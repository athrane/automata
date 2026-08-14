import { SimulationSpeed } from '../../src/gui/SimulationSpeed';

describe('SimulationSpeed', () => {
  it('starts at the slowest level', () => {
    // Arrange / Act
    const speed = SimulationSpeed.create();

    // Assert
    expect(speed.getLevel()).toBe(1);
    expect(speed.isAtMinimum()).toBe(true);
    expect(speed.isAtMaximum()).toBe(false);
    expect(speed.getFramesPerGeneration()).toBe(16);
  });

  it('does not fall below the slowest level', () => {
    // Arrange
    const speed = SimulationSpeed.create();

    // Act
    speed.slowDown();

    // Assert
    expect(speed.getLevel()).toBe(1);
    expect(speed.getFramesPerGeneration()).toBe(16);
  });

  it('reaches the fastest level after stepping up through the table', () => {
    // Arrange
    const speed = SimulationSpeed.create();

    // Act
    for (let step = 1; step < speed.getLevelCount(); step += 1) {
      speed.speedUp();
    }

    // Assert
    expect(speed.getLevel()).toBe(speed.getLevelCount());
    expect(speed.isAtMaximum()).toBe(true);
    expect(speed.isAtMinimum()).toBe(false);
  });

  it('does not exceed the fastest level', () => {
    // Arrange
    const speed = SimulationSpeed.create();
    for (let step = 1; step < speed.getLevelCount(); step += 1) {
      speed.speedUp();
    }

    // Act
    speed.speedUp();

    // Assert
    expect(speed.getLevel()).toBe(speed.getLevelCount());
    expect(speed.isAtMaximum()).toBe(true);
  });

  it('holds a generation for fewer frames at faster levels', () => {
    // Arrange
    const speed = SimulationSpeed.create();
    const framesByLevel: number[] = [];

    // Act
    framesByLevel.push(speed.getFramesPerGeneration());
    for (let step = 1; step < speed.getLevelCount(); step += 1) {
      speed.speedUp();
      framesByLevel.push(speed.getFramesPerGeneration());
    }

    // Assert
    expect(framesByLevel).toEqual([16, 8, 4, 2, 1]);
  });

  it('returns to the slowest level after stepping up and back down', () => {
    // Arrange
    const speed = SimulationSpeed.create();
    speed.speedUp();
    speed.speedUp();

    // Act
    speed.slowDown();
    speed.slowDown();

    // Assert
    expect(speed.getLevel()).toBe(1);
    expect(speed.getFramesPerGeneration()).toBe(16);
  });
});
