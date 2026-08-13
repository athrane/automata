---
name: typescript-unit-tests
description: 'Write TypeScript unit tests using Jest and ts-jest. Use when: creating test files, adding test cases, testing classes or functions, writing describe/it blocks, using expect matchers, testing edge cases, or verifying TypeScript types in tests. Covers test structure, import paths, typed fixtures, and running tests with npm test.'
argument-hint: 'class or module to test (e.g. "SumRule" or "Simulation")'
---

# TypeScript Unit Tests

## Stack
- **Test runner**: Jest (`npm test`)
- **TypeScript transformer**: ts-jest (`tsconfig.test.json`)
- **Test files**: `tests/**/*.test.ts`
- **Types**: `@types/jest`

## Procedure

### 1. Locate the source file
Find the class or function to test in `src/`. Note the public API: constructor arguments, public methods, and return types.

### 2. Create (or open) the test file
- Path: `tests/<ClassName>.test.ts`
- One test file per source file / class.

### 3. Write the test file

```ts
import { ClassName } from "../src/path/to/ClassName";
import type { SomeType } from "../src/types"; // import types with `import type`

describe("ClassName", () => {
  it("does X when given Y", () => {
    // Arrange
    const subject = new ClassName(/* args */);

    // Act
    const result = subject.someMethod();

    // Assert
    expect(result).toBe(expectedValue);
  });
});
```

#### Key conventions in this project
| Convention | Detail |
|---|---|
| Import paths | Relative from `tests/` → `../src/...` |
| Type imports | Use `import type` for interfaces/type aliases |
| Typed fixtures | Declare grid or data variables with explicit types (e.g., `const grid: Grid = [...]`) |
| Null cells | Empty grid cells are `null`, not `0` or `undefined` |
| Describe label | Match the class name exactly |
| It label | Sentence describing behaviour: *"does X when Y"* |
| AAA layout | Arrange / Act / Assert blocks separated by a blank line |

### 4. Cover these cases (minimum)

1. **Happy path** — typical valid input produces expected output.
2. **Boundary / edge cases** — empty collections, grid corners/edges, zero values.
3. **Multiple configurations** — e.g., different constructor options.
4. **Interaction** — when the class delegates to a collaborator (use a real instance unless isolation is needed).

### 5. Run the tests

```sh
npm test
```

All suites must pass before committing. If a test fails:
1. Read the Jest error: expected vs received values.
2. Check the source method's logic first.
3. Fix the source or the test (never silence failures with `.skip` or `any`).

## Common Jest Matchers

| Matcher | When to use |
|---|---|
| `toBe(value)` | Primitives, strict equality (`===`) |
| `toEqual(value)` | Deep equality for objects/arrays |
| `toBeNull()` | Explicit `null` check |
| `toHaveLength(n)` | Arrays and strings |
| `toBeTruthy()` / `toBeFalsy()` | Boolean-like checks |
| `toThrow()` | Expect an error to be thrown |

## File Structure Reference

```
tests/
  ClassName.test.ts     ← one file per class
src/
  ClassName.ts          ← source under test
tsconfig.test.json      ← includes both src/ and tests/
jest.config.js          ← ts-jest transform via tsconfig.test.json
```
