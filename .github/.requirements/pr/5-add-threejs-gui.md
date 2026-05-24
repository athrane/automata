## PR Title
feat(gui): add Three.js browser renderer, Vite dev server, and Vitest test runner

## Summary
This PR adds a browser GUI rendering path for the cellular automata simulation using Three.js, replaces Jest and standalone esbuild with Vite (dev server, browser build) and Vitest (test runner), and wires startup so the renderer runs in browser environments while Node.js execution remains headless. It also strengthens simulation option validation, and updates documentation and tests to reflect the new toolchain.

## Motivation
The project needed a visual execution path for simulation output in browsers without breaking current Node.js workflows and tests. It also needed clearer contribution guidance for generating PR descriptions and stronger defaults and validation around simulation configuration.

## Changes

### Files Deleted

- **`jest.config.js`** — Removed; Jest configuration replaced by Vitest configured in vite.config.ts.

### Files Updated

- [.github/skills/pr-description-generator/SKILL.md](.github/skills/pr-description-generator/SKILL.md) — Expanded the skill contract with explicit required inputs, section-by-section fill rules, edge-case handling, final validation criteria, and required save location under .github/.requirements/pr.
- [eslint.config.mjs](eslint.config.mjs) — Added vite.config.ts to allowDefaultProject so ESLint can lint it; removed jest.config.js from the ignores list.
- [README.md](README.md) — Replaced the minimal README with setup, scripts, Vite dev server and production build guidance, and API usage sections for GuiOptions and SimulationRenderer.
- [index.html](index.html) — Added Vite browser entry point that loads src/main.ts as an ES module.
- [package-lock.json](package-lock.json) — Updated to reflect added vite and vitest devDependencies and removal of jest, ts-jest, @types/jest, and esbuild.
- [package.json](package.json) — Added Three.js runtime and type dependencies; added vite and vitest devDependencies; replaced Jest scripts with Vitest; added dev, preview, build:node, and test:watch scripts; removed bundle:browser and standalone esbuild.
- [tsconfig.test.json](tsconfig.test.json) — Changed types from jest to vitest/globals to match the new test runner.
- [vite.config.ts](vite.config.ts) — Added Vite configuration with Vitest test settings (globals, node environment, tests include pattern).
- [src/gui/GuiOptions.ts](src/gui/GuiOptions.ts) — Added GuiOptions class with static create factory and width/height validation plus documented renderer configuration fields.
- [src/gui/SimulationRenderer.ts](src/gui/SimulationRenderer.ts) — Added Three.js-backed SimulationRenderer with scene initialization, per-cell mesh mapping, render synchronization, and start/stop animation loop management.
- [src/gui/index.ts](src/gui/index.ts) — Added gui barrel exports for GuiOptions and SimulationRenderer.
- [src/main.ts](src/main.ts) — Wired simulation creation to conditionally start browser rendering when document exists, preserving safe execution in Node.js.
- [src/simulation/Simulation.ts](src/simulation/Simulation.ts) — Added static create factory, mutable generation tracking, and deterministic next-grid calculation with player rule matching.
- [src/simulation/SimulationOptions.ts](src/simulation/SimulationOptions.ts) — Added defaults for width and height, static create factory, and RangeError validation for non-positive dimensions.
- [src/simulation/index.ts](src/simulation/index.ts) — Updated exports so SimulationOptions is available alongside Simulation and grid types.
- [tests/Simulation.test.ts](tests/Simulation.test.ts) — Updated root-level simulation tests to cover default grid initialization, custom dimensions, generation advancement, and multi-player rule behavior.
- [tests/simulation/Simulation.test.ts](tests/simulation/Simulation.test.ts) — Updated nested simulation tests with the same scenario coverage for path-level consistency.

## Type of Change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [x] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [x] Documentation update
- [ ] Refactoring (no functional changes)
- [ ] Performance improvement
- [x] Test coverage improvement

## Implementation Plan

### Phase 1 — Introduce browser rendering module and dependencies

Pre-condition: Simulation core exists and compiles, but there is no browser renderer module or Three.js dependency.

1. Update [package.json](package.json) and [package-lock.json](package-lock.json) to add three and @types/three so rendering code can compile and run with typed APIs.
2. Add [src/gui/GuiOptions.ts](src/gui/GuiOptions.ts) with a static create(width, height, container, playerColors) factory and positive-dimension validation to centralize renderer configuration checks.
3. Add [src/gui/SimulationRenderer.ts](src/gui/SimulationRenderer.ts) implementing Three.js scene setup, orthographic camera layout, and one mesh per simulation cell to create a renderable view-model of the grid.
4. Add [src/gui/index.ts](src/gui/index.ts) exports so gui consumers can import through a single module boundary.

Post-condition: Browser GUI primitives are implemented and importable, and project dependencies support compilation of renderer code.

### Phase 2 — Wire runtime entry point and strengthen simulation options

Pre-condition: GUI module exists and can be imported.

Requires Phase 1 to be complete.

1. Update [src/main.ts](src/main.ts) to import gui types and start SimulationRenderer only when document is available, preventing Node.js runtime crashes.
2. Update [src/simulation/SimulationOptions.ts](src/simulation/SimulationOptions.ts) to provide default dimensions and RangeError guards so invalid sizes fail fast.
3. Update [src/simulation/Simulation.ts](src/simulation/Simulation.ts) to expose static create, run one-generation transitions deterministically, and track generation progression.
4. Update [src/simulation/index.ts](src/simulation/index.ts) to export SimulationOptions with other simulation APIs for consistent imports.

