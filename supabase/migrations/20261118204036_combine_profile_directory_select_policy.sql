revoke select on public.profiles from authenticated;
grant select (id, full_name, status, avatar_path) on public.profiles to authenticated;

create policy "Active employees can view the minimal active directory"
on public.profiles for select to authenticated
using (
  status = 'active'
  and (select private.is_active_user())
);

drop policy "Users can view permitted profiles" on public.profiles;
drop policy "Active employees can view the minimal active directory" on public.profiles;
create policy "Users can view permitted profiles and minimal active directory"
on public.profiles for select to authenticated
using (
  (select private.can_view_profile(id))
  or (
    status = 'active'
    and (select private.is_active_user())
  )
);
