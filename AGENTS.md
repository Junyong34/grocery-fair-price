## Agent skills

### Issue tracker

Issues and specs are local markdown in `.scratch/<feature>/` (`spec.md`, `issues/NN-slug.md`). Read `docs/agents/issue-tracker.md` before creating or triaging one.

### Triage labels

Five roles: needs-triage, needs-info, ready-for-agent, ready-for-human, wontfix. Mapping: `docs/agents/triage-labels.md`.

### Domain docs

Glossary `grocery-price/GLOSSARY.md`, ADRs `grocery-price/docs/adr/`. How skills consume them: `docs/agents/domain.md`.

Naming or classifying foods (카테고리, 품목, 품종, 규격) anywhere in the repo, including `prototypes/`: use the terms in `grocery-price/GLOSSARY.md`.

## Where things are

- Current work: `.scratch/*/spec.md`. Phases and completion criteria: `grocery-price/docs/00-overview/roadmap.md`.
- Before calling a public price API (KAMIS, 축평원, 참가격), read `grocery-price/docs/10-research/api-spec.md`. It records measured behavior the official specs omit. Saved responses and the browser viewer: `grocery-price/reference/public-data/samples/`.
- Viewer changes (`grocery-price/reference/public-data/samples/viewer/`): run `grocery-price/reference/public-data/samples/viewer/smoke.sh --quick` before finishing.
- Fresh clone: run `git config core.hooksPath .githooks` once. The pre-commit hook runs `scripts/check-no-secrets.sh` and blocks commits that contain a value from `.env`.
- `prototypes/` is gitignored for now (see `.gitignore`). Don't force-add it.
- Food illustrations in `apps/web/public/foods/` are generated from `prototypes/seasonal-food`. After drawing or changing one, run `pnpm foods:sync`. Don't edit the SVGs by hand. Food data (`packages/seasonal/src/data/foods.generated.ts`) is regenerated with `pnpm --filter @workspace/seasonal build:foods`.

## Web app UI (`apps/web`)

`apps/web` is the 제철 (seasonal food) app. The price-comparison screens will join the same app later. Screen spec: `prototypes/seasonal-food/wireframes/WIREFRAME-SPEC.md`. Color and type reference: `apps/web/DESIGN.md` (Oura).

Layers. Each one may import only from the layers below it:

| Layer | Where | What goes there |
|---|---|---|
| App routes | `apps/web/app/` | Route files only (`page`, `layout`, `@slot`, route groups). Keep them thin: read params, then render a feature component. |
| Features | `apps/web/features/<feature>/` | Screen components and hooks for one feature (`seasonal`, later `price`). Features don't import each other. Shared code moves down a layer. |
| App shared | `apps/web/shared/` | App-wide pieces: `routes.ts`, `providers.tsx`. |
| Domain | `packages/seasonal` (`@workspace/seasonal`) | Pure TypeScript data and calculations, such as months, seasons, festivals and Seoul "today". No React, Next.js or DOM. The MVP-later print pages reuse it. |
| Design system | `packages/ui` (`@workspace/ui`) | Oura tokens, cojeev UI, and generic components such as `BottomSheet`. No domain words. |

Import with package paths, such as `@workspace/ui/components/button` and `@workspace/seasonal/data/months`. Inside `apps/web`, use `@/features/...` and `@/shared/...`.

When you need a component, effect, or element, look in this order:

1. **cojeev UI** — https://cojeev.com/ui/docs/ (full list: https://cojeev.com/ui/r/registry.json). If it exists there, use it.
2. **shadcn/ui** — only if cojeev has nothing that fits. Search the shadcn registry and add it.
3. **Build it yourself** — only if neither has it. A generic piece goes in `packages/ui/src/components/`. A piece for one screen goes in `apps/web/features/<feature>/components/`. Use the existing tokens either way.

