# AGENTS.md

제철달력과 장보기 가격 판정 서비스. pnpm + Turborepo 모노레포, Next.js 16.4 (`apps/web`), Supabase(Postgres) 가격 DB.

## Project map

Full map (every route, module, generated file, command, and doc): `docs/project-structure.md`. Read it before adding a route, package, script, or generated file, or when a task spans more than one package.

- `apps/web`: the Next.js app: price screens (시세 · 판정, at `/`) and 제철달력 (at `/seasonal`). Header and bottom nav are shared (`shared/shell`).
- `packages/seasonal`, `packages/price`: pure-TypeScript domain layers (제철, 가격). `packages/ui`: design system.
- `supabase/`, `packages/price-db`: the price DB. Migrations (schema `price`, roles `ingest_writer`·`web_reader`, RLS) are the source of truth for tables; `packages/price-db` holds DB tests, sample data and the ERD generator.
- `grocery-price/`: design docs and public price API research for the price service. Glossary `grocery-price/GLOSSARY.md`, ADRs `grocery-price/docs/adr/` (how skills use them: `docs/agents/domain.md`).
- `prototypes/`: illustration source, wireframes, brand originals. Gitignored, so a fresh clone lacks it. Keep it out of commits (no force-add).
- Specs and tickets: `.scratch/<feature>/`. A spec whose title is followed by a `> 완료` or `> 종료` line is history, not current work. Price-service stages (① 수집 기반 → ② 판정 설계 → ③ 화면 설계 → ④ 구현): `grocery-price/docs/00-overview/roadmap.md`.

Code comments and docs are written in Korean.

<important if="you need to run commands to build, test, lint, typecheck, start the dev server or DB, or regenerate files">

Run from the repo root. Scripts live in the root `package.json`; the full table is `docs/project-structure.md` §9. Regeneration commands are in the generated-file table below. What the scripts don't tell you:

- Add UI components with `pnpm ui:add <name-or-url>`, not `shadcn add` (it keeps our edited files and fixes `cojeev.css` imports).
- `pnpm db:test` needs `pnpm db:start` first.
- Once per fresh clone: `git config core.hooksPath .githooks` (pre-commit secret check).
</important>

<important if="you are finishing, verifying, or committing a change">

- Done means `pnpm typecheck`, `pnpm lint` (0 errors) and `pnpm test` pass at the repo root.
- A screen change is done when `next-dev-loop` (dev server MCP in `.mcp.json` + browser) shows it at widths 375 and 1280 with no console errors or hydration warnings.
- Commit each verified ticket straight to `main`, no PR. Message: `feat: …` in Korean.
</important>

<important if="you are writing or changing a pure function (layout, calendar, search, geometry)">
Write the vitest test first, as `*.test.ts` beside the code.
</important>

<important if="you are creating, triaging, or labeling an issue or spec">
Issues and specs are local markdown in `.scratch/<feature>/` (`spec.md`, `issues/NN-slug.md`). Read `docs/agents/issue-tracker.md` first. Five triage roles (needs-triage, needs-info, ready-for-agent, ready-for-human, wontfix): `docs/agents/triage-labels.md`.
</important>

<important if="you are naming or classifying foods (카테고리, 품목, 품종, 규격) anywhere, including prototypes/">
Use the terms in `grocery-price/GLOSSARY.md`.
</important>

<important if="you are editing a generated file or changing what feeds one (품종 list, illustrations, migrations, any file in grocery-price/reference/public-data/samples/viewer/, print editions)">

Regenerate with the command and commit the output. Hand edits are overwritten.

