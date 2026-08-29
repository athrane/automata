import { NeighborhoodUtils } from "../../src/simulation/NeighborhoodUtils";

describe("NeighborhoodUtils", () => {
  describe("forEachMooreNeighbor", () => {
    it("visits exactly 8 neighbours", () => {
      // Arrange
      const visited: Array<[number, number]> = [];

      // Act
      NeighborhoodUtils.forEachMooreNeighbor(5, 5, 2, 2, (nx, ny) => {
        visited.push([nx, ny]);
      });

      // Assert
      expect(visited).toHaveLength(8);
    });

    it("visits neighbours in top-left to bottom-right order", () => {
      // Arrange
      const coordinates: Array<[number, number]> = [];

      // Act
      NeighborhoodUtils.forEachMooreNeighbor(5, 5, 2, 2, (nx, ny) => {
        coordinates.push([nx, ny]);
      });

      // Assert
      expect(coordinates).toEqual([
        [1, 1], [2, 1], [3, 1],
        [1, 2],         [3, 2],
        [1, 3], [2, 3], [3, 3],
      ]);
    });

    it("passes the offset index for each neighbour, from 0 to 7", () => {
      // Arrange
      const indexes: number[] = [];

      // Act
      NeighborhoodUtils.forEachMooreNeighbor(5, 5, 2, 2, (_nx, _ny, index) => {
        indexes.push(index);
      });

      // Assert
      expect(indexes).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
    });

    it("wraps neighbours around the left and top edges", () => {
      // Arrange
      const coordinates: Array<[number, number]> = [];

      // Act
      NeighborhoodUtils.forEachMooreNeighbor(4, 4, 0, 0, (nx, ny) => {
        coordinates.push([nx, ny]);
      });

      // Assert
      expect(coordinates).toEqual([
        [3, 3], [0, 3], [1, 3],
        [3, 0],         [1, 0],
        [3, 1], [0, 1], [1, 1],
      ]);
    });

    it("wraps neighbours around the right and bottom edges", () => {
      // Arrange
      const coordinates: Array<[number, number]> = [];

      // Act
      NeighborhoodUtils.forEachMooreNeighbor(4, 4, 3, 3, (nx, ny) => {
        coordinates.push([nx, ny]);
      });

      // Assert
      expect(coordinates).toEqual([
        [2, 2], [3, 2], [0, 2],
        [2, 3],         [0, 3],
        [2, 0], [3, 0], [0, 0],
      ]);
    });

    it("throws RangeError when width is not positive", () => {
      // Arrange
      const visit = (): void => {
        // no-op
      };

      // Act & Assert
      expect(() => NeighborhoodUtils.forEachMooreNeighbor(0, 4, 0, 0, visit)).toThrow(RangeError);
    });
  });
});
