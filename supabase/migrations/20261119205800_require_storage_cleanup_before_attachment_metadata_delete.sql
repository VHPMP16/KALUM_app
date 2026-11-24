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
  if exists (
    select 1 from storage.objects o
    where o.bucket_id = _attachment.bucket and o.name = _attachment.object_path
  ) then
    raise exception 'storage object must be removed before deleting attachment metadata' using errcode = '55000';
  end if;

  update public.messages set body = '[Anexo removido pela TI]'
   where id = _attachment.message_id;
  delete from public.attachments where id=_attachment_id;

  insert into private.audit_logs(actor_profile_id,action,resource_type,resource_id,reason,metadata)
  values (_actor,'attachment.deleted','attachment',_attachment_id,btrim(_reason),
    jsonb_build_object('scan_status',_attachment.scan_status,'bucket',_attachment.bucket,'conversation_id',_attachment.conversation_id));
  insert into private.admin_actions(actor_profile_id,target_profile_id,action_type,outcome,reason,metadata)
  values (_actor,_attachment.uploader_id,'attachment.deleted','success',btrim(_reason),
    jsonb_build_object('attachment_id',_attachment_id,'scan_status',_attachment.scan_status));
end;
$$;
