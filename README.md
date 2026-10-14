# shadcn/ui monorepo template

This is a Next.js monorepo template with shadcn/ui.

## Adding components

Look in cojeev UI first, then shadcn/ui. Add components from the repo root:

```bash
pnpm --filter web ui:add https://cojeev.com/ui/r/tabs.json
```

This places components in `apps/web/components/ui` and fixes the CSS imports the CLI writes. Don't run `shadcn add` directly. See "Web app UI" in `AGENTS.md`.

## Using components

```tsx
import { Button } from "@/components/ui/button";
```
