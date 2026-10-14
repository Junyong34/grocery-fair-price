# grocery-fair-price

pnpm + Turborepo monorepo.

```
apps/web/              Next.js app (routes in app/, screens in features/, app-wide code in shared/)
packages/ui/           @workspace/ui: Oura tokens, cojeev UI, generic components
packages/seasonal/     @workspace/seasonal: 제철 data and date calculations (no React)
packages/eslint-config, packages/typescript-config
grocery-price/         price-service docs and research
```

Layer rules are in "Web app UI" in `AGENTS.md`.

## Adding components

Look in cojeev UI first, then shadcn/ui. Add components from the repo root:

```bash
pnpm ui:add https://cojeev.com/ui/r/tabs.json
```

This installs into `packages/ui` and fixes the CSS imports the CLI writes. Don't run `shadcn add` directly.

## Using components

```tsx
import { Button } from "@workspace/ui/components/button"
```
