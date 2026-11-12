# AGENTS.md

장볼날: 제철달력과 장보기 가격 판정 서비스. pnpm + Turborepo 모노레포, Next.js 16.4 (`apps/web`), Supabase(Postgres) 가격 DB.

Code comments and docs are written in Korean. Use the terms in `grocery-price/GLOSSARY.md` when you name or classify anything (카테고리, 품목, 품종, 규격, 그림), including under `prototypes/`.

## Where to start

Each area has its own `AGENTS.md` with the rules that apply only there. Read the one for the area you are about to change.

| Task | Start in | Read first |
|---|---|---|
| Change a screen, route, metadata, analytics, or an `/admin` page | `apps/web` | `apps/web/AGENTS.md` |
| Change 제철 data, a 품종, 이유식 data, or anything about illustrations | `packages/seasonal` | `packages/seasonal/AGENTS.md` |
| Change a table, column, function or migration | `supabase` (tests in `packages/price-db`) | `supabase/AGENTS.md` |
| Call a public price API, change collection or the catalog | `packages/price-ingest` | `packages/price-ingest/AGENTS.md` |
| Change price-service docs, the glossary or an ADR | `grocery-price` | `grocery-price/AGENTS.md` |
| Change price-screen domain logic (verdict, search, format, copy) | `packages/price` | the layer table below; copy is in `packages/price/src/copy.ts` and `verdict-copy.ts` |
| Add or change a design-system component, token or font | `packages/ui` | the component and color blocks below |
| Find current work, or tidy docs and tickets | `.scratch` | `.scratch/README.md` (open tickets per spec; a finished spec can still have open ones) |

- `docs/project-structure.md`: the full map (every route, module, generated file, command, doc). Read it before adding a route, package, script or generated file, or when a task spans more than one area.
- `docs/rules/ticket-workflow.md`: read it before you call a ticket done or commit. It holds the done criteria, the 375 / 1280 screen check, the test-first rule for pure functions, and the commit rule (each verified ticket straight to `main`, no PR).
- `prototypes/` (illustration source, wireframes, brand originals) and `.claude/skills/` exist on this machine only. Both are gitignored: keep them out of commits (no force-add).
- A generated file is never edited by hand. Its command is in the `AGENTS.md` of the area that owns it.

<important if="you need to run commands to build, test, lint, typecheck, start the dev server or DB">

Run from the repo root. Scripts live in the root `package.json`; the full table is `docs/project-structure.md` §9. What the scripts don't tell you:

- In a shell with no TTY (an agent's shell), prefix pnpm with `CI=true`. Without it pnpm stops to ask about reinstalling modules.
- Add UI components with `pnpm ui:add <name-or-url>`, not `shadcn add` (it keeps our edited files and fixes `cojeev.css` imports).
- `pnpm db:test` needs `pnpm db:start` first.
- Once per fresh clone: `git config core.hooksPath .githooks` (pre-commit secret check).
</important>

<important if="you are creating, triaging, or labeling an issue or spec">
Issues and specs are local markdown in `.scratch/<feature>/` (`spec.md`, `issues/NN-slug.md`). Read `docs/agents/issue-tracker.md` first. Five triage roles (needs-triage, needs-info, ready-for-agent, ready-for-human, wontfix): `docs/agents/triage-labels.md`.
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

<!-- BEGIN:turborepo-agent-rules -->

# This is NOT the Turborepo you know

Turborepo configuration, task behavior, and CLI commands can vary between installed versions and may differ from your training data. Resolve the `turbo` package from this file's directory or relevant workspace; in monorepos, it may not be visible from the repository root. For example, run `node -p "require.resolve('turbo/package.json')"` from a workspace that depends on `turbo`.

Read `docs/README.md` inside that installed package first, then read the relevant pages from its `docs/` directory before changing Turborepo configuration or commands. Heed deprecation notices. These bundled docs match the installed package version and are available without network access.

This block is written and re-added by `turbo` before repository-scoped commands when an AI agent is detected. In the Turborepo source repository, its template is defined in `crates/turborepo-cli/src/cli/agent_guidance.rs`. Removing the managed block while updates are enabled means a later qualifying invocation will add it again. Set `"agentGuidance": false` in the root `turbo.json` or `turbo.jsonc` to opt out; this does not remove an existing block. Keep the block committed with your work to avoid an uncommitted change on the next agent invocation.
<!-- END:turborepo-agent-rules -->

## 대화 방식

맞장구치지 말고 솔직하게 말해 줘. 내 생각이 약하면 반박하고, 틀렸으면 왜 틀렸는지 설명해 줘. 아이디어는 10점 만점으로 점수 매기고, 모르면 모른다고 해 줘.
