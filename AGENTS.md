## Agent skills

### Issue tracker

Issues and specs are local markdown in `.scratch/<feature>/` (`spec.md`, `issues/NN-slug.md`). Read `docs/agents/issue-tracker.md` before creating or triaging one.

### Triage labels

Five roles: needs-triage, needs-info, ready-for-agent, ready-for-human, wontfix. Mapping: `docs/agents/triage-labels.md`.

### Domain docs

Glossary `grocery-price/GLOSSARY.md`, ADRs `grocery-price/docs/adr/`. How skills consume them: `docs/agents/domain.md`.

Naming or classifying foods (카테고리, 품목, 품종, 규격) anywhere in the repo, including `prototypes/`: use the terms in `grocery-price/GLOSSARY.md`.

## Repo map

Full map (every route, module, generated file, command, and doc): `docs/project-structure.md`. Read it before adding a route, package, script, or generated file, or when a task spans more than one package.

- `apps/web`: the Next.js app, 제철달력 (seasonal food calendar). The price-comparison screens will join it later.
- `packages/seasonal`, `packages/ui`: domain and design-system layers of the app (see "Web app UI").
- `grocery-price/`: design docs and public price API research for the price service. Collection code (Supabase + GitHub Actions) starts in stage ① of the roadmap; screens join `apps/web` in stage ④.
- `prototypes/`: illustration source, wireframes, brand originals. Gitignored, so a fresh clone lacks it. Keep it out of commits (no force-add).

## Workflow

- Current work: `.scratch/*/spec.md`. The app's spec is `.scratch/seasonal-mvp/spec.md`. Price-service stages (① 수집 기반 → ② 판정 설계 → ③ 화면 설계 → ④ 구현) and completion criteria: `grocery-price/docs/00-overview/roadmap.md`.
- Commit each verified ticket straight to `main`, no PR. Message: `feat: …` in Korean. Code comments and docs are Korean too.
- A change is done when `pnpm typecheck`, `pnpm lint` (0 errors) and `pnpm test` pass at the repo root. A screen change is done when `next-dev-loop` (dev server MCP in `.mcp.json` + browser) shows it at widths 375 and 1280 with no console errors or hydration warnings.
- Pure functions (layout, calendar, search, geometry): write the vitest test first, as `*.test.ts` beside the code.
- Fresh clone: run `git config core.hooksPath .githooks` once. The pre-commit hook runs `scripts/check-no-secrets.sh` and blocks commits that contain a value from `.env`.

## Generated files

Regenerate these with their command and commit the output. Hand edits are overwritten.

| Output | Command | Run it when |
|---|---|---|
| `packages/seasonal/src/data/foods.generated.ts` | `pnpm --filter @workspace/seasonal build:foods` | the 품종 list in `prototypes/` changes. A 품종 without an illustration gets its id in `NEW_IDS` in `packages/seasonal/scripts/build-foods.mjs`. |
| `apps/web/public/foods/<id>/{color,motion}.svg`, `PROVENANCE.md`, `drawn-foods.generated.ts`, `food-bounds.generated.ts` | `pnpm foods:sync` | an illustration is drawn or changed (`/seasonal-food-illustrator`). |
| `food-bounds.generated.ts` alone | `pnpm foods:bounds` | the SVGs changed without a sync. Needs no `prototypes/`. |
| `apps/web/public/downloads/**` (PDFs, `manifest.json`), `apps/web/print-editions/<id>.build.json` | the admin's "PDF 생성" button at `/admin` (`pnpm dev`, uses the local Google Chrome) | an edition's spec changes, or anything a print page draws changes (foods, illustrations, holidays). Saving an edition rewrites `manifest.json`. Exception to the commit rule: the PDFs are gitignored (too large) until a storage location is chosen, so keep editions unpublished and `manifest.json` empty until then. |

The first two read `prototypes/`, so they run only on a machine that has it. Per-품종 drawing scale (`FOOD_SCALE` in `packages/seasonal/src/data/food-sizes.ts`) is hand-tuned. Brand files are copied by hand: `apps/web/docs/brand-assets.md`.

## Public price APIs

- Before calling a public price API (KAMIS, 축평원, 참가격) or writing collection/schema code for it, read that source's doc in `grocery-price/docs/30-data/sources/` (`kamis.md`, `ekape.md`, `chamgagyeok.md`). They record measured behavior the official specs omit. `grocery-price/docs/10-research/api-spec.md` is the summary and maps each data.go.kr dataset ID to its endpoint; check it before treating a data.go.kr dataset as a new source. Schema and collection design: `grocery-price/docs/30-data/pipeline.md`. Saved responses and the browser viewer: `grocery-price/reference/public-data/samples/`.
- Viewer changes (`grocery-price/reference/public-data/samples/viewer/`): run `grocery-price/reference/public-data/samples/viewer/smoke.sh --quick` before finishing.

