# AGENTS.md

This file is for Codex agents working in this repository. Read it before making
changes, especially inside the TrallAI planner.

Scope: this root file applies to the whole repository.

## Project In One Sentence

Trall Mono is a pnpm/Turborepo monorepo for TrallAI, a Next.js deck planner that
lets users draw a precise 2D deck plan, inspect a 3D build preview, calculate
materials, save projects to Supabase, and generate AI property visualizations.

## Repository Map

- `apps/web`: the main Next.js 16 app.
- `packages/ui`: shared shadcn-style UI components and global styles.
- `packages/eslint-config`: shared ESLint config.
- `packages/typescript-config`: shared TypeScript config.
- `supabase/trall_mono_schema.sql`: database schema, RLS policies, and seed data.
- `docs`: reference assets.

The app uses the `@/*` alias for `apps/web/*` and `@workspace/ui/*` for shared
UI components.

## Commands

Run commands from the repo root unless there is a reason to target a package.

```bash
pnpm install
pnpm dev
pnpm build
pnpm lint
pnpm test
pnpm typecheck
```

Target the web app directly:

```bash
pnpm --filter web dev
pnpm --filter web build
pnpm --filter web lint
pnpm --filter web test
pnpm --filter web typecheck
```

`pnpm --filter web test` runs Node tests in `apps/web/lib/trall/*.test.ts`.
`next build` may rewrite `apps/web/next-env.d.ts` between dev and production
route type references; do not keep that generated churn unless it is intentional.

Known current lint warnings can exist outside your change area at the time this
file was written:

- `apps/web/app/demo/page.tsx`: unused `projectTitle`
- `apps/web/components/data-table.tsx`: React Compiler warning for TanStack Table

Do not treat those as caused by unrelated planner work unless you changed them.

## Environment

Minimum local env for the app:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

Additional server env used by features:

```bash
SUPABASE_SERVICE_ROLE_KEY=   # create confirmed accounts without email
OPENAI_API_KEY=              # AI visualization generation
OPENAI_IMAGE_MODEL=          # defaults to gpt-image-2
BLOB_READ_WRITE_TOKEN=       # Vercel Blob uploads for AI/reference images
TRALL_DEMO_MATERIALS_EMAIL=
```

`apps/web/next.config.mjs` loads a root `.env` file if present.

## Product Rules To Preserve

- The 2D planner is the precision editing source of truth.
- 3D is an inspectable preview: orbit, pan, zoom, reset camera.
- Do not add 3D geometry editing unless explicitly requested.
- Do not break saved project compatibility. Old project JSON must normalize into
  the current shape.
- Do not rename Supabase tables, columns, or RLS assumptions without updating the
  schema, API routes, and persistence code together.
- Preserve existing routes and auth behavior.
- Keep the planner compact and work-focused. This is an operational tool, not a
  decorative landing-page UI.

## Core Planner Architecture

Start here for planner work:

- `apps/web/components/trall/workspace.tsx`: main planner container and most
  high-level project state.
- `apps/web/components/trall/planning-surface.tsx`: switches between 2D and 3D.
- `apps/web/components/trall/plan-svg.tsx`: 2D SVG editor container.
- `apps/web/components/trall/plan-svg/*`: extracted 2D layers and helpers.
- `apps/web/hooks/trall/use-deck-editor.ts`: core 2D pointer/editing behavior.
- `apps/web/components/trall/canvas-toolbar.tsx`: planner toolbar and view mode
  controls.
- `apps/web/components/trall/calculator-panel.tsx`: right-side inspector shell.
- `apps/web/components/trall/calculator-panel/*`: inspector cards, controls, and
  form hooks.

Core domain files:

- `apps/web/lib/trall/types.ts`: shared planner types.
- `apps/web/lib/trall/constants.ts`: planner scale and default geometry.
- `apps/web/lib/trall/geometry.ts`: pure 2D geometry helpers.
- `apps/web/lib/trall/edge-model.ts`: explicit deck edge constraints.
- `apps/web/lib/trall/features.ts`: deck feature types, defaults, normalization,
  placement math, and board direction helpers.
- `apps/web/lib/trall/house.ts`: house bounds, openings, roof defaults, and
  opening dimension normalization.
- `apps/web/lib/trall/elevation.ts`: elevation settings normalization and terrain
  height lookup.
- `apps/web/lib/trall/supports.ts`: C/C support segment calculations.
- `apps/web/lib/trall/materials.ts`: material types and calculations.
- `apps/web/lib/trall/project-storage.ts`: client-side project persistence and
  project JSON normalization.

