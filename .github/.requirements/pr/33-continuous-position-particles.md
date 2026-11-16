## Title

`feat(simulation): add a continuous-position particle engine with type-by-type attraction and a particle level`

## Summary
Adds a particle engine beside the grid engine: particles with floating-point positions and velocities move in a wrap-around world under a type-by-type attraction/repulsion matrix. It is published as **Particle level 1**, reached from a new title-screen entry and drawn by a dedicated particle renderer. Particle types never change in this PR; only motion is introduced.

## Motivation
Everything the game simulates today lives on `Grid = Cell[][]`. A cell has a fixed location: its value can change, but nothing can travel, gather or pack. The behaviour this work is aiming for — coloured particles that cluster into tight blobs, spread out like a gas, or chase one another depending on their colours — comes from particles being pulled toward or pushed away from their neighbours, which has no equivalent on a grid.

The grid engine cannot host this by extension. `SimulationMode.nextGeneration` returns a `Grid`, `Rule.matches` and `IterationStrategy` work in integer cell coordinates, `Simulation` owns the grid and scores by counting cells, and `SimulationRenderer` builds one mesh per cell. A continuous-position model shares almost none of these mechanics, so this PR adds a sibling engine and leaves the grid engine, its modes and its screens untouched.

Motion is introduced alone, without conversion between types, because it is the part with no analogue in the current code and carries the most risk: frame rate with many particles, stable movement, and force tuning. Conversion on the grid is planned separately in #32; conversion on particles is a later PR.

## Changes

### Files Deleted
- None

### Files Updated

**Simulation — particle engine** (all new, under `src/simulation/particle/`)

- **`Particle.ts`** — Interface `Particle { x: number; y: number; vx: number; vy: number; readonly type: number }`. Position and velocity are mutable because the engine updates them in place every step; `type` is a player id and is read-only in this PR.
- **`SeededRandom.ts`** — `SeededRandom.create(seed)` with `next(): number` in `[0, 1)`, a small deterministic generator (mulberry32). Throws `RangeError` when the seed is not an integer. The project has no seeded generator today, and particle start positions must be repeatable.
- **`ForceMatrix.ts`** — `ForceMatrix.create(types: number[], values: number[][])` and `attraction(actingType, neighbourType): number`. Row = the particle being moved, column = the neighbour acting on it. Throws `RangeError` when `values` is not square, does not match `types` in size, or holds a value outside `[-1, 1]`; throws `Error` on duplicate types. An unknown type pair returns `0`.
- **`ForceLaw.ts`** — Interface `ForceLaw { magnitude(distanceRatio: number, attraction: number): number }`, where `distanceRatio` is distance divided by the interaction radius. Positive pulls together, negative pushes apart.
- **`ParticleLifeForceLaw.ts`** — `ParticleLifeForceLaw.create(repulsionRatio)` implementing `ForceLaw`: below `repulsionRatio` every pair repels (`distanceRatio / repulsionRatio - 1`); between `repulsionRatio` and `1` the force is `attraction` scaled by a triangle peaking midway; at `1` and beyond it is `0`. Throws `RangeError` when `repulsionRatio` is not in `(0, 1)`.
- **`WrapDelta.ts`** — `wrapDelta(delta, size): number` returning the shortest signed difference on a wrap-around axis, so two particles on opposite edges are treated as close. Throws `RangeError` when `size <= 0`, matching `wrapCoordinate`.
- **`SpatialHash.ts`** — `SpatialHash.create(width, height, bucketSize)`, `rebuild(particles)` and `forEachNearby(index, visit)`, which visits the indices of particles in the 3x3 block of buckets around a particle, wrapping at the edges. Throws `RangeError` when the world is narrower than three buckets on either axis, because a 3x3 block would then visit a bucket twice.
- **`ParticleSimulationOptions.ts`** — `ParticleSimulationOptions.create(width, height, interactionRadius, forceMatrix, forceLaw?, friction?, forceScale?)` with validation of every numeric argument and defaults for the last three.
- **`ParticleSimulation.ts`** — `ParticleSimulation.create(options, particles)`, `step(timeStep): void`, `getParticles(): ReadonlyArray<Particle>`, `getTypeCounts(): Map<number, number>`, and readonly `width`, `height`, `interactionRadius` and `generation` (the number of steps taken). `step` rebuilds the spatial hash, computes every particle's force from the positions of the step being read, then applies friction, velocity and position, wrapping positions at the edges. Throws `RangeError` when `timeStep <= 0`.
- **`ParticleLevel.ts`** — `ParticleLevel.create(id, name, width, height, interactionRadius, populations, forceMatrix, seed)` with `populations: ReadonlyArray<{ type: number; count: number }>`, and `createSimulation(): ParticleSimulation`, which places every particle at a uniformly random position drawn from `SeededRandom.create(seed)` with zero velocity. Throws when a dimension or count is not positive or a population's type is duplicated.
- **`ParticleLevelOne.ts`** — `PARTICLE_LEVEL_ONE`: a 200x200 world, interaction radius 10, four types (player ids 1–4) of 300 particles each, a fixed seed, and the force matrix listed in Phase 3.
- **`index.ts`** — Barrel for the folder.
- **`src/simulation/index.ts`** — Exports the particle engine's public classes, types and `PARTICLE_LEVEL_ONE`.