Post-condition: The application starts headless in Node.js and rendered in browsers, with validated and consistently exposed simulation configuration.

### Phase 3 — Document behavior and align tests and contributor workflow

Pre-condition: Runtime behavior and exports are finalized.

Requires Phase 2 to be complete.

1. Update [README.md](README.md) to document prerequisites, scripts, browser bundling flow (including the new bundle:browser npm script and HTML template), and renderer API usage to make browser startup reproducible.
2. Update [tests/Simulation.test.ts](tests/Simulation.test.ts) and [tests/simulation/Simulation.test.ts](tests/simulation/Simulation.test.ts) to verify default size behavior, custom dimensions, generation updates, and multi-player matching.
3. Update [.github/skills/pr-description-generator/SKILL.md](.github/skills/pr-description-generator/SKILL.md) to enforce complete PR drafting inputs, detailed phased implementation plans, and truth-based validation reporting.

### Phase 4 — Replace Jest and esbuild with Vite and Vitest

Pre-condition: Phases 1–3 are complete; browser GUI and simulation core are implemented and documented.

Requires Phase 3 to be complete.

1. Update [package.json](package.json) to remove jest, ts-jest, @types/jest, and esbuild devDependencies and add vite and vitest; add dev, preview, build:node, and test:watch scripts; rename build to vite build and keep build:node for tsc Node.js compilation.
2. Create [vite.config.ts](vite.config.ts) declaring Vitest globals, node environment, and the tests/**/*.test.ts include pattern so all existing test files run without changes.
3. Create [index.html](index.html) at the project root as Vite’s browser entry point, loading src/main.ts as an ES module so npm run dev launches the simulation with HMR.
4. Update [tsconfig.test.json](tsconfig.test.json) to replace the jest type with vitest/globals so TypeScript resolves Vitest globals in test files.
5. Delete jest.config.js as it is fully replaced by the test block in vite.config.ts.
6. Update [eslint.config.mjs](eslint.config.mjs) to add vite.config.ts to allowDefaultProject and remove jest.config.js from the ignores list.

Post-condition: Running npm run dev starts a Vite dev server; npm run build produces a browser bundle via Vite; npm run test runs all 42 tests via Vitest with no configuration changes to test files.

## Testing

### TypeScript unit tests

Updated test files:
- [tests/Simulation.test.ts](tests/Simulation.test.ts) — passing
- [tests/simulation/Simulation.test.ts](tests/simulation/Simulation.test.ts) — passing

- [x] Unit tests added/updated
- [ ] Integration tests added/updated
- [x] All tests passing (npm run test)

Validation evidence:
- npm run lint: passing (eslint completed with no reported errors, including vite.config.ts).
- npm run build: passing (vite build produced dist/index.html and dist/assets/ bundle, 465 kB, in 216 ms).
- npm run build:node: passing (tsc compiled src/ to dist/).
- npm run typecheck: passing (tsc --noEmit -p tsconfig.json completed with no errors).
- npm run test: passing (vitest run, 5 files, 42 tests, 355 ms).

### Manual validation steps

| # | Check | How to verify |
|---|-------|---------------|
| 1 | Browser dev server starts | Run npm run dev, open http://localhost:5173, and confirm a canvas is appended to document.body. |
| 2 | Production browser build is served | Run npm run build then npm run preview, open http://localhost:4173, and confirm the simulation renders. |
| 3 | Simulation still runs in Node.js without DOM APIs | Run npm start and confirm no document is not defined runtime error occurs. |
| 4 | Renderer syncs cell colors from grid state | Set playerColors mappings and verify rendered cell colors change with simulation transitions. |
| 5 | Renderer loop can be stopped | Call stop on the renderer instance and verify requestAnimationFrame updates cease. |

## Documentation Plan

| File | Changes |
|------|---------|
| [README.md](README.md) | Updated scripts table to document dev, build, preview, build:node, test:watch; replaced Bundling section with Vite dev server and production build instructions. |
| [.github/skills/pr-description-generator/SKILL.md](.github/skills/pr-description-generator/SKILL.md) | Expanded PR-description generation instructions for required inputs, section completeness, implementation phases, testing evidence, and output validation. |

## Related Issues
Closes #5

## Checklist
- [x] Code follows project conventions (static factory methods, TypeUtils validation, etc.)
- [x] TypeScript types are correct (npm run typecheck passes)
- [x] Code lints without errors (npm run lint passes)
- [x] All tests pass (npm run test passes)
- [x] Build succeeds (npm run build passes)
- [x] JSDoc comments added for public APIs
- [x] Updated documentation (if applicable)
- [x] No breaking changes (or documented in PR description)
- [ ] Commit messages follow Conventional Commits format

## Additional Notes
- Vite uses esbuild internally so the standalone esbuild devDependency was removed; bundle speed is unchanged.
- All 42 existing tests ran against Vitest without any test file changes; Jest’s describe/it/expect API is fully compatible with Vitest globals.
- Vitest browser mode (Playwright) can be added in a follow-up PR to enable real-WebGL tests for SimulationRenderer.
- The Vite dev server provides HMR, meaning rule or player config changes reload the browser instantly during development.
