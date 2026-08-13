---
name: pr-review-standards
description: "Orchestration skill for automata PR reviews. Provides the skill loading map and compliance report structure. Load this skill when generating the final compliance report for a pull request."
---

# Skill: PR Review Standards

Orchestration skill for automata pull request reviews. This skill maps which focused skills to activate at each review step.

---

## When to Use This Skill

- Reviewing a pull request for the automata project
- Generating a compliance report

---

## Skill Loading Map

| Review Step | Load Skill | Applies To |
|-------------|-----------|------------|
| Mandatory Requirements | `mandatory-requirements` | All source files |
| Code Quality | `code-quality` | All source files |
| SOLID Principles | `solid-principles` | All source files |
| Refactoring Patterns | `fowler-refactoring` | All source files |
| Test Files | `test-standards` | All test files |

---

## Compliance Report Template

```markdown
# PR Review: [PR Title]

## Summary
[Brief description of what the PR changes]

## Validation Pipeline
- [ ] `npm run lint` passes
- [ ] `npm run test` passes
- [ ] `npm run build` passes

## Mandatory Requirements
[Findings from mandatory-requirements skill]

## Code Quality
[Findings from code-quality skill]

## SOLID Principles
[Findings from solid-principles skill]

## Refactoring Opportunities
[Findings from fowler-refactoring skill]

## Test Standards
[Findings from test-standards skill]

## Verdict
**PASS** / **PASS WITH COMMENTS** / **CHANGES REQUESTED**
```

---

## Focused Skills Reference

| Skill | Domain |
|-------|--------|
| `mandatory-requirements` | Strict types, validation, module syntax, file organization |
| `code-quality` | No any, import order, magic numbers, guard clauses, JSDoc |
| `solid-principles` | SRP, OCP, LSP, ISP, DIP in automata context |
| `fowler-refactoring` | Long method, duplicate code, feature envy, naming |
| `test-standards` | Test structure, isolation, AAA layout, coverage |
