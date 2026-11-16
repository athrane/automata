import { PARTICLE_LEVEL_ONE } from "../../../src/simulation/particle/ParticleLevelOne";

/** Expected matrix: row = particle moved, column = neighbour. */
const EXPECTED_MATRIX: number[][] = [
  [0.8, 0.3, -0.4, 0.0],
  [-0.3, 0.8, 0.3, -0.4],
  [0.0, -0.3, 0.8, 0.3],
  [0.3, 0.0, -0.4, 0.8],
];

const TYPES = [1, 2, 3, 4];

describe("PARTICLE_LEVEL_ONE", () => {
  it("is a 200x200 world with an interaction radius of 10", () => {
    expect(PARTICLE_LEVEL_ONE.width).toBe(200);
    expect(PARTICLE_LEVEL_ONE.height).toBe(200);
    expect(PARTICLE_LEVEL_ONE.interactionRadius).toBe(10);
  });

  it("is identified as particle level 1", () => {
    expect(PARTICLE_LEVEL_ONE.id).toBe(1);
    expect(PARTICLE_LEVEL_ONE.name).toBe("Particle level 1");
  });

  it("starts with 300 particles of each of types 1 to 4", () => {
    expect(PARTICLE_LEVEL_ONE.populations).toEqual(
      TYPES.map((type) => ({ type, count: 300 })),
    );
  });

  it("uses the chasing force matrix", () => {
    // Arrange / Act
    const actual = TYPES.map((acting) =>
      TYPES.map((neighbour) => PARTICLE_LEVEL_ONE.forceMatrix.attraction(acting, neighbour)),
    );

    // Assert
    expect(actual).toEqual(EXPECTED_MATRIX);
  });
});
