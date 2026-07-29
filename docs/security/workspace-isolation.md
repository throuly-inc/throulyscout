# Workspace Isolation — Access Matrix & Enforcement

Last updated: 2026-06-20

## Core rule

A user can access a workspace only if **both**:
1. `role_assignments(user_id, role).status = 'approved'`, AND
2. `profiles.active_workspace_role = role`

Holding a role does not, by itself, expose that workspace's data.

## Server-side enforcement

### Single helper (source of truth)

```sql
public.require_active_workspace(_user_id uuid, _role product_role) RETURNS boolean
-- SECURITY DEFINER, search_path='', GRANT EXECUTE TO authenticated, service_role only.
```

Returns `true` only when the user has the approved assignment **and** that role is their `active_workspace_role`.

### Tables gated by `require_active_workspace`

| Table | Gated workspace | Notes |
| --- | --- | --- |
| `buyer_match_profiles` | buyer | Owner-only |
| `buyer_questionnaires` | buyer | Owner-only |
| `saved_searches` | buyer | Owner-only |
| `saved_results` | buyer | Owner-only |
| `saved_scenarios` | buyer | Owner-only |
| `user_financial_profiles` | buyer | Owner-only |
| `seller_match_listings` | seller | Owner-only, anon revoked |
| `offer_templates` | agent | Agent owns |
| `contacts` | agent (rw) / buyer (read own linked contact) | Linked client can only see their own contact row in buyer workspace |
| `tasks` | agent (rw on agent deals) / buyer (read tasks on own deals) | Dual path |
| `deals` | agent (rw on own) / buyer (read own) | Dual path |

All policies are scoped to the `authenticated` role; anon is revoked.

### Tables NOT gated (intentional)

- `profiles`, `role_assignments`, `notifications` — user-self only.
- `properties`, public directories — public listings.
- Storage buckets `avatars`, `agent-logos` — public read by URL (documented residual).

## Client-side enforcement

### Route guard

`<RequireWorkspace role="...">` wraps every workspace-specific page:

1. Active matches → render.
2. Approved but not active → confirmation screen, explicit switch only.
3. Not approved → "Start workspace" or "Apply" CTA. Page content never rendered.

Currently wrapping: `/dashboard/client/*` (buyer). Apply the same wrapper to new agent/seller/lender route trees as they are introduced.

### Cache hygiene on switch

`useRoles.switchWorkspace()`:
1. Calls `set_active_workspace` RPC.
2. `queryClient.clear()` — drops every cached react-query result.
3. Purges localStorage / sessionStorage keys prefixed `buyer:`, `seller:`, `agent:`, `lender:`, `workspace:`.
4. Re-fetches roles + dispatches `workspace-changed`.

## Access matrix

| Roles held | Active workspace | Can access |
| --- | --- | --- |
| Buyer | Buyer | Buyer workspace only |
| Seller | Seller | Seller workspace only |
| Agent | Agent | Agent workspace only |
| Lender | Lender | Lender workspace only |
| Agent + Buyer | Agent | Agent workspace only |
| Agent + Buyer | Buyer | Buyer workspace only |
| Buyer + Seller + Agent | Seller | Seller workspace only |
| any roles | (none) | Account screens only |
| Admin (separately) | n/a | Admin pages only — never appears in user-facing switcher |

## What still needs work (follow-up)

- Wrap any future agent/seller/lender routes in `RequireWorkspace`.
- Add `assertActiveWorkspace()` helper to workspace-scoped Edge Functions (agent-only `send-offer-email` already requires `has_approved_role('agent'|'lender')`; tighten further to active workspace when those functions become role-strict).
- Workspace-aware nav rebuild in `Navbar.tsx` — currently switches dashboard link by `profile.role`; should read `activeWorkspace`.
- Expand `RolesSettings.tsx` with the full "My workspaces" card layout described in the spec.
- Deno acceptance test suite for the 12 isolation scenarios.
