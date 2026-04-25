## Summary
Extend SumRule behavior so rule definitions can count neighbors with the central cell either excluded or included, depending on the rule being modeled. This also delivers the five issue #4 SUM outcomes: solitude death, overpopulation death, survival with two neighbors, survival with three neighbors, and birth for unpopulated cells with three neighbors.

## Motivation
Issue #4 requires explicit SUM rule handling for all key population transitions. Some rules are easiest to express when the central cell is excluded from the count, while others may be modeled with central-cell inclusion; supporting both keeps SumRule flexible and avoids duplicating rule implementations.

## Changes

### Files Deleted

- None

### Files Updated

- src/simulation/rule/SumRule.ts — Add configurable neighbor counting that can include or exclude the central cell, and apply it to the five specified SUM-rule outcomes.
- src/simulation/rule/index.ts — Export updates if needed for rule accessibility.
- tests/simulation/rule/SumRule.test.ts — Add/expand tests for solitude, overpopulation, survival, and birth behavior.
- tests/SumRule.test.ts — Align root-level SUM rule tests with the updated expected behavior (if still used by test runner).

## Type of Change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [x] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update
- [ ] Refactoring (no functional changes)
- [ ] Performance improvement
- [x] Test coverage improvement

## Implementation Plan

Describe the ordered execution phases for this PR:

### Phase 1 — Define SUM transition behavior

Implement configurable neighbor counting in SumRule so each rule definition can choose whether the central cell is part of the sum.

Implement neighbor-count decision logic for:
- Populated cell with 0 or 1 neighbors dies.
- Populated cell with 4 or more neighbors dies.
- Populated cell with 2 neighbors survives.
- Cell with 3 neighbors survives.
- Unpopulated cell with 3 neighbors becomes populated.

### Phase 2 — Validate and lock behavior with tests

Add and/or update unit tests to cover central-cell inclusion/exclusion modes and each rule path, including positive and negative assertions for boundary neighbor counts.

## Testing

### TypeScript unit tests

Planned/expected test updates:
- tests/simulation/rule/SumRule.test.ts
- tests/SumRule.test.ts (if applicable)

- [x] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] All tests passing (npm run test)

Test coverage: Targeted branch coverage for central-cell include/exclude counting modes and all neighbor-count cases relevant to issue #4.

### Manual validation steps

| # | Check | How to verify |
|---|-------|---------------|
| 1 | SumRule supports central-cell exclusion | Run unit tests proving neighbor count ignores current cell when configured for exclusion |
| 2 | SumRule supports central-cell inclusion | Run unit tests proving neighbor count includes current cell when configured for inclusion |
| 3 | Populated cell dies with 0 or 1 neighbors | Run SUM rule tests that assert false/alive->dead for neighbor counts 0 and 1 |
| 4 | Populated cell dies with 4+ neighbors | Run SUM rule tests that assert false/alive->dead for neighbor counts 4 and above |
| 5 | Populated cell survives with 2 neighbors | Run SUM rule tests that assert true/alive->alive for neighbor count 2 |
| 6 | Cell survives with 3 neighbors | Run SUM rule tests that assert alive cells remain alive with neighbor count 3 |
| 7 | Unpopulated cell becomes populated with 3 neighbors | Run SUM rule tests that assert dead->alive with neighbor count 3 |

## Documentation Plan

Describe the documentation changes needed:

| File | Changes |
|------|---------|
| README.md | Optional: document SumRule central-cell include/exclude configuration and summarize the five supported SUM transitions. |

## Related Issues
Closes #4

## Checklist
- [ ] Code follows project conventions (static factory methods, TypeUtils validation, etc.)
- [ ] TypeScript types are correct (npm run typecheck passes)
- [ ] Code lints without errors (npm run lint passes)
- [ ] All tests pass (npm run test passes)
- [ ] Build succeeds (npm run build passes)
- [ ] JSDoc comments added for public APIs
- [ ] Updated documentation (if applicable)
- [x] No breaking changes (or documented in PR description)
- [ ] Commit messages follow Conventional Commits format

## Additional Notes
Suggested PR title: feat(simulation): add SUM neighbor transition rules for issue #4

Current branch is clean at draft time; this PR description captures the intended implementation scope and validation plan for the upcoming code changes, including central-cell counting configurability.
