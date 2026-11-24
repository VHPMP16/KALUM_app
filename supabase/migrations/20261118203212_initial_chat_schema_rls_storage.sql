create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

create type public.profile_status as enum ('pending_invitation','active','disabled');
create type public.conversation_type as enum ('direct','group');

create table public.departments (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  code text not null unique,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  check (char_length(btrim(name)) between 2 and 100),
  check (code ~ '^[A-Z0-9_-]{2,20}$')
);
create table public.roles (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code in ('employee','it_admin','security_admin')),
  name text not null,
  description text
);
insert into public.roles(code,name,description) values
 ('employee','Funcionário','Acesso operacional às conversas das quais participa.'),
 ('it_admin','Administrador de TI','Provisionamento e administração de contas e grupos.'),
 ('security_admin','Administrador de Segurança','Consulta controlada de trilhas de segurança.')
on conflict(code) do nothing;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete restrict,
  employee_code text unique,
  full_name text not null check (char_length(btrim(full_name)) between 2 and 120),
  corporate_email text not null unique check (corporate_email = lower(corporate_email)),
  department_id uuid references public.departments(id) on delete restrict,
  status public.profile_status not null default 'pending_invitation',
  avatar_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  disabled_at timestamptz,
  check (employee_code is null or char_length(employee_code) between 2 and 30)
);
create table public.profile_roles (
  profile_id uuid not null references public.profiles(id) on delete restrict,
  role_id uuid not null references public.roles(id) on delete restrict,
  granted_by uuid references public.profiles(id) on delete restrict,
  granted_at timestamptz not null default now(),
  primary key(profile_id,role_id)
);
create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  type public.conversation_type not null,
  title text,
  created_by uuid not null references public.profiles(id) on delete restrict,
  direct_key text unique,
  created_at timestamptz not null default now(),
  archived_at timestamptz,
  check (title is null or char_length(btrim(title)) between 1 and 100),
  check ((type='direct' and direct_key is not null and title is null) or (type='group' and direct_key is null))
);
create table public.conversation_members (
  conversation_id uuid not null references public.conversations(id) on delete restrict,
  profile_id uuid not null references public.profiles(id) on delete restrict,
  member_role text not null default 'member' check (member_role in ('owner','admin','member')),
  joined_at timestamptz not null default now(),
  left_at timestamptz,
  added_by uuid references public.profiles(id) on delete restrict,
  primary key(conversation_id,profile_id)
);
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete restrict,
  sender_id uuid not null references public.profiles(id) on delete restrict,
  client_message_id uuid not null,
  body text not null check (char_length(btrim(body)) between 1 and 4000),
  reply_to_id uuid references public.messages(id) on delete restrict,
  created_at timestamptz not null default now(),
  unique(sender_id,conversation_id,client_message_id)
);
create table public.attachments (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.messages(id) on delete restrict,
  conversation_id uuid not null references public.conversations(id) on delete restrict,
  uploader_id uuid not null references public.profiles(id) on delete restrict,
  bucket text not null check (bucket in ('chat-quarantine','chat-attachments')),
  object_path text not null unique,
  original_name text not null check (char_length(btrim(original_name)) between 1 and 255),
  mime_type text not null check (mime_type in ('application/pdf','image/jpeg')),
  size_bytes bigint not null check (size_bytes between 1 and 5242880),
  sha256 text check (sha256 is null or sha256 ~ '^[a-f0-9]{64}$'),
  scan_status text not null default 'pending' check (scan_status in ('pending','clean','rejected')),
  created_at timestamptz not null default now()
);
create table public.message_receipts (
  message_id uuid not null references public.messages(id) on delete restrict,
  profile_id uuid not null references public.profiles(id) on delete restrict,
  delivered_at timestamptz,
  read_at timestamptz,
  primary key(message_id,profile_id),
  check (read_at is null or delivered_at is not null)
);
create table private.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_profile_id uuid references public.profiles(id) on delete restrict,
  action text not null, resource_type text not null, resource_id uuid,
  reason text, request_id uuid, metadata jsonb not null default '{}'::jsonb,
  previous_hash text, record_hash text, occurred_at timestamptz not null default now()
);
create table private.admin_actions (
  id uuid primary key default gen_random_uuid(),
  actor_profile_id uuid not null references public.profiles(id) on delete restrict,
  action_type text not null,
  target_profile_id uuid references public.profiles(id) on delete restrict,
  outcome text not null check (outcome in ('success','denied','failure')),
  reason text, request_id uuid, metadata jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now()
);

create index profiles_department_status_idx on public.profiles(department_id,status);
create index profile_roles_role_profile_idx on public.profile_roles(role_id,profile_id);
create index conversation_members_profile_active_idx on public.conversation_members(profile_id,left_at,conversation_id);
create index messages_conversation_cursor_idx on public.messages(conversation_id,created_at desc,id desc);
create index messages_reply_to_idx on public.messages(reply_to_id) where reply_to_id is not null;
create index attachments_conversation_created_idx on public.attachments(conversation_id,created_at desc);
create index message_receipts_profile_read_idx on public.message_receipts(profile_id,read_at);
create index audit_logs_occurred_idx on private.audit_logs(occurred_at desc);
create index audit_logs_actor_occurred_idx on private.audit_logs(actor_profile_id,occurred_at desc);
create index admin_actions_target_occurred_idx on private.admin_actions(target_profile_id,occurred_at desc);

