drop policy "Creators and conversation managers can add active members" on public.conversation_members;
create policy "Creators add themselves as owner and managers add regular members"
on public.conversation_members for insert to authenticated
with check (
  added_by=(select auth.uid())
  and (select private.is_active_user())
  and exists(select 1 from public.profiles p where p.id=profile_id and p.status='active')
  and (
    (profile_id=(select auth.uid()) and member_role='owner'
      and exists(select 1 from public.conversations c where c.id=conversation_id and c.created_by=(select auth.uid())))
    or (member_role='member' and (select private.can_manage_conversation(conversation_id)))
  )
);
grant update(title,archived_at) on public.conversations to authenticated;
grant update(left_at) on public.conversation_members to authenticated;
create policy "Conversation managers can update metadata"
on public.conversations for update to authenticated
using((select private.can_manage_conversation(id)))
with check((select private.can_manage_conversation(id)));
create policy "Users can leave their own conversations"
on public.conversation_members for update to authenticated
using(profile_id=(select auth.uid()) and left_at is null and (select private.is_conversation_member(conversation_id)))
with check(profile_id=(select auth.uid()) and left_at is not null);
create policy "Authenticated users cannot access audit logs directly"
on private.audit_logs for all to authenticated using(false) with check(false);
create policy "Authenticated users cannot access admin actions directly"
on private.admin_actions for all to authenticated using(false) with check(false);
create index attachments_message_id_idx on public.attachments(message_id);
create index attachments_uploader_id_idx on public.attachments(uploader_id);
create index conversation_members_added_by_idx on public.conversation_members(added_by);
create index conversations_created_by_idx on public.conversations(created_by);
create index profile_roles_granted_by_idx on public.profile_roles(granted_by);
create index admin_actions_actor_occurred_idx on private.admin_actions(actor_profile_id,occurred_at desc);
