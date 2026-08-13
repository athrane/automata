import { SimulationSpeed } from '../../src/gui/SimulationSpeed';

describe('SimulationSpeed', () => {
  it('starts at the fastest level', () => {
    // Arrange / Act
    const speed = SimulationSpeed.create();

    // Assert
    expect(speed.getLevel()).toBe(speed.getLevelCount());
    expect(speed.isAtMaximum()).toBe(true);
    expect(speed.isAtMinimum()).toBe(false);
    expect(speed.getFramesPerGeneration()).toBe(1);
  });

  it('does not exceed the fastest level', () => {
    // Arrange
    const speed = SimulationSpeed.create();

    // Act
    speed.speedUp();

    // Assert
    expect(speed.getLevel()).toBe(speed.getLevelCount());
    expect(speed.getFramesPerGeneration()).toBe(1);
  });

  it('reaches the slowest level after stepping down through the table', () => {
    // Arrange
    const speed = SimulationSpeed.create();

    // Act
    for (let step = 1; step < speed.getLevelCount(); step += 1) {
      speed.slowDown();
    }

    // Assert
    expect(speed.getLevel()).toBe(1);
    expect(speed.isAtMinimum()).toBe(true);
    expect(speed.isAtMaximum()).toBe(false);
  });

  it('does not fall below the slowest level', () => {
    // Arrange
    const speed = SimulationSpeed.create();
    for (let step = 1; step < speed.getLevelCount(); step += 1) {
      speed.slowDown();
    }

    // Act
    speed.slowDown();

    // Assert
    expect(speed.getLevel()).toBe(1);
    expect(speed.isAtMinimum()).toBe(true);
  });

  it('holds a generation for more frames at slower levels', () => {
    // Arrange
    const speed = SimulationSpeed.create();
    const framesByLevel: number[] = [];

    // Act
    framesByLevel.push(speed.getFramesPerGeneration());
    for (let step = 1; step < speed.getLevelCount(); step += 1) {
      speed.slowDown();
      framesByLevel.push(speed.getFramesPerGeneration());
    }

    // Assert
    expect(framesByLevel).toEqual([1, 2, 4, 8, 16]);
  });

  it('returns to the fastest level after stepping down and back up', () => {
    // Arrange
    const speed = SimulationSpeed.create();
    speed.slowDown();
    speed.slowDown();

    // Act
    speed.speedUp();
    speed.speedUp();

    // Assert
    expect(speed.getLevel()).toBe(speed.getLevelCount());
    expect(speed.getFramesPerGeneration()).toBe(1);
  });
});
