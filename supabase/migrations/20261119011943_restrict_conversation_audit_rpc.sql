-- The client has no supported direct call for this audit helper.
-- Prevent authenticated users from fabricating arbitrary audit actions.
REVOKE EXECUTE ON FUNCTION private.log_conversation_event(text, uuid, jsonb)
FROM authenticated;
