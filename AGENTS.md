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
