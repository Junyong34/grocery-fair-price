# apps/web

The Next.js 16.4 app: price screens (`/`), 제철달력 (`/seasonal`), 이유식 (`/baby-food`), and the dev-only admin (`/admin`). Root `AGENTS.md` holds the rules shared by every area (layers, colors and fonts, new UI components, glossary); this file adds what applies only here.

Map of every route, feature folder and shared module: `docs/project-structure.md` §4 and §5. Read it before adding a route or moving code between `app/`, `features/` and `shared/`.

Run commands from the repo root. A screen change is done when it shows correctly at widths 375 and 1280 with no console errors or hydration warnings (`docs/rules/ticket-workflow.md`). `/admin` screens are desktop-only: check 1280.

<important if="you are building or changing a screen in apps/web, or need its spec">
Screen spec: `prototypes/seasonal-food/wireframes/WIREFRAME-SPEC.md`; where it and `.scratch/seasonal-mvp/spec.md` differ, the `.scratch` spec wins. Name screens by spec code: 2a 이달 (`/seasonal`), 2b 월별, 3a 계절, 1g 명절, 1h 나의 식탁, 1i 품종 상세. Price screens spec: `.scratch/price-screens/spec.md` (product pages: `.scratch/catalog-scale/issues/10-product-page-and-search.md`). 이유식 screens: `.scratch/infant-food-pairing/spec.md`, `.scratch/baby-food-ingredient-pages/spec.md`, `.scratch/baby-food-fruits/spec.md`. The `/examples/*` comparison pages the specs cite were deleted; read them with `git show 22520eb:apps/web/app/examples/<name>/page.tsx`.
</important>

<important if="you are writing longer screen copy (month notes, season or festival text, verdict sentences, empty states, toasts)">
제철 screens: `packages/seasonal/src/data/copy.ts`. Price screens: `packages/price/src/copy.ts` (verdict sentences: `verdict-copy.ts`).
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
`apps/web` runs Next.js 16.4, which may differ from your training data. Read the relevant guide in `apps/web/node_modules/next/dist/docs/` first (resolve `next` from `apps/web`; the root has none). Heed deprecation notices. This app's rendering and caching rationale: `apps/web/docs/nextjs-16-patterns.md`. `agentRules: false` in `apps/web/next.config.ts` stops `next dev` from overwriting this hand-written file.
</important>

<important if="you are adding or changing an /admin screen or a server action that reads or writes files outside apps/web">

- Admin is dev-server only. Guard pages through `app/admin/layout.tsx` and route handlers and server actions with `adminEnabled` / `assertAdmin()` from `features/admin-print/server/guard.ts`. Add the menu entry in `features/admin-shell/admin-nav.ts` and the path in `shared/routes.ts`.
- When server code builds or reads a path above `apps/web` (repo root, `prototypes/`, `packages/`), put `/*turbopackIgnore: true*/` in the `path.join` / `path.resolve` call and in every `fs` call that uses it. Without it Turbopack traces the whole repo into the server bundle and the Vercel build fails. Example: `features/admin-foods/server/paths.ts`.
- 그림 어드민 (`/admin/foods`, `/admin/foods/varieties`) writes `packages/seasonal/src/data/food-registry.json`, `infant-art.json` and `prototypes/…/art.json`; its "웹에 반영" button runs `pnpm foods:sync --json`. Rules for those files: `packages/seasonal/AGENTS.md`.
</important>

<important if="you are editing a generated file in apps/web or changing what feeds one (display font, print editions)">

Regenerate with the command and commit the output. Hand edits are overwritten. `apps/web/public/foods/**` and `public/dishes/**` are generated by `pnpm foods:sync`: see `packages/seasonal/AGENTS.md`.

| Output | Command | Run it when |
|---|---|---|
| `apps/web/shared/fonts/BricolageGrotesque.woff2` (subset of `BricolageGrotesque-full.woff2`) | `scripts/subset-display-font.sh` (needs `fonttools` + `brotli`) | the font or the glyph range it must cover changes. |
| `apps/web/public/downloads/**` (PDFs, `manifest.json`), `apps/web/print-editions/<id>.build.json` | the admin's "PDF 생성" button at `/admin` (`pnpm dev`, uses local Google Chrome) | an edition's spec changes, or anything a print page draws changes (foods, illustrations, holidays). Saving an edition rewrites `manifest.json`. |

- Print PDFs are gitignored (too large); commit `manifest.json`, the thumbnails and the edition files. Publishing an edition uploads its A4 PDF to the private R2 bucket (ADR 0003, write keys in root `.env`); withdrawing or deleting leaves the object, and the admin's "R2 정리" button removes unlisted objects once the deploy is live.
- Brand files are copied by hand: `apps/web/docs/brand-assets.md`.
</important>