**State**

- **`src/state/GameState.ts`** — Adds `'particle-game'`.
- **`src/state/StateMachine.ts`** — Adds `'particle-game'` to `'title-screen'`'s transitions and the entry `'particle-game': ['title-screen']`. A new state is used rather than permitting `title-screen → game`, which an existing test relies on being invalid.

**GUI**

- **`src/gui/ParticleTimeStep.ts`** *(new file)* — `resolveParticleTimeStep(framesPerGeneration): number` returning `BASE_TIME_STEP / framesPerGeneration`. Throws `RangeError` when the argument is less than 1.
- **`src/gui/ParticleRenderer.ts`** *(new file)* — Draws a `ParticleSimulation` with Three.js: one `InstancedMesh` of a circle, an orthographic camera covering the world, instance colours set once from `GuiOptions.playerColors`, instance positions updated every frame. `create(simulation, options)`, `setFramesPerGeneration(frames)`, `start()`, `stop()`, `destroy()`. Each animation frame advances the simulation by one step of `resolveParticleTimeStep(frames)`, so slower speeds are smaller steps and motion stays smooth.
- **`src/gui/AvailableParticleLevels.ts`** *(new file)* — `AVAILABLE_PARTICLE_LEVELS: ReadonlyArray<ParticleLevel> = [PARTICLE_LEVEL_ONE]`.
- **`src/gui/GameParticipants.ts`** — Adds the exported function `resolvePlayerColor(playerId): number`, returning the palette colour or the existing default, and has `createLevelParticipants` call it. The particle screen needs a colour per type without building `Player` objects.
- **`src/gui/screens/ParticlePlayingScreen.ts`** *(new file)* — `create(container, onExit)`, `show(level: ParticleLevel)`, `hide()`. Creates the simulation from the level, a `ParticleRenderer`, and the existing `SpeedControlOverlay` wired to slow down, speed up and exit. No scoreboard: with no conversion, every type's count is constant.
- **`src/gui/screens/TitleScreen.ts`** — `create` gains a fourth parameter `onPlayParticles: () => void`, and `show` adds a second button, `Particle lab`, built with the same design class as `Play game`.
- **`src/gui/screens/index.ts`** — Exports `ParticlePlayingScreen`.
- **`src/gui/GameController.ts`** — Creates a `ParticlePlayingScreen`; adds `handlePlayParticles`, which transitions to `'particle-game'`, hides the title screen and shows the particle screen with `AVAILABLE_PARTICLE_LEVELS[0]`; adds `handleExitParticles`, which transitions back to `'title-screen'`, hides the particle screen and shows the title screen.
- **`src/gui/index.ts`** — Exports `AVAILABLE_PARTICLE_LEVELS`, `ParticleRenderer`, `resolveParticleTimeStep` and `resolvePlayerColor`.

