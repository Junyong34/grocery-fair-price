## Agent skills

### Issue tracker

Issues live as local markdown files under `.scratch/<feature>/`. See `docs/agents/issue-tracker.md`.

### Triage labels

Default five-role vocabulary (needs-triage, needs-info, ready-for-agent, ready-for-human, wontfix). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context, rooted at `grocery-price/` (GLOSSARY.md + docs/adr/). See `docs/agents/domain.md`.

## Where things are

- Current work: `.scratch/*/spec.md` (issues in `.scratch/<feature>/issues/`). Phases and completion criteria: `grocery-price/docs/00-overview/roadmap.md`.
- Public price APIs (KAMIS, 축평원, 참가격): read `grocery-price/docs/10-research/api-spec.md` before calling them. It records measured behavior the official specs omit. Saved responses and a browser viewer: `grocery-price/reference/public-data/samples/`.
- After cloning, run `git config core.hooksPath .githooks` once. The pre-commit hook blocks commits that contain a value from `.env`.
- Viewer changes: run `grocery-price/reference/public-data/samples/viewer/smoke.sh --quick` before finishing.