create or replace function private.is_active_user() returns boolean
language sql stable security definer set search_path=''
as $$ select exists(select 1 from public.profiles p where p.id=(select auth.uid()) and p.status='active'); $$;
create or replace function private.has_role(_role_code text) returns boolean
language sql stable security definer set search_path=''
as $$ select exists(select 1 from public.profile_roles pr join public.roles r on r.id=pr.role_id join public.profiles p on p.id=pr.profile_id where pr.profile_id=(select auth.uid()) and r.code=_role_code and p.status='active'); $$;
create or replace function private.is_conversation_member(_conversation_id uuid) returns boolean
language sql stable security definer set search_path=''
as $$ select exists(select 1 from public.conversation_members cm join public.profiles p on p.id=cm.profile_id where cm.conversation_id=_conversation_id and cm.profile_id=(select auth.uid()) and cm.left_at is null and p.status='active'); $$;
create or replace function private.can_manage_conversation(_conversation_id uuid) returns boolean
language sql stable security definer set search_path=''
as $$ select exists(select 1 from public.conversation_members cm join public.profiles p on p.id=cm.profile_id where cm.conversation_id=_conversation_id and cm.profile_id=(select auth.uid()) and cm.left_at is null and p.status='active' and cm.member_role in ('owner','admin')); $$;
create or replace function private.can_view_profile(_profile_id uuid) returns boolean
language sql stable security definer set search_path=''
as $$ select _profile_id=(select auth.uid()) or private.has_role('it_admin') or private.has_role('security_admin') or exists(select 1 from public.conversation_members mine join public.conversation_members theirs on theirs.conversation_id=mine.conversation_id where mine.profile_id=(select auth.uid()) and mine.left_at is null and theirs.profile_id=_profile_id and theirs.left_at is null); $$;

create or replace function private.touch_updated_at() returns trigger
language plpgsql set search_path=''
as $$ begin new.updated_at=now(); return new; end; $$;
create or replace function private.handle_new_auth_user() returns trigger
language plpgsql security definer set search_path=''
as $$
begin
 insert into public.profiles(id,full_name,corporate_email,status)
 values(new.id,coalesce(nullif(btrim(new.raw_user_meta_data->>'full_name'),''),split_part(new.email,'@',1)),lower(new.email),'pending_invitation');
 return new;
end; $$;
create or replace function private.audit_message_insert() returns trigger
language plpgsql security definer set search_path=''
as $$
begin
 insert into private.audit_logs(actor_profile_id,action,resource_type,resource_id,metadata)
 values(new.sender_id,'message.created','message',new.id,jsonb_build_object('conversation_id',new.conversation_id,'created_at',new.created_at));
 return new;
end; $$;

create trigger profiles_touch_updated_at before update on public.profiles for each row execute function private.touch_updated_at();
create trigger on_auth_user_created after insert on auth.users for each row execute function private.handle_new_auth_user();
create trigger messages_audit_insert after insert on public.messages for each row execute function private.audit_message_insert();

grant execute on function private.is_active_user() to authenticated;
grant execute on function private.has_role(text) to authenticated;
grant execute on function private.is_conversation_member(uuid) to authenticated;
grant execute on function private.can_manage_conversation(uuid) to authenticated;
grant execute on function private.can_view_profile(uuid) to authenticated;

alter table public.departments enable row level security;
alter table public.roles enable row level security;
alter table public.profiles enable row level security;
alter table public.profile_roles enable row level security;
alter table public.conversations enable row level security;
alter table public.conversation_members enable row level security;
alter table public.messages enable row level security;
alter table public.attachments enable row level security;
alter table public.message_receipts enable row level security;
alter table private.audit_logs enable row level security;
alter table private.admin_actions enable row level security;

grant select on public.departments,public.roles,public.profiles,public.profile_roles,public.conversations,public.conversation_members,public.messages,public.attachments,public.message_receipts to authenticated;
grant insert on public.conversations,public.conversation_members,public.messages,public.attachments,public.message_receipts to authenticated;
grant update(full_name,avatar_path) on public.profiles to authenticated;
grant insert(conversation_id,profile_id,member_role,added_by) on public.conversation_members to authenticated;
grant insert(conversation_id,sender_id,client_message_id,body,reply_to_id) on public.messages to authenticated;
grant insert(message_id,profile_id,delivered_at,read_at) on public.message_receipts to authenticated;
grant update(delivered_at,read_at) on public.message_receipts to authenticated;

