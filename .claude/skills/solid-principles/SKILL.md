---
name: solid-principles
description: "All 5 SOLID principles grounded in the automata TypeScript context with concrete examples. Use when performing a design review, checking that classes have a single responsibility, verifying new behavior is added via new classes rather than modifying existing ones, checking Liskov substitution in Rule implementations, reviewing interface segregation, or verifying dependency inversion via interfaces."
---

# Skill: SOLID Principles

Apply SOLID principles to every changed source file, grounded in the automata project context.

---

## When to Use This Skill

- Performing a design review of new or modified classes
- Checking that classes have a single clear responsibility
- Verifying new behavior is added via new classes, not modifying existing ones
- Reviewing interface design
- Checking dependency on abstractions (interfaces) rather than concrete implementations

---

## S — Single Responsibility Principle

**Rule**: Each class has one clear reason to change.

**In automata context**:
- `Simulation` manages the grid and orchestrates generation steps — one responsibility
- `SumRule` evaluates one matching criterion — one responsibility
- Type definitions (`Cell`, `Grid`) hold data only

**Violation** — Class does too much:
```typescript
// ❌ Rule both matches AND renders output
class SumRule implements Rule {
    matches(...) { ... }
    renderToConsole() { ... } // separate responsibility — extract
}
```

**Check**: Can you describe the class in one sentence without using "and"?

---

## O — Open/Closed Principle

**Rule**: Classes are open for extension, closed for modification.

**In automata context**:
- Add new rules by creating new classes implementing the `Rule` interface — do not modify `Simulation.run()`
- The `Player.rules` array accepts any `Rule` implementation without changes to `Simulation`

```typescript
// ✅ New behavior via new class (no modification of existing code)
export class RangeRule implements Rule {
    matches(grid: Grid, x: number, y: number, playerId: number): boolean { ... }
}
```

**Violation**:
```typescript
// ❌ Adding a conditional inside Simulation.run() for a new rule type
if (rule instanceof SumRule) { ... }
else if (rule instanceof RangeRule) { ... }
```

---

## L — Liskov Substitution Principle

**Rule**: Implementations of an interface must be substitutable wherever the interface is expected.

**In automata context**:
- Any class implementing `Rule` must honor the `matches()` contract: return `boolean`, accept the standard parameters, not throw for valid grid inputs
- `Simulation` iterates `player.rules` polymorphically — every Rule must behave consistently

**Violation**:
```typescript
// ❌ Implementation throws instead of returning boolean
class BrokenRule implements Rule {
    matches(): boolean { throw new Error('not implemented'); }
}
```

---

## I — Interface Segregation Principle

**Rule**: No client should be forced to depend on interfaces it does not use.

**In automata context**:
- The `Rule` interface is narrow: a single `matches()` method — good
- `SimulationOptions` uses optional fields so callers supply only what they need — good
- If a future interface grows beyond 3–4 methods, split it

**Check**: Does the interface have methods that some implementations would leave unimplemented?

---

## D — Dependency Inversion Principle

**Rule**: Depend on abstractions, not concrete implementations.

**In automata context**:
- `Player.rules` is typed as `Rule[]` (the interface), not `SumRule[]` — good
- `Simulation` iterates over `Rule` without knowing the concrete type — good

**Violation**:
```typescript
// ❌ Depends on concrete class
class Player {
    rules: SumRule[]; // locked to one implementation
}

// ✅ Depends on abstraction
class Player {
    rules: Rule[]; // any Rule implementation works
}
```

---

## Checklist

For each changed class, verify:

- [ ] **SRP**: Class has one clear reason to change; no mixed responsibilities
- [ ] **OCP**: New behavior added via extension (new classes), not modification of existing classes
- [ ] **LSP**: Interface implementations honor the contract; no throwing stubs
- [ ] **ISP**: Interfaces are narrow; no methods left unimplemented
- [ ] **DIP**: Dependencies are on abstractions (`Rule` interface) not concrete implementations (`SumRule`)
