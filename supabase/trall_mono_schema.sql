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

create table if not exists public.materials (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null,
  unit text not null check (unit in ('metre', 'linear_metre', 'square_metre', 'piece', 'box', 'pack')),
  cost numeric(12, 2) not null default 0 check (cost >= 0),
  thickness_mm numeric(10, 1) check (thickness_mm is null or thickness_mm > 0),
  width_mm numeric(10, 1) check (width_mm is null or width_mm > 0),
  length_mm numeric(10, 1) check (length_mm is null or length_mm > 0),
  image_url text,
  description text,
  created_by uuid references auth.users(id) on delete cascade,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.materials
  add column if not exists thickness_mm numeric(10, 1) check (thickness_mm is null or thickness_mm > 0);

alter table public.materials
  add column if not exists width_mm numeric(10, 1) check (width_mm is null or width_mm > 0);

alter table public.materials
  add column if not exists length_mm numeric(10, 1) check (length_mm is null or length_mm > 0);

alter table public.materials
  add column if not exists image_url text;

create index if not exists materials_created_by_idx
  on public.materials(created_by);

create index if not exists materials_active_category_name_idx
  on public.materials(active, category, name);

create table if not exists public.project_materials (
  project_id uuid not null references public.trall_mono_projects(id) on delete cascade,
  material_id uuid not null references public.materials(id),
  quantity numeric(12, 3) not null default 0 check (quantity >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (project_id, material_id)
);

create index if not exists project_materials_material_id_idx
  on public.project_materials(material_id);

create table if not exists public.trall_mono_ai_visualizations (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.trall_mono_projects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  brief text not null default '',
  style text not null default 'planning_realistic',
  plan_summary text not null default '',
  reference_images jsonb not null default '[]'::jsonb,
  generated_images jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists trall_mono_ai_visualizations_project_id_idx
  on public.trall_mono_ai_visualizations(project_id, created_at desc);

create index if not exists trall_mono_ai_visualizations_user_id_idx
  on public.trall_mono_ai_visualizations(user_id);

alter table public.trall_mono_projects enable row level security;
alter table public.trall_mono_project_versions enable row level security;
alter table public.materials enable row level security;
alter table public.project_materials enable row level security;
alter table public.trall_mono_ai_visualizations enable row level security;

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

create policy "Users can select own AI visualizations"
  on public.trall_mono_ai_visualizations
  for select
  using (user_id = auth.uid());

create policy "Users can insert own AI visualizations"
  on public.trall_mono_ai_visualizations
  for insert
  with check (
    user_id = auth.uid()
    and exists (
      select 1
      from public.trall_mono_projects
      where trall_mono_projects.id = trall_mono_ai_visualizations.project_id
        and trall_mono_projects.user_id = auth.uid()
    )
  );

create policy "Users can delete own AI visualizations"
  on public.trall_mono_ai_visualizations
  for delete
  using (user_id = auth.uid());

create policy "Users can select own materials"
  on public.materials
  for select
  using (created_by = auth.uid());

create policy "Users can insert own materials"
  on public.materials
  for insert
  with check (created_by = auth.uid());

create policy "Users can update own materials"
  on public.materials
  for update
  using (created_by = auth.uid())
  with check (created_by = auth.uid());

create policy "Users can delete own materials"
  on public.materials
  for delete
  using (created_by = auth.uid());

create policy "Users can select own project materials"
  on public.project_materials
  for select
  using (
    exists (
      select 1
      from public.trall_mono_projects
      where trall_mono_projects.id = project_materials.project_id
        and trall_mono_projects.user_id = auth.uid()
    )
  );

create policy "Users can insert own project materials"
  on public.project_materials
  for insert
  with check (
    exists (
      select 1
      from public.trall_mono_projects
      where trall_mono_projects.id = project_materials.project_id
        and trall_mono_projects.user_id = auth.uid()
    )
    and exists (
      select 1
      from public.materials
      where materials.id = project_materials.material_id
        and materials.active = true
        and materials.created_by = auth.uid()
    )
  );

create policy "Users can update own project materials"
  on public.project_materials
  for update
  using (
    exists (
      select 1
      from public.trall_mono_projects
      where trall_mono_projects.id = project_materials.project_id
        and trall_mono_projects.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.trall_mono_projects
      where trall_mono_projects.id = project_materials.project_id
        and trall_mono_projects.user_id = auth.uid()
    )
  );

create policy "Users can delete own project materials"
  on public.project_materials
  for delete
  using (
    exists (
      select 1
      from public.trall_mono_projects
      where trall_mono_projects.id = project_materials.project_id
        and trall_mono_projects.user_id = auth.uid()
    )
  );