create policy "Active users can read departments" on public.departments for select to authenticated using((select private.is_active_user()) and active=true);
create policy "Active users can read role definitions" on public.roles for select to authenticated using((select private.is_active_user()));
create policy "Users can view permitted profiles" on public.profiles for select to authenticated using((select private.can_view_profile(id)));
create policy "Users can update own non-privileged profile fields" on public.profiles for update to authenticated using(id=(select auth.uid()) and (select private.is_active_user())) with check(id=(select auth.uid()) and (select private.is_active_user()));
create policy "Users can view own role assignments or admins can view all" on public.profile_roles for select to authenticated using(profile_id=(select auth.uid()) or (select private.has_role('it_admin')) or (select private.has_role('security_admin')));
create policy "Conversation members can read their conversations" on public.conversations for select to authenticated using((select private.is_conversation_member(id)));
create policy "Active users can create conversations" on public.conversations for insert to authenticated with check(created_by=(select auth.uid()) and (select private.is_active_user()));
create policy "Conversation owners can update conversation metadata" on public.conversations for update to authenticated using((select private.can_manage_conversation(id))) with check((select private.can_manage_conversation(id)));
create policy "Members can view conversation membership" on public.conversation_members for select to authenticated using((select private.is_conversation_member(conversation_id)) or (select private.has_role('it_admin')));
create policy "Creators and conversation managers can add active members" on public.conversation_members for insert to authenticated with check(added_by=(select auth.uid()) and (select private.is_active_user()) and exists(select 1 from public.profiles p where p.id=profile_id and p.status='active') and (exists(select 1 from public.conversations c where c.id=conversation_id and c.created_by=(select auth.uid())) or (select private.can_manage_conversation(conversation_id))));
create policy "Members can read messages in their conversations" on public.messages for select to authenticated using((select private.is_conversation_member(conversation_id)));
create policy "Active members can send messages as themselves" on public.messages for insert to authenticated with check(sender_id=(select auth.uid()) and (select private.is_active_user()) and (select private.is_conversation_member(conversation_id)) and (reply_to_id is null or exists(select 1 from public.messages parent where parent.id=reply_to_id and parent.conversation_id=messages.conversation_id)));
create policy "Members can read only clean attachments" on public.attachments for select to authenticated using(scan_status='clean' and (select private.is_conversation_member(conversation_id)));
create policy "Members can register quarantined attachments" on public.attachments for insert to authenticated with check(uploader_id=(select auth.uid()) and bucket='chat-quarantine' and scan_status='pending' and (select private.is_active_user()) and (select private.is_conversation_member(conversation_id)) and exists(select 1 from public.messages m where m.id=message_id and m.conversation_id=attachments.conversation_id));
create policy "Conversation members can read receipts" on public.message_receipts for select to authenticated using((select private.is_conversation_member((select m.conversation_id from public.messages m where m.id=message_id))));
create policy "Users can create their own receipts" on public.message_receipts for insert to authenticated with check(profile_id=(select auth.uid()) and (select private.is_active_user()) and exists(select 1 from public.messages m where m.id=message_id and (select private.is_conversation_member(m.conversation_id))));
create policy "Users can update their own receipts" on public.message_receipts for update to authenticated using(profile_id=(select auth.uid()) and (select private.is_active_user())) with check(profile_id=(select auth.uid()) and (select private.is_active_user()) and exists(select 1 from public.messages m where m.id=message_id and (select private.is_conversation_member(m.conversation_id))));

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values
 ('chat-quarantine','chat-quarantine',false,5242880,array['application/pdf','image/jpeg']),
 ('chat-attachments','chat-attachments',false,5242880,array['application/pdf','image/jpeg']);

create policy "Active conversation members can upload PDF and JPEG to quarantine" on storage.objects for insert to authenticated with check(bucket_id='chat-quarantine' and (storage.foldername(name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' and storage.extension(name) in ('pdf','jpg','jpeg') and (select private.is_active_user()) and (select private.is_conversation_member(((storage.foldername(name))[1])::uuid)));
create policy "Members can download only clean approved attachments" on storage.objects for select to authenticated using(bucket_id='chat-attachments' and exists(select 1 from public.attachments a where a.bucket=storage.objects.bucket_id and a.object_path=storage.objects.name and a.scan_status='clean' and (select private.is_conversation_member(a.conversation_id))));

comment on table public.profiles is 'Perfil interno vinculado a Supabase Auth. Novas contas iniciam como pending_invitation e precisam ser ativadas pela TI.';
comment on table public.conversations is 'Conversas privadas diretas ou em grupo; leitura condicionada à membership ativa.';
comment on table public.messages is 'Mensagens persistidas; edição e exclusão não são concedidas a usuários autenticados no MVP.';
comment on table public.attachments is 'Metadados de anexos. Arquivos permanecem em quarentena até existir scanner antimalware aprovado.';
comment on table private.audit_logs is 'Trilha append-only de eventos relevantes. Não exposta pela API pública.';
comment on table private.admin_actions is 'Trilha de ações administrativas. Não exposta pela API pública.';
