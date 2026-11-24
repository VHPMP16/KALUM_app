create or replace function public.admin_set_profile_status(_profile_id uuid,_status public.profile_status,_reason text)
returns void language plpgsql security definer set search_path='' as $$
declare _actor uuid := (select auth.uid()); _old_status public.profile_status; _target_admin boolean; _admin_count bigint;
begin
 if _actor is null or not (select private.has_role('it_admin')) then raise exception 'forbidden' using errcode='42501'; end if;
 if _profile_id is null or _status not in ('active','disabled') then raise exception 'invalid status' using errcode='22023'; end if;
 if _profile_id=_actor then raise exception 'cannot change own status' using errcode='42501'; end if;
 if length(trim(coalesce(_reason,'')))<8 or length(_reason)>500 then raise exception 'reason required (8-500 chars)' using errcode='22023'; end if;
 select p.status,exists(select 1 from public.profile_roles pr join public.roles r on r.id=pr.role_id where pr.profile_id=p.id and r.code='it_admin')
 into _old_status,_target_admin from public.profiles p where p.id=_profile_id for update;
 if not found then raise exception 'profile not found' using errcode='P0002'; end if;
 if _old_status=_status then return; end if;
 if _status='disabled' and _target_admin and _old_status='active' then
  select count(*) into _admin_count from public.profiles p join public.profile_roles pr on pr.profile_id=p.id join public.roles r on r.id=pr.role_id where p.status='active' and r.code='it_admin';
  if _admin_count<=1 then raise exception 'cannot disable last active IT administrator' using errcode='23514'; end if;
 end if;
 update public.profiles set status=_status,disabled_at=case when _status='disabled' then now() else null end,updated_at=now() where id=_profile_id;
 insert into private.audit_logs(actor_profile_id,action,resource_type,resource_id,reason,metadata)
 values(_actor,case when _status='disabled' then 'admin.profile_disabled' else 'admin.profile_reactivated' end,'profile',_profile_id,trim(_reason),jsonb_build_object('previous_status',_old_status,'new_status',_status));
end; $$;

create or replace function public.admin_set_profile_role(_profile_id uuid,_role_code text,_grant boolean,_reason text)
returns void language plpgsql security definer set search_path='' as $$
declare _actor uuid := (select auth.uid()); _role_id uuid; _profile_status public.profile_status; _assigned boolean; _admin_count bigint;
begin
 if _actor is null or not (select private.has_role('it_admin')) then raise exception 'forbidden' using errcode='42501'; end if;
 if _profile_id is null or _role_code not in ('employee','it_admin','security_admin') then raise exception 'invalid role' using errcode='22023'; end if;
 if length(trim(coalesce(_reason,'')))<8 or length(_reason)>500 then raise exception 'reason required (8-500 chars)' using errcode='22023'; end if;
 select id into _role_id from public.roles where code=_role_code;
 if _role_id is null then raise exception 'role not found' using errcode='P0002'; end if;
 select status into _profile_status from public.profiles where id=_profile_id for update;
 if not found then raise exception 'profile not found' using errcode='P0002'; end if;
 if _profile_status<>'active' then raise exception 'roles require active profile' using errcode='23514'; end if;
 select exists(select 1 from public.profile_roles where profile_id=_profile_id and role_id=_role_id) into _assigned;
 if _grant and not _assigned then
  insert into public.profile_roles(profile_id,role_id,granted_by) values(_profile_id,_role_id,_actor);
 elsif not _grant and _assigned then
  if _role_code='it_admin' then
   select count(*) into _admin_count from public.profiles p join public.profile_roles pr on pr.profile_id=p.id join public.roles r on r.id=pr.role_id where p.status='active' and r.code='it_admin';
   if _admin_count<=1 then raise exception 'cannot remove last active IT administrator' using errcode='23514'; end if;
  end if;
  delete from public.profile_roles where profile_id=_profile_id and role_id=_role_id;
 else return;
 end if;
 insert into private.audit_logs(actor_profile_id,action,resource_type,resource_id,reason,metadata)
 values(_actor,case when _grant then 'admin.role_granted' else 'admin.role_revoked' end,'profile',_profile_id,trim(_reason),jsonb_build_object('role_code',_role_code,'granted',_grant));
end; $$;

revoke all on function public.admin_set_profile_status(uuid,public.profile_status,text) from public,anon;
revoke all on function public.admin_set_profile_role(uuid,text,boolean,text) from public,anon;
grant execute on function public.admin_set_profile_status(uuid,public.profile_status,text) to authenticated;
grant execute on function public.admin_set_profile_role(uuid,text,boolean,text) to authenticated;
