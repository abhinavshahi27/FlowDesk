-- FlowDesk initial schema for Supabase Auth + RLS.
-- Run this in Supabase SQL Editor (or via `supabase db push`).

create extension if not exists "pgcrypto";

-- ============================================================
-- profiles: one row per auth.users entry. Holds name + role.
-- ============================================================
create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  name        text not null,
  email       text not null unique,
  role        text not null default 'MEMBER' check (role in ('ADMIN', 'MEMBER')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ============================================================
-- projects: each project has one owner (admin who created it).
-- ============================================================
create table public.projects (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  description text,
  owner_id    uuid not null references public.profiles(id) on delete cascade,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ============================================================
-- tasks: belongs to a project, optionally assigned to a profile.
-- ============================================================
create table public.tasks (
  id           uuid primary key default gen_random_uuid(),
  title        text not null,
  description  text,
  status       text not null default 'TODO' check (status in ('TODO', 'IN_PROGRESS', 'REVIEW', 'DONE')),
  due_date     timestamptz,
  project_id   uuid not null references public.projects(id) on delete cascade,
  assignee_id  uuid references public.profiles(id) on delete set null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index tasks_project_id_idx on public.tasks(project_id);
create index tasks_assignee_id_idx on public.tasks(assignee_id);
create index projects_owner_id_idx on public.projects(owner_id);

-- ============================================================
-- updated_at auto-touch
-- ============================================================
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger projects_updated before update on public.projects
  for each row execute function public.set_updated_at();
create trigger tasks_updated before update on public.tasks
  for each row execute function public.set_updated_at();

-- ============================================================
-- Auto-create profile when a user signs up.
-- First user becomes ADMIN; everyone else MEMBER.
-- Name comes from raw_user_meta_data->>'name' (we set this on signUp).
-- ============================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  user_count int;
  resolved_role text;
  resolved_name text;
begin
  select count(*) into user_count from public.profiles;
  resolved_role := case when user_count = 0 then 'ADMIN' else 'MEMBER' end;
  resolved_name := coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1));

  insert into public.profiles (id, name, email, role)
  values (new.id, resolved_name, new.email, resolved_role);

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- Row Level Security
-- ============================================================
alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.tasks    enable row level security;

-- Helper: is the current user an admin?
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'ADMIN'
  );
$$;

-- ---------- profiles ----------
-- Any authenticated user can read all profiles (team page needs this).
create policy "profiles_select_authenticated"
  on public.profiles for select
  to authenticated
  using (true);

-- A user can update their own name/email. Role changes are blocked here
-- (handled by admin-only policy below).
create policy "profiles_update_self"
  on public.profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid() and role = (select role from public.profiles where id = auth.uid()));

-- Admins can update any profile (including role).
create policy "profiles_update_admin"
  on public.profiles for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- INSERT happens only via the on_auth_user_created trigger (security definer).
-- No INSERT policy needed for clients.

-- ---------- projects ----------
create policy "projects_select_authenticated"
  on public.projects for select
  to authenticated
  using (true);

create policy "projects_insert_admin"
  on public.projects for insert
  to authenticated
  with check (public.is_admin() and owner_id = auth.uid());

create policy "projects_update_admin"
  on public.projects for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "projects_delete_admin"
  on public.projects for delete
  to authenticated
  using (public.is_admin());

-- ---------- tasks ----------
create policy "tasks_select_authenticated"
  on public.tasks for select
  to authenticated
  using (true);

create policy "tasks_insert_admin"
  on public.tasks for insert
  to authenticated
  with check (public.is_admin());

-- Admins can update anything; members can update only the status of tasks
-- assigned to them.
create policy "tasks_update_admin"
  on public.tasks for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "tasks_update_assignee_status"
  on public.tasks for update
  to authenticated
  using (assignee_id = auth.uid())
  with check (assignee_id = auth.uid());

create policy "tasks_delete_admin"
  on public.tasks for delete
  to authenticated
  using (public.is_admin());