**Tests**

- **`tests/simulation/particle/SeededRandom.test.ts`** *(new file)* — Same seed gives the same sequence; different seeds differ; every value is in `[0, 1)`; `create` validation.
- **`tests/simulation/particle/ForceMatrix.test.ts`** *(new file)* — Lookup by acting and neighbour type; asymmetric entries stay asymmetric; unknown pair returns `0`; each validation failure.
- **`tests/simulation/particle/ParticleLifeForceLaw.test.ts`** *(new file)* — Repulsion below the ratio regardless of attraction; zero at the ratio; peak midway; zero at and beyond `1`; sign follows the attraction; `create` validation.
- **`tests/simulation/particle/WrapDelta.test.ts`** *(new file)* — Short differences unchanged; a difference of more than half the size wraps to the other sign; `size <= 0` throws.
- **`tests/simulation/particle/SpatialHash.test.ts`** *(new file)* — Finds a particle in the same and an adjacent bucket; finds one across a wrapped edge; does not report a particle two buckets away; each nearby particle is visited once; `create` validation.
- **`tests/simulation/particle/ParticleSimulationOptions.test.ts`** *(new file)* — Defaults and each validation failure.
- **`tests/simulation/particle/ParticleSimulation.test.ts`** *(new file)* — Two attracting particles move closer; two repelling particles move apart; two particles closer than the repulsion distance separate even when they attract; particles beyond the radius do not affect each other; a particle leaving one edge re-enters at the opposite one; forces are computed from the positions before the step; `generation` counts steps; `step` validation.
- **`tests/simulation/particle/ParticleLevel.test.ts`** *(new file)* — `createSimulation` yields the configured count per type inside the world with zero velocity; two calls give identical positions; `create` validation.
- **`tests/simulation/particle/ParticleLevelOne.test.ts`** *(new file)* — Dimensions, populations and matrix values.
- **`tests/integration/ParticleGame.test.ts`** *(new file)* — Running `PARTICLE_LEVEL_ONE` twice for the same number of steps gives identical positions; after several hundred steps every position is inside the world, every value is finite and no speed exceeds a stated bound; same-type particles end closer together on average than they started.
- **`tests/state/StateMachine.test.ts`** — `title-screen → particle-game` and `particle-game → title-screen` succeed; `particle-game → game` throws.
- **`tests/gui/ParticleTimeStep.test.ts`** *(new file)* — One frame per generation gives the base step; sixteen gives a sixteenth; less than 1 throws.
- **`tests/gui/AvailableParticleLevels.test.ts`** *(new file)* — Ids and names.
- **`tests/gui/GameParticipants.test.ts`** — `resolvePlayerColor` returns the palette colour for a known id and the default for an unknown one.

**Documentation**

- **`README.md`** — See the Documentation Plan.

## Type of Change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [x] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [x] Documentation update
- [ ] Refactoring (no functional changes)
- [ ] Performance improvement
- [x] Test coverage improvement

## Design Decisions

Settled in a design interview before this plan was written.

| # | Decision | Outcome |
|---|----------|---------|
| 1 | Scope of this PR | Motion only; conversion on particles is a later PR |
| 2 | Where the forces are defined | A type-by-type matrix on the particle level; players choose nothing about motion in this PR |
| 3 | How a particle level is hosted | Its own playing screen, reached from the title screen; the configuration screen and grid playing screen are untouched |

Carried over from earlier work, not asked again: the particle engine is a sibling of the grid engine; a particle's type is a player id; the world wraps at its edges; start positions are deterministic.

Decided by default while writing the plan, and open to change in review: the force law is the particle-life shape with one interaction radius for every pair; a speed level changes the size of the time step, not how often a step is taken; the game runs until the player exits.

