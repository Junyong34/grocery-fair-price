# Domain Docs

How the engineering skills should consume this repo's domain documentation when exploring the codebase.

## Before exploring, read these

- **`grocery-price/GLOSSARY.md`**: the project glossary.
- **`grocery-price/docs/adr/`**: read ADRs that touch the area you're about to work in.

This repo is single-context, but its domain docs live under `grocery-price/` rather than the repo root. Wherever the rules below say `GLOSSARY.md` or `docs/adr/`, use the `grocery-price/` paths.

If any of these files don't exist, **proceed silently**. Don't flag their absence; don't suggest creating them upfront. The `/domain-modeling` skill (reached via `/grill-with-docs` and `/improve-codebase-architecture`) creates them lazily when terms or decisions actually get resolved.

## File structure

This repo (single-context):

```
/
└── grocery-price/
    ├── GLOSSARY.md
    └── docs/adr/
        └── 0001-public-data-and-reports-over-crawling.md
```

## Use the glossary's vocabulary

When your output names a domain concept (in an issue title, a refactor proposal, a hypothesis, a test name), use the term as defined in `GLOSSARY.md`. Don't drift to synonyms the glossary explicitly avoids.

If the concept you need isn't in the glossary yet, that's a signal: either you're inventing language the project doesn't use (reconsider) or there's a real gap (note it for `/domain-modeling`).

## Flag ADR conflicts

If your output contradicts an existing ADR, surface it explicitly rather than silently overriding:

> _Contradicts ADR-0007 (event-sourced orders), but worth reopening because…_
