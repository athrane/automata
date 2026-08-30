import {
  DEAD_CELL_CHARACTER,
  LIVE_CELL_CHARACTER,
  generateAutomatonRows,
} from '../../../src/gui/design/ElementaryAutomaton';

/** Wolfram rule number of the Sierpinski rule used by the design programme. */
const RULE_90 = 90;

/** Wolfram rule number of the rule that kills every cell. */
const RULE_0 = 0;

describe('generateAutomatonRows', () => {
  it('returns one row per generation, each of the requested width', () => {
    // Arrange / Act
    const rows = generateAutomatonRows(9, 4, RULE_90);

    // Assert
    expect(rows).toHaveLength(4);
    for (const row of rows) {
      expect(row).toHaveLength(9);
    }
  });

  it('seeds a single live cell in the middle of the first row', () => {
    // Arrange / Act
    const rows = generateAutomatonRows(5, 1, RULE_90);

    // Assert
    expect(rows[0]).toBe('..#..');
  });

  it('evolves rule 90 into the Sierpinski triangle', () => {
    // Arrange / Act
    const rows = generateAutomatonRows(9, 3, RULE_90);

    // Assert
    expect(rows).toEqual(['....#....', '...#.#...', '..#...#..']);
  });

  it('wraps at both edges, so the row is toroidal like the game grid', () => {
    // Arrange — a live cell at index 2 of 5 reaches both edges after two generations.
    // Act
    const rows = generateAutomatonRows(5, 3, RULE_90);

    // Assert
    expect(rows).toEqual(['..#..', '.#.#.', '#...#']);
  });

  it('renders live and dead cells with the exported characters', () => {
    // Arrange / Act
    const rows = generateAutomatonRows(3, 1, RULE_90);

    // Assert
    expect(rows[0]).toBe(
      `${DEAD_CELL_CHARACTER}${LIVE_CELL_CHARACTER}${DEAD_CELL_CHARACTER}`,
    );
  });

  it('applies the supplied rule number', () => {
    // Arrange / Act — rule 0 leaves no live cell in any later generation.
    const rows = generateAutomatonRows(5, 2, RULE_0);

    // Assert
    expect(rows[1]).toBe('.....');
  });

  it('throws when the width is less than one', () => {
    // Arrange / Act / Assert
    expect(() => generateAutomatonRows(0, 1, RULE_90)).toThrow(RangeError);
  });

  it('throws when the generation count is less than one', () => {
    // Arrange / Act / Assert
    expect(() => generateAutomatonRows(5, 0, RULE_90)).toThrow(RangeError);
  });

  it('throws when the rule number is outside the range of an elementary automaton', () => {
    // Arrange / Act / Assert
    expect(() => generateAutomatonRows(5, 1, -1)).toThrow(RangeError);
    expect(() => generateAutomatonRows(5, 1, 256)).toThrow(RangeError);
    expect(() => generateAutomatonRows(5, 1, 90.5)).toThrow(RangeError);
  });
});