Coordinate system:

- Planner geometry is in pixels.
- `PIXELS_PER_METER` is `40`.
- Convert pixels to meters with `px / PIXELS_PER_METER`.
- In 3D, planner `x` maps to `x`, planner `y` maps to `z`, and vertical height
  uses `y`.

## Common Change Checklists

When adding saved planner state:

- Extend the relevant type in `apps/web/lib/trall/types.ts` or a domain file.
- Add defaults in `createDefaultPlannerProjectState`.
- Normalize missing/old values in `normalizePlannerProjectState` or the domain
  normalizer.
- Thread the state through `workspace.tsx`, `planning-surface.tsx`, and the
  relevant inspector cards.
- Add or update a pure test in `apps/web/lib/trall/*.test.ts`.

When adding or changing a deck feature:

- Update `apps/web/lib/trall/features.ts` for types, defaults, normalization,
  edge attachment, and placement math.
- Update `features/feature-tool-list.tsx` for the tool entry.
- Update `features/feature-renderer.tsx` and related 2D drag affordances.
- Update `features/feature-settings-card.tsx` for controls.
- Update `apps/web/lib/trall/plan-3d.ts` for 3D conversion.
- Add or update the focused 3D component in `plan-3d-view/*`.
- Verify the feature stays editable in 2D and preview-only in 3D.

When changing 3D placement:

- Start with `apps/web/lib/trall/plan-3d.ts` and
  `apps/web/lib/trall/plan-3d-layers.ts`.
- Keep renderer components simple; they should consume the converted
  `Plan3DModel`.
- Update placement validation if the change introduces a new class of possible
  clipping or near-coplanar surfaces.
- Inspect flat terrain and sloped terrain scenarios.

## 3D Preview Architecture

3D model conversion is intentionally separated from rendering:

- `apps/web/lib/trall/plan-3d.ts`: converts planner state into render-friendly
  meters and 3D model objects.
- `apps/web/lib/trall/plan-3d-layers.ts`: shared vertical placement constants,
  camera scale, and small render offsets.
- `apps/web/components/trall/plan-3d-view.tsx`: Canvas, camera, controls, scene
  orchestration.
- `apps/web/components/trall/plan-3d-view/*`: focused R3F scene components and
  geometry helpers.

Important 3D files:

- `terrain.tsx`, `terrain-geometry.ts`: sloped ground.
- `deck-slab.tsx`, `board-lines.tsx`: deck slab and board overlay.
- `pool-body.tsx`, `pool-excavation.tsx`, `pool-excavation-geometry.ts`: pool
  volume and terrain cut/excavation.
- `supports.tsx`: terrain-to-deck support posts.
- `stairs.tsx`, `railings.tsx`, `pergolas.tsx`, `privacy-screens.tsx`: deck
  accessories.
- `house.tsx`, `house-roof.tsx`, `house-openings.tsx`: house mass, roof, doors,
  and windows.
- `site-objects.tsx`: tree, bush, planter, outdoor light.
- `height-markers.tsx`, `label-geometry.ts`: optional 3D height labels.
- `materials.ts`: 3D material colors/textures.
- `placement-validation.ts`: local development warnings for suspicious
  placement.

3D rendering rules:

- Avoid hardcoded Y offsets in components; use `PLAN_3D_LAYERS` helpers.
- Treat mesh positions as center anchors unless a helper explicitly uses top or
  bottom.
- Do not place visible surfaces on the same plane. Use intentional small layer
  offsets to avoid z-fighting.
- Objects mounted to the deck should use deck-relative height.
- Objects standing on the ground should use terrain height at their X/Z point.
- Keep R3F JSX files using `/* eslint-disable react/no-unknown-property */` when
  they render Three JSX props such as `castShadow`, `receiveShadow`, or `attach`.

## Persistence And Auth

Project JSON is versioned in Supabase:

- `trall_mono_projects`
- `trall_mono_project_versions`

Material data:

- `materials`
- `project_materials`

AI visualization records:

- `trall_mono_ai_visualizations`

Persistence entry points:

- `apps/web/lib/trall/project-storage.ts`
- `apps/web/lib/trall/materials-api.ts`
- `apps/web/app/api/trall/materials/*`
- `apps/web/app/api/trall/projects/[projectId]/materials/*`
- `apps/web/app/api/trall/ai-visualize/*`

Saved planner state must go through `normalizePlannerProjectState` when loaded.
When adding project state, add defaults and normalization so old saved projects
still load.