| Output | Command | Run it when |
|---|---|---|
| `packages/seasonal/src/data/foods.generated.ts` | `pnpm --filter @workspace/seasonal build:foods` | the 품종 source `packages/seasonal/src/data/food-registry.json` changes (name, aliases, months, 제철 검증 status, evidence). Edit 품종 there, never in the generated file. Runs without `prototypes/`. |
| `apps/web/public/foods/<id>/{color,motion}.svg`, `PROVENANCE.md`, `drawn-foods.generated.ts`, `food-bounds.generated.ts` | `pnpm foods:sync` | an illustration is drawn or changed (`/seasonal-food-illustrator`). |
| ERD blocks in `grocery-price/docs/30-data/schema-map.html` | `pnpm db:erd` (local DB up, migrations applied) | a migration changes tables, keys or checks. `pnpm db:test` fails while they differ. |
| `grocery-price/reference/public-data/samples/viewer/api-explorer.html` | `python3 -I build.py` in that folder | `template.html`, `build.py` or the saved samples change. Then run `smoke.sh --quick` in that folder before finishing. |
| `food-bounds.generated.ts` alone | `pnpm foods:bounds` | the SVGs changed without a sync. Needs no `prototypes/`. |
| `apps/web/shared/fonts/BricolageGrotesque.woff2` (subset of `BricolageGrotesque-full.woff2`) | `scripts/subset-display-font.sh` (needs `fonttools` + `brotli`) | the font or the glyph range it must cover changes. |
| `apps/web/public/downloads/**` (PDFs, `manifest.json`), `apps/web/print-editions/<id>.build.json` | the admin's "PDF 생성" button at `/admin` (`pnpm dev`, uses local Google Chrome) | an edition's spec changes, or anything a print page draws changes (foods, illustrations, holidays). Saving an edition rewrites `manifest.json`. |

- `pnpm foods:sync` reads `prototypes/`, so it runs only on a machine that has it.
- Print PDFs are gitignored (too large); commit `manifest.json`, the thumbnails and the edition files. Publishing an edition uploads its A4 PDF to the private R2 bucket (ADR 0003, write keys in root `.env`); withdrawing or deleting leaves the object, and the admin's "R2 정리" button removes unlisted objects once the deploy is live.
- Per-품종 drawing scale (`FOOD_SCALE` in `packages/seasonal/src/data/food-sizes.ts`) is hand-tuned. Brand files are copied by hand: `apps/web/docs/brand-assets.md`.
</important>

<important if="you are calling a public price API (KAMIS, 축평원, 참가격, data.go.kr) or writing collection or schema code for one">

- First read that source's doc in `grocery-price/docs/30-data/sources/` (`kamis.md`, `ekape.md`, `chamgagyeok.md`); they record measured behavior the official specs omit.
- `grocery-price/docs/10-research/api-spec.md` summarizes and maps each data.go.kr dataset ID to its endpoint; check it before treating a dataset as a new source.
- Schema and collection design: `grocery-price/docs/30-data/pipeline.md`. Saved responses and browser viewer: `grocery-price/reference/public-data/samples/`.
</important>

<important if="you are adding or changing a database migration, table, column, or function in supabase/">

- New file in `supabase/migrations/`; never edit an applied one. Verify with `pnpm db:start` once, then `pnpm db:test`.
- A new `price` table or column needs `comment on` in the same file (meaning, unit or format, what `null` means, source field name; Korean, GLOSSARY terms). `pnpm db:test` fails without it.
- A new `price` table also needs RLS policies, a group in `packages/price-db/scripts/build-erd.ts`, and the lists in `packages/price-db/test/helpers.ts`.
- A new `price` function needs `revoke execute … from public, anon, authenticated` in the same file.
</important>

<important if="you are adding or moving code in apps/web or packages/{seasonal,price,ui}, or adding imports between them">

Each layer may import only from the layers below it:

| Layer | Where | What goes there |
|---|---|---|
| App routes | `apps/web/app/` | Route files only (`page`, `layout`, `@slot`, route groups), plus `api/og`, `sitemap.ts`, `robots.ts`. Keep routes thin: validate params, set metadata, render a feature component. |
| Features | `apps/web/features/<feature>/` | One folder per screen, grouped by area (e.g. `seasonal/this-month`, `price/home`, `baby-food`); the list is the directory itself. `components/` holds parts several screens share; `stores/` holds zustand stores. Features don't import each other; shared code moves down a layer. |
| App shared | `apps/web/shared/` | App-wide pieces: routes, providers, metadata, today, device stores, the shared shell. |
| Domain | `packages/seasonal` | Pure TS for 제철, 이유식 and print specs (data, calendar, seeded scatter, 초성 search). No React, Next.js or DOM. |
| Domain | `packages/price` | Pure TS for price screens (screen schema, verdict, search, format, copy). No React, Next.js or DOM. |
| Design system | `packages/ui` | Oura tokens, cojeev UI, generic components such as `BottomSheet`. No domain words. |

Import with package paths (`@workspace/ui/components/button`, `@workspace/seasonal/data/months`); inside `apps/web`, `@/features/...` and `@/shared/...`.
</important>

