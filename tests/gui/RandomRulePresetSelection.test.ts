import { selectRandomPresetIndices } from '../../src/gui/RandomRulePresetSelection';

/** Creates a random source returning the supplied values in order. */
function scriptedRandom(values: number[]): () => number {
  let callIndex = 0;
  return () => {
    const value = values[callIndex];
    callIndex += 1;
    return value;
  };
}

describe('selectRandomPresetIndices', () => {
  it('returns exactly the requested number of indices', () => {
    // Arrange / Act
    const result = selectRandomPresetIndices(8, 3, Math.random);

    // Assert
    expect(result).toHaveLength(3);
  });

  it('returns distinct indices within range', () => {
    // Arrange / Act
    const result = selectRandomPresetIndices(8, 3, Math.random);

    // Assert
    expect(new Set(result).size).toBe(3);
    for (const index of result) {
      expect(index).toBeGreaterThanOrEqual(0);
      expect(index).toBeLessThan(8);
    }
  });

  it('produces a deterministic result for a scripted random source', () => {
    // Arrange — swap 0<->4, then 1<->1, then 2<->3
    const random = scriptedRandom([0.5, 0.0, 0.2]);

    // Act
    const result = selectRandomPresetIndices(8, 3, random);

    // Assert
    expect(result).toEqual([4, 1, 3]);
  });

  it('returns an empty array when the count is zero or negative', () => {
    // Arrange / Act / Assert
    expect(selectRandomPresetIndices(8, 0, Math.random)).toEqual([]);
    expect(selectRandomPresetIndices(8, -1, Math.random)).toEqual([]);
  });

  it('returns an empty array when there are no presets', () => {
    // Arrange / Act / Assert
    expect(selectRandomPresetIndices(0, 3, Math.random)).toEqual([]);
  });

  it('returns every index when the count meets or exceeds the total', () => {
    // Arrange / Act
    const result = selectRandomPresetIndices(3, 5, Math.random);

    // Assert
    expect(result).toEqual([0, 1, 2]);
  });
});
