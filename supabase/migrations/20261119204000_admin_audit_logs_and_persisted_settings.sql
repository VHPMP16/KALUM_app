create table if not exists private.admin_settings (
  setting_key text primary key check (setting_key in (
    'company_name', 'support_email', 'maintenance_notice',
    'group_creation_enabled', 'max_group_members'
  )),
  setting_value jsonb not null,
  description text not null,
  updated_by uuid references public.profiles(id) on delete restrict,
  updated_at timestamptz not null default now()
);
alter table private.admin_settings enable row level security;
revoke all on table private.admin_settings from public, anon, authenticated;

insert into private.admin_settings(setting_key, setting_value, description) values
  ('company_name', '"Calunga"'::jsonb, 'Nome institucional exibido nas configurações.'),
  ('support_email', '""'::jsonb, 'E-mail de suporte corporativo.'),
  ('maintenance_notice', '""'::jsonb, 'Aviso administrativo exibido no painel.'),
  ('group_creation_enabled', 'true'::jsonb, 'Permite que funcionários criem novos grupos.'),
  ('max_group_members', '50'::jsonb, 'Quantidade máxima de participantes por grupo, incluindo o criador.')
on conflict (setting_key) do nothing;

create index if not exists audit_logs_action_occurred_idx
  on private.audit_logs(action, occurred_at desc);
create index if not exists admin_actions_actor_occurred_idx
  on private.admin_actions(actor_profile_id, occurred_at desc);
create index if not exists admin_actions_type_occurred_idx
  on private.admin_actions(action_type, occurred_at desc);

