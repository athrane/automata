---
name: linear-code-pattern
description: "Verification rules for the Herodotus linear code style. Use when reviewing any method for readability and nesting depth. Covers guard clauses at the top, early returns for edge cases, keeping the happy path at the lowest indentation level, and prohibition on deeply nested if/else blocks. Applies to all methods especially processEntity(), mutation methods, and event handlers."
---

# Skill: Linear Code Pattern

Verification rules for linear, guard-clause-based code style. Applies to every method in every changed file.

**Documentation**: [docs/architecture/linear-code-pattern.md](../../../docs/architecture/linear-code-pattern.md)

---

## When to Use This Skill

- Reviewing any method implementation for nesting depth
- Reviewing `processEntity()` and `processFilteredEntity()` methods
- Reviewing mutation methods, event handlers, and data transformations
- When any method has 2+ levels of nested `if` statements

---

## The Rule

Methods must place **guard clauses and early returns for edge cases at the top**. The happy path must remain at the **lowest indentation level**.

```typescript
// ❌ Nested if/else — obscures the happy path
processEntity(entity: Entity): void {
    if (entity.hasComponent(RealmComponent)) {
        const realm = entity.getComponent(RealmComponent);
        if (realm.getTreasury() > 0) {
            if (this.isDecayTick()) {
                this.applyDecay(realm); // 3 levels deep
            }
        }
    }
}

// ✅ Guard clauses — happy path stays flat
processEntity(entity: Entity): void {
    if (!entity.hasComponent(RealmComponent)) return;          // guard
    const realm = entity.getComponent(RealmComponent);
    if (realm.getTreasury() <= 0) return;                      // guard
    if (!this.isDecayTick()) return;                           // guard
    this.applyDecay(realm);                                    // happy path — level 1
}
```

---

## Nesting Threshold

- **0–1 levels**: Good. No action needed.
- **2 levels**: Acceptable if both are simple guards.
- **3+ levels**: Refactor required. Extract inner blocks to named private methods or apply guard clauses.

---

## Early Return vs. Else

Avoid `else` after a `return`. An `else` after a `return` is always redundant and increases nesting.

```typescript
// ❌ Redundant else
if (!isValid) {
    return;
} else {
    process(); // unnecessary nesting
}

// ✅ No else needed
if (!isValid) return;
process();
```

---

## Checklist

- [ ] Edge cases and error conditions handled at the top with guard clauses
- [ ] No `else` branches after `return` statements
- [ ] Happy path logic at indentation level 1 (inside the method, not inside an `if`)
- [ ] No block nested deeper than 2 levels (except simple loop bodies)
- [ ] Deeply nested blocks extracted to named private methods
