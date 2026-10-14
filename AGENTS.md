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

## Web app UI (`apps/web`)

`apps/web` is the 제철 (seasonal food) app. Screen spec: `prototypes/seasonal-food/wireframes/WIREFRAME-SPEC.md`. Color and type reference: `apps/web/DESIGN.md` (Oura).

When you need a component, effect, or element, look in this order:

1. **cojeev UI** — https://cojeev.com/ui/docs/ (full list: https://cojeev.com/ui/r/registry.json). If it exists there, use it.
2. **shadcn/ui** — only if cojeev has nothing that fits. Search the shadcn registry and add it.
3. **Build it yourself** — only if neither has it. Put it in `apps/web/components/` and use the existing tokens.

Add cojeev or shadcn components with `pnpm --filter web ui:add <name-or-url>` (for example `https://cojeev.com/ui/r/tabs.json`). Don't run `shadcn add` directly. The script also runs `apps/web/scripts/fix-ui-css.mjs`. That step rewrites the `@import "@/styles/..."` lines the CLI writes, because Tailwind can't resolve the `@/` alias and the build breaks. It also removes the `dark` variant the CLI adds back each time.

Components land in `apps/web/components/ui/` and are imported from `@/components/ui/...`. `packages/ui` only holds the shared theme (`globals.css`). Don't add components there.

Colors:

- The only color source is the Oura palette in `packages/ui/src/styles/globals.css` (`--color-canvas`, `--color-stone`, `--color-gold`, ..., `--color-season-*`).
- cojeev's own palette (`--v-*`) is overridden with Oura values in `apps/web/app/globals.css`. Don't put hex values in components.
- No dark mode. `<html data-mode="light">` is fixed in `app/layout.tsx`. Don't add dark tokens, a theme toggle, or `dark:` classes.

Sheets and dialogs: open them with `overlay-kit` (`<OverlayProvider>` is in `app/providers.tsx`). For bottom sheets, use `components/bottom-sheet.tsx` (`BottomSheet`, `openBottomSheet`). Example: `/examples/bottom-sheet`.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

<!-- BEGIN:turborepo-agent-rules -->

# This is NOT the Turborepo you know

Turborepo configuration, task behavior, and CLI commands can vary between installed versions and may differ from your training data. Resolve the `turbo` package from this file's directory or relevant workspace; in monorepos, it may not be visible from the repository root. For example, run `node -p "require.resolve('turbo/package.json')"` from a workspace that depends on `turbo`.

Read `docs/README.md` inside that installed package first, then read the relevant pages from its `docs/` directory before changing Turborepo configuration or commands. Heed deprecation notices. These bundled docs match the installed package version and are available without network access.

This block is written and re-added by `turbo` before repository-scoped commands when an AI agent is detected. In the Turborepo source repository, its template is defined in `crates/turborepo-cli/src/cli/agent_guidance.rs`. Removing the managed block while updates are enabled means a later qualifying invocation will add it again. Set `"agentGuidance": false` in the root `turbo.json` or `turbo.jsonc` to opt out; this does not remove an existing block. Keep the block committed with your work to avoid an uncommitted change on the next agent invocation.
<!-- END:turborepo-agent-rules -->
