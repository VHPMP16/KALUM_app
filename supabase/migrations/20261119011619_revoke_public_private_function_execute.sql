-- Defense in depth: private schema is not exposed to anon, but functions must
-- not retain PostgreSQL's default PUBLIC EXECUTE grant.
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA private FROM PUBLIC;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA private FROM anon;

-- Only authenticated RLS helper functions required by application policies.
GRANT EXECUTE ON FUNCTION private.can_manage_conversation(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION private.can_view_profile(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION private.has_role(text) TO authenticated;
GRANT EXECUTE ON FUNCTION private.is_active_profile(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION private.is_active_user() TO authenticated;
GRANT EXECUTE ON FUNCTION private.is_conversation_member(uuid) TO authenticated;

-- Admin RPCs and invitation audit retain their existing explicit grants.
-- Trigger functions remain callable only by PostgreSQL trigger execution.
