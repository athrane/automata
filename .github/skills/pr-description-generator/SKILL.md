---
name: pr-description-generator
description: 'Generate a complete GitHub pull request title and description from project changes using the automata PR template. Use when preparing a PR, creating a PR draft, writing PR summary/motivation/testing sections, or saving PR description files to .github/.requirements/pr.'
argument-hint: 'Provide: issue number, scope, key changes, lint/build/typecheck/test evidence, related issues, and README.md documentation updates.'
---

# PR Description Generator

Generate a PR title and full PR description using the template in [pr-template.md](../../.requirements/pr-template.md).

## When to Use
- You need a complete PR body before opening a pull request.
- You want a Conventional Commits style PR title.
- You need a consistent checklist, testing plan, and implementation plan.
- You want the PR description saved as a markdown artifact in `.github/.requirements/pr/`.

## Inputs to Collect
- Branch name and optional scope.
- Why the change was made (motivation).
- Files changed, including deleted files.
- Validation evidence for `npm run lint`, `npm run build`, `npm run typecheck`, and `npm run test`.
- Related issues (`Closes #...`, `Related to #...`).
- README.md documentation updates for this PR.

If any input is missing, ask targeted follow-up questions before drafting.

## Procedure
1. Inspect current changes and summarize intent.
2. Propose a Conventional Commits PR title in the format `<type>(<scope>): <description>`.
3. Load [pr-template.md](../../.requirements/pr-template.md) and populate all required sections.
4. Build an implementation plan with ordered phases that reflect the actual change sequence.
5. Fill testing with concrete evidence:
- Updated or added test files.
- Test status (pass/fail/not run).
- `npm run lint` status and relevant output summary.
- `npm run build` status and relevant output summary.
- `npm run typecheck` status and relevant output summary.
- Manual validation steps as a table.
6. Handle decision points:
- If there are no deleted files, replace the deleted files section with `- None`.
- Always include the Documentation Plan section and add a row for `README.md` with the documentation changes made for this PR.
- If tests were not run, explicitly state that and why.
- If multiple change types apply, check all relevant boxes in Type of Change.
7. Save the output to `.github/.requirements/pr/<issue-number>-<slug>.md`.
8. Final validation against the template:
- Title uses Conventional Commits format.
- Summary is 1-3 sentences.
- Every changed file has a description in the Changes section.
- Testing section is truthful and specific.
- Validation evidence includes lint/build/typecheck/test results.
- Documentation Plan is present and includes `README.md`.
- Checklist items match the known validation state.

## Output Format
- File path: `.github/.requirements/pr/<issue-number>-<slug>.md`
- Content: Fully populated PR markdown body suitable for GitHub PR description.

## Quality Bar
- Prefer precise, reviewable statements over generic text.
- Do not claim tests/checks passed unless confirmed.
- Keep language concise and actionable for reviewers.
- Keep section order aligned with [pr-template.md](../../.requirements/pr-template.md).
