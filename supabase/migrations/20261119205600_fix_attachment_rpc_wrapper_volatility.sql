create or replace function public.create_attachment_message(
  _conversation_id uuid,
  _client_message_id uuid,
  _original_name text,
  _mime_type text,
  _size_bytes bigint,
  _sha256 text,
  _object_path text
)
returns table (
  id uuid, conversation_id uuid, sender_id uuid, client_message_id uuid,
  body text, reply_to_id uuid, created_at timestamptz,
  attachment_id uuid, scan_status text
)
language sql
volatile
security invoker
set search_path = ''
as $$
  select * from private.create_attachment_message(
    _conversation_id,_client_message_id,_original_name,_mime_type,_size_bytes,_sha256,_object_path
  );
$$;
