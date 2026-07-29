#!/usr/bin/env bash
#
# Migrate auth users (with passwords) from the Throuly Supabase project
# into the ThroulyScout Supabase project.
#
# What it does:
#   - Preserves user UUIDs and bcrypt password hashes, so migrated users can
#     log in to ThroulyScout with their existing Throuly email + password.
#   - Skips any user whose email (case-insensitive) already exists in
#     ThroulyScout. The existing ThroulyScout account wins and its password
#     is untouched.
#   - ThroulyScout's on_auth_user_created trigger automatically creates the
#     public.profiles and public.user_roles rows for each imported user.
#     Afterwards, full_name / phone / subscription_tier are copied from the
#     old Throuly profile.
#   - The whole import runs in a single transaction: if anything fails,
#     nothing is written.
#
# Usage:
#   OLD_DB_URL='postgresql://postgres:<PW>@db.<THROULY_REF>.supabase.co:5432/postgres' \
#   NEW_DB_URL='postgresql://postgres:<PW>@db.<THROULYSCOUT_REF>.supabase.co:5432/postgres' \
#   bash scripts/migrate-users-from-throuly.sh
#
# Get each connection string from: Supabase Dashboard -> Project Settings ->
# Database -> Connection string. If your network is IPv4-only or blocks
# direct connections, use the "Session pooler" URI instead.

set -euo pipefail

: "${OLD_DB_URL:?Set OLD_DB_URL to the Throuly (source) Postgres connection string}"
: "${NEW_DB_URL:?Set NEW_DB_URL to the ThroulyScout (destination) Postgres connection string}"

WORKDIR="$(mktemp -d)"
trap 'rm -rf "$WORKDIR"' EXIT
echo "Working directory: $WORKDIR"

echo "==> Exporting users from Throuly (source)..."
(
  cd "$WORKDIR"
  psql "$OLD_DB_URL" -v ON_ERROR_STOP=1 <<'SQL'
\copy (SELECT id, email, encrypted_password, email_confirmed_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, phone, phone_confirmed_at, banned_until FROM auth.users WHERE deleted_at IS NULL AND email IS NOT NULL AND coalesce(is_anonymous, false) = false) TO 'users.csv' WITH (FORMAT csv, HEADER true)
\copy (SELECT i.id, i.user_id, i.provider_id, i.provider, i.identity_data, i.last_sign_in_at, i.created_at, i.updated_at FROM auth.identities i JOIN auth.users u ON u.id = i.user_id WHERE u.deleted_at IS NULL) TO 'identities.csv' WITH (FORMAT csv, HEADER true)
\copy (SELECT id, full_name, phone, subscription_tier FROM public.profiles) TO 'old_profiles.csv' WITH (FORMAT csv, HEADER true)
SQL
)
echo "    Exported $(($(wc -l < "$WORKDIR/users.csv") - 1)) user(s)."

