# Claude Code Instructions

## Response Style
Be brief. Target 1–3 sentences for simple answers; expand only for complex work or when asked. Skip preamble, summaries, and explanations of what you just did.

## Implementation Discipline
Only make changes that are directly requested. Do not add features, refactoring, comments, docstrings, type annotations, or error handling beyond what was asked.

## Project Skills
Domain knowledge is packaged in `.claude/skills/`. Load a skill only when its area is relevant — do not pre-load all skills.

| Skill | When to load |
|---|---|
| `mandatory-code-requirements` | Before writing any new TypeScript class |
| `code-quality` | When reviewing code or before submitting a PR |
| `solid-principles` | When performing a design review |
| `grill-me` | When asked to grill/challenge a plan, or before implementing an ambiguous design |
| `fowler-refactoring` | When asked to refactor |
| `test-standards` / `typescript-unit-tests` | When writing or reviewing tests |
| `validation-pipeline` | Before committing — run lint → test → build |
| `pr-description-generator` / `pr-draft-validator` / `pr-review-standards` | PR workflows only |
| `reflect` | When asked to reflect on a session |
