-- The 2026-07-16 workspace-system cleanup migration dropped
-- require_active_workspace() with CASCADE, which silently deleted the RLS
-- policies on these tables (they depended on that function). RLS stayed
-- enabled with zero policies, so every insert/select/update/delete has been
-- denied for regular users ever since. Restore simple owner-scoped policies,
-- matching the pattern already in place on saved_scenarios.

-- buyer_questionnaires
CREATE POLICY "Users can view own buyer questionnaire" ON throulyscout.buyer_questionnaires
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own buyer questionnaire" ON throulyscout.buyer_questionnaires
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own buyer questionnaire" ON throulyscout.buyer_questionnaires
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own buyer questionnaire" ON throulyscout.buyer_questionnaires
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- saved_searches
CREATE POLICY "Users can view own saved searches" ON throulyscout.saved_searches
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own saved searches" ON throulyscout.saved_searches
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own saved searches" ON throulyscout.saved_searches
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own saved searches" ON throulyscout.saved_searches
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- saved_results
CREATE POLICY "Users can view own saved results" ON throulyscout.saved_results
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own saved results" ON throulyscout.saved_results
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own saved results" ON throulyscout.saved_results
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own saved results" ON throulyscout.saved_results
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- user_financial_profiles
CREATE POLICY "Users can view own financial profile" ON throulyscout.user_financial_profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own financial profile" ON throulyscout.user_financial_profiles
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own financial profile" ON throulyscout.user_financial_profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own financial profile" ON throulyscout.user_financial_profiles
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);
