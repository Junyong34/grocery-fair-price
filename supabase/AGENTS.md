# supabase

The price DB. Migrations in `supabase/migrations/` (schema `price`, roles `ingest_writer` · `web_reader`, RLS) are the source of truth for tables. `packages/price-db` holds the DB tests, sample data and the ERD generator. Table map and roles: `docs/project-structure.md` §8-1. Schema and collection design: `grocery-price/docs/30-data/pipeline.md`.

Run from the repo root: `pnpm db:start` once, then `pnpm db:test` (it needs the local DB up). `pnpm db:reset` reapplies every migration locally.

<important if="you are adding or changing a database migration, table, column, or function in supabase/">

- New file in `supabase/migrations/`; never edit an applied one. Verify with `pnpm db:start` once, then `pnpm db:test`.
- A new `price` table or column needs `comment on` in the same file (meaning, unit or format, what `null` means, source field name; Korean, GLOSSARY terms). `pnpm db:test` fails without it.
- A new `price` table also needs RLS policies, a group in `packages/price-db/scripts/build-erd.ts`, and the lists in `packages/price-db/test/helpers.ts`.
- A new `price` function needs `revoke execute … from public, anon, authenticated` in the same file.
</important>

<important if="a migration changes tables, keys or checks">

| Output | Command | Run it when |
|---|---|---|
| ERD blocks in `grocery-price/docs/30-data/schema-map.html` | `pnpm db:erd` (local DB up, migrations applied) | a migration changes tables, keys or checks. `pnpm db:test` fails while they differ. |
</important>
