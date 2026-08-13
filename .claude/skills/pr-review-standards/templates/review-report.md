# Code Review Report - PR ${prNumber}

**Generated:** [Current date and time]  
**Scope:** [Changed files only / Full codebase]  
**Changed Files:** [Count]  
**Source Files Analyzed:** [Count]  
**Test Files Analyzed:** [Count]  

---

## Executive Summary

[Brief overview of compliance status]

**Overall Compliance:** [Percentage or rating]  
**Critical Issues:** [Count]  
**High Priority Issues:** [Count]  
**Recommendations:** [Count]  

---

## Compliance Analysis by Category

### 1. Mandatory Requirements ✅/❌

| Requirement | Status | Files Affected | Notes |
|------------|--------|----------------|-------|
| Static factory methods | ✅ Pass | - | All classes implement `create()` |
| Runtime type validation | ❌ Fail | `src/example/File.ts` | Missing TypeUtils in constructor |
| ES module syntax | ✅ Pass | - | - |
| Immutability (data classes) | ⚠️ Partial | `src/data/Example.ts` | Missing `Object.freeze()` |
| One type per file | ✅ Pass | - | - |

### 2. Architectural Patterns ✅/❌

Verify all documented patterns from `docs/architecture/` directory:

| Pattern | Status | Files Affected | Notes |
|---------|--------|----------------|-------|
| ECS Architecture | ✅ Pass | - | All components/systems follow pattern |
| Builder Pattern | ✅ Pass | - | Build order respected |
| Data Loading Pattern | ⚠️ Partial | `src/data/example/` | Missing cache clearing in tests |
| Random Pattern | ❌ Fail | `src/example/System.ts` | Storing RandomComponent in field |
| Entity Reference Pattern | ✅ Pass | - | Proper null instances |
| BDI Pattern | N/A | - | No personality changes in PR |
| [Other discovered patterns] | [Status] | - | [Notes] |

### 3. Testing Standards ✅/❌

| Standard | Status | Files Affected | Notes |
|----------|--------|----------------|-------|
| Test structure mirrors src/ | ✅ Pass | - | Correct directory structure |
| Descriptive test names | ✅ Pass | - | - |
| Console mocking | ❌ Fail | `test/example/File.test.ts` | Missing mock for validation test |
| Deterministic random tests | ✅ Pass | - | Using `createTestRandomComponent()` |
| Coverage (success/failure) | ⚠️ Partial | `test/example/File.test.ts` | Missing failure case tests |

### 4. Code Quality ✅/❌

| Quality Check | Status | Files Affected | Notes |
|---------------|--------|----------------|-------|
| No Math.random() | ✅ Pass | - | - |
| No `any` types | ✅ Pass | - | - |
| Named constants for magic numbers | ⚠️ Partial | `src/example/Generator.ts` | Magic numbers found |
| Null return policy compliance | ✅ Pass | - | - |
| JSDoc documentation | ⚠️ Partial | `src/example/File.ts` | Missing method docs |
| Import organization | ✅ Pass | - | - |

### 5. SOLID Principles ✅/❌

| Principle | Status | Files Affected | Notes |
|-----------|--------|----------------|-------|
| Single Responsibility | ✅ Pass | - | Each class has one clear purpose |
| Open/Closed | ✅ Pass | - | Extensions possible without modification |
| Liskov Substitution | ✅ Pass | - | Proper inheritance hierarchy |
| Interface Segregation | N/A | - | No interface changes |
| Dependency Inversion | ✅ Pass | - | Dependencies injected properly |

### 6. Refactoring Opportunities 💡

| Pattern | Status | Files Affected | Notes |
|---------|--------|----------------|-------|
| Code duplication | ✅ Pass | - | No duplicate code detected |
| Long methods | ⚠️ Review | `src/example/LongClass.ts` | Method exceeds 30 lines |
| Long parameter lists | ✅ Pass | - | All methods have < 5 parameters |
| Large classes | ✅ Pass | - | Appropriate class sizes |
| Feature envy | ✅ Pass | - | Methods use own class data |
| Primitive obsession | ✅ Pass | - | Appropriate use of objects |
| Switch on type codes | N/A | - | No type-based switches |
| Naming clarity | ✅ Pass | - | Clear, descriptive names |

---

## Detailed Findings

### Critical Issues (Must Fix) 🔴

1. **Missing Runtime Type Validation**
   - **File:** `src/example/ExampleComponent.ts`
   - **Line:** Constructor at line 15
   - **Issue:** Constructor parameter `value` not validated with TypeUtils
   - **Required Action:** Add `TypeUtils.ensureString(value, 'ExampleComponent value must be a string.')`
   - **Reference:** [Coding Instructions - Runtime Type Validation](../../.github/instructions/coding.instructions.md)

