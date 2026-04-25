import { GeometryRule } from "../../../src/simulation/rule";
import type { Grid } from "../../../src/simulation/Grid";

describe("GeometryRule", () => {
  it("matches when all 8 neighbours exactly match the pattern", () => {
    // Arrange
    // Pattern: top-left=true, top=true, top-right=false, left=false,
    //          right=false, bottom-left=false, bottom=false, bottom-right=false
    const grid: Grid = [
      [1, 1, null],
      [null, null, null],
      [null, null, null],
    ];
    const pattern = [true, true, false, false, false, false, false, false];
    const rule = new GeometryRule(pattern);

    // Act
    const result = rule.matches(grid, 1, 1, 1);

    // Assert
    expect(result).toBe(true);
  });

  it("does not match when a required neighbour is absent", () => {
    // Arrange
    const grid: Grid = [
      [1, null, null],
      [null, null, null],
      [null, null, null],
    ];
    const pattern = [true, true, false, false, false, false, false, false];
    const rule = new GeometryRule(pattern);

    // Act
    const result = rule.matches(grid, 1, 1, 1);

    // Assert
    expect(result).toBe(false);
  });

  it("does not match when a forbidden neighbour is present", () => {
    // Arrange
    const grid: Grid = [
      [1, 1, 1],
      [null, null, null],
      [null, null, null],
    ];
    // pattern expects top-right to be false, but it is 1
    const pattern = [true, true, false, false, false, false, false, false];
    const rule = new GeometryRule(pattern);

    // Act
    const result = rule.matches(grid, 1, 1, 1);

    // Assert
    expect(result).toBe(false);
  });

  it("treats out-of-bounds neighbours as false", () => {
    // Arrange
    // Corner cell (0,0): all neighbours at negative coords are out-of-bounds (false).
    // Pattern expects all 8 neighbours to be false.
    const grid: Grid = [
      [null, null],
      [null, null],
    ];
    const pattern = [false, false, false, false, false, false, false, false];
    const rule = new GeometryRule(pattern);

    // Act
    const result = rule.matches(grid, 0, 0, 1);

    // Assert
    expect(result).toBe(true);
  });

  it("matches an all-surrounded pattern", () => {
    // Arrange
    const grid: Grid = [
      [1, 1, 1],
      [1, null, 1],
      [1, 1, 1],
    ];
    const pattern = [true, true, true, true, true, true, true, true];
    const rule = new GeometryRule(pattern);

    // Act
    const result = rule.matches(grid, 1, 1, 1);

    // Assert
    expect(result).toBe(true);
  });

  it("throws TypeError when pattern is not an array", () => {
    // @ts-expect-error intentionally passing wrong type
    expect(() => new GeometryRule("invalid")).toThrow(TypeError);
  });

  it("throws RangeError when pattern does not have exactly 8 elements", () => {
    expect(() => new GeometryRule([true, false])).toThrow(RangeError);
  });
});