Add cojeev or shadcn components from the repo root with `pnpm ui:add <name-or-url>` (for example `pnpm ui:add https://cojeev.com/ui/r/tabs.json`). Don't run `shadcn add` directly. The script installs into `packages/ui`, answers "no" to every overwrite prompt (so files we customized, like `bottom-sheet` or `option-wheel`, stay), then runs `packages/ui/scripts/fix-ui-css.mjs`. That step rewrites the `@import "@/styles/..."` lines the CLI writes into `src/styles/cojeev.css`, because Tailwind can't resolve the `@/` alias and the build breaks. It also removes the `dark` variant the CLI adds back each time. If `next dev` was running during `pnpm ui:add`, it can keep the CLI's half-written CSS and show `Can't resolve '@/styles/...'` even after the fix. Restart the dev server.

Colors:

- The only color source is the Oura palette in `packages/ui/src/styles/globals.css` (`--color-canvas`, `--color-stone`, `--color-gold`, ..., `--color-season-*`).
- cojeev's own palette (`--v-*`) is overridden with Oura values in `packages/ui/src/styles/cojeev.css`. Don't put hex values in components.
- No dark mode. `<html data-mode="light">` is fixed in `apps/web/app/layout.tsx`. Don't add dark tokens, a theme toggle, or `dark:` classes.

Routes:

- The 제철 screens live under `/seasonal`. `/` is reserved for the future price-comparison main. Today `app/page.tsx` redirects to `routes.home`. When the price main ships, replace that page. Don't move the seasonal routes.
- Build every path with `routes` from `apps/web/shared/routes.ts`. Never hard-code a path string in a component. `proxy.ts` `matcher` is the one exception, because it must be a static literal.
- Route groups `(this-month)` and `(season)` share the second-level tab bars without changing the URL. `@sheet/(.)foods/[food]` intercepts `/seasonal/foods/[food]` and shows it as a bottom sheet inside the seasonal area. Loading that URL directly renders the full page.
- With Cache Components, `dynamicParams` is a build error. Validate params with `notFound()` and read `params` inside `<Suspense>`.

Sheets and dialogs: open them with `overlay-kit` (`<OverlayProvider>` is in `apps/web/shared/providers.tsx`). For bottom sheets, use `@workspace/ui/components/bottom-sheet` (`BottomSheet`, `openBottomSheet`). Example: `/examples/bottom-sheet`.

## Next.js docs

`apps/web` runs Next.js 16.4. APIs, conventions, and file structure may differ from your training data. Before writing Next.js code, read the relevant guide in `apps/web/node_modules/next/dist/docs/`. The repo root has no `next` package, so resolve it from `apps/web`. Heed deprecation notices. Rendering and caching patterns for this app: `apps/web/docs/nextjs-16-patterns.md`.

`next dev` would normally write this as a managed block in `apps/web/AGENTS.md`. That is off (`agentRules: false` in `apps/web/next.config.ts`) so this file stays the single source of agent instructions.

<!-- BEGIN:turborepo-agent-rules -->

# This is NOT the Turborepo you know

Turborepo configuration, task behavior, and CLI commands can vary between installed versions and may differ from your training data. Resolve the `turbo` package from this file's directory or relevant workspace; in monorepos, it may not be visible from the repository root. For example, run `node -p "require.resolve('turbo/package.json')"` from a workspace that depends on `turbo`.

Read `docs/README.md` inside that installed package first, then read the relevant pages from its `docs/` directory before changing Turborepo configuration or commands. Heed deprecation notices. These bundled docs match the installed package version and are available without network access.

This block is written and re-added by `turbo` before repository-scoped commands when an AI agent is detected. In the Turborepo source repository, its template is defined in `crates/turborepo-cli/src/cli/agent_guidance.rs`. Removing the managed block while updates are enabled means a later qualifying invocation will add it again. Set `"agentGuidance": false` in the root `turbo.json` or `turbo.jsonc` to opt out; this does not remove an existing block. Keep the block committed with your work to avoid an uncommitted change on the next agent invocation.
<!-- END:turborepo-agent-rules -->
