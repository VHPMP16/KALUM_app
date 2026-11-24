create policy "Group managers can remove other members"
on public.conversation_members for update to authenticated
using (
  profile_id <> (select auth.uid())
  and left_at is null
  and (select private.can_manage_conversation(conversation_id))
  and exists (
    select 1 from public.conversations c
    where c.id = conversation_id and c.type = 'group'
  )
)
with check (
  profile_id <> (select auth.uid())
  and left_at is not null
  and (select private.can_manage_conversation(conversation_id))
  and exists (
    select 1 from public.conversations c
    where c.id = conversation_id and c.type = 'group'
  )
);

create or replace function private.audit_group_member_removal()
returns trigger
language plpgsql
security definer
set search_path=''
as $$
begin
  if old.left_at is null and new.left_at is not null then
    insert into private.audit_logs(actor_profile_id,action,resource_type,resource_id,metadata)
    values (
      (select auth.uid()),
      'group.member_removed',
      'conversation_member',
      new.conversation_id,
      jsonb_build_object('removed_profile_id',new.profile_id,'removed_at',new.left_at)
    );
  end if;
  return new;
end;
$$;

create trigger conversation_members_audit_removal
after update of left_at on public.conversation_members
for each row execute function private.audit_group_member_removal();
