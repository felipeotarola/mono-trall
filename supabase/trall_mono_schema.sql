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

insert into public.materials (id, name, category, unit, cost, thickness_mm, width_mm, length_mm, image_url, description, created_by, active)
values
  ('00000000-0000-4000-8000-000000000001', 'Decking boards 28 x 120 mm', 'Decking', 'linear_metre', 39.00, 28, 120, null, null, 'Standard pressure-treated deck board.', null, true),
  ('00000000-0000-4000-8000-000000000002', 'Joists 45 x 145 mm', 'Framing', 'linear_metre', 18.50, 45, 145, null, null, 'Structural timber joist for deck framing.', null, true),
  ('00000000-0000-4000-8000-000000000003', 'Posts 98 x 98 mm', 'Framing', 'metre', 24.00, 98, 98, null, null, 'Support post material.', null, true),
  ('00000000-0000-4000-8000-000000000004', 'Galvanized post anchors', 'Foundation', 'piece', 16.00, null, null, null, null, 'Post base anchor for concrete or pier fixing.', null, true),
  ('00000000-0000-4000-8000-000000000005', 'A4 stainless deck screws', 'Fasteners', 'box', 32.00, null, null, null, null, 'Box of corrosion-resistant deck screws.', null, true),
  ('00000000-0000-4000-8000-000000000006', 'Joist hangers', 'Fasteners', 'piece', 4.25, null, null, null, null, 'Galvanized connector for joist support.', null, true),
  ('00000000-0000-4000-8000-000000000007', 'Beijerbygg Trall 34 x 170 mm XL Premium+ NTR/AB G4-2', 'Decking', 'linear_metre', 57.50, 34, 170, 5100, 'https://media-prod.beijerflow.com/media/derivates/8/001/205/062/Trall_34x145_130121_101605_0084_1536px.jpg', 'Pressure-treated premium deck board priced per löpmeter. Beijer article 880703417051.', null, true)
on conflict (id) do update
set
  name = excluded.name,
  category = excluded.category,
  unit = excluded.unit,
  cost = excluded.cost,
  thickness_mm = excluded.thickness_mm,
  width_mm = excluded.width_mm,
  length_mm = excluded.length_mm,
  image_url = excluded.image_url,
  description = excluded.description,
  active = excluded.active;

alter table public.trall_mono_projects enable row level security;
alter table public.trall_mono_project_versions enable row level security;
alter table public.materials enable row level security;
alter table public.project_materials enable row level security;

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

create policy "Users can select own or standard materials"
  on public.materials
  for select
  using (created_by = auth.uid() or created_by is null);

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
        and (materials.created_by = auth.uid() or materials.created_by is null)
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