<important if="you are building or changing a screen in apps/web, or need its spec">
Screen spec: `prototypes/seasonal-food/wireframes/WIREFRAME-SPEC.md`; where it and `.scratch/seasonal-mvp/spec.md` differ, the `.scratch` spec wins. Name screens by spec code: 2a 이달 (`/seasonal`), 2b 월별, 3a 계절, 1g 명절, 1h 나의 식탁, 1i 품종 상세. Price screens spec: `.scratch/price-screens/spec.md` (product pages: `.scratch/catalog-scale/issues/10-product-page-and-search.md`). 이유식 screens: `.scratch/infant-food-pairing/spec.md`, `.scratch/baby-food-ingredient-pages/spec.md`, `.scratch/baby-food-fruits/spec.md`. The `/examples/*` comparison pages the specs cite were deleted; read them with `git show 22520eb:apps/web/app/examples/<name>/page.tsx`.
</important>

<important if="you are writing longer screen copy (month notes, season or festival text, verdict sentences, empty states, toasts)">
제철 screens: `packages/seasonal/src/data/copy.ts`. Price screens: `packages/price/src/copy.ts` (verdict sentences: `verdict-copy.ts`).
</important>

<important if="you need a new UI component, effect, or element">

Look in this order:
1. cojeev UI: https://cojeev.com/ui/docs/ (full list: https://cojeev.com/ui/r/registry.json).
2. shadcn/ui, only if cojeev has nothing that fits.
3. Build it yourself: generic → `packages/ui/src/components/`; one screen → that screen's folder; a feature's screens → `apps/web/features/<feature>/components/`. Use existing tokens.

Add with `pnpm ui:add <name-or-url>`. It answers "no" to overwrites so our edited files stay (`bottom-sheet`, `option-wheel`, `dialog`, `link-tabs`, `segmented`, ...), and `packages/ui/scripts/fix-ui-css.mjs` appends new `src/styles/cojeev/*.css` imports to `src/styles/cojeev.css` in name order. If a new file depends on another (toggle before toggle-group), fix the order by hand.
</important>

<important if="you are choosing colors, fonts, or theme styles">

