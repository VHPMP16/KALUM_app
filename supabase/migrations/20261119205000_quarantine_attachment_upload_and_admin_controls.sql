drop policy if exists "Active conversation members can upload PDF and JPEG to quaranti" on storage.objects;

create policy "Active members upload quarantine files under own folder"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'chat-quarantine'
  and (storage.foldername(name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  and (storage.foldername(name))[2] = (select auth.uid())::text
  and storage.extension(name) = any (array['pdf','jpg','jpeg'])
  and (select private.is_active_user())
  and (select private.is_conversation_member(((storage.foldername(name))[1])::uuid))
);

create policy "Users can delete their own quarantine uploads"
on storage.objects for delete to authenticated
using (
  bucket_id = 'chat-quarantine'
  and (storage.foldername(name))[2] = (select auth.uid())::text
  and (select private.is_active_user())
  and (select private.is_conversation_member(((storage.foldername(name))[1])::uuid))
);

create policy "Administrators can delete attachment objects"
on storage.objects for delete to authenticated
using (
  bucket_id in ('chat-quarantine','chat-attachments')
  and (select private.is_active_user())
  and ((select private.has_role('it_admin')) or (select private.has_role('security_admin')))
);

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
  id uuid,
  conversation_id uuid,
  sender_id uuid,
  client_message_id uuid,
  body text,
  reply_to_id uuid,
  created_at timestamptz,
  attachment_id uuid,
  scan_status text
)
language plpgsql
security definer
set search_path = ''
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

revoke all on function public.create_attachment_message(uuid,uuid,text,text,bigint,text,text) from public, anon;
grant execute on function public.create_attachment_message(uuid,uuid,text,text,bigint,text,text) to authenticated;

create or replace function private.get_message_attachment_status(_conversation_id uuid)
returns table (
  message_id uuid,
  attachment_id uuid,
  original_name text,
  mime_type text,
  size_bytes bigint,
  scan_status text,
  bucket text,
  object_path text
)
language plpgsql stable security definer set search_path = ''
as $$
declare
  _actor uuid := (select auth.uid());
begin
  if _actor is null or not (select private.is_active_user())
     or not (select private.is_conversation_member(_conversation_id)) then
    raise exception 'conversation access denied' using errcode = '42501';
  end if;
  return query
    select a.message_id, a.id, a.original_name, a.mime_type, a.size_bytes,
           a.scan_status, a.bucket,
           case when a.scan_status = 'clean' and a.bucket = 'chat-attachments' then a.object_path else null end
    from public.attachments a
    where a.conversation_id = _conversation_id
    order by a.created_at asc;
end;
$$;

revoke all on function private.get_message_attachment_status(uuid) from public, anon;
grant execute on function private.get_message_attachment_status(uuid) to authenticated;

create or replace function public.get_message_attachment_status(_conversation_id uuid)
returns table (
  message_id uuid, attachment_id uuid, original_name text, mime_type text,
  size_bytes bigint, scan_status text, bucket text, object_path text
)
language sql stable security invoker set search_path = ''
as $$ select * from private.get_message_attachment_status(_conversation_id); $$;

revoke all on function public.get_message_attachment_status(uuid) from public, anon;
grant execute on function public.get_message_attachment_status(uuid) to authenticated;

create or replace function private.admin_list_attachments(
  _status text default null,
  _page integer default 1,
  _page_size integer default 25
)
returns table (
  id uuid, conversation_id uuid, message_id uuid, uploader_id uuid,
  uploader_name text, original_name text, mime_type text, size_bytes bigint,
  scan_status text, bucket text, object_path text, created_at timestamptz,
  total_count bigint
)
language plpgsql stable security definer set search_path = ''
as $$
declare
  _page_number integer := greatest(coalesce(_page,1),1);
  _size integer := greatest(1,least(coalesce(_page_size,25),100));
begin
  if (select auth.uid()) is null or not ((select private.has_role('it_admin')) or (select private.has_role('security_admin'))) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if _status is not null and _status not in ('pending','clean','rejected') then
    raise exception 'invalid attachment status' using errcode = '22023';
  end if;
  return query
    select a.id,a.conversation_id,a.message_id,a.uploader_id,
           coalesce(p.full_name,'Funcionário'),a.original_name,a.mime_type,a.size_bytes,
           a.scan_status,a.bucket,a.object_path,a.created_at,count(*) over()
    from public.attachments a
    left join public.profiles p on p.id=a.uploader_id
    where (_status is null or a.scan_status=_status)
    order by a.created_at desc,a.id desc
    limit _size offset ((_page_number-1)*_size);
end;
$$;

create or replace function private.admin_delete_attachment(_attachment_id uuid,_reason text)
returns void
language plpgsql security definer set search_path = ''
as $$
declare
  _actor uuid := (select auth.uid());
  _attachment public.attachments%rowtype;
begin
  if _actor is null or not ((select private.has_role('it_admin')) or (select private.has_role('security_admin'))) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if _reason is null or char_length(btrim(_reason)) not between 8 and 500 then
    raise exception 'a deletion reason between 8 and 500 characters is required' using errcode = '22023';
  end if;
  select * into _attachment from public.attachments where id=_attachment_id for update;
  if not found then raise exception 'attachment not found' using errcode = 'P0002'; end if;

  delete from public.attachments where id=_attachment_id;
  insert into private.audit_logs(actor_profile_id,action,resource_type,resource_id,reason,metadata)
  values (_actor,'attachment.deleted','attachment',_attachment_id,btrim(_reason),
    jsonb_build_object('scan_status',_attachment.scan_status,'bucket',_attachment.bucket,'conversation_id',_attachment.conversation_id));
  insert into private.admin_actions(actor_profile_id,target_profile_id,action_type,outcome,reason,metadata)
  values (_actor,_attachment.uploader_id,'attachment.deleted','success',btrim(_reason),
    jsonb_build_object('attachment_id',_attachment_id,'scan_status',_attachment.scan_status));
end;
$$;

revoke all on function private.admin_list_attachments(text,integer,integer) from public, anon;
revoke all on function private.admin_delete_attachment(uuid,text) from public, anon;
grant execute on function private.admin_list_attachments(text,integer,integer) to authenticated;
grant execute on function private.admin_delete_attachment(uuid,text) to authenticated;

create or replace function public.admin_list_attachments(_status text default null,_page integer default 1,_page_size integer default 25)
returns table (
  id uuid, conversation_id uuid, message_id uuid, uploader_id uuid, uploader_name text,
  original_name text, mime_type text, size_bytes bigint, scan_status text, bucket text,
  object_path text, created_at timestamptz, total_count bigint
)
language sql stable security invoker set search_path = ''
as $$ select * from private.admin_list_attachments(_status,_page,_page_size); $$;

create or replace function public.admin_delete_attachment(_attachment_id uuid,_reason text)
returns void language sql security invoker set search_path = ''
as $$ select private.admin_delete_attachment(_attachment_id,_reason); $$;

revoke all on function public.admin_list_attachments(text,integer,integer) from public, anon;
revoke all on function public.admin_delete_attachment(uuid,text) from public, anon;
grant execute on function public.admin_list_attachments(text,integer,integer) to authenticated;
grant execute on function public.admin_delete_attachment(uuid,text) to authenticated;
