# Trall Mono

Trall Mono is a pnpm/Turborepo workspace for TrallAI, a deck planning and material estimation app. The main web app lets users draw and edit a deck shape against a house outline, inspect measurements, estimate materials, and autosave project versions to Supabase.

Repository: https://github.com/felipeotarola/mono-trall

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Ffelipeotarola%2Fmono-trall&project-name=trallai&repository-name=mono-trall&root-directory=apps%2Fweb&env=NEXT_PUBLIC_SUPABASE_URL,NEXT_PUBLIC_SUPABASE_ANON_KEY,SUPABASE_SERVICE_ROLE_KEY,OPENAI_API_KEY,BLOB_READ_WRITE_TOKEN&envDescription=TrallAI%20needs%20Supabase%20credentials%20for%20auth%20and%20project%20storage%2C%20plus%20OpenAI%20and%20Vercel%20Blob%20tokens%20for%20AI%20image%20generation%20and%20saved%20assets.)

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

The TrallAI planner separates material library management from per-project material usage:

- The deck planner calculator shows **Project Materials** only: materials assigned to the current project, editable quantities, removals from the project, and project totals. Users can pick from the library or create a custom material while adding it to the project. Decking materials with a width in millimetres can suggest Swedish `lpm`/`löpmeter` from the deck area. These rows persist through `/api/trall/projects/[projectId]/materials`.
- The dedicated `/materials` page manages the **Materials Library** with a wider overview, search, custom material add/edit/delete controls, optional dimensions (`thickness_mm`, `width_mm`, `length_mm`), and optional `image_url` thumbnails. Standard rows are seeded by the Supabase schema and are read-only in the UI, including a Beijerbygg 34 x 170 mm decking material with product imagery. Custom rows persist through `/api/trall/materials`. If a custom material is referenced by a project, delete archives it by setting `active = false` instead of removing the row.

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