## Implementation Plan

### Phase 1 — Build the force model and the neighbour lookup

**Pre-condition**: `src/simulation/particle/` does not exist, and the project has no seeded random generator, no continuous-position type and no distance helper for a wrap-around axis.

1. Create `Particle.ts` with the `Particle` interface. Mutable `x`, `y`, `vx`, `vy` avoid allocating a new object per particle per step; `type` is read-only because nothing converts in this PR.
2. Create `ForceMatrix.ts` with a private constructor, `create(types, values)` validating shape and range, and `attraction(actingType, neighbourType)`. Storing the values in a `Map` keyed by type keeps the matrix independent of the order and numbering of player ids.
3. Create `ForceLaw.ts` (interface) and `ParticleLifeForceLaw.ts` (the one implementation). The law is behind an interface so a different shape can be added later without editing the simulation, and it works in distance ratios so it does not need to know the interaction radius.
4. Create `WrapDelta.ts` with `wrapDelta(delta, size)`. `wrapCoordinate` already wraps a position; this is its counterpart for a difference, needed so forces act across an edge.
5. Create `SpatialHash.ts`. Buckets as wide as the interaction radius mean every particle within range lies in the 3x3 block around the particle's own bucket, which replaces comparing every pair.
6. Create `SeededRandom.ts`.
7. Add the six matching test files under `tests/simulation/particle/`.

**Post-condition**: The building blocks exist and are each covered by a passing test file; nothing outside `src/simulation/particle/` has changed and nothing uses them yet.

### Phase 2 — Advance particles one step at a time

**Pre-condition**: Phase 1 is complete.

1. Create `ParticleSimulationOptions.ts` with `create(...)`, following `SimulationOptions`: a private constructor, resolved defaults for `forceLaw`, `friction` and `forceScale`, and a `RangeError` per invalid argument.
2. Create `ParticleSimulation.ts` with a private constructor and `create(options, particles)`, which builds a `SpatialHash` with `bucketSize = options.interactionRadius`.
3. Implement `step(timeStep)` in two passes. Pass one rebuilds the hash and, for each particle, sums over nearby particles within the radius: the direction from `wrapDelta` on each axis, the magnitude from `forceLaw.magnitude(distance / radius, forceMatrix.attraction(type, neighbourType))`, storing the result in two reusable arrays. Pass two multiplies each velocity by `friction ** timeStep`, adds the stored force times `forceScale * timeStep`, moves the position by velocity times `timeStep`, and wraps it with `wrapCoordinate`. Two passes keep every force based on the positions of the step being read, the same rule the grid follows by writing a new grid; friction as a power of the time step keeps behaviour consistent when the step size changes.
4. Skip a neighbour at zero distance in pass one, since it has no direction; add `generation` and increment it at the end of `step`; add `getParticles` and `getTypeCounts`.
5. Add `tests/simulation/particle/ParticleSimulationOptions.test.ts` and `ParticleSimulation.test.ts`, each test placing two or three particles by hand so the expected movement is unambiguous.

**Post-condition**: A `ParticleSimulation` built in a test moves hand-placed particles as the matrix dictates, wraps them at the edges, and is deterministic. Depends on Phase 1.

### Phase 3 — Define a particle level

**Pre-condition**: Phase 2 is complete. `Level` describes a grid level and cannot describe a particle one.

1. Create `ParticleLevel.ts` with a private constructor, `create(...)` and `createSimulation()`. Particles are placed in population order, drawing x then y from one `SeededRandom`, so the result depends only on the level's own data.
2. Create `ParticleLevelOne.ts` with `PARTICLE_LEVEL_ONE`: world 200x200, radius 10, populations of 300 for each of types 1, 2, 3 and 4, and this matrix (row = particle moved, column = neighbour):

   | | 1 | 2 | 3 | 4 |
   |---|---|---|---|---|
   | **1** | 0.8 | 0.3 | -0.4 | 0.0 |
   | **2** | -0.3 | 0.8 | 0.3 | -0.4 |
   | **3** | 0.0 | -0.3 | 0.8 | 0.3 |
   | **4** | 0.3 | 0.0 | -0.4 | 0.8 |

   Each type attracts itself, so it clusters; each is drawn to the next type and pushed away by the previous one, so clusters chase each other.
