drop policy "Users can leave their own conversations" on public.conversation_members;
drop policy "Group managers can remove other members" on public.conversation_members;

create policy "Members can leave or managers can remove group members"
on public.conversation_members for update to authenticated
using (
  (
    profile_id = (select auth.uid())
    and left_at is null
    and (select private.is_conversation_member(conversation_id))
  )
  or (
    profile_id <> (select auth.uid())
    and left_at is null
    and (select private.can_manage_conversation(conversation_id))
    and exists (
      select 1 from public.conversations c
      where c.id = conversation_id and c.type = 'group'
    )
  )
)
with check (
  left_at is not null
  and (
    profile_id = (select auth.uid())
    or (
      profile_id <> (select auth.uid())
      and (select private.can_manage_conversation(conversation_id))
      and exists (
        select 1 from public.conversations c
        where c.id = conversation_id and c.type = 'group'
      )
    )
  )
);