echo "==> Importing into ThroulyScout (destination)..."
(
  cd "$WORKDIR"
  psql "$NEW_DB_URL" -v ON_ERROR_STOP=1 <<'SQL'
BEGIN;

-- Bypass the block_privilege_changes / strict_prevent_role_change triggers
-- so subscription_tier can be copied over. Transaction-local only.
SELECT set_config('app.privileged_update', 'on', true);

CREATE SCHEMA _throuly_migration;

CREATE TABLE _throuly_migration.users (
  id uuid PRIMARY KEY,
  email text NOT NULL,
  encrypted_password text,
  email_confirmed_at timestamptz,
  last_sign_in_at timestamptz,
  raw_app_meta_data jsonb,
  raw_user_meta_data jsonb,
  created_at timestamptz,
  updated_at timestamptz,
  phone text,
  phone_confirmed_at timestamptz,
  banned_until timestamptz
);

CREATE TABLE _throuly_migration.identities (
  id uuid,
  user_id uuid,
  provider_id text,
  provider text,
  identity_data jsonb,
  last_sign_in_at timestamptz,
  created_at timestamptz,
  updated_at timestamptz
);

CREATE TABLE _throuly_migration.old_profiles (
  id uuid,
  full_name text,
  phone text,
  subscription_tier text
);

\copy _throuly_migration.users FROM 'users.csv' WITH (FORMAT csv, HEADER true)
\copy _throuly_migration.identities FROM 'identities.csv' WITH (FORMAT csv, HEADER true)
\copy _throuly_migration.old_profiles FROM 'old_profiles.csv' WITH (FORMAT csv, HEADER true)

-- Users whose email (case-insensitive) or id already exists in ThroulyScout
-- are skipped; the existing ThroulyScout account and password win.
CREATE TABLE _throuly_migration.skipped AS
SELECT u.id, u.email
FROM _throuly_migration.users u
WHERE EXISTS (SELECT 1 FROM auth.users t WHERE lower(t.email) = lower(u.email))
   OR EXISTS (SELECT 1 FROM auth.users t WHERE t.id = u.id);

CREATE TABLE _throuly_migration.to_import AS
SELECT u.*
FROM _throuly_migration.users u
WHERE u.id NOT IN (SELECT id FROM _throuly_migration.skipped);

-- Insert auth users. The on_auth_user_created trigger fires per row and
-- creates public.profiles + public.user_roles automatically.
-- Token columns are set to '' (not NULL) to avoid GoTrue "converting NULL
-- to string" errors on imported rows.
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, last_sign_in_at,
  raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at, phone, phone_confirmed_at, banned_until,
  confirmation_token, recovery_token, email_change_token_new, email_change
)
SELECT
  '00000000-0000-0000-0000-000000000000'::uuid,
  id, 'authenticated', 'authenticated', email, encrypted_password,
  email_confirmed_at, last_sign_in_at,
  coalesce(raw_app_meta_data, '{"provider":"email","providers":["email"]}'::jsonb),
  coalesce(raw_user_meta_data, '{}'::jsonb),
  coalesce(created_at, now()), now(), phone, phone_confirmed_at, banned_until,
  '', '', '', ''
FROM _throuly_migration.to_import;

-- Copy the matching identity rows (the "email" provider identity is
-- required for password login to work).
INSERT INTO auth.identities (
  id, user_id, provider_id, provider, identity_data,
  last_sign_in_at, created_at, updated_at
)
SELECT i.id, i.user_id, i.provider_id, i.provider, i.identity_data,
       i.last_sign_in_at, coalesce(i.created_at, now()), now()
FROM _throuly_migration.identities i
JOIN _throuly_migration.to_import u ON u.id = i.user_id;

-- Safety net: synthesize an email identity for any imported user that had
-- no identity row in the source project.
INSERT INTO auth.identities (
  id, user_id, provider_id, provider, identity_data, created_at, updated_at
)
SELECT gen_random_uuid(), u.id, u.id::text, 'email',
       jsonb_build_object('sub', u.id::text, 'email', u.email,
                          'email_verified', true, 'phone_verified', false),
       now(), now()
FROM _throuly_migration.to_import u
WHERE NOT EXISTS (
  SELECT 1 FROM auth.identities ai WHERE ai.user_id = u.id
);

-- Carry over profile details (incl. subscription tier) from Throuly for
-- the users we just imported.
UPDATE public.profiles p
SET full_name         = coalesce(op.full_name, p.full_name),
    phone             = coalesce(op.phone, p.phone),
    subscription_tier = coalesce(op.subscription_tier, p.subscription_tier)
FROM _throuly_migration.old_profiles op
WHERE p.id = op.id
  AND op.id IN (SELECT id FROM _throuly_migration.to_import);

-- Summary
SELECT (SELECT count(*) FROM _throuly_migration.to_import) AS imported,
       (SELECT count(*) FROM _throuly_migration.skipped)   AS skipped_existing;

SELECT email AS skipped_because_already_in_throulyscout
FROM _throuly_migration.skipped
ORDER BY email;

DROP SCHEMA _throuly_migration CASCADE;
COMMIT;
SQL
)

echo "==> Done. Export files (which contained password hashes) were deleted."