create or replace function private.group_creation_is_enabled()
returns boolean
language sql stable security definer set search_path = ''
as $$
  select coalesce(
    (select (s.setting_value #>> '{}')::boolean
     from private.admin_settings s
     where s.setting_key = 'group_creation_enabled'),
    true
  );
$$;

create or replace function private.group_max_members()
returns integer
language sql stable security definer set search_path = ''
as $$
  select coalesce(
    (select (s.setting_value #>> '{}')::integer
     from private.admin_settings s
     where s.setting_key = 'max_group_members'),
    50
  );
$$;

revoke all on function private.group_creation_is_enabled() from public, anon;
revoke all on function private.group_max_members() from public, anon;
grant execute on function private.group_creation_is_enabled() to authenticated;
grant execute on function private.group_max_members() to authenticated;

create or replace function private.admin_get_settings()
returns table (
  setting_key text,
  setting_value jsonb,
  description text,
  updated_at timestamptz
)
language plpgsql stable security definer set search_path = ''
as $$
begin
  if (select auth.uid()) is null
     or not (select private.has_role('it_admin')) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  return query
    select s.setting_key, s.setting_value, s.description, s.updated_at
    from private.admin_settings s
    order by s.setting_key;
end;
$$;

create or replace function private.admin_update_settings(_settings jsonb)
returns void
language plpgsql security definer set search_path = ''
as $$
declare
  _actor uuid := (select auth.uid());
  _item record;
  _text_value text;
begin
  if _actor is null or not (select private.has_role('it_admin')) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if jsonb_typeof(_settings) <> 'object'
     or (select count(*) from jsonb_object_keys(_settings)) < 1
     or (select count(*) from jsonb_object_keys(_settings)) > 5 then
    raise exception 'settings must be a non-empty object with at most five keys' using errcode = '22023';
  end if;

  for _item in select key, value from jsonb_each(_settings)
  loop
    _text_value := _item.value #>> '{}';
    if _item.key = 'company_name' then
      if jsonb_typeof(_item.value) <> 'string'
         or char_length(btrim(coalesce(_text_value, ''))) not between 2 and 80 then
        raise exception 'company_name must contain 2 to 80 characters' using errcode = '22023';
      end if;
    elsif _item.key = 'support_email' then
      if jsonb_typeof(_item.value) <> 'string'
         or char_length(_text_value) > 254
         or (_text_value <> '' and _text_value !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$') then
        raise exception 'support_email must be a valid e-mail or empty' using errcode = '22023';
      end if;
    elsif _item.key = 'maintenance_notice' then
      if jsonb_typeof(_item.value) <> 'string'
         or char_length(_text_value) > 300 then
        raise exception 'maintenance_notice must contain at most 300 characters' using errcode = '22023';
      end if;
    elsif _item.key = 'group_creation_enabled' then
      if jsonb_typeof(_item.value) <> 'boolean' then
        raise exception 'group_creation_enabled must be boolean' using errcode = '22023';
      end if;
    elsif _item.key = 'max_group_members' then
      if jsonb_typeof(_item.value) <> 'number'
         or _text_value !~ '^[0-9]+$'
         or _text_value::integer not between 2 and 50 then
        raise exception 'max_group_members must be an integer between 2 and 50' using errcode = '22023';
      end if;
    else
      raise exception 'unknown administrative setting: %', _item.key using errcode = '22023';
    end if;

    update private.admin_settings
       set setting_value = _item.value,
           updated_by = _actor,
           updated_at = now()
     where setting_key = _item.key;
    if not found then
      raise exception 'administrative setting not found: %', _item.key using errcode = 'P0002';
    end if;

    insert into private.audit_logs(actor_profile_id, action, resource_type, reason, metadata)
    values (_actor, 'admin.setting_updated', 'setting',
      'Configuração administrativa atualizada',
      jsonb_build_object('setting_key', _item.key));

    insert into private.admin_actions(actor_profile_id, action_type, outcome, reason, metadata)
    values (_actor, 'setting.updated', 'success',
      'Configuração administrativa atualizada',
      jsonb_build_object('setting_key', _item.key));
  end loop;
end;
$$;

create or replace function private.admin_search_audit_logs(
  _from timestamptz default null,
  _to timestamptz default null,
  _actor uuid default null,
  _action text default null,
  _page integer default 1,
  _page_size integer default 25
)
returns table (
  id uuid,
  actor_profile_id uuid,
  actor_name text,
  action text,
  resource_type text,
  resource_id uuid,
  reason text,
  metadata jsonb,
  occurred_at timestamptz,
  total_count bigint
)
language plpgsql stable security definer set search_path = ''
as $$
declare
  _page integer := greatest(coalesce(_page, 1), 1);
  _size integer := greatest(1, least(coalesce(_page_size, 25), 100));
begin
  if (select auth.uid()) is null
     or not ((select private.has_role('it_admin')) or (select private.has_role('security_admin'))) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  return query
    select a.id, a.actor_profile_id, coalesce(p.full_name, 'Sistema'),
           a.action, a.resource_type, a.resource_id, a.reason, a.metadata,
           a.occurred_at, count(*) over()
    from private.audit_logs a
    left join public.profiles p on p.id = a.actor_profile_id
    where (_from is null or a.occurred_at >= _from)
      and (_to is null or a.occurred_at < _to)
      and (_actor is null or a.actor_profile_id = _actor)
      and (_action is null or a.action ilike '%' || left(btrim(_action), 100) || '%')
    order by a.occurred_at desc, a.id desc
    limit _size offset ((_page - 1) * _size);
end;
$$;

create or replace function private.admin_search_activity_logs(
  _from timestamptz default null,
  _to timestamptz default null,
  _actor uuid default null,
  _event text default null,
  _outcome text default null,
  _page integer default 1,
  _page_size integer default 25
)
returns table (
  id uuid,
  source text,
  actor_profile_id uuid,
  actor_name text,
  event_type text,
  outcome text,
  target_profile_id uuid,
  target_name text,
  reason text,
  metadata jsonb,
  occurred_at timestamptz,
  total_count bigint
)
language plpgsql stable security definer set search_path = ''
as $$
declare
  _page integer := greatest(coalesce(_page, 1), 1);
  _size integer := greatest(1, least(coalesce(_page_size, 25), 100));
begin
  if (select auth.uid()) is null
     or not ((select private.has_role('it_admin')) or (select private.has_role('security_admin'))) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  return query
    with activity as (
      select a.id, 'auditoria'::text as source, a.actor_profile_id,
             coalesce(actor.full_name, 'Sistema') as actor_name,
             a.action as event_type, 'recorded'::text as outcome,
             a.resource_id as target_profile_id, null::text as target_name,
             a.reason, a.metadata, a.occurred_at
      from private.audit_logs a
      left join public.profiles actor on actor.id = a.actor_profile_id
      union all
      select aa.id, 'administrativo'::text, aa.actor_profile_id,
             coalesce(actor.full_name, 'Sistema'), aa.action_type, aa.outcome,
             aa.target_profile_id, target.full_name, aa.reason, aa.metadata, aa.occurred_at
      from private.admin_actions aa
      left join public.profiles actor on actor.id = aa.actor_profile_id
      left join public.profiles target on target.id = aa.target_profile_id
    ), filtered as (
      select * from activity a
      where (_from is null or a.occurred_at >= _from)
        and (_to is null or a.occurred_at < _to)
        and (_actor is null or a.actor_profile_id = _actor)
        and (_event is null or a.event_type ilike '%' || left(btrim(_event), 100) || '%')
        and (_outcome is null or a.outcome = _outcome)
    )
    select f.id, f.source, f.actor_profile_id, f.actor_name, f.event_type,
           f.outcome, f.target_profile_id, f.target_name, f.reason, f.metadata,
           f.occurred_at, count(*) over()
    from filtered f
    order by f.occurred_at desc, f.id desc
    limit _size offset ((_page - 1) * _size);
end;
$$;

revoke all on function private.admin_get_settings() from public, anon;
revoke all on function private.admin_update_settings(jsonb) from public, anon;
revoke all on function private.admin_search_audit_logs(timestamptz,timestamptz,uuid,text,integer,integer) from public, anon;
revoke all on function private.admin_search_activity_logs(timestamptz,timestamptz,uuid,text,text,integer,integer) from public, anon;
grant execute on function private.admin_get_settings() to authenticated;
grant execute on function private.admin_update_settings(jsonb) to authenticated;
grant execute on function private.admin_search_audit_logs(timestamptz,timestamptz,uuid,text,integer,integer) to authenticated;
grant execute on function private.admin_search_activity_logs(timestamptz,timestamptz,uuid,text,text,integer,integer) to authenticated;

create or replace function public.admin_get_settings()
returns table (setting_key text, setting_value jsonb, description text, updated_at timestamptz)
language sql stable security invoker set search_path = ''
as $$ select * from private.admin_get_settings(); $$;

create or replace function public.admin_update_settings(_settings jsonb)
returns void language sql security invoker set search_path = ''
as $$ select private.admin_update_settings(_settings); $$;

create or replace function public.admin_search_audit_logs(
  _from timestamptz default null, _to timestamptz default null,
  _actor uuid default null, _action text default null,
  _page integer default 1, _page_size integer default 25
)
returns table (
  id uuid, actor_profile_id uuid, actor_name text, action text,
  resource_type text, resource_id uuid, reason text, metadata jsonb,
  occurred_at timestamptz, total_count bigint
)
language sql stable security invoker set search_path = ''
as $$ select * from private.admin_search_audit_logs(_from,_to,_actor,_action,_page,_page_size); $$;

create or replace function public.admin_search_activity_logs(
  _from timestamptz default null, _to timestamptz default null,
  _actor uuid default null, _event text default null, _outcome text default null,
  _page integer default 1, _page_size integer default 25
)
returns table (
  id uuid, source text, actor_profile_id uuid, actor_name text, event_type text,
  outcome text, target_profile_id uuid, target_name text, reason text,
  metadata jsonb, occurred_at timestamptz, total_count bigint
)
language sql stable security invoker set search_path = ''
as $$ select * from private.admin_search_activity_logs(_from,_to,_actor,_event,_outcome,_page,_page_size); $$;

revoke all on function public.admin_get_settings() from public, anon;
revoke all on function public.admin_update_settings(jsonb) from public, anon;
revoke all on function public.admin_search_audit_logs(timestamptz,timestamptz,uuid,text,integer,integer) from public, anon;
revoke all on function public.admin_search_activity_logs(timestamptz,timestamptz,uuid,text,text,integer,integer) from public, anon;
grant execute on function public.admin_get_settings() to authenticated;
grant execute on function public.admin_update_settings(jsonb) to authenticated;
grant execute on function public.admin_search_audit_logs(timestamptz,timestamptz,uuid,text,integer,integer) to authenticated;
grant execute on function public.admin_search_activity_logs(timestamptz,timestamptz,uuid,text,text,integer,integer) to authenticated;

create or replace function public.create_conversation(
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
  select count(distinct member_id) into v_distinct_count
    from unnest(_member_ids) as members(member_id);
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
    select v_conversation_id,member_id,'member',v_user_id
    from unnest(_member_ids) as members(member_id);
  perform private.log_conversation_event('conversation.created',v_conversation_id,
    jsonb_build_object('type',_type,'member_count',v_member_count + 1));
  return v_conversation_id;
end;
$$;

revoke all on function public.create_conversation(public.conversation_type,text,uuid[]) from public, anon;
grant execute on function public.create_conversation(public.conversation_type,text,uuid[]) to authenticated;
