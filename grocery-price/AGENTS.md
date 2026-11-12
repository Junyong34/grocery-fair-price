# grocery-price

Design docs and public price API research for the price service. No application code. Map of this folder: `docs/project-structure.md` §10 and `grocery-price/README.md`.

| Read | When |
|---|---|
| `GLOSSARY.md` | you name or classify anything (카테고리, 품목, 품종, 규격, 시세, 판정, 제철, 그림). Use its terms and avoid the words it lists under _Avoid_ |
| `docs/adr/` | you are about to change something an ADR decided, or you made a decision that is hard to reverse, surprising, and a real trade-off (then add one, next number) |
| `docs/00-overview/roadmap.md` | you need the price-service stage (① 수집 기반 → ② 판정 설계 → ③ 화면 설계 → ④ 구현) a task belongs to |
| `docs/30-data/sources/{kamis,ekape,chamgagyeok}.md` | you call that source or write collection code for it. They record measured behavior the official specs omit |
| `docs/10-research/api-spec.md` | a data.go.kr dataset comes up: it maps dataset IDs to endpoints, so check it before treating one as a new source |
| `docs/30-data/pipeline.md` | you change the schema or the collection flow |

How skills use the glossary and ADRs: `docs/agents/domain.md`. Docs are written in Korean. A doc change needs no test run, but `pnpm test` checks paths that code cites, so run it after moving or renaming a file.

<important if="you are editing a generated file in grocery-price or changing what feeds one">

Regenerate with the command and commit the output. Hand edits are overwritten.

| Output | Command | Run it when |
|---|---|---|
| `grocery-price/reference/public-data/samples/viewer/api-explorer.html` | `python3 -I build.py` in that folder | `template.html`, `build.py` or the saved samples change. Then run `smoke.sh --quick` in that folder before finishing. |
| ERD blocks in `grocery-price/docs/30-data/schema-map.html` | `pnpm db:erd` (local DB up, migrations applied) | a migration changes tables, keys or checks. `pnpm db:test` fails while they differ. |
</important>
