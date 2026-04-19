---
name: pr-draft-validator
description: 'Validate an existing PR draft against the automata PR template checklist and flag missing evidence. Use when reviewing PR descriptions, performing pre-review quality checks, confirming lint/build/typecheck/test proof, or identifying incomplete sections before opening a PR.'
argument-hint: 'Provide: path to PR draft markdown, issue number, and any command outputs for lint/build/typecheck/test.'
---

# PR Draft Validator

Validate an existing PR draft and produce a structured compliance report using [pr-template.md](../../.requirements/pr-template.md) as the source of truth.

## When to Use
- You already have a PR draft markdown file and want a quality gate before publishing.
- You need to confirm required evidence is present for lint/build/typecheck/test.
- You want explicit missing-item feedback mapped to checklist entries.

## Required Inputs
- PR draft file path (typically `.github/.requirements/pr/<issue-number>-<slug>.md`).
- Issue number and PR context.
- Evidence snippets or command outputs for:
- `npm run lint`
- `npm run build`
- `npm run typecheck`
- `npm run test`

If required inputs are missing, request only the missing data before evaluating.

## Validation Procedure
1. Load [pr-template.md](../../.requirements/pr-template.md).
2. Read the PR draft markdown and map all sections to template headings.
3. Validate structural completeness:
- Summary, Motivation, Changes, Type of Change, Implementation Plan, Testing, Manual validation steps, Documentation Plan, Related Issues, Checklist, Additional Notes.
4. Validate title quality:
- Enforce Conventional Commits format `<type>(<scope>): <description>`.
5. Validate evidence requirements:
- Confirm explicit status/evidence for `npm run lint`, `npm run build`, `npm run typecheck`, and `npm run test`.
- Flag any claim of passing checks without attached evidence.
6. Validate documentation requirements:
- Documentation Plan must be present.
- Documentation Plan must include a `README.md` row with concrete updates.
7. Validate issue/file conventions:
- Draft filename must follow `.github/.requirements/pr/<issue-number>-<slug>.md`.
- Related Issues section must include `Closes #<issue-number>` or a justified alternative.
8. Evaluate checklist integrity:
- Each checked box must have corresponding evidence in the draft.
- Mark any unsupported checked items as `unchecked-without-evidence`.

## Output
Return a compact validation report with these sections:
- `Status`: pass | fail
- `Critical findings`: blocking issues that must be fixed
- `Missing evidence`: checklist items lacking proof
- `Warnings`: non-blocking quality issues
- `Suggested fixes`: exact edits to make

## Severity Rules
- `Critical`: missing required section, missing required command evidence, invalid filename format, or missing Documentation Plan/README.md update row.
- `Warning`: vague wording, incomplete rationale, or weak manual validation steps.

## Completion Criteria
- All critical findings resolved.
- Required evidence exists for lint/build/typecheck/test.
- Documentation Plan includes `README.md` updates.
- Filename and related issue format comply with project conventions.
