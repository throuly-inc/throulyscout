-- The 2026-07-16 workspace-system cleanup migration dropped
-- require_active_workspace() with CASCADE, which silently deleted the RLS
-- policies on these tables (they depended on that function). RLS stayed
-- enabled with zero policies, so every insert/select/update/delete has been
-- denied for regular users ever since. Restore simple owner-scoped policies,
-- matching the pattern already in place on saved_scenarios.
--
-- NOTE: the `throulyscout` schema only exists on the production project (the
-- app tables were moved there outside migration history). On fresh databases
-- built from this repo's migrations the schema doesn't exist, so skip
-- gracefully instead of failing the whole push. Policies are also dropped
-- before creation so the migration can be re-applied safely.

DO $$
DECLARE
  t text;
  tables text[] := ARRAY[
    'buyer_questionnaires',
    'saved_searches',
    'saved_results',
    'user_financial_profiles'
  ];
  labels text[] := ARRAY[
    'buyer questionnaire',
    'saved searches',
    'saved results',
    'financial profile'
  ];
  label text;
  i int;
BEGIN
  IF to_regnamespace('throulyscout') IS NULL THEN
    RAISE NOTICE 'Schema throulyscout does not exist; skipping RLS policy restore';
    RETURN;
  END IF;

  FOR i IN 1..array_length(tables, 1) LOOP
    t := tables[i];
    label := labels[i];

    IF to_regclass('throulyscout.' || t) IS NULL THEN
      RAISE NOTICE 'Table throulyscout.% does not exist; skipping', t;
      CONTINUE;
    END IF;

    EXECUTE format('DROP POLICY IF EXISTS %I ON throulyscout.%I', 'Users can view own ' || label, t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON throulyscout.%I', 'Users can insert own ' || label, t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON throulyscout.%I', 'Users can update own ' || label, t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON throulyscout.%I', 'Users can delete own ' || label, t);

    EXECUTE format(
      'CREATE POLICY %I ON throulyscout.%I FOR SELECT TO authenticated USING (auth.uid() = user_id)',
      'Users can view own ' || label, t);
    EXECUTE format(
      'CREATE POLICY %I ON throulyscout.%I FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id)',
      'Users can insert own ' || label, t);
    EXECUTE format(
      'CREATE POLICY %I ON throulyscout.%I FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id)',
      'Users can update own ' || label, t);
    EXECUTE format(
      'CREATE POLICY %I ON throulyscout.%I FOR DELETE TO authenticated USING (auth.uid() = user_id)',
      'Users can delete own ' || label, t);
  END LOOP;
END $$;