## Web app UI (`apps/web`)

Screen spec: `prototypes/seasonal-food/wireframes/WIREFRAME-SPEC.md`. Where it and `.scratch/seasonal-mvp/spec.md` differ, the `.scratch` spec wins. Code and comments name screens by their spec codes: 2a 이달 (`/seasonal`), 2b 월별, 3a 계절, 1g 명절, 1h 나의 식탁, 1i 품종 상세. Color and type reference: `apps/web/DESIGN.md` (Oura).

Layers. Each one may import only from the layers below it:

| Layer | Where | What goes there |
|---|---|---|
| App routes | `apps/web/app/` | Route files only (`page`, `layout`, `@slot`, route groups), plus `api/og` (share image), `sitemap.ts` and `robots.ts`. The `/examples/*` design comparison pages the specs cite were deleted on 2026-10-16; read them in git history (`git show 22520eb:apps/web/app/examples/<name>/page.tsx`). Keep routes thin: validate params, set metadata, render a feature component. |
| Features | `apps/web/features/<feature>/` | One folder per screen (`seasonal/this-month`, `month-timeline`, `seasons`, `festivals`, `my-table`, `food-detail`, `search`). `components/` holds parts several screens share (shell, nav, `FoodImage`, scatter); `stores/` holds the feature's zustand stores. Features don't import each other; shared code moves down a layer. |
| App shared | `apps/web/shared/` | App-wide pieces: `routes.ts`, `providers.tsx`, `meta.ts`, `today.ts` + `today-context.tsx`, `eaten-store.ts`, `brand-logo.tsx`. |
| Domain | `packages/seasonal` (`@workspace/seasonal`) | Pure TypeScript: `data/` (품종, months, seasons, festivals, copy), `calendar/` (calendar cells, holidays, lunar, Seoul today), `layout/` (seeded scatter), `search/` (초성 match). No React, Next.js or DOM. The MVP-later print pages reuse it. |
| Design system | `packages/ui` (`@workspace/ui`) | Oura tokens, cojeev UI, and generic components such as `BottomSheet`. No domain words. |

Import with package paths, such as `@workspace/ui/components/button` and `@workspace/seasonal/data/months`. Inside `apps/web`, use `@/features/...` and `@/shared/...`.

Longer screen copy (month notes, season and festival text, empty states, toasts) lives in `packages/seasonal/src/data/copy.ts`.

### Components

When you need a component, effect, or element, look in this order:

1. **cojeev UI** — https://cojeev.com/ui/docs/ (full list: https://cojeev.com/ui/r/registry.json). If it exists there, use it.
2. **shadcn/ui** — only if cojeev has nothing that fits. Search the shadcn registry and add it.
3. **Build it yourself** — only if neither has it. A generic piece goes in `packages/ui/src/components/`. A piece for one screen goes in that screen's folder; one shared by a feature's screens goes in `apps/web/features/<feature>/components/`. Use the existing tokens either way.

Add cojeev or shadcn components from the repo root with `pnpm ui:add <name-or-url>` (for example `pnpm ui:add https://cojeev.com/ui/r/tabs.json`), never `shadcn add` directly. It installs into `packages/ui`, answers "no" to every overwrite so our edited files stay (`bottom-sheet`, `option-wheel`, `dialog`, `link-tabs`, `segmented`, ...), and `packages/ui/scripts/fix-ui-css.mjs` appends new `src/styles/cojeev/*.css` imports to `src/styles/cojeev.css` in name order. If a new file depends on another (toggle before toggle-group), fix the order by hand.

### Colors and type

- The only color source is the Oura palette in `packages/ui/src/styles/globals.css` (`--color-canvas`, `--color-stone`, `--color-gold`, ..., `--color-season-*`). cojeev's own palette (`--v-*`) is overridden with Oura values in `packages/ui/src/styles/cojeev.css`. Components use tokens, never hex values.
- One exception: `apps/web/app/api/og/route.tsx` copies palette hex values into `OG_COLORS` because the image renderer can't read CSS variables. Update it when the palette changes.
- Light mode only. `<html data-mode="light">` is fixed in `apps/web/app/layout.tsx`. Write no dark tokens, theme toggle, or `dark:` classes.
- Fonts: body Pretendard, headings Gowun Batang (`font-heading`), big numbers cojeev display (`font-number`).

### Routes