2. **Magic Numbers Without Named Constants**
   - **File:** `src/generator/StellarClassificationGenerator.ts`
   - **Lines:** Multiple locations (15, 18, 21, etc.)
   - **Issue:** Threshold values (0.76, 0.88, 0.96) used without named constants
   - **Required Action:** Define constants like `SPECTRAL_CLASS_M_THRESHOLD = 0.76` with JSDoc
   - **Reference:** [Coding Instructions - Named Constants](../../.github/instructions/coding.instructions.md)

3. **Inappropriate Null Return**
   - **File:** `src/generator/simulation/SimulationBuilder.ts`
   - **Line:** `getGalaxyMap()` method at line 85
   - **Issue:** Returns null when called before build(), requiring defensive null checks
   - **Required Action:** Throw `Error` with message 'GalaxyMap not available. Call build() first.'
   - **Reference:** [Coding Instructions - Null Return Policy](../../.github/instructions/coding.instructions.md)

4. **RandomComponent Stored in Instance Field**
   - **File:** `src/example/ExampleSystem.ts`
   - **Line:** Field declaration at line 12
   - **Issue:** RandomComponent stored in System instance field instead of retrieved at point of use
   - **Required Action:** Remove field, retrieve via `getSingletonComponent(RandomComponent)` in `processEntity()`
   - **Reference:** [Random Pattern](../../docs/architecture/random-pattern.md)

### High Priority Issues (Should Fix) 🟡

1. **Missing Immutability Freeze**
   - **File:** `src/data/example/ExampleData.ts`
   - **Line:** Constructor missing freeze call
   - **Issue:** Data class not frozen with `Object.freeze(this)`
   - **Recommended Action:** Add `Object.freeze(this)` at end of constructor
   - **Reference:** [Data Loading Pattern](../../docs/architecture/data-loading-pattern.md)

### Recommendations (Best Practices) 💡

1. **Consider FilteredSystem Pattern**
   - **File:** `src/example/ExampleSystem.ts`
   - **Observation:** Manual entity filtering in `processEntity()` could be eliminated
   - **Recommendation:** Extend `FilteredSystem` instead of `System` with `EntityFilters.byName()`
   - **Reference:** [ECS Architecture - FilteredSystem Pattern](../../docs/architecture/ecs-architecture.md)

2. **Missing JSDoc Documentation**
   - **Files:** `src/example/ExampleComponent.ts`, `src/example/ExampleSystem.ts`
   - **Observation:** Public methods lack JSDoc comments
   - **Recommendation:** Add JSDoc to all public classes and methods
   - **Reference:** [Coding Conventions - JSDoc Comments](../../docs/development/coding-conventions.md)

---

## Emerging Patterns Analysis

### Identified Patterns (Potential Documentation Candidates)

1. **[Pattern Name]**
   - **Occurrences:** Found in [count] files
   - **Description:** [Brief description of the pattern]
   - **Benefits:** [Why this pattern is useful]
   - **Recommendation:** [Document in which file/section]
   - **Example Files:** 
     - `src/example/File1.ts`
     - `src/example/File2.ts`

2. **[Pattern Name]**
   - [Same structure as above]

### No Emerging Patterns Detected

[If no new patterns found, state this clearly]

---

## Documentation Gap Analysis

### Missing Instruction Files

1. **[Domain/Type].instructions.md**
   - **Rationale:** [Why this instruction file is needed]
   - **Scope:** Files/patterns it should cover
   - **Priority:** High/Medium/Low
   - **Suggested Location:** `.github/instructions/[name].instructions.md`
   - **Key Content:**
     - [Bullet points of what should be covered]

### Documentation Updates Needed

1. **[Documentation File Path]**
   - **Issue:** [What is outdated or missing]
   - **Recommendation:** [What should be updated]
   - **Priority:** High/Medium/Low

### No Documentation Gaps Detected

[If no gaps found, state this clearly]

---

## Validation Pipeline Status

### Pre-commit Validation
- [ ] `npm run typecheck` - TypeScript type checking
- [ ] `npm run lint` - ESLint validation  
- [ ] `npm run test` - Jest test suite
- [ ] `npm run build` - Production bundle creation

**Recommendation:** [Pass/Review/Fix issues before commit]

---

## Action Items Summary

### Required Before Merge (Critical) 🔴
1. [Action item 1]
2. [Action item 2]

### Recommended Improvements (High Priority) 🟡
1. [Action item 1]
2. [Action item 2]

### Optional Enhancements (Best Practices) 💡
1. [Action item 1]
2. [Action item 2]

### Documentation Tasks 📚
1. [Documentation action 1]
2. [Documentation action 2]

---

## Conclusion

[Overall assessment of PR quality and compliance]

**Approval Recommendation:** [Approve / Request Changes / Needs Discussion]

---

## Appendix: Checked Files

### Source Files
- `src/example/File1.ts`
- `src/example/File2.ts`

### Test Files
- `test/example/File1.test.ts`
- `test/example/File2.test.ts`

### Documentation Files
- `docs/guides/example.md`

---

**Report Generation Tool:** GitHub Copilot Code Review Agent  
**Documentation Version:** [Current date]  
**Project:** Herodotus (athrane/herodotus)
