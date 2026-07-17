-- handle_new_user() is a SECURITY DEFINER trigger function that must only run
-- via the on_auth_user_created trigger, never through /rest/v1/rpc. A previous
-- revoke targeted anon/authenticated, but functions default to granting
-- EXECUTE to PUBLIC, which still covered those roles.
-- Applied to production 2026-07-17 via Supabase MCP.

revoke execute on function public.handle_new_user() from public;
