---
name: fowler-refactoring
description: "Fowler code smell detection with thresholds tailored to the automata project. Use when refactoring long methods, identifying duplicate code, reviewing parameter lists, spotting feature envy, checking for primitive obsession, reviewing switch statements on type codes, or evaluating naming conventions. Load when any method exceeds 30 lines, when duplicate logic is suspected, or when asked to review code for refactoring opportunities."
---

# Skill: Fowler Refactoring Patterns

Identify code smells using Fowler's refactoring catalog, adapted for the automata TypeScript project.

---

## When to Use This Skill

- Reviewing methods that may be too long (> 30 lines)
- Identifying duplicated logic that should be extracted
- Reviewing constructors or method signatures with many parameters
- Spotting deeply nested conditionals
- Identifying primitive types that should be wrapped in domain value objects
- Reviewing switch/if-else chains that could use polymorphism

---

## 1. Duplicate Code

**Smell**: The same code structure appears in more than one location.

**Automata context**:
- Repeated grid-iteration logic across multiple Rule implementations → extract to a shared helper
- Repeated test setup → extract to `beforeEach` or a shared test utility

**Refactoring**: Extract Method, Extract Class, or move shared logic to a utility function.

**Check**: Is the same 3+ line block copy-pasted in two or more places?

---

## 2. Long Method

**Smell**: A method exceeds ~30 lines.

**Automata context**:
- `run()` in `Simulation` with complex nested loops → extract sub-steps into private methods
- `matches()` in a Rule implementation → extract neighbor counting into a helper

**Refactoring**: Extract Method.

```typescript
// ❌ Long method
run(): Grid {
    // 40+ lines of mixed grid creation and rule evaluation
}

// ✅ Extract Method
run(): Grid {
    const nextGrid = this.createEmptyGrid();
    this.evaluateCells(nextGrid);
    this.grid = nextGrid;
    this.generation += 1;
    return this.getGrid();
}
private createEmptyGrid(): Grid { ... }
private evaluateCells(nextGrid: Grid): void { ... }
```

---

## 3. Long Parameter List

**Smell**: A method or constructor has more than 5–6 parameters.

**Automata context**:
- Constructor with many options → use an options/config interface (e.g., `SimulationOptions`)
- Rule `matches()` has 4 params — acceptable for now, but watch for growth

**Refactoring**: Introduce Parameter Object, Preserve Whole Object.

```typescript
// ❌ Too many parameters
constructor(width: number, height: number, players: Player[], seed: number, wrap: boolean, ...) { }

// ✅ Use an options interface
constructor(options: SimulationOptions = {}) { }
```

---

## 4. Deeply Nested Conditionals

**Smell**: Logic is nested 3+ levels deep.

**Refactoring**: Replace Nested Conditional with Guard Clauses.

```typescript
// ❌ 3 levels of nesting
matches(grid: Grid, x: number, y: number, playerId: number): boolean {
    for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
            if (dx !== 0 || dy !== 0) {
                if (x + dx >= 0 && y + dy >= 0) {
                    if (grid[y + dy][x + dx] === playerId) {
                        count++;
                    }
                }
            }
        }
    }
}

// ✅ Guard clauses / continue
for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue;
        const nx = x + dx;
        const ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
        if (grid[ny][nx] === playerId) count++;
    }
}
```

---

## 5. Feature Envy

**Smell**: A method in class A uses more data from class B than from class A.

**Automata context**:
- A Rule that accesses many properties of `Simulation` directly → pass only what the Rule needs (the grid, coordinates, player id)

**Check**: Does the method call more getters on an external class than on `this`?

---

## 6. Primitive Obsession

**Smell**: Using primitive types (`string`, `number`) to represent domain concepts that have their own behavior or constraints.

**Automata context**:
- `Cell` is `number | null` — acceptable for a simple grid, but if cells gain behavior, wrap in a value object
- Player ID as a raw `number` — acceptable now, but if player identity grows complex, consider a `Player` class with more structure

**Refactoring**: Replace Primitive with Object.

---

## 7. Switch on Type Codes

**Smell**: Switch statements (or long if/else if chains) that branch on a type code to select behavior.

**Automata context**:
- Different rule types should use polymorphism via the `Rule` interface rather than switch statements checking rule type

**Refactoring**: Replace Conditional with Polymorphism.

```typescript
// ❌ Switch on rule type
switch (rule.type) {
    case 'sum': evaluateSum(rule); break;
    case 'range': evaluateRange(rule); break;
}

// ✅ Polymorphism — each Rule implements matches()
rule.matches(grid, x, y, playerId);
```

---

## 8. Inappropriate Naming

**Smell**: Names that don't reveal intent, or that are misleading.

**Automata naming conventions**:
- Classes: PascalCase (`Simulation`, `SumRule`)
- Interfaces: PascalCase, descriptive noun (`Rule`, `Player`, `SimulationOptions`)
- Type aliases: PascalCase (`Cell`, `Grid`)
- Methods: camelCase, verb-first (`getGrid`, `setCell`, `matches`)
- Files: match the exported type name
- Evaluators: `*Evaluator`

**Refactoring**: Rename Method, Rename Variable, Rename Class.

---

## Checklist

For each changed source file:

- [ ] No duplicate code blocks (3+ lines copy-pasted); shared logic extracted
- [ ] Methods are ≤ 30 lines; longer methods extracted into named sub-methods
- [ ] Constructors and methods have ≤ 5–6 parameters; longer lists use a parameter object
- [ ] No nested conditionals deeper than 2 levels; guard clauses used instead
- [ ] Methods do not exhibit feature envy (use more external data than their own)
- [ ] Primitive types not used for domain concepts with constraints
- [ ] No switch/if-else chains on type codes; polymorphism used instead
- [ ] Names follow Herodotus conventions (`*Data`, `*Component`, `*System`, etc.)