3. Add `index.ts` in the folder and export the public API from `src/simulation/index.ts`, alongside the grid exports.
4. Add `tests/simulation/particle/ParticleLevel.test.ts`, `ParticleLevelOne.test.ts` and `tests/integration/ParticleGame.test.ts`.

**Post-condition**: `PARTICLE_LEVEL_ONE.createSimulation()` returns a repeatable 1,200-particle simulation that can be stepped headlessly, and the integration test shows it stays bounded and clusters. Depends on Phase 2.

### Phase 4 — Draw the level and reach it from the title screen

**Pre-condition**: Phase 3 is complete. The state machine has no state for a particle game, and `TitleScreen` offers one action. Load the `gui-design-program` skill before changing anything under `src/gui/`.

1. Add `'particle-game'` to `src/state/GameState.ts` and its two transitions to `src/state/StateMachine.ts`; extend `tests/state/StateMachine.test.ts`.
2. Create `src/gui/ParticleTimeStep.ts` and its test. It is a pure function outside the renderer because the renderer cannot be tested in the project's node test environment.
3. Add `resolvePlayerColor` to `src/gui/GameParticipants.ts`, use it inside `createLevelParticipants`, and extend `tests/gui/GameParticipants.test.ts`.
4. Create `src/gui/ParticleRenderer.ts`, following `SimulationRenderer`'s structure (private constructor, `create`, `initThree`, `start`, `stop`, `destroy`). Use one `InstancedMesh` so 1,200 particles are one draw call, with a disc diameter equal to the repulsion distance so a packed cluster looks packed. Draw nothing extra for wrap-around in this PR.
5. Create `src/gui/AvailableParticleLevels.ts` with its test, and `src/gui/screens/ParticlePlayingScreen.ts`, reusing `SpeedControlOverlay` and `SimulationSpeed` exactly as `GamePlayingScreen` does and passing `speed.getFramesPerGeneration()` to the renderer.
6. In `src/gui/screens/TitleScreen.ts`, add the `onPlayParticles` parameter and the `Particle lab` button; in `src/gui/GameController.ts`, create the particle screen, pass the new callback to `TitleScreen.create`, and add `handlePlayParticles` and `handleExitParticles`.
7. Update `src/gui/screens/index.ts`, `src/gui/index.ts` and `README.md`.

**Post-condition**: The title screen offers `Particle lab`; choosing it shows 1,200 moving particles in four colours with working speed and exit controls, and exiting returns to the title screen. `Play game` and every grid screen behave as before. Depends on Phase 3.

## Testing

### TypeScript unit tests

New test files: `tests/simulation/particle/SeededRandom.test.ts`, `ForceMatrix.test.ts`, `ParticleLifeForceLaw.test.ts`, `WrapDelta.test.ts`, `SpatialHash.test.ts`, `ParticleSimulationOptions.test.ts`, `ParticleSimulation.test.ts`, `ParticleLevel.test.ts`, `ParticleLevelOne.test.ts` (all under `tests/simulation/particle/`), `tests/integration/ParticleGame.test.ts`, `tests/gui/ParticleTimeStep.test.ts`, `tests/gui/AvailableParticleLevels.test.ts`.

Updated test files: `tests/state/StateMachine.test.ts`, `tests/gui/GameParticipants.test.ts`.

- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] All tests passing (`npm run test`)

**Status**: not run — this description is the plan; no code has been written yet.

| Command | Result |
|---------|--------|
| `npm run lint` | not run — implementation pending |
| `npm run build` | not run — implementation pending |
| `npm run typecheck` | not run — implementation pending |
| `npm run test` | not run — implementation pending |