- Only color source: the Oura palette in `packages/ui/src/styles/globals.css` (`--color-canvas`, `--color-gold`, `--color-season-*`, ...). cojeev's `--v-*` palette is overridden in `packages/ui/src/styles/cojeev.css`. Use tokens, never hex. Reference: `apps/web/DESIGN.md`.
- Exception: `apps/web/app/api/og/route.tsx` copies hex values into `OG_COLORS` (the renderer can't read CSS variables). Update it when the palette changes.
- Light mode only (`<html data-mode="light">` in `apps/web/app/layout.tsx`). No dark tokens, theme toggle, or `dark:` classes.
- Fonts: body Pretendard, headings Gowun Batang (`font-heading`), big numbers cojeev display (`font-number`).
</important>

<important if="you are adding or changing a route, link, redirect, page metadata, or proxy.ts">

- 제철 screens live under `/seasonal`. `/` is the price main (`app/(price)/page.tsx`); `/`, `/search`, `/prices/[variety]`, `/basket`, `/products/*`, `/baby-food/*`, `/settings/*`, `/privacy` share route group `(price)`.
- Build every path with `routes` from `apps/web/shared/routes.ts`. `proxy.ts` `matcher` is the one hard-coded path (must be a static literal); keep it in sync.
- Route groups `(this-month)` and `(season)` both render the one 제철달력 tab row (이달 · 월별 · 계절 · 명절, `SeasonalTabs`) without changing the URL. `(this-month)/months/(detail)` adds the 2b timeline only to `/seasonal/months/[month]`.
- `/seasonal/festivals` has no page: `proxy.ts` redirects to the upcoming festival by Seoul date.
- `@sheet/(.)foods/[food]` intercepts `/seasonal/foods/[food]` (and `@sheet/(.)downloads/[edition]` intercepts `/seasonal/downloads/[edition]`) as a bottom sheet; a direct load renders the full page. `@sheet/[...catchAll]` and `@sheet/page.tsx` render null so the sheet closes on other navigation; new `/seasonal` routes need nothing in `@sheet`.
- Cache Components is on, so `dynamicParams` is a build error. List params with `generateStaticParams` (at least one entry), validate with `notFound()`, read `params` inside `<Suspense>`.
- Metadata: return `createMetadata({ title, description, path, ogImage })` from `apps/web/shared/meta.ts`.
- Register every new page in `apps/web/shared/seo/pages.ts` (indexed, noindex, or redirect); `pnpm test` fails otherwise. Checklist and go-live: `apps/web/docs/seo.md`.
</important>

<important if="you are reading price data in a price screen">
Read only through `getPriceSource()` in `features/price/data/price-source.ts`, never `db`, `db-source` or `queries/` directly. It reads the remote DB (`WEB_DATABASE_URL` in root `.env`, also locally). Spec: `.scratch/price-db-read/spec.md`.
</important>

<important if="you are deciding between server and client components, or adding 'use client'">
Server Components by default. Put `'use client'` on interactive leaves and pass static content as `children`.
</important>

<important if="your code needs today's date">
"Today" is Seoul time. Never call `new Date()` in rendering code.

- `/seasonal` and `/settings` are fully static; the server never computes today there. Small today marks (calendar ring, "오늘", "이번 달", "지금 계절", this year's dates) are hidden in the HTML with `TodayShow`/`TodayHide` (`shared/today-mark.tsx`); the `<head>` script `TODAY_MARK_SCRIPT` turns on that day's keys before first paint. Content that depends on today (eaten records' year, my table, year filter) uses `useSeoulToday()` (`shared/today-context.tsx`), which is `null` until hydration.
- Server code elsewhere (price, admin, baby-food) uses `getSeoulToday()` (`shared/today.ts`) inside `<Suspense>`.
</important>

<important if="you are saving state on the device or touching localStorage">
Use `deviceStore(key, defaults)` from `shared/device-store.ts` (key `seasonal:<name>` or `price:<name>`; never rename a key in use). Server HTML and first client render use defaults; `Providers` loads every store once after mount, and earlier writes apply on top. Store modules keep the store private and export hooks and functions (`toggleEaten`, `addToBasket`, ...).
</important>

<important if="you are adding or changing an analytics event">
Add it to the catalog in `shared/analytics/events.ts`, send only with `track()` from `shared/analytics/track.ts`. A new parameter must also be registered in GA (the catalog test lists it). Procedures: `apps/web/docs/analytics.md`.
</important>

<important if="you are adding or changing animation or transitions">
CSS keyframes for small effects, `motion` for drag, spring and layout animation, React `<ViewTransition>` only for the two spec'd transitions (CSS in `apps/web/app/globals.css`). Every animation ends instantly under `prefers-reduced-motion`.
</important>

<important if="you are opening a bottom sheet or dialog">
Open with `overlay-kit` (`<OverlayProvider>` in `apps/web/shared/providers.tsx`). Bottom sheets: `@workspace/ui/components/bottom-sheet` (`BottomSheet`, `openBottomSheet`). Examples: `features/seasonal/components/detail-sheet.tsx`, `features/seasonal/my-table/category-filter.tsx`.
</important>

<important if="you are writing Next.js code (routing, caching, rendering, config)">
`apps/web` runs Next.js 16.4, which may differ from your training data. Read the relevant guide in `apps/web/node_modules/next/dist/docs/` first (resolve `next` from `apps/web`; the root has none). Heed deprecation notices. This app's rendering and caching rationale: `apps/web/docs/nextjs-16-patterns.md`. `agentRules: false` in `apps/web/next.config.ts` keeps this file the single source of agent instructions.
</important>

<!-- BEGIN:turborepo-agent-rules -->

# This is NOT the Turborepo you know

Turborepo configuration, task behavior, and CLI commands can vary between installed versions and may differ from your training data. Resolve the `turbo` package from this file's directory or relevant workspace; in monorepos, it may not be visible from the repository root. For example, run `node -p "require.resolve('turbo/package.json')"` from a workspace that depends on `turbo`.

Read `docs/README.md` inside that installed package first, then read the relevant pages from its `docs/` directory before changing Turborepo configuration or commands. Heed deprecation notices. These bundled docs match the installed package version and are available without network access.

This block is written and re-added by `turbo` before repository-scoped commands when an AI agent is detected. In the Turborepo source repository, its template is defined in `crates/turborepo-cli/src/cli/agent_guidance.rs`. Removing the managed block while updates are enabled means a later qualifying invocation will add it again. Set `"agentGuidance": false` in the root `turbo.json` or `turbo.jsonc` to opt out; this does not remove an existing block. Keep the block committed with your work to avoid an uncommitted change on the next agent invocation.
<!-- END:turborepo-agent-rules -->

## 대화 방식

맞장구치지 말고 솔직하게 말해 줘. 내 생각이 약하면 반박하고, 틀렸으면 왜 틀렸는지 설명해 줘. 아이디어는 10점 만점으로 점수 매기고, 모르면 모른다고 해 줘.
