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
  if jsonb_typeof(_settings) is distinct from 'object'
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
       set setting_value = _item.value, updated_by = _actor, updated_at = now()
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
