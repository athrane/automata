---
name: pr-description-generator
description: 'Generate and save a complete GitHub pull request description to .github/.requirements/pr/. Use when preparing a PR, creating a PR draft, writing PR summary/motivation/testing sections, implementing a PR description, saving PR description files to .requirements/pr, or filling in the PR template.'
argument-hint: 'Provide: issue number, scope, key changes, lint/build/typecheck/test evidence, related issues, and README.md documentation updates.'
---

# PR Description Generator

Generate a PR title and full PR description using the template in [pr-template.md](../../../.github/.requirements/pr-template.md), then save the result to `.github/.requirements/pr/`.

## When to Use
- You need a complete PR body before opening a pull request.
- You want a Conventional Commits style PR title.
- You need a consistent checklist, testing plan, and implementation plan.
- You want the PR description saved as a markdown artifact in `.github/.requirements/pr/`.

## Inputs to Collect

Gather the following before drafting. If any are missing, ask targeted follow-up questions.

| Input | Notes |
|-------|-------|
| Issue number | Used for the output filename and `Closes #` link |
| Branch name and scope | Drives the Conventional Commits title `<type>(<scope>)` |
| Motivation | Why the change was needed |
| Files changed | All added, modified, and deleted files |
| Validation evidence | Results of `npm run lint`, `npm run build`, `npm run typecheck`, `npm run test` |
| Related issues | `Closes #…` or `Related to #…` |
| README.md documentation updates | What was changed or "No changes required" |

## Procedure

### Step 1 — Inspect changes
Run `git diff --name-status HEAD` (or equivalent) to list all touched files. Summarize the intent of the PR in one sentence.

### Step 2 — Propose a PR title
Format: `<type>(<scope>): <description>` using [Conventional Commits](https://www.conventionalcommits.org/).  
Types: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`, `perf`, `style`.

### Step 3 — Fill each template section

Load [pr-template.md](../../../.github/.requirements/pr-template.md) and populate every section:

| Section | Rules |
|---------|-------|
| **Summary** | 1–3 sentences, no bullet points |
| **Motivation** | State the problem solved, not the solution |
| **Files Deleted** | One bullet per deleted file with reason; write `- None` if no deletions |
| **Files Updated** | One bullet per changed file with a concrete description of what changed |
| **Type of Change** | Check all boxes that apply |
| **Implementation Plan** | See Step 4 |
| **Testing** | See Step 5 |
| **Documentation Plan** | Always include; always add a `README.md` row |
| **Related Issues** | `Closes #<n>` or `Related to #<n>` |
| **Checklist** | Check items only when evidence confirms they pass |
| **Additional Notes** | Optional — add screenshots, tradeoffs, or open questions |

### Step 4 — Build the implementation plan

Write ordered phases that reflect the actual change sequence. Every phase must satisfy:

- **Title**: Names the goal, not just a number (e.g. `Phase 1 — Introduce GeometryRule interface`).
- **Pre-condition**: One sentence stating what must be true before the phase starts.
- **Steps**: At least three concrete, ordered steps. Each step names (a) the exact file(s) touched, (b) the precise change (e.g. "Add method `evaluate(state: State): boolean` to `Rule.ts`"), and (c) the reason.
- **Post-condition**: One sentence describing the observable state of the codebase once the phase finishes.
- **Dependencies**: If a phase depends on a prior phase, state it explicitly.
- **Minimum two phases.** Vague steps such as "update the file" or "make the change" are not acceptable.

### Step 5 — Fill testing evidence

- List every test file added or updated.
- State test status honestly: `passing`, `failing`, or `not run — <reason>`.
- Provide one-line summaries for `npm run lint`, `npm run build`, `npm run typecheck`, and `npm run test`.
- Fill the manual validation table with at least one verification step per major behavior change.

### Step 6 — Handle edge cases

- No deleted files → replace the section content with `- None` (keep the heading).
- Tests not run → explicitly state why in the Testing section.
- Multiple change types → check all relevant Type of Change boxes.
- No documentation changes → keep the Documentation Plan section and write "No changes required."

### Step 7 — Save the output

Write the completed description to:

```
.github/.requirements/pr/<issue-number>-<slug>.md
```

Where `<slug>` is a short kebab-case summary of the PR title (e.g. `42-add-geometry-rule.md`).

### Step 8 — Final validation

Before confirming completion, verify:

- [ ] Title uses Conventional Commits format.
- [ ] Summary is 1–3 sentences.
- [ ] Every changed file appears in the Changes section.
- [ ] Testing section is truthful and specific — no claimed passes without evidence.
- [ ] Validation evidence covers lint / build / typecheck / test.
- [ ] Documentation Plan is present and includes a `README.md` row.
- [ ] Checklist items reflect actual validation state.
- [ ] File saved to `.github/.requirements/pr/`.

## Output Format

- **File path**: `.github/.requirements/pr/<issue-number>-<slug>.md`
- **Content**: Fully populated PR markdown body suitable for pasting directly into a GitHub PR description.

## Quality Bar

- Prefer precise, reviewable statements over generic text.
- Do not claim tests or checks passed unless confirmed by output evidence.
- Keep language concise and actionable for reviewers.
- Keep section order aligned with [pr-template.md](../../../.github/.requirements/pr-template.md).
