import { ForceMatrix } from "../../../src/simulation/particle/ForceMatrix";

describe("ForceMatrix", () => {
  describe("attraction", () => {
    it("looks up the value by acting type then neighbour type", () => {
      // Arrange
      const matrix = ForceMatrix.create([1, 2], [
        [0.5, 0.25],
        [-0.75, 1],
      ]);

      // Act / Assert
      expect(matrix.attraction(1, 1)).toBe(0.5);
      expect(matrix.attraction(1, 2)).toBe(0.25);
      expect(matrix.attraction(2, 1)).toBe(-0.75);
      expect(matrix.attraction(2, 2)).toBe(1);
    });

    it("keeps asymmetric entries asymmetric", () => {
      // Arrange
      const matrix = ForceMatrix.create([3, 7], [
        [0, 0.6],
        [-0.6, 0],
      ]);

      // Act
      const chaser = matrix.attraction(3, 7);
      const fleer = matrix.attraction(7, 3);

      // Assert
      expect(chaser).toBe(0.6);
      expect(fleer).toBe(-0.6);
    });

    it("returns 0 for a pair the matrix does not list", () => {
      // Arrange
      const matrix = ForceMatrix.create([1], [[1]]);

      // Act / Assert
      expect(matrix.attraction(1, 9)).toBe(0);
      expect(matrix.attraction(9, 1)).toBe(0);
    });

    it("accepts the bounds -1 and 1", () => {
      // Arrange
      const matrix = ForceMatrix.create([1, 2], [
        [-1, 1],
        [1, -1],
      ]);

      // Act / Assert
      expect(matrix.attraction(1, 1)).toBe(-1);
      expect(matrix.attraction(1, 2)).toBe(1);
    });
  });

  describe("create", () => {
    it("throws RangeError when values has fewer rows than types", () => {
      expect(() => ForceMatrix.create([1, 2], [[0, 0]])).toThrow(RangeError);
    });

    it("throws RangeError when a row is not as long as types", () => {
      expect(() => ForceMatrix.create([1, 2], [[0, 0], [0]])).toThrow(RangeError);
    });

    it("throws RangeError when a value is above 1", () => {
      expect(() => ForceMatrix.create([1], [[1.5]])).toThrow(RangeError);
    });

    it("throws RangeError when a value is below -1", () => {
      expect(() => ForceMatrix.create([1], [[-1.5]])).toThrow(RangeError);
    });

    it("throws RangeError when a value is NaN", () => {
      expect(() => ForceMatrix.create([1], [[Number.NaN]])).toThrow(RangeError);
    });

    it("throws Error when a type is duplicated", () => {
      expect(() => ForceMatrix.create([1, 1], [[0, 0], [0, 0]])).toThrow("types must be unique");
    });
  });
});
