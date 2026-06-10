
-- are_connected: switch to SECURITY INVOKER so it runs with caller RLS.
CREATE OR REPLACE FUNCTION public.are_connected(a UUID, b UUID)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY INVOKER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.connections
    WHERE status = 'accepted'
    AND ((requester_id = a AND addressee_id = b) OR (requester_id = b AND addressee_id = a))
  );
$$;

-- handle_new_user: keep SECURITY DEFINER (required for trigger on auth.users)
-- but revoke broad EXECUTE so it cannot be invoked directly via API.
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
