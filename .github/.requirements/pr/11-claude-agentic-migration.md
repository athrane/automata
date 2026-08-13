## PR Title
refactor(agentic-setup): migrate Copilot instructions and skills to Claude Code conventions

## Summary
This PR relocates the project's AI-agent configuration from GitHub Copilot's conventions to Claude Code's native conventions: `.github/copilot-instructions.md` becomes a root-level `CLAUDE.md`, and the entire `.github/skills/` library moves to `.claude/skills/`. No application code, tests, or PR-artifact history is touched.

## Motivation
The current setup is shaped for GitHub Copilot: instructions live at `.github/copilot-instructions.md`, and skill definitions live in a custom `.github/skills/` convention that Copilot does not natively discover either — they require a human (or the agent) to manually locate and read the right `SKILL.md`, as happened in this very session for `pr-description-generator`. Claude Code has first-class support for a root `CLAUDE.md` (auto-loaded project instructions) and `.claude/skills/` (auto-discovered project skills, surfaced directly through Claude Code's Skill tool). Moving the existing library into those locations lets Claude Code pick up the project's skills automatically instead of requiring them to be pointed to explicitly.

## Changes

### Files Deleted

- **Delete `.github/copilot-instructions.md`** — Superseded by `CLAUDE.md` at the repo root; content is ported over, not discarded.
- **Delete `.github/skills/` (8 skill directories, 12 files)** — Relocated via `git mv` to `.claude/skills/`, preserving history; nothing here is dropped.

### Files Updated

- **`CLAUDE.md` (new)** — Repo-root instructions file, ported verbatim from `.github/copilot-instructions.md`, with the "Project Skills" section's path updated from `` `.github/skills/` `` to `` `.claude/skills/` `` so the instructions match the new skill location.
- **`.claude/skills/code-quality/SKILL.md`** — Moved from `.github/skills/`, content unchanged.
- **`.claude/skills/fowler-refactoring/SKILL.md`** — Moved from `.github/skills/`, content unchanged.
- **`.claude/skills/fowler-refactoring/implementation-planning/SKILL.md`** — Moved from `.github/skills/`, content unchanged.
- **`.claude/skills/fowler-refactoring/implementation-planning/linear-code-pattern/SKILL.md`** — Moved from `.github/skills/`, content unchanged.
- **`.claude/skills/mandatory-code-requirements/SKILL.md`** — Moved from `.github/skills/`, content unchanged.
- **`.claude/skills/pr-description-generator/SKILL.md`** — Moved from `.github/skills/`; the three `[pr-template.md](../../.requirements/pr-template.md)` links (lines 9, 42, 116) are corrected to `../../../.github/.requirements/pr-template.md`, since `.requirements/` is not moving and the skill's new home under `.claude/` is one hop further from it.
- **`.claude/skills/pr-draft-validator/SKILL.md`** — Moved from `.github/skills/`; the two `pr-template.md` links (lines 9, 28) corrected the same way.
- **`.claude/skills/pr-review-standards/SKILL.md`** — Moved from `.github/skills/`, content unchanged.
- **`.claude/skills/pr-review-standards/templates/review-report.md`** — Moved from `.github/skills/`, content unchanged. (This file already contains relative links to `docs/architecture/*` and `instructions/coding.instructions.md` that don't resolve to any file in the repo today; that pre-existing breakage is out of scope here and is left as-is.)
- **`.claude/skills/reflect/SKILL.md`** — Moved from `.github/skills/`, content unchanged.
- **`.claude/skills/reflect/template/reflect-report-template.md`** — Moved from `.github/skills/`, content unchanged.
- **`.claude/skills/solid-principles/SKILL.md`** — Moved from `.github/skills/`, content unchanged.
- **`.claude/skills/test-standards/SKILL.md`** — Moved from `.github/skills/`, content unchanged.
- **`.claude/skills/typescript-unit-tests/SKILL.md`** — Moved from `.github/skills/`, content unchanged.
- **`.claude/skills/validation-pipeline/SKILL.md`** — Moved from `.github/skills/`, content unchanged.

`.github/.requirements/` (`pr-template.md` and `pr/*.md`) is intentionally **not** moved — see Additional Notes.

## Type of Change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update
- [x] Refactoring (no functional changes)
- [ ] Performance improvement
- [ ] Test coverage improvement

## Implementation Plan

### Phase 1 — Introduce CLAUDE.md at the repo root

Pre-condition: `.github/copilot-instructions.md` is the sole agent-instructions file; no `CLAUDE.md` exists yet.

Steps:
1. Create `CLAUDE.md` at the repo root by porting the full content of `.github/copilot-instructions.md` verbatim.
2. In `CLAUDE.md`, update the "Project Skills" section's lead-in sentence and table so the skill path reads `` `.claude/skills/` `` instead of `` `.github/skills/` ``, matching the location introduced in Phase 2.
3. Delete `.github/copilot-instructions.md` (untracked in git) now that its content lives in `CLAUDE.md`.

Post-condition: `CLAUDE.md` exists at the repo root, auto-loadable by Claude Code, and already references `.claude/skills/`; `.github/copilot-instructions.md` no longer exists.

Dependencies: None.

### Phase 2 — Relocate the skill library to .claude/skills/

Pre-condition: Phase 1 is complete, so `CLAUDE.md` already points at `.claude/skills/` before any skill file is moved.

Steps:
1. Run `git mv .github/skills .claude/skills` to relocate all 8 skill directories (12 files total) in one history-preserving operation.
2. In `.claude/skills/pr-description-generator/SKILL.md`, update the three `pr-template.md` relative links (lines 9, 42, 116) from `../../.requirements/pr-template.md` to `../../../.github/.requirements/pr-template.md`.
3. In `.claude/skills/pr-draft-validator/SKILL.md`, apply the same link correction to the two `pr-template.md` references (lines 9, 28).
4. Leave `.github/.requirements/` untouched in place — no files there are added, edited, or removed by this phase.

Post-condition: `.claude/skills/` contains all 8 skill directories with working relative links back to `.github/.requirements/pr-template.md`; `.github/skills/` no longer exists; `.github/` retains only `.requirements/`.

Dependencies: Phase 1 (so there is no intermediate state where `CLAUDE.md` and the skill files disagree on where the skills live).

## Testing

### TypeScript unit tests

No source or test files are touched — this PR only moves and edits Markdown configuration. No test changes are required.

- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] All tests passing (`npm run test`)

**Test coverage**: Not applicable — no executable code is affected.

**Status**: not run — this document describes the planned refactor; the file moves and edits above have not been implemented yet, so there is no diff to validate against `npm run lint` / `npm run build` / `npm run typecheck` / `npm run test`.

### Manual validation steps

| # | Check | How to verify |
|---|-------|---------------|
| 1 | `CLAUDE.md` is picked up as project instructions | Open the repo in Claude Code and confirm `CLAUDE.md` content is loaded automatically |
| 2 | `.claude/skills/` entries are auto-discovered | Confirm each of the 8 skills is listed as an available skill without manually pointing at a file path |
| 3 | `pr-description-generator` still resolves its template | Invoke the skill and confirm it loads `.github/.requirements/pr-template.md` via the corrected link and saves output under `.github/.requirements/pr/` |
| 4 | `pr-draft-validator` still resolves its template | Invoke the skill against an existing draft (e.g. `.github/.requirements/pr/5-add-threejs-gui.md`) and confirm the template loads correctly |
| 5 | No stray references to the old paths remain | `grep -rn "copilot-instructions\|.github/skills" CLAUDE.md .claude/` returns nothing |

## Documentation Plan

| File | Changes |
|------|---------|
| `README.md` | No changes required — README.md does not currently reference `copilot-instructions.md` or `.github/skills/`. |

## Related Issues
Closes #7

## Checklist
- [ ] Code follows project conventions (static factory methods, TypeUtils validation, etc.)
- [ ] TypeScript types are correct (`npm run typecheck` passes)
- [ ] Code lints without errors (`npm run lint` passes)
- [ ] All tests pass (`npm run test` passes)
- [ ] Build succeeds (`npm run build` passes)
- [ ] JSDoc comments added for public APIs
- [ ] Updated documentation (if applicable)
- [x] No breaking changes (or documented in PR description)
- [ ] Commit messages follow Conventional Commits format

## Additional Notes
- `.github/.requirements/` (the PR template and the saved PR descriptions under `.github/.requirements/pr/`, including this file) is deliberately left where it is. It holds GitHub pull-request content and history, not agent configuration, so it isn't in scope for a Copilot-to-Claude migration. Moving it would also reach into `.github/.requirements/pr/6-game-state-machine.md`, which is an unrelated, currently uncommitted draft for issue #6 — this refactor is scoped to avoid touching that file.
- `.claude/skills/pr-review-standards/templates/review-report.md` and `.claude/skills/fowler-refactoring/implementation-planning/SKILL.md` contain relative links to files that don't exist in the repository today (`instructions/coding.instructions.md`, `docs/architecture/*`, a `builder-pattern` skill, a `mandatory-requirements` skill). These are pre-existing issues, not introduced by this move, and are left unchanged.
- This PR is documentation/configuration-only; it carries no functional risk to `src/`.
