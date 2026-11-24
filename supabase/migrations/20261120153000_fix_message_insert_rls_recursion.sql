create or replace function private.can_reference_message(
  _reply_to_id uuid,
  _conversation_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    (select private.is_active_user())
    and (select private.is_conversation_member(_conversation_id))
    and (
      _reply_to_id is null
      or exists (
        select 1
        from public.messages parent
        where parent.id = _reply_to_id
          and parent.conversation_id = _conversation_id
      )
    );
$$;

revoke all on function private.can_reference_message(uuid, uuid) from public, anon;
grant execute on function private.can_reference_message(uuid, uuid) to authenticated;

drop policy if exists "Active members can send messages as themselves" on public.messages;
create policy "Active members can send messages as themselves"
on public.messages
for insert
to authenticated
with check (
  sender_id = (select auth.uid())
  and (select private.is_active_user())
  and (select private.is_conversation_member(conversation_id))
  and (select private.can_reference_message(reply_to_id, conversation_id))
);
