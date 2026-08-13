---
name: code-quality
description: "Code quality rules for every automata TypeScript source file. Use when reviewing code quality, checking for any types, reviewing import order, checking for magic numbers, verifying null return policy, checking for linear guard-clause style, or reviewing JSDoc coverage. Load when performing any code quality review or before submitting code for review."
---

# Skill: Code Quality

Rules that apply to every source file in the automata project.

---

## When to Use This Skill

- Reviewing source files for code quality issues
- Verifying no `any` types exist
- Checking import organization
- Reviewing JSDoc coverage on public APIs
- Checking for magic numbers or deeply nested code

---

## 1. No `any` Type

**Rule**: The `any` type is forbidden. Use `unknown` if the type is genuinely unknown, then narrow with type guards.

**Enforced by**: `@typescript-eslint/no-explicit-any` (ESLint). Run `npm run lint` to check.

```typescript
// ❌ NEVER
function process(data: any): void { ... }

// ✅ Use unknown + narrowing
function process(data: unknown): void {
    if (typeof data !== 'string') throw new Error('data must be a string');
    // data is now narrowed to string
}
```

---

## 2. Import Organization

**Rule**: Imports must be organized in two groups, separated by a blank line:

1. External dependencies (npm packages)
2. Local imports (relative paths)

Type-only imports use `import type`.

```typescript
// ✅ Correct import order
import { SomeLib } from "some-lib";            // 1. External

import type { Rule } from "./rules/Rule";      // 2. Local (type import)
import type { Cell, Grid } from "./types";      // 2. Local (type import)
import { Simulation } from "./Simulation";      // 2. Local
```

---

## 3. Named Constants for Magic Numbers

**Rule**: All numeric literals (except `0`, `1`, `-1`, array indices) must be assigned to `UPPER_SNAKE_CASE` constants with a descriptive name.

```typescript
// ❌ Magic numbers
if (grid.length > 50) { ... }
const offset = 3;

// ✅ Named constants
const MAX_GRID_SIZE = 50;
const NEIGHBOR_RADIUS = 3;
```

**Exemptions**: Default values for well-known parameters (e.g., `width: 100, height: 100` in `Simulation` constructor) are acceptable inline.

---

## 4. Null Return Policy

**Rule**: For error conditions, throw an `Error` with a descriptive message instead of returning `null`. The `null` value is reserved for domain data (e.g., empty `Cell` values in a `Grid`).

```typescript
// ❌ Returns null on error
getPlayer(id: number): Player | null {
    return this.players.find(p => p.id === id) ?? null;
}

// ✅ Throws on error, or returns undefined for lookups
getPlayer(id: number): Player | undefined {
    return this.players.find(p => p.id === id);
}
```

---

## 5. Linear Code / Guard Clauses

**Rule**: Methods must use guard clauses (early returns) to handle edge cases at the top. The happy path must remain at the lowest indentation level.

```typescript
// ❌ Nested if/else — obscures happy path
setCell(x: number, y: number, value: Cell): void {
    if (x >= 0 && y >= 0 && x < this.width && y < this.height) {
        this.grid[y][x] = value;
    }
}

// ✅ Guard clauses — happy path flat and readable
setCell(x: number, y: number, value: Cell): void {
    if (x < 0 || y < 0 || x >= this.width || y >= this.height) return;
    this.grid[y][x] = value;
}
```

---

## 6. JSDoc on Public APIs

**Rule**: All public classes and public methods must have JSDoc comments. Interfaces must have inline comments on each property.

```typescript
/**
 * A rule that matches when the count of same-player neighbors
 * is one of the specified sums.
 */
export class SumRule implements Rule {
    /**
     * Returns true when the neighbor count for the given player
     * at (x, y) is included in the target sums.
     */
    matches(grid: Grid, x: number, y: number, playerId: number): boolean { ... }
}
```

---

## Checklist

Apply to every changed source file:

- [ ] No `any` types — use `unknown` if type is genuinely unknown
- [ ] Imports organized: external → local (with `import type` for type-only imports)
- [ ] Magic numbers extracted to named `UPPER_SNAKE_CASE` constants
- [ ] No `null` returns for error conditions; errors thrown instead (`null` is reserved for empty cells)
- [ ] Guard clauses used; happy path at lowest indentation level
- [ ] JSDoc on public classes, methods, and interface properties
