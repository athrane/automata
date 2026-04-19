---
name: implementation-planning
description: "Planning workflow for requirements-driven implementation in Herodotus. Use when translating a PR requirements checklist into ordered file operations, determining file dependency ordering (enums → interfaces → classes → builder integrations → systems → tests), applying one-type-per-file organisation, planning re-exports, or sequencing builder integration phases (data before components, components before systems)."
---

# Skill: Implementation Planning

Translate a PR requirements checklist into an ordered sequence of file operations, ensuring
dependency order and project structural conventions are respected.

**References**:
- [coding.instructions.md](../../instructions/coding.instructions.md)
- [mandatory-requirements/SKILL.md](../mandatory-requirements/SKILL.md)
- [builder-pattern/SKILL.md](../builder-pattern/SKILL.md)
- [test-standards/SKILL.md](../test-standards/SKILL.md)

---

## When to Use This Skill

- Translating a `.requirements/` file into a concrete list of file operations
- Determining the correct creation order for new files
- Planning integration sequencing with SimulationBuilder or GuiBuilder phases
- Deciding file names and paths for one-type-per-file compliance
- Planning re-exports in module index files

---

## 1. File Dependency Ordering

When implementing a new feature from a requirements checklist, create files in this order:

| Order | File Type | Rationale |
|-------|-----------|-----------|
| 1 | **Enums** | No dependencies; all other types may reference them |
| 2 | **Interfaces and type aliases** | May reference enums; no class dependencies |
| 3 | **Value/domain classes** (non-ECS) | Depend on enums and interfaces |
| 4 | **Data classes** (`src/data/`) | Depend on domain types; follow `data-loader-pattern` |
| 5 | **ECS Components** | Depend on data classes and domain types; follow `ecs-architecture` |
| 6 | **ECS Systems** | Depend on Components; follow `ecs-architecture` |
| 7 | **Builder integrations** | Depend on all of the above; follow `builder-pattern` |
| 8 | **Tests** | Created last; mirror `src/` structure; follow `test-standards` |

**Rule**: Never implement a consumer before the type it consumes exists.

---

## 2. Translating Requirements to File Operations

For each item in the PR requirements "Changes" checklist:

1. **Identify the artifact type**: enum, interface, value class, ECS Component, ECS System,
   data class, builder change, test
2. **Map to a file path** following one-type-per-file rule: `src/[scope]/[TypeName].ts`
3. **Record the operation**: CREATE (new file) or MODIFY (add/change methods in existing file)
4. **Order CREATE operations** by the dependency table above
5. **Order MODIFY operations** after all CREATEs they depend on

### Example Translation

Requirements item: `Added RealmModifier interface with source tracking`

| Field | Value |
|-------|-------|
| Artifact type | Interface |
| Operation | CREATE |
| File path | `src/realm/RealmModifier.ts` |
| Order | 2 (interfaces before classes) |
| Test file | `test/realm/RealmModifier.test.ts` |

---

## 3. One-Type-Per-File Organisation

- One enum per file: `ModifierType.ts`, `ModifierSourceType.ts` (not `ModifierTypes.ts`)
- One interface per file: `RealmModifier.ts`
- One class per file: `RealmStateComponent.ts`
- **Never** combine an enum and a class in one file
- **Never** combine two enums in one file
- Test file mirrors source: `test/realm/ModifierType.test.ts` mirrors `src/realm/ModifierType.ts`

### Common Violation

```typescript
// ❌ NEVER — two types in one file
// src/realm/ModifierTypes.ts
export enum ModifierType { Flat, Percentage, Multiplier }
export enum ModifierSourceType { Permanent, Temporary }

// ✅ CORRECT — one type per file
// src/realm/ModifierType.ts
export enum ModifierType { Flat, Percentage, Multiplier }

// src/realm/ModifierSourceType.ts
export enum ModifierSourceType { Permanent, Temporary }
```

---

## 4. Re-Export Planning

After creating all files, decide which types warrant a re-export from the module's main
component file:

- Re-export types **used by consumers** of the component (not internal implementation details)
- Place re-export statements after all class members in the main component file
- Prefer explicit named re-exports over barrel files

```typescript
// src/realm/RealmStateComponent.ts — re-exports related types for consumer convenience
export { ModifierType } from './ModifierType.js';
export { ModifierSourceType } from './ModifierSourceType.js';
export { RealmModifier } from './RealmModifier.js';
```

---

## 5. Integration Sequencing with Builder Phases

When a feature touches multiple Builder phases, integrate in this order:

| Builder Phase | When to Integrate |
|---------------|------------------|
| `buildData()` | After data classes are implemented and tested |
| `buildComponents()` | After ECS Components are implemented and tested |
| `buildSystems()` | After ECS Systems are implemented and tested |
| `buildEntities()` | After all of the above; for initial entity population only |

**Rule**: Never integrate a type into a Builder phase before that type is fully implemented
and its unit tests pass.

See `builder-pattern/SKILL.md` for full build phase order and naming conventions.

---

## 6. Scope-to-Directory Mapping

| Scope keyword | `src/` directory | `test/` directory |
|---------------|-----------------|-----------------|
| `realm` | `src/realm/` | `test/realm/` |
| `ecs` | `src/ecs/` | `test/ecs/` |
| `chronicle` | `src/chronicle/` | `test/chronicle/` |
| `world` | `src/world/` | `test/world/` |
| `historicalfigure` | `src/historicalfigure/` | `test/historicalfigure/` |
| `simulation` | `src/simulation/` | `test/simulation/` |
| `data` | `src/data/` | `test/data/` |
| `gui` / `gui2` | `src/gui2/` | `test/gui2/` |
| `naming` | `src/naming/` | `test/naming/` |
| `time` | `src/time/` | `test/time/` |
| `effect` | `src/effect/` | `test/effect/` |

---

## 7. Implementation Plan Template

Use this structure to record the plan before executing:

```markdown
## Implementation Plan

### Files to Create (ordered by dependency)
1. `src/[scope]/EnumName.ts` — [description]
2. `src/[scope]/InterfaceName.ts` — [description]
3. `src/[scope]/ClassName.ts` — [description]
4. `src/data/[scope]/DataClass.ts` — [description]
5. `src/[scope]/ComponentName.ts` — [description]
6. `src/[scope]/SystemName.ts` — [description]

### Files to Modify
- `src/[builder]/SimulationBuilder.ts` — add to buildData/buildComponents/buildSystems

### Test Files to Create
- `test/[scope]/EnumName.test.ts`
- `test/[scope]/ClassName.test.ts`

### Builder Integration Sequence
- buildData(): register [DataClass]
- buildComponents(): register [ComponentName]  
- buildSystems(): register [SystemName]
```
