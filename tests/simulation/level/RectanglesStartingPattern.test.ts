import { RectanglesStartingPattern } from "../../../src/simulation/level/RectanglesStartingPattern";

describe("RectanglesStartingPattern", () => {
  it("returns the owner of a region for every cell inside it", () => {
    const pattern = RectanglesStartingPattern.create([
      { x: 10, y: 10, width: 5, height: 5, owner: 1 },
    ]);

    for (let y = 10; y < 15; y += 1) {
      for (let x = 10; x < 15; x += 1) {
        expect(pattern.cellAt(x, y)).toBe(1);
      }
    }
  });

  it("returns null for a cell outside every region", () => {
    const pattern = RectanglesStartingPattern.create([
      { x: 10, y: 10, width: 5, height: 5, owner: 1 },
    ]);

    expect(pattern.cellAt(0, 0)).toBeNull();
    expect(pattern.cellAt(20, 20)).toBeNull();
  });

  it("includes a region's near edge and excludes its far edge", () => {
    const pattern = RectanglesStartingPattern.create([
      { x: 10, y: 10, width: 5, height: 5, owner: 1 },
    ]);

    expect(pattern.cellAt(10, 10)).toBe(1);
    expect(pattern.cellAt(14, 14)).toBe(1);
    expect(pattern.cellAt(15, 10)).toBeNull();
    expect(pattern.cellAt(10, 15)).toBeNull();
  });

  it("leaves no gap and no overlap between two edge-to-edge regions", () => {
    const pattern = RectanglesStartingPattern.create([
      { x: 0, y: 0, width: 5, height: 5, owner: 1 },
      { x: 5, y: 0, width: 5, height: 5, owner: 2 },
    ]);

    expect(pattern.cellAt(4, 0)).toBe(1);
    expect(pattern.cellAt(5, 0)).toBe(2);
  });

  it("resolves several distinct regions to their own owners", () => {
    const pattern = RectanglesStartingPattern.create([
      { x: 0, y: 0, width: 2, height: 2, owner: 1 },
      { x: 10, y: 0, width: 2, height: 2, owner: 2 },
      { x: 0, y: 10, width: 2, height: 2, owner: 3 },
      { x: 10, y: 10, width: 2, height: 2, owner: 4 },
    ]);

    expect(pattern.cellAt(0, 0)).toBe(1);
    expect(pattern.cellAt(10, 0)).toBe(2);
    expect(pattern.cellAt(0, 10)).toBe(3);
    expect(pattern.cellAt(10, 10)).toBe(4);
  });

  it("is unaffected by later mutation of the supplied regions array", () => {
    const regions = [{ x: 0, y: 0, width: 2, height: 2, owner: 1 }];
    const pattern = RectanglesStartingPattern.create(regions);

    regions.push({ x: 5, y: 5, width: 2, height: 2, owner: 2 });

    expect(pattern.cellAt(5, 5)).toBeNull();
  });

  it("throws RangeError when regions is empty", () => {
    expect(() => RectanglesStartingPattern.create([])).toThrow(RangeError);
  });
});
