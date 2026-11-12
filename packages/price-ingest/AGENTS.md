# packages/price-ingest

Public price API clients and the ingest CLI that GitHub Actions runs (`.github/workflows/ingest-*.yml`). Module map: `docs/project-structure.md` §8-2. Design: `grocery-price/docs/30-data/pipeline.md`.

Run from the repo root. `pnpm --filter @workspace/price-ingest test` runs offline tests; `test:live` calls the real APIs and `test:db` needs `pnpm db:start`. Keys come from the root `.env`; use key names only and never print their values.

<important if="you are calling a public price API (KAMIS, 축평원, 참가격, data.go.kr) or writing collection or schema code for one">

- First read that source's doc in `grocery-price/docs/30-data/sources/` (`kamis.md`, `ekape.md`, `chamgagyeok.md`); they record measured behavior the official specs omit.
- `grocery-price/docs/10-research/api-spec.md` summarizes and maps each data.go.kr dataset ID to its endpoint; check it before treating a dataset as a new source.
- Schema and collection design: `grocery-price/docs/30-data/pipeline.md`. Saved responses and browser viewer: `grocery-price/reference/public-data/samples/`.
</important>

<important if="you are changing the catalog (카테고리, 품목, 품종, 규격, 상품 or their source-code mappings)">
The catalog's source of truth is the operating DB, not code (ADR `grocery-price/docs/adr/0005-catalog-source-is-db.md`). `src/catalog/snapshot.json` is the exported copy: change the catalog through the dev admin (`/admin/catalog/*`) or `pnpm --filter @workspace/price-ingest catalog`, then commit the re-exported snapshot. Do not hand-edit it.
</important>