Auth behavior:

- This project uses Next.js `proxy.ts` for route protection, not
  `middleware.ts`.
- `apps/web/proxy.ts` redirects unauthenticated private routes to `/landing`.
- `/landing`, `/demo`, `/login`, `/api/auth/*`, demo material APIs, and the AI
  visualization API are public at the proxy layer.
- `/login` supports sign-in and create-account. Account creation uses
  `SUPABASE_SERVICE_ROLE_KEY` and confirms email immediately.
- `localStorage` key `trallai.currentProjectId` stores the current project id.

## AI Visualization

The AI visualization flow combines property/reference images, the current plan
summary, optional markup comments, and generated images.

Client/UI:

- `apps/web/components/trall/ai-visualization-panel.tsx`
- `apps/web/components/trall/ai-visualization/*`
- `apps/web/lib/trall/ai-visualization.ts`

Server/API:

- `apps/web/app/api/trall/ai-visualize/route.ts`
- `auth.ts`, `openai.ts`, `prompts.ts`, `request.ts`, `storage.ts`, `types.ts`

Generated and reference images are uploaded to Vercel Blob in non-demo mode and
stored as URLs in `trall_mono_ai_visualizations`.

## Materials

The project separates the material library from per-project material quantities.

- Library manager: `apps/web/components/trall/material-library-manager.tsx`
- Project material UI: `apps/web/components/trall/materials-manager.tsx`
- Shared calculations and parsing: `apps/web/lib/trall/materials.ts`
- Client API helper: `apps/web/lib/trall/materials-api.ts`

Do not mix library mutation rules with project quantity rules. Custom material
delete may archive by setting `active = false` if rows are referenced.

## Working Style For Agents

Use this loop for non-trivial work:

1. Inspect the relevant code paths before editing.
2. Identify the smallest complete vertical slice.
3. Make responsibility-based edits that match local patterns.
4. Run focused validation.
5. Review the product behavior and code shape.
6. Tighten the result and repeat until the feature or refactor is complete.

Always check `git status --short` before and after work. There may be user
changes in the tree; never revert changes you did not make unless explicitly
asked.

Prefer:

- `rg` and `rg --files` for search.
- `apply_patch` for manual edits.
- Existing helpers in `apps/web/lib/trall` over new ad hoc math.
- Existing UI components from `@workspace/ui/components/*`.
- Lucide icons for tool buttons when an icon exists.
- Focused tests in `apps/web/lib/trall/*.test.ts` for pure domain behavior.

Avoid:

- Rewriting the 2D editor to support a 3D change.
- Mutating planner geometry from 3D preview code.
- Adding database columns without schema and compatibility work.
- Adding dependencies unless the repo clearly benefits.
- Keeping generated `.next` or `next-env.d.ts` build churn.
- Large mixed-responsibility components when a hook, card, service, or pure
  helper would make the boundary clearer.

## Verification Expectations

For domain/helper changes:

```bash
pnpm --filter web typecheck
pnpm --filter web lint
pnpm --filter web test
```

For app-wide, route, auth, API, or import-boundary changes:

```bash
pnpm --filter web build
```

For planner UI or 3D visual changes:

- Start or reuse `pnpm --filter web dev`.
- Use Playwright/browser inspection when available.
- Check desktop and mobile widths.
- Confirm 2D editing still works.
- Confirm Top -> 3D -> Top preserves planner state.
- For 3D canvas changes, verify the canvas is nonblank and inspect for clipping,
  z-fighting, incorrect elevation, and broken camera framing.

## Safe Places To Add Tests

- Geometry, edge, feature, elevation, support, material, and 3D conversion tests
  belong in `apps/web/lib/trall/*.test.ts`.
- Prefer pure helper tests over brittle UI tests when validating math or
  persistence normalization.

## Current Hotspots

These areas are important and easy to regress:

- `workspace.tsx`: still the high-level state hub. Be careful with autosave,
  hydration, current project id, and demo mode.
- `plan-svg.tsx` and `plan-svg/deck-pool-layers.tsx`: 2D editing behavior and
  drag interactions.
- `features.ts`: broad domain file for feature normalization and placement.
- `plan-3d.ts`: central conversion from planner pixels to 3D meters.
- `project-storage.ts`: backward compatibility for saved project JSON.
- `ai-visualize` API route: auth, OpenAI request shape, Vercel Blob uploads, and
  DB persistence all meet here.

When in doubt, keep the 2D planner stable, normalize old saved data, and let
pure domain helpers own the math.
