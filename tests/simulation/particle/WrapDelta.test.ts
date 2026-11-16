import { wrapDelta } from "../../../src/simulation/particle/WrapDelta";

describe("wrapDelta", () => {
  it("returns a short positive difference unchanged", () => {
    expect(wrapDelta(3, 10)).toBe(3);
  });

  it("returns a short negative difference unchanged", () => {
    expect(wrapDelta(-3, 10)).toBe(-3);
  });

  it("returns zero for zero", () => {
    expect(wrapDelta(0, 10)).toBe(0);
  });

  it("wraps a positive difference of more than half the size to a negative one", () => {
    expect(wrapDelta(8, 10)).toBe(-2);
  });

  it("wraps a negative difference of more than half the size to a positive one", () => {
    expect(wrapDelta(-8, 10)).toBe(2);
  });

  it("handles fractional positions across an edge", () => {
    expect(wrapDelta(0.5 - 9.5, 10)).toBeCloseTo(1);
  });

  it("throws RangeError when size is zero", () => {
    expect(() => wrapDelta(1, 0)).toThrow(RangeError);
  });

  it("throws RangeError when size is negative", () => {
    expect(() => wrapDelta(1, -10)).toThrow(RangeError);
  });
});
