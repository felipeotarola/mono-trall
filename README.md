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

Apply the database schema in `supabase/trall_mono_schema.sql` to your Supabase project. The schema creates project and project-version tables with row-level security policies scoped to the authenticated user.

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
pnpm typecheck  # Run TypeScript checks
pnpm format     # Format TypeScript and TSX files
```

To target the web app directly:

```bash
pnpm --filter web dev
pnpm --filter web build
pnpm --filter web lint
pnpm --filter web typecheck
```

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

- The planner state is stored as versioned JSON in Supabase.
- The current project id is cached in `localStorage` under `trallai.currentProjectId`.
- Authentication is required before project autosave and loading can succeed.