**Test coverage**: every new simulation class has its own test file covering success and failure paths. `ParticleRenderer`, `ParticlePlayingScreen`, `TitleScreen` and `GameController` need a browser and are covered by the manual steps below, as the existing renderer and screens are.

### Manual validation steps

| # | Check | How to verify |
|---|-------|---------------|
| 1 | Entry point | `npm run dev`; the title screen shows `Particle lab` below `Play game`. |
| 2 | Particles move | Choose `Particle lab`; four colours of discs are scattered across the canvas and start moving at once. |
| 3 | Clustering | Within a few seconds each colour gathers into clusters, and clusters of one colour follow those of another. |
| 4 | Packing | Inside a cluster, discs sit beside each other without overlapping. |
| 5 | Wrap-around | A cluster leaving one edge of the canvas re-enters at the opposite edge. |
| 6 | Speed control | Slower and faster change how quickly particles move; motion stays smooth at the slowest setting. |
| 7 | Frame rate | With the browser's performance overlay open, the particle level holds the display's refresh rate at the fastest speed. |
| 8 | Repeatable start | Exit and re-enter; the opening arrangement is the same. |
| 9 | Exit | The exit control returns to the title screen and the canvas is removed. |
| 10 | Grid game unchanged | `Play game` still leads to the configuration screen, and a Level 1 game plays and ends as before. |

## Documentation Plan

| File | Changes |
|------|---------|
| `README.md` | Add `### Particle simulation` after "Game modes", covering the particle world and wrap-around, the force matrix (row and column meaning), the force law with its repulsion and attraction ranges, the time step and how speed scales it, and a `#### Particle level 1` subsection with the world size, populations and matrix. Extend "Determinism" to state that a particle level's start positions come from its seed. Note in the Browser GUI section that the title screen has a `Particle lab` entry. |

## Related Issues
Closes #33
Related to #32

## Checklist
- [ ] Code follows project conventions (static factory methods, TypeUtils validation, etc.)
- [ ] TypeScript types are correct (`npm run typecheck` passes)
- [ ] Code lints without errors (`npm run lint` passes)
- [ ] All tests pass (`npm run test` passes)
- [ ] Build succeeds (`npm run build` passes)
- [ ] JSDoc comments added for public APIs
- [ ] Updated documentation (if applicable)
- [ ] No breaking changes (or documented in PR description)
- [ ] Commit messages follow Conventional Commits format

## Additional Notes

- **Issue numbers**: neither issue exists yet. `#33` is assumed for this work and `#32` for the grid conversion work; adjust the numbers and the filename if they are created differently.
- **Independent of #32**: this PR uses player ids 1–4 and the existing four palette colours, and touches none of the files #32 plans to change except `src/simulation/index.ts`, `src/gui/index.ts`, `src/gui/GameParticipants.ts` and `README.md`, where both add lines. Either can be implemented first.
- **Types never change**: there is no conversion in this PR, so the level shows clustering and chasing but no colour takeover. Bringing conversion to particles is a later PR, and it has to decide whether the particle engine mirrors the grid's iteration and rule-application stages or the existing interfaces are generalised.
- **The human does nothing yet**: a particle level has no player choices, no score, no end and no hi-score. It runs until the player exits. Player-chosen forces and scoring belong to the game-integration step.
- **One level, no picker**: `Particle lab` starts `AVAILABLE_PARTICLE_LEVELS[0]` directly. A level picker is needed once there is a second particle level.
- **Force law is a default, not a decision**: one interaction radius for every pair keeps the level data to a single matrix. Per-pair radii would give more varied structures and would add a second matrix to `ParticleLevel`.
- **Level values are a starting point**: the world size, population, friction, force scale and matrix are chosen to produce visible clustering at an acceptable frame rate and may need tuning during manual validation.
- **`TitleScreen.create` gains a parameter**: its only caller is `GameController`, which this PR updates.
