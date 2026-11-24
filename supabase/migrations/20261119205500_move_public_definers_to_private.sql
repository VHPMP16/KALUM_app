create policy "Deny direct access to private admin settings"
on private.admin_settings for all to public
using (false) with check (false);

create index if not exists admin_settings_updated_by_idx
  on private.admin_settings(updated_by);

create or replace function private.create_conversation(
  _type public.conversation_type,
  _title text default null,
  _member_ids uuid[] default '{}'::uuid[]
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_target_id uuid;
  v_conversation_id uuid;
  v_direct_key text;
  v_distinct_count integer;
  v_member_count integer;
  v_max_group_members integer;
begin
  if v_user_id is null then raise exception 'Authentication required' using errcode = '42501'; end if;
  if not (select private.is_active_user()) then raise exception 'Active account required' using errcode = '42501'; end if;
  if _type not in ('direct','group') then raise exception 'Invalid conversation type' using errcode = '22023'; end if;
  if _member_ids is null then _member_ids := '{}'::uuid[]; end if;
  v_member_count := cardinality(_member_ids);
  select count(distinct member_id) into v_distinct_count from unnest(_member_ids) as members(member_id);
  if v_distinct_count <> v_member_count then raise exception 'Duplicate or null participants are not allowed' using errcode = '22023'; end if;
  if v_user_id = any(_member_ids) then raise exception 'Do not include the creator in member_ids' using errcode = '22023'; end if;

  if _type = 'direct' then
    if v_member_count <> 1 then raise exception 'A direct conversation must have exactly one other participant' using errcode = '22023'; end if;
    v_target_id := _member_ids[1];
    if not (select private.is_active_profile(v_target_id)) then raise exception 'Participant is not active' using errcode = '42501'; end if;
    v_direct_key := least(v_user_id::text,v_target_id::text) || ':' || greatest(v_user_id::text,v_target_id::text);
    select c.id into v_conversation_id from public.conversations c where c.direct_key = v_direct_key;
    if v_conversation_id is not null then
      if (select private.is_conversation_member(v_conversation_id)) then return v_conversation_id; end if;
      raise exception 'An existing direct conversation is unavailable to this account' using errcode = '42501';
    end if;
    insert into public.conversations(type,created_by,direct_key)
      values ('direct',v_user_id,v_direct_key) returning id into v_conversation_id;
  else
    if not (select private.group_creation_is_enabled()) then
      raise exception 'Group creation is disabled by IT administration' using errcode = '42501';
    end if;
    v_max_group_members := (select private.group_max_members());
    if v_member_count < 1 or v_member_count + 1 > v_max_group_members then
      raise exception 'Group participant limit exceeded' using errcode = '22023';
    end if;
    if _title is null or char_length(btrim(_title)) not between 1 and 100 then
      raise exception 'A group title between 1 and 100 characters is required' using errcode = '22023';
    end if;
    foreach v_target_id in array _member_ids loop
      if not (select private.is_active_profile(v_target_id)) then
        raise exception 'Every group participant must have an active account' using errcode = '42501';
      end if;
    end loop;
    insert into public.conversations(type,title,created_by)
      values ('group',btrim(_title),v_user_id) returning id into v_conversation_id;
  end if;

  insert into public.conversation_members(conversation_id,profile_id,member_role,added_by)
    values (v_conversation_id,v_user_id,'owner',v_user_id);
  insert into public.conversation_members(conversation_id,profile_id,member_role,added_by)
    select v_conversation_id,member_id,'member',v_user_id from unnest(_member_ids) as members(member_id);
  perform private.log_conversation_event('conversation.created',v_conversation_id,
    jsonb_build_object('type',_type,'member_count',v_member_count + 1));
  return v_conversation_id;
end;
$$;

revoke all on function private.create_conversation(public.conversation_type,text,uuid[]) from public, anon;
grant execute on function private.create_conversation(public.conversation_type,text,uuid[]) to authenticated;

create or replace function public.create_conversation(
  _type public.conversation_type,
  _title text default null,
  _member_ids uuid[] default '{}'::uuid[]
)
returns uuid
language sql
security invoker
set search_path = ''
as $$ select private.create_conversation(_type,_title,_member_ids); $$;

revoke all on function public.create_conversation(public.conversation_type,text,uuid[]) from public, anon;
grant execute on function public.create_conversation(public.conversation_type,text,uuid[]) to authenticated;

create or replace function private.create_attachment_message(
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
language plpgsql security definer set search_path = ''
as $$
declare
  _actor uuid := (select auth.uid());
  _message_id uuid;
  _attachment_id uuid;
begin
  if _actor is null or not (select private.is_active_user()) then
    raise exception 'active authenticated profile required' using errcode = '42501';
  end if;
  if not (select private.is_conversation_member(_conversation_id)) then
    raise exception 'conversation access denied' using errcode = '42501';
  end if;
  if _client_message_id is null
     or _original_name is null
     or char_length(btrim(_original_name)) not between 1 and 180
     or _original_name ~ '[/\\\\]'
     or _mime_type not in ('application/pdf','image/jpeg')
     or _size_bytes < 1 or _size_bytes > 5242880
     or _sha256 !~ '^[0-9a-f]{64}$'
     or _object_path is null
     or array_length(string_to_array(_object_path, '/'), 1) <> 3
     or split_part(_object_path, '/', 1) <> _conversation_id::text
     or split_part(_object_path, '/', 2) <> _actor::text
     or split_part(_object_path, '/', 3) !~ '^[0-9a-f-]{36}-[A-Za-z0-9_.-]{1,100}$' then
    raise exception 'invalid attachment metadata' using errcode = '22023';
  end if;

  insert into public.messages(conversation_id, sender_id, client_message_id, body)
  values (_conversation_id, _actor, _client_message_id, '📎 ' || btrim(_original_name))
  returning public.messages.id into _message_id;

  insert into public.attachments(
    message_id, conversation_id, uploader_id, bucket, object_path,
    original_name, mime_type, size_bytes, sha256, scan_status
  )
  values (
    _message_id, _conversation_id, _actor, 'chat-quarantine', _object_path,
    btrim(_original_name), _mime_type, _size_bytes, _sha256, 'pending'
  )
  returning public.attachments.id into _attachment_id;

  insert into private.audit_logs(actor_profile_id, action, resource_type, resource_id, reason, metadata)
  values (_actor, 'attachment.uploaded_quarantined', 'attachment', _attachment_id,
    'Arquivo recebido e encaminhado para quarentena',
    jsonb_build_object('conversation_id', _conversation_id, 'mime_type', _mime_type, 'size_bytes', _size_bytes));

  return query
    select m.id, m.conversation_id, m.sender_id, m.client_message_id, m.body,
           m.reply_to_id, m.created_at, _attachment_id, 'pending'::text
    from public.messages m where m.id = _message_id;
end;
$$;

revoke all on function private.create_attachment_message(uuid,uuid,text,text,bigint,text,text) from public, anon;
grant execute on function private.create_attachment_message(uuid,uuid,text,text,bigint,text,text) to authenticated;

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
language sql volatile security invoker set search_path = ''
as $
  select * from private.create_attachment_message(
    _conversation_id,_client_message_id,_original_name,_mime_type,_size_bytes,_sha256,_object_path
  );
$$;

revoke all on function public.create_attachment_message(uuid,uuid,text,text,bigint,text,text) from public, anon;
grant execute on function public.create_attachment_message(uuid,uuid,text,text,bigint,text,text) to authenticated;
