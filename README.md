# Trall Mono

Trall Mono is a pnpm/Turborepo workspace for TrallAI, a deck planning and material estimation app. The main web app lets users draw and edit a deck shape against a house outline, inspect measurements, estimate materials, and autosave project versions to Supabase.

## Stack

- Next.js 16 with React 19 and Turbopack
- TypeScript
- Tailwind CSS 4 and shadcn/ui-style components
- Supabase Auth and Postgres storage
- Turborepo with shared UI, ESLint, and TypeScript packages

## Workspace Layout

```text
apps/web                  Next.js application
packages/ui               Shared UI components and global styles
packages/eslint-config    Shared ESLint configs
packages/typescript-config Shared TypeScript configs
supabase                  Database schema for Trall project storage
```

## Getting Started

Install dependencies from the repository root:

```bash
pnpm install
```

Create `apps/web/.env.local` with the Supabase browser credentials:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Apply the database schema in `supabase/trall_mono_schema.sql` to your Supabase project. The schema creates project, project-version, material-library, and project-material tables with row-level security policies scoped to the authenticated user. Standard materials are seeded as shared read-only rows; user-created materials are stored with `created_by = auth.uid()`.

Start the development server:

```bash
pnpm dev
```

The web app runs from `apps/web` through Turborepo. Next.js will print the local URL, usually `http://localhost:3000`.

## Scripts

Run these commands from the repository root:

```bash
pnpm dev        # Start all development tasks
pnpm build      # Build all packages and apps
pnpm lint       # Run linting
pnpm test       # Run Node unit tests
pnpm typecheck  # Run TypeScript checks
pnpm format     # Format TypeScript and TSX files
```

To target the web app directly:

```bash
pnpm --filter web dev
pnpm --filter web build
pnpm --filter web lint
pnpm --filter web test
pnpm --filter web typecheck
```

## Materials Management

The TrallAI planner has a materials manager in the calculator panel with two tabs:

- **Project Materials** stores the materials and quantities used by the current deck project in `project_materials`. Users can pick from the library or create a custom material while adding it to the project. Totals update immediately in the UI and persist through `/api/trall/projects/[projectId]/materials`.
- **Materials Library** stores standard and custom library rows in `materials`. Standard rows are seeded by the Supabase schema and are read-only in the UI. Custom rows can be added, edited, and removed through `/api/trall/materials`. If a custom material is referenced by a project, delete archives it by setting `active = false` instead of removing the row.

Shared material types and calculation helpers live in `apps/web/lib/trall/materials.ts`. Client API helpers live in `apps/web/lib/trall/materials-api.ts`, and the Next route handlers enforce authentication plus project ownership before reading or mutating rows.

## Adding UI Components

Add shadcn/ui components from the repository root and point the CLI at the web app config:

```bash
pnpm dlx shadcn@latest add button -c apps/web
```

Generated shared components are placed in `packages/ui/src/components` and can be imported with the workspace alias:

```tsx
import { Button } from "@workspace/ui/components/button"
```

## Notes

- The planner geometry state is stored as versioned JSON in Supabase.
- Project material quantities are normalized in `project_materials`, separate from saved planner versions.
- The current project id is cached in `localStorage` under `trallai.currentProjectId`.
- Authentication is required before project autosave and loading can succeed.
