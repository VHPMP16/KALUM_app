create or replace function private.validate_direct_conversation_insert()
returns trigger
language plpgsql
set search_path=''
as $$
declare
  v_parts text[];
  v_left uuid;
  v_right uuid;
  v_target uuid;
begin
  if new.type = 'direct' then
    v_parts := string_to_array(new.direct_key, ':');
    if cardinality(v_parts) <> 2 then
      raise exception 'Direct conversation key must contain exactly two participant IDs';
    end if;
    begin
      v_left := v_parts[1]::uuid;
      v_right := v_parts[2]::uuid;
    exception when others then
      raise exception 'Invalid direct conversation key';
    end;
    if v_left::text >= v_right::text or new.created_by not in (v_left, v_right) then
      raise exception 'Direct conversation key is not canonical';
    end if;
    v_target := case when new.created_by = v_left then v_right else v_left end;
    if v_target = new.created_by or not (select private.is_active_profile(v_target)) then
      raise exception 'Direct conversation participant must be another active user';
    end if;
  end if;
  return new;
end;
$$;

create or replace function private.enforce_conversation_member_limit()
returns trigger
language plpgsql
security definer
set search_path=''
as $$
declare
  v_type public.conversation_type;
  v_count integer;
begin
  select c.type into v_type
  from public.conversations c
  where c.id = new.conversation_id
  for update;

  if v_type is null then
    raise exception 'Conversation not found';
  end if;

  select count(*) into v_count
  from public.conversation_members cm
  where cm.conversation_id = new.conversation_id;

  if v_type = 'direct' and v_count >= 2 then
    raise exception 'Direct conversations can contain only two participants';
  end if;
  if v_type = 'group' and v_count >= 50 then
    raise exception 'Group participant limit reached';
  end if;
  return new;
end;
$$;

create trigger conversations_validate_direct_key
before insert on public.conversations
for each row execute function private.validate_direct_conversation_insert();

create trigger conversation_members_enforce_limit
before insert on public.conversation_members
for each row execute function private.enforce_conversation_member_limit();

drop policy "Creators add themselves as owner and managers add regular members" on public.conversation_members;
create policy "Creators add themselves as owner and managers add regular members"
on public.conversation_members for insert to authenticated
with check (
  added_by=(select auth.uid())
  and (select private.is_active_user())
  and (select private.is_active_profile(profile_id))
  and (
    (
      profile_id=(select auth.uid())
      and member_role='owner'
      and exists(select 1 from public.conversations c where c.id=conversation_id and c.created_by=(select auth.uid()))
    )
    or (
      member_role='member'
      and (select private.can_manage_conversation(conversation_id))
      and exists(
        select 1 from public.conversations c
        where c.id=conversation_id
          and (
            c.type='group'
            or (
              c.type='direct'
              and c.direct_key = least(c.created_by::text,profile_id::text)||':'||greatest(c.created_by::text,profile_id::text)
            )
          )
      )
    )
  )
);
