create or replace function private.is_active_profile(_profile_id uuid)
returns boolean language sql stable security definer set search_path=''
as $$ select exists(select 1 from public.profiles p where p.id=_profile_id and p.status='active'); $$;
grant execute on function private.is_active_profile(uuid) to authenticated;

drop policy "Creators add themselves as owner and managers add regular members" on public.conversation_members;
create policy "Creators add themselves as owner and managers add regular members"
on public.conversation_members for insert to authenticated
with check (
  added_by=(select auth.uid())
  and (select private.is_active_user())
  and (select private.is_active_profile(profile_id))
  and (
    (profile_id=(select auth.uid()) and member_role='owner'
      and exists(select 1 from public.conversations c where c.id=conversation_id and c.created_by=(select auth.uid())))
    or (member_role='member' and (select private.can_manage_conversation(conversation_id)))
  )
);

create or replace function private.log_conversation_event(_action text,_conversation_id uuid,_metadata jsonb default '{}'::jsonb)
returns void language plpgsql security definer set search_path=''
as $$
begin
  if (select auth.uid()) is null then raise exception 'Authentication required'; end if;
  insert into private.audit_logs(actor_profile_id,action,resource_type,resource_id,metadata)
  values((select auth.uid()),_action,'conversation',_conversation_id,coalesce(_metadata,'{}'::jsonb));
end; $$;
grant execute on function private.log_conversation_event(text,uuid,jsonb) to authenticated;

create or replace function public.create_conversation(
  _type public.conversation_type,
  _title text default null,
  _member_ids uuid[] default '{}'::uuid[]
)
returns uuid language plpgsql security invoker set search_path=''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_target_id uuid;
  v_conversation_id uuid;
  v_direct_key text;
  v_distinct_count integer;
  v_member_count integer;
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;
  if not (select private.is_active_user()) then raise exception 'Active account required'; end if;
  if _member_ids is null then _member_ids := '{}'::uuid[]; end if;
  v_member_count := cardinality(_member_ids);
  select count(distinct member_id) into v_distinct_count from unnest(_member_ids) as members(member_id);
  if v_distinct_count <> v_member_count then raise exception 'Duplicate or null participants are not allowed'; end if;
  if v_user_id = any(_member_ids) then raise exception 'Do not include the creator in member_ids'; end if;

  if _type='direct' then
    if v_member_count <> 1 then raise exception 'A direct conversation must have exactly one other participant'; end if;
    v_target_id := _member_ids[1];
    if not (select private.is_active_profile(v_target_id)) then raise exception 'Participant is not active'; end if;
    v_direct_key := least(v_user_id::text,v_target_id::text)||':'||greatest(v_user_id::text,v_target_id::text);
    select c.id into v_conversation_id from public.conversations c where c.direct_key=v_direct_key;
    if v_conversation_id is not null then
      if (select private.is_conversation_member(v_conversation_id)) then return v_conversation_id; end if;
      raise exception 'An existing direct conversation is unavailable to this account';
    end if;
    insert into public.conversations(type,created_by,direct_key) values('direct',v_user_id,v_direct_key) returning id into v_conversation_id;
  else
    if v_member_count < 1 or v_member_count > 49 then raise exception 'A group must have between 1 and 49 invited participants'; end if;
    if _title is null or char_length(btrim(_title)) not between 1 and 100 then raise exception 'A group title between 1 and 100 characters is required'; end if;
    foreach v_target_id in array _member_ids loop
      if not (select private.is_active_profile(v_target_id)) then raise exception 'Every group participant must have an active account'; end if;
    end loop;
    insert into public.conversations(type,title,created_by) values('group',btrim(_title),v_user_id) returning id into v_conversation_id;
  end if;

  insert into public.conversation_members(conversation_id,profile_id,member_role,added_by)
  values(v_conversation_id,v_user_id,'owner',v_user_id);
  insert into public.conversation_members(conversation_id,profile_id,member_role,added_by)
  select v_conversation_id,member_id,'member',v_user_id from unnest(_member_ids) as members(member_id);
  perform private.log_conversation_event('conversation.created',v_conversation_id,
    jsonb_build_object('type',_type,'member_count',v_member_count+1));
  return v_conversation_id;
end; $$;

revoke all on function public.create_conversation(public.conversation_type,text,uuid[]) from public,anon;
grant execute on function public.create_conversation(public.conversation_type,text,uuid[]) to authenticated;
revoke insert on public.conversations from authenticated;
revoke insert on public.conversation_members from authenticated;
