create index if not exists profiles_global_search_idx
  on public.profiles using gin (to_tsvector('simple', coalesce(full_name, '')))
  where status = 'active';

create index if not exists conversations_global_search_idx
  on public.conversations using gin (to_tsvector('simple', coalesce(title, '')))
  where type = 'group' and archived_at is null;

create index if not exists messages_global_search_idx
  on public.messages using gin (to_tsvector('simple', coalesce(body, '')));

create or replace function private.search_chatapp(_query text, _limit integer default 6)
returns table (
  category text,
  id uuid,
  title text,
  subtitle text,
  snippet text,
  conversation_id uuid,
  created_at timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  _actor uuid := (select auth.uid());
  _terms tsquery;
  _per_category integer := greatest(1, least(coalesce(_limit, 6), 10));
begin
  if _actor is null or not (select private.is_active_user()) then
    raise exception 'active authenticated profile required' using errcode = '42501';
  end if;
  if _query is null or char_length(btrim(_query)) < 2 or char_length(_query) > 100 then
    raise exception 'search query must contain between 2 and 100 characters' using errcode = '22023';
  end if;

  _terms := plainto_tsquery('simple', btrim(_query));
  if numnode(_terms) = 0 then
    return;
  end if;

  return query
  with matches as (
    select
      'Funcionários'::text as category,
      p.id,
      p.full_name as title,
      'Funcionário ativo'::text as subtitle,
      'Localizar funcionário'::text as snippet,
      null::uuid as conversation_id,
      p.created_at,
      ts_rank(to_tsvector('simple', coalesce(p.full_name, '')), _terms) as relevance
    from public.profiles p
    where p.status = 'active'
      and to_tsvector('simple', coalesce(p.full_name, '')) @@ _terms

    union all

    select
      'Grupos'::text,
      c.id,
      c.title,
      'Grupo privado'::text,
      count(cm.profile_id)::text || ' participantes',
      c.id,
      c.created_at,
      ts_rank(to_tsvector('simple', coalesce(c.title, '')), _terms)
    from public.conversations c
    join public.conversation_members mine
      on mine.conversation_id = c.id
     and mine.profile_id = _actor
     and mine.left_at is null
    left join public.conversation_members cm
      on cm.conversation_id = c.id
     and cm.left_at is null
    where c.type = 'group'
      and c.archived_at is null
      and to_tsvector('simple', coalesce(c.title, '')) @@ _terms
    group by c.id, c.title, c.created_at

    union all

    select
      'Mensagens'::text,
      m.id,
      coalesce(c.title, sender.full_name, 'Conversa individual'),
      sender.full_name,
      left(m.body, 240),
      m.conversation_id,
      m.created_at,
      ts_rank(to_tsvector('simple', coalesce(m.body, '')), _terms)
    from public.messages m
    join public.conversations c on c.id = m.conversation_id
    join public.profiles sender on sender.id = m.sender_id
    where c.archived_at is null
      and exists (
        select 1
        from public.conversation_members mine
        where mine.conversation_id = m.conversation_id
          and mine.profile_id = _actor
          and mine.left_at is null
      )
      and to_tsvector('simple', coalesce(m.body, '')) @@ _terms
  ), ranked as (
    select matches.*,
      row_number() over (
        partition by matches.category
        order by matches.relevance desc, matches.created_at desc
      ) as position
    from matches
  )
  select ranked.category, ranked.id, ranked.title, ranked.subtitle,
         ranked.snippet, ranked.conversation_id, ranked.created_at
  from ranked
  where ranked.position <= _per_category
  order by ranked.category, ranked.created_at desc;
end;
$$;

revoke all on function private.search_chatapp(text, integer) from public, anon;
grant execute on function private.search_chatapp(text, integer) to authenticated;

create or replace function public.search_chatapp(_query text, _limit integer default 6)
returns table (
  category text,
  id uuid,
  title text,
  subtitle text,
  snippet text,
  conversation_id uuid,
  created_at timestamptz
)
language sql
stable
security invoker
set search_path = ''
as $$
  select * from private.search_chatapp(_query, _limit);
$$;

revoke all on function public.search_chatapp(text, integer) from public, anon;
grant execute on function public.search_chatapp(text, integer) to authenticated;
