import { PARTICLE_LEVEL_ONE, wrapDelta } from "../../src/simulation";
import type { Particle } from "../../src/simulation";

/** Steps each run takes. */
const STEPS = 300;

/** Time step of the fastest speed level. */
const TIME_STEP = 1;

/** No particle may move faster than one interaction radius per unit of time. */
const MAXIMUM_SPEED = PARTICLE_LEVEL_ONE.interactionRadius;

/**
 * Average distance from each particle to the nearest particle of its own type,
 * measured across the wrapped edges.
 */
function meanNearestSameTypeDistance(particles: ReadonlyArray<Particle>): number {
  let total = 0;
  for (const particle of particles) {
    let nearest = Infinity;
    for (const other of particles) {
      if (other === particle || other.type !== particle.type) {
        continue;
      }
      const distance = Math.hypot(
        wrapDelta(other.x - particle.x, PARTICLE_LEVEL_ONE.width),
        wrapDelta(other.y - particle.y, PARTICLE_LEVEL_ONE.height),
      );
      nearest = Math.min(nearest, distance);
    }
    total += nearest;
  }

  return total / particles.length;
}

function run(): ReadonlyArray<Particle> {
  const simulation = PARTICLE_LEVEL_ONE.createSimulation();
  for (let step = 0; step < STEPS; step += 1) {
    simulation.step(TIME_STEP);
  }

  return simulation.getParticles();
}

describe("Particle level 1 game", () => {
  const finalParticles = run();

  it("gives identical positions when run twice", () => {
    expect(run()).toEqual(finalParticles);
  });

  it("keeps every position inside the world and every value finite", () => {
    for (const particle of finalParticles) {
      expect(Number.isFinite(particle.vx)).toBe(true);
      expect(Number.isFinite(particle.vy)).toBe(true);
      expect(particle.x).toBeGreaterThanOrEqual(0);
      expect(particle.x).toBeLessThan(PARTICLE_LEVEL_ONE.width);
      expect(particle.y).toBeGreaterThanOrEqual(0);
      expect(particle.y).toBeLessThan(PARTICLE_LEVEL_ONE.height);
    }
  });

  it("keeps every speed below one interaction radius per unit of time", () => {
    const fastest = Math.max(...finalParticles.map((particle) => Math.hypot(particle.vx, particle.vy)));

    expect(fastest).toBeLessThan(MAXIMUM_SPEED);
  });

  it("keeps the number of particles of each type", () => {
    const counts = new Map<number, number>();
    for (const particle of finalParticles) {
      counts.set(particle.type, (counts.get(particle.type) ?? 0) + 1);
    }

    expect(counts).toEqual(new Map([[1, 300], [2, 300], [3, 300], [4, 300]]));
  });

  it("draws same-type particles closer together than they started", () => {
    const start = meanNearestSameTypeDistance(PARTICLE_LEVEL_ONE.createSimulation().getParticles());

    expect(meanNearestSameTypeDistance(finalParticles)).toBeLessThan(start);
  });
});
