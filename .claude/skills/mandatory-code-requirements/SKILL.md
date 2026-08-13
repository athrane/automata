---
name: mandatory-requirements
description: "The non-negotiable mandatory coding requirements for every automata source file. Use when implementing any new class, reviewing code for compliance, or checking that strict TypeScript types, ES module-style exports, and file organization rules are all satisfied. Load before writing any new TypeScript class or performing a code review."
---

# Skill: Mandatory Requirements

These are the non-negotiable requirements that every source file in automata must satisfy.

---

## When to Use This Skill

- Implementing any new class, interface, or type
- Reviewing source files for compliance
- Checking file naming and organization conventions

---

## 1. Strict TypeScript Types

**Rule**: The project uses `"strict": true` in `tsconfig.json`. All code must pass strict type checking. No `any` types.

**Enforced by**: `@typescript-eslint/no-explicit-any` (ESLint) and `@typescript-eslint/strict` config.

```typescript
// ❌ Implicit any or explicit any
function process(data: any): void { ... }

// ✅ Explicit types everywhere
function process(data: unknown): void {
    if (typeof data !== 'string') throw new Error('expected string');
}
```

---

## 2. Constructor Parameter Validation

**Rule**: Constructors that accept parameters from external callers should validate inputs at system boundaries.

```typescript
// ✅ Validate at boundary
constructor(sums: number[]) {
    if (!Array.isArray(sums)) throw new TypeError('sums must be an array');
    this.sums = new Set(sums);
}
```

Internal construction (e.g., `Array.from(...)` inside `Simulation`) does not need validation.

---

## 3. Module Syntax

**Rule**: Use `import`/`export` syntax. The project uses CommonJS (`"type": "commonjs"`) but TypeScript source files use ES module syntax which compiles to `require`/`module.exports`.

```typescript
// ✅ Correct
import type { Grid } from "../types";
import { SumRule } from "../rules/SumRule";
export class Simulation { ... }
```

---

## 4. One Type Per File / PascalCase Filename

**Rule**: Each class, interface, or type alias with significant logic should be in its own file. The filename must match the exported type name.

| File | Exports |
|------|---------|
| `Simulation.ts` | `Simulation` class |
| `SumRule.ts` | `SumRule` class |
| `Rule.ts` | `Rule` interface |
| `types.ts` | Small type aliases (`Cell`, `Grid`) — grouping is fine for simple types |

---

## 5. Interface-Based Design for Rules

**Rule**: All rule implementations must implement the `Rule` interface. New rule types are added as new classes, not as conditionals in existing code.

```typescript
// ✅ New rule = new file implementing Rule
export class RangeRule implements Rule {
    matches(grid: Grid, x: number, y: number, playerId: number): boolean { ... }
}
```

---

## Checklist

When reviewing a source file, check:

- [ ] No `any` types — all types explicit
- [ ] Constructor validates parameters at system boundaries
- [ ] `import`/`export` syntax used in source files
- [ ] File contains one primary type; filename matches the type name
- [ ] New rules implement the `Rule` interface
