set search_path = throulyscout, public, extensions;

GRANT EXECUTE ON FUNCTION throulyscout.require_active_workspace(uuid, throulyscout.product_role) TO authenticated;
GRANT EXECUTE ON FUNCTION throulyscout.get_client_agent_ids_for_rls(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION throulyscout.get_agent_client_ids_for_rls(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION throulyscout.get_broker_agent_ids_for_rls(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION throulyscout.has_approved_role(uuid, throulyscout.product_role) TO authenticated;
GRANT EXECUTE ON FUNCTION throulyscout.has_role(uuid, throulyscout.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION throulyscout.is_deal_client(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION throulyscout.user_can_access_deal(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION throulyscout.get_user_role(uuid) TO authenticated;