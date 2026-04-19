---
name: test-standards
description: "Test file structure, isolation, assertion, and coverage standards for automata. Use when writing new tests, reviewing test files for compliance, checking that test paths use the tests/ directory, verifying AAA layout, confirming both success and failure paths are covered, or reviewing test naming conventions."
---

# Skill: Test Standards

Verification rules for test files (`tests/**/*.test.ts`). Apply to all changed test files.

---

## When to Use This Skill

- Writing new test files
- Reviewing test files for compliance with project standards
- Checking that tests follow the AAA pattern
- Verifying coverage of both success and failure paths

---

## 1. Test File Structure

**Rules**:
- [ ] Test files live in `tests/` at the project root
- [ ] Test filename matches the source class name with `.test.ts` suffix
  - `src/Simulation.ts` → `tests/Simulation.test.ts`
  - `src/rules/SumRule.ts` → `tests/SumRule.test.ts`
- [ ] Descriptive test names explain *what* is being tested
  - ❌ `it('works', ...)`
  - ✅ `it('starts at generation 0 with default 100x100 grid', ...)`

---

## 2. Test Isolation

**Rules**:
- [ ] Each test creates its own instances — no shared mutable state across tests
- [ ] `beforeEach` used when multiple tests need similar setup
- [ ] `afterEach` used to restore mocks if `jest.spyOn` is used

---

## 3. AAA Layout

**Rule**: Tests follow the **Arrange / Act / Assert** pattern with blank lines separating each section.

```typescript
it("supports custom rectangular grid size", () => {
    // Arrange
    const simulation = new Simulation({ width: 3, height: 2 });

    // Act
    const grid = simulation.getGrid();

    // Assert
    expect(grid).toHaveLength(2);
    expect(grid[0]).toHaveLength(3);
});
```

---

## 4. Assertion Style

**Rules**:
- [ ] One primary behavior per test (focused tests)
- [ ] Multiple assertions acceptable only when checking the same logical outcome
- [ ] Use `import type` for type-only imports:
  ```typescript
  import type { Grid } from "../src/types";
  ```
- [ ] Typed fixtures — declare data variables with explicit types:
  ```typescript
  const grid: Grid = [
      [1, 1, null],
      [null, null, null],
      [null, null, null],
  ];
  ```

---

## 5. Test Coverage

**Rules**:
- [ ] Both success (happy path) and failure (error/edge case) paths tested
- [ ] Boundary cases covered (grid edges, empty grids, zero-size, out-of-bounds)
- [ ] Multiple configurations tested (default options, custom options)
- [ ] Interactions tested (rules applied within a simulation run)

---

## 6. Imports

**Rule**: Use relative imports from `tests/` to `src/`:

```typescript
import { Simulation } from "../src/Simulation";
import { SumRule } from "../src/rules/SumRule";
import type { Grid } from "../src/types";
```

---

## Checklist

For each changed test file:

- [ ] File lives in `tests/` with `.test.ts` suffix matching the source class
- [ ] Test names are descriptive (explain what behavior is verified)
- [ ] AAA layout with blank-line separation
- [ ] One primary behavior per test
- [ ] Each test creates its own instances (no shared mutable state)
- [ ] Both success and failure/edge-case paths covered
- [ ] Type-only imports use `import type`
- [ ] Typed fixtures with explicit type annotations
