import { wrapCoordinate } from "../../src/simulation/WrapCoordinate";

describe("wrapCoordinate", () => {
  it("returns the value unchanged when it is already in range", () => {
    // Arrange / Act
    const result = wrapCoordinate(3, 10);

    // Assert
    expect(result).toBe(3);
  });

  it("wraps a negative coordinate to the opposite edge", () => {
    // Arrange / Act
    const result = wrapCoordinate(-1, 10);

    // Assert
    expect(result).toBe(9);
  });

  it("wraps a coordinate beyond the last index back to zero", () => {
    // Arrange / Act
    const result = wrapCoordinate(10, 10);

    // Assert
    expect(result).toBe(0);
  });

  it("wraps coordinates that overshoot by more than one grid", () => {
    // Arrange / Act / Assert
    expect(wrapCoordinate(-12, 10)).toBe(8);
    expect(wrapCoordinate(23, 10)).toBe(3);
  });

  it("throws RangeError when size is zero", () => {
    expect(() => wrapCoordinate(0, 0)).toThrow(RangeError);
  });

  it("throws RangeError when size is negative", () => {
    expect(() => wrapCoordinate(0, -5)).toThrow(RangeError);
  });
});
