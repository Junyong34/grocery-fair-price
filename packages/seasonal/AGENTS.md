# packages/seasonal

Pure TypeScript for 제철, 이유식 and print specs: data, calendar, seeded scatter, 초성 search. No React, Next.js, DOM or Node APIs (`node:fs` fails typecheck here; a test that needs a JSON file imports it). Module list: `docs/project-structure.md` §6. Pipeline of generated files: §8.

Write the vitest test first, as `*.test.ts` beside the code. Done means `pnpm typecheck`, `pnpm lint` and `pnpm test` pass at the repo root (`docs/rules/ticket-workflow.md`).

<important if="you are adding or changing a 품종 (name, alias, category, 제철 months, evidence) or which illustration it uses">

- Edit only `src/data/food-registry.json` (shape and checks: `src/data/food-registry.ts`). 그림 and 품종 are separate things; `art` names the 그림 ID when it differs from the 품종 ID (ADR `grocery-price/docs/adr/0006-illustration-is-separate-from-variety.md`).
- 제철 검증 and 그림 검수 are separate judgments. `season: "verified"` puts a 품종 on the 제철달력 and needs evidence (`sources`, `checkedAt`) for anything new or changed; older entries may lack it. 그림 검수 lives in `prototypes/seasonal-food/foods/<그림 ID>/art.json` (shape: `src/data/art-meta.ts`).
- A 품종 ID is the URL and the key of saved 먹음 기록. Keep it. If one must change, add the old ID to `src/data/renamed-foods.ts`. Remove a 품종 from the calendar by setting `season: "unverified"`, not by deleting it.
- 이유식 screens point at 그림 IDs in `src/data/infant-art.json`. 궁합 and 월령 text stays in `infant-pairings.ts` and `infant-fruits.ts`.
- The dev admin edits the same files: `/admin/foods` (그림 검수, 용도), `/admin/foods/varieties` (기존 품종).
</important>

<important if="you are editing a generated file here or changing what feeds one (품종 source, infant-art.json, illustrations)">

Regenerate with the command and commit the output. Hand edits are overwritten.

| Output | Command | Run it when |
|---|---|---|
| `packages/seasonal/src/data/{foods,drawn-foods,drawn-dishes,food-bounds}.generated.ts`, `apps/web/public/foods/<id>/{color,motion}.svg`, `apps/web/public/dishes/<id>/color.svg`, both `PROVENANCE.md` | `pnpm foods:sync` | the 품종 source `packages/seasonal/src/data/food-registry.json` changes (name, aliases, months, 제철 검증 status, evidence, `art`), `infant-art.json` changes, or an illustration is drawn, changed or reviewed (`/seasonal-food-illustrator`). It checks first and replaces nothing if it finds a problem; fix the items it lists. `--check` only checks. |
| `food-bounds.generated.ts` alone | `pnpm foods:bounds` | the SVGs changed without a sync. Needs no `prototypes/`. |

- `pnpm foods:sync` exports an illustration when its `art.json` says `reviewed` and some screen data points at it (a verified 품종, `infant-art.json`). What counts as a problem is decided in `src/data/food-sync-plan.ts`.
- Without `prototypes/`, `pnpm foods:sync` regenerates only the 품종 list and leaves the committed illustrations as they are.
- Per-품종 drawing scale (`FOOD_SCALE` in `packages/seasonal/src/data/food-sizes.ts`) is hand-tuned.
- `scripts/sync-foods.mjs` imports `src/data/*.ts` directly with Node, so the modules it imports (`food-registry.ts`, `food-sync-plan.ts`, `art-meta.ts`, `dish-rows.ts`, `renamed-foods.ts`) must not import other local modules as values.
</important>

<important if="you are asked to draw a new illustration or change an existing one">
Start with the `seasonal-food-illustrator` skill (`.claude/skills/`, on this machine only, like `prototypes/`). It ends at a preview and an `unreviewed` `art.json`; the user reviews and assigns the use in `/admin/foods`.
</important>

<important if="you are writing longer 제철 screen copy (month notes, season or festival text, empty states)">
It lives in `src/data/copy.ts`.
</important>
