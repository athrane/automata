import { CheckerStartingPattern } from "../../../src/simulation/level/CheckerStartingPattern";

describe("CheckerStartingPattern", () => {
  it("fills every cell of a block with the same sequence entry", () => {
    const pattern = CheckerStartingPattern.create(10, [1, 2, 3, 4, null]);

    for (let y = 0; y < 10; y += 1) {
      for (let x = 0; x < 10; x += 1) {
        expect(pattern.cellAt(x, y)).toBe(1);
      }
    }
  });

  it("advances the sequence along both axes", () => {
    const pattern = CheckerStartingPattern.create(10, [1, 2, 3, 4, null]);

    expect(pattern.cellAt(10, 0)).toBe(2);
    expect(pattern.cellAt(0, 10)).toBe(2);
  });

  it("advances the sequence diagonally by two steps", () => {
    const pattern = CheckerStartingPattern.create(10, [1, 2, 3, 4, null]);

    expect(pattern.cellAt(10, 10)).toBe(3);
  });

  it("yields an empty cell for a null sequence entry", () => {
    const pattern = CheckerStartingPattern.create(10, [1, 2, 3, 4, null]);

    expect(pattern.cellAt(40, 0)).toBeNull();
    expect(pattern.cellAt(0, 40)).toBeNull();
  });

  it("realigns with the first entry after a full cycle", () => {
    const pattern = CheckerStartingPattern.create(10, [1, 2, 3, 4, null]);

    expect(pattern.cellAt(50, 0)).toBe(1);
    expect(pattern.cellAt(0, 50)).toBe(1);
  });

  it("is unaffected by later mutation of the supplied sequence", () => {
    const sequence = [1, 2];
    const pattern = CheckerStartingPattern.create(10, sequence);

    sequence[0] = 99;

    expect(pattern.cellAt(0, 0)).toBe(1);
  });

  it("throws RangeError when blockSize is zero", () => {
    expect(() => CheckerStartingPattern.create(0, [1])).toThrow(RangeError);
  });

  it("throws RangeError when blockSize is negative", () => {
    expect(() => CheckerStartingPattern.create(-5, [1])).toThrow(RangeError);
  });

  it("throws RangeError when blockSize is not an integer", () => {
    expect(() => CheckerStartingPattern.create(2.5, [1])).toThrow(RangeError);
  });

  it("throws RangeError when the sequence is empty", () => {
    expect(() => CheckerStartingPattern.create(10, [])).toThrow(RangeError);
  });
});
