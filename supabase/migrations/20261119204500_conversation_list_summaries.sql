create index if not exists attachments_message_created_idx
  on public.attachments(message_id, created_at desc);

create or replace function private.get_conversation_summaries()
returns table (
  conversation_id uuid,
  conversation_type public.conversation_type,
  conversation_title text,
  created_at timestamptz,
  participant_name text,
  participant_avatar_path text,
  active_member_count integer,
  last_message_body text,
  last_message_sender_name text,
  last_message_created_at timestamptz,
  last_attachment_mime_type text,
  last_attachment_scan_status text
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  _actor uuid := (select auth.uid());
begin
  if _actor is null or not (select private.is_active_user()) then
    raise exception 'active authenticated profile required' using errcode = '42501';
  end if;

  return query
  select
    c.id,
    c.type,
    c.title,
    c.created_at,
    peer.full_name,
    peer.avatar_path,
    coalesce(member_count.total, 0)::integer,
    last_message.body,
    sender.full_name,
    last_message.created_at,
    latest_attachment.mime_type,
    latest_attachment.scan_status
  from public.conversations c
  join public.conversation_members mine
    on mine.conversation_id = c.id
   and mine.profile_id = _actor
   and mine.left_at is null
  left join lateral (
    select m.id, m.body, m.sender_id, m.created_at
    from public.messages m
    where m.conversation_id = c.id
    order by m.created_at desc, m.id desc
    limit 1
  ) last_message on true
  left join public.profiles sender on sender.id = last_message.sender_id
  left join lateral (
    select p.full_name, p.avatar_path
    from public.conversation_members cm
    join public.profiles p on p.id = cm.profile_id
    where cm.conversation_id = c.id
      and cm.profile_id <> _actor
      and cm.left_at is null
    order by cm.joined_at, cm.profile_id
    limit 1
  ) peer on c.type = 'direct'
  left join lateral (
    select count(*) as total
    from public.conversation_members cm
    where cm.conversation_id = c.id and cm.left_at is null
  ) member_count on true
  left join lateral (
    select a.mime_type, a.scan_status
    from public.attachments a
    where a.message_id = last_message.id
    order by a.created_at desc, a.id desc
    limit 1
  ) latest_attachment on true
  where c.archived_at is null
  order by coalesce(last_message.created_at, c.created_at) desc, c.id desc;
end;
$$;

revoke all on function private.get_conversation_summaries() from public, anon;
grant execute on function private.get_conversation_summaries() to authenticated;

create or replace function public.get_conversation_summaries()
returns table (
  conversation_id uuid,
  conversation_type public.conversation_type,
  conversation_title text,
  created_at timestamptz,
  participant_name text,
  participant_avatar_path text,
  active_member_count integer,
  last_message_body text,
  last_message_sender_name text,
  last_message_created_at timestamptz,
  last_attachment_mime_type text,
  last_attachment_scan_status text
)
language sql
stable
security invoker
set search_path = ''
as $$
  select * from private.get_conversation_summaries();
$$;

revoke all on function public.get_conversation_summaries() from public, anon;
grant execute on function public.get_conversation_summaries() to authenticated;
