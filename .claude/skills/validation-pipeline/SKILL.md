---
name: validation-pipeline
description: "Three-stage validation pipeline for automata TypeScript code changes. Use when verifying that changes are lint-clean, test-passing, and buildable before committing. Covers exact commands (npm run lint, npm run lint:fix, npm run test, npm run build), execution order rationale, fix-and-retry loop guidance, and when to use lint:fix vs manual fixes."
---

# Skill: Validation Pipeline

Run the three-stage validation pipeline to confirm that all automata code changes are
lint-clean, test-passing, and compilable before committing.

---

## When to Use This Skill

- Before committing any code changes
- After implementing a feature or fix
- To confirm that refactoring introduced no regressions
- As the final step of any implementation workflow

---

## 1. Commands (Execute in This Order)

```powershell
# Stage 1a: ESLint check
npm run lint

# Stage 1b: Auto-fix lint violations (optional, use before manual fixes)
npm run lint:fix

# Stage 2: Jest test suite
npm run test

# Stage 3: TypeScript compile / build
npm run build
```

---

## 2. Execution Order Rationale

| Stage | Command | Rationale |
|-------|---------|-----------|
| 1 | `lint` | Catches style errors and type issues cheaply; fix before running slower tests |
| 2 | `test` | Verifies runtime correctness; also catches type errors in `tests/` files not covered by `build` |
| 3 | `build` | Confirms the project compiles to `dist/`; only run after all other checks pass |

**Important**: `tsconfig.json` excludes `tests/` from compilation. Type errors in test files
are only caught by `npm run test` (via ts-jest), not by `npm run build`.

---

## 3. Fix-and-Retry Loop

If any stage fails:

1. Fix **all** errors reported by that stage
2. Re-run **only** that stage to confirm the fix
3. Continue to the next stage
4. After all three pass individually, run the **full sequence once more** to confirm no regressions

---

## 4. Lint: Auto-Fix vs Manual Fix

### Use `npm run lint:fix` for

- Trailing whitespace
- Semicolons and quote style
- Other auto-fixable rules (ESLint marks these as "fixable" in its output)

### Fix Manually for

| Violation | Why Manual |
|-----------|------------|
| `any` type usage | Must be replaced with specific types or `unknown` — requires understanding intent |
| Unused variables | Must decide whether to remove or use the variable |
| Logic violations | Require reasoning about correctness, not mechanical substitution |

---

## 5. Common Failures and Fixes

| Stage | Common Failure | Fix |
|-------|---------------|-----|
| `lint` | `Unexpected any` / `@typescript-eslint/no-explicit-any` | Replace with specific type or `unknown` |
| `lint` | `is defined but never used` | Remove unused import/variable or prefix with `_` |
| `test` | `Cannot find module` | Check import path |
| `test` | `Expected X, received Y` | Fix logic in source or correct the test expectation |
| `build` | `Type 'X' is not assignable to type 'Y'` | Add correct type annotation or fix value |
| `build` | `Property does not exist` | Check spelling; verify import is correct |

---

## 6. Quick Reference

```powershell
# Run full pipeline in one command
npm run lint; npm run test; npm run build

# Fix lint issues automatically then re-check
npm run lint:fix; npm run lint

# Run only tests matching a pattern
npm run test -- --testPathPattern="SumRule"

# Run tests with coverage
npm run test -- --coverage
```
