revoke select on public.profiles from authenticated;
grant select (id, full_name, status, avatar_path) on public.profiles to authenticated;

create policy "Active employees can view the minimal active directory"
on public.profiles for select to authenticated
using (
  status = 'active'
  and (select private.is_active_user())
);
