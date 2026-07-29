GRANT EXECUTE ON FUNCTION public.require_active_workspace(uuid, public.product_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_client_agent_ids_for_rls(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_agent_client_ids_for_rls(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_broker_agent_ids_for_rls(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_approved_role(uuid, public.product_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_deal_client(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_can_access_deal(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_role(uuid) TO authenticated;