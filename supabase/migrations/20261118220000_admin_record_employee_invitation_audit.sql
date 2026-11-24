create or replace function private.record_employee_invitation(_profile_id uuid,_email_domain text)
returns void language plpgsql security definer set search_path='' as $$
declare _actor uuid := (select auth.uid());
begin
 if _actor is null or not (select private.has_role('it_admin')) then
  raise exception 'forbidden' using errcode='42501';
 end if;
 if _profile_id is null or _email_domain is null or length(trim(_email_domain))<3 then
  raise exception 'invalid invitation audit data' using errcode='22023';
 end if;
 insert into private.audit_logs(actor_profile_id,action,resource_type,resource_id,reason,metadata)
 values(_actor,'admin.invitation_sent','profile',_profile_id,
 'Convite de acesso enviado pela administração de TI',
 jsonb_build_object('email_domain',lower(trim(_email_domain))));
end; $$;

revoke all on function private.record_employee_invitation(uuid,text) from public,anon;
grant execute on function private.record_employee_invitation(uuid,text) to authenticated;

create or replace function public.admin_record_invitation(_invited_profile_id uuid,_email_domain text)
returns void language sql security invoker set search_path='' as $$
 select private.record_employee_invitation(_invited_profile_id,_email_domain);
$$;
revoke all on function public.admin_record_invitation(uuid,text) from public,anon;
grant execute on function public.admin_record_invitation(uuid,text) to authenticated;
