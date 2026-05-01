create table if not exists public.trall_mono_projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists trall_mono_projects_user_id_idx
  on public.trall_mono_projects(user_id);

create table if not exists public.trall_mono_project_versions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.trall_mono_projects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  version_number integer not null default 1,
  state jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists trall_mono_project_versions_user_id_idx
  on public.trall_mono_project_versions(user_id);

create index if not exists trall_mono_project_versions_project_id_idx
  on public.trall_mono_project_versions(project_id);

alter table public.trall_mono_projects enable row level security;
alter table public.trall_mono_project_versions enable row level security;

create policy "Users can select own projects"
  on public.trall_mono_projects
  for select
  using (user_id = auth.uid());

create policy "Users can insert own projects"
  on public.trall_mono_projects
  for insert
  with check (user_id = auth.uid());

create policy "Users can update own projects"
  on public.trall_mono_projects
  for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Users can delete own projects"
  on public.trall_mono_projects
  for delete
  using (user_id = auth.uid());

create policy "Users can select own project versions"
  on public.trall_mono_project_versions
  for select
  using (user_id = auth.uid());

create policy "Users can insert own project versions"
  on public.trall_mono_project_versions
  for insert
  with check (user_id = auth.uid());

create policy "Users can update own project versions"
  on public.trall_mono_project_versions
  for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Users can delete own project versions"
  on public.trall_mono_project_versions
  for delete
  using (user_id = auth.uid());