- The 제철 screens live under `/seasonal`. `/` is reserved for the future price-comparison main. Today `app/page.tsx` redirects to `routes.home`. When the price main ships, replace that page and leave the seasonal routes where they are.
- Build every path with `routes` from `apps/web/shared/routes.ts`. `proxy.ts` `matcher` is the one hard-coded path, because it must be a static literal; keep it in sync with `routes`.
- Route groups `(this-month)` and `(season)` share the second-level tab bars without changing the URL. `(this-month)/months/(detail)` adds the 2b timeline only to `/seasonal/months/[month]`.
- `/seasonal/festivals` has no page: `proxy.ts` redirects it to the upcoming festival by Seoul date.
- `@sheet/(.)foods/[food]` intercepts `/seasonal/foods/[food]` and shows it as a bottom sheet inside the seasonal area. Loading that URL directly renders the full page. `@sheet/[...catchAll]` and `@sheet/page.tsx` render null so the sheet closes on any other navigation; new `/seasonal` routes need nothing in `@sheet`.
- Cache Components is on, so `dynamicParams` is a build error. List params with `generateStaticParams` (at least one entry), validate them with `notFound()`, and read `params` inside `<Suspense>`.
- Page metadata: return `createMetadata({ title, description, path, ogImage })` from `apps/web/shared/meta.ts`. It wires canonical, OpenGraph and the `/api/og` image.
- Search indexing: register every new page in `apps/web/shared/seo/pages.ts` (indexed, noindex, or redirect); `pnpm test` fails otherwise. Checklist, env vars and go-live steps: `apps/web/docs/seo.md`.

### Rendering and state

- Server Components by default. Put `'use client'` on interactive leaves and pass static content in as `children`.
- "Today" is Seoul time computed once per request on the server: `getSeoulToday()` (`shared/today.ts`) → `TodayProvider` in `app/seasonal/layout.tsx` → `useToday()` inside `<Suspense>`. Rendering code takes today from there instead of calling `new Date()`.
- Device-saved state is a zustand `persist` store with `skipHydration: true` and a `seasonal:<name>` key, rehydrated after mount (`Providers` for `eaten-store`, `useHydrate*` hooks for the feature stores). Server HTML and the first client render use the defaults; read localStorage only through the store.
- Motion: CSS keyframes for small effects, `motion` for drag, spring and layout animation, React `<ViewTransition>` only for the three spec'd transitions (CSS in `apps/web/app/globals.css`). Every animation ends instantly under `prefers-reduced-motion`.
- Sheets and dialogs: open them with `overlay-kit` (`<OverlayProvider>` is in `apps/web/shared/providers.tsx`). For bottom sheets, use `@workspace/ui/components/bottom-sheet` (`BottomSheet`, `openBottomSheet`). Examples: `features/seasonal/components/food-sheet.tsx`, `features/seasonal/this-month/settings-panel.tsx`.

## Next.js docs

`apps/web` runs Next.js 16.4. APIs, conventions, and file structure may differ from your training data. Before writing Next.js code, read the relevant guide in `apps/web/node_modules/next/dist/docs/`. The repo root has no `next` package, so resolve it from `apps/web`. Heed deprecation notices. Rendering and caching rationale for this app: `apps/web/docs/nextjs-16-patterns.md`. It predates the screens, so where its sketches differ from the code (`lib/` paths, a `useSyncExternalStore` eaten store), the code and this file win.

`next dev` would normally write this as a managed block in `apps/web/AGENTS.md`. That is off (`agentRules: false` in `apps/web/next.config.ts`) so this file stays the single source of agent instructions.

<!-- BEGIN:turborepo-agent-rules -->

# This is NOT the Turborepo you know

Turborepo configuration, task behavior, and CLI commands can vary between installed versions and may differ from your training data. Resolve the `turbo` package from this file's directory or relevant workspace; in monorepos, it may not be visible from the repository root. For example, run `node -p "require.resolve('turbo/package.json')"` from a workspace that depends on `turbo`.

Read `docs/README.md` inside that installed package first, then read the relevant pages from its `docs/` directory before changing Turborepo configuration or commands. Heed deprecation notices. These bundled docs match the installed package version and are available without network access.

This block is written and re-added by `turbo` before repository-scoped commands when an AI agent is detected. In the Turborepo source repository, its template is defined in `crates/turborepo-cli/src/cli/agent_guidance.rs`. Removing the managed block while updates are enabled means a later qualifying invocation will add it again. Set `"agentGuidance": false` in the root `turbo.json` or `turbo.jsonc` to opt out; this does not remove an existing block. Keep the block committed with your work to avoid an uncommitted change on the next agent invocation.
<!-- END:turborepo-agent-rules -->
