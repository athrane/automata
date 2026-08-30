/** Character an alive cell is drawn with. */
export const LIVE_CELL_CHARACTER = '#';

/** Character a dead cell is drawn with. */
export const DEAD_CELL_CHARACTER = '.';

/** Number of cells in the neighbourhood of an elementary automaton. */
const NEIGHBORHOOD_SIZE = 3;

/** Number of rules an elementary automaton can express: one per neighbourhood outcome. */
const RULE_COUNT = 2 ** 2 ** NEIGHBORHOOD_SIZE;

/**
 * Evolves a one-dimensional elementary cellular automaton and renders each
 * generation as a row of ASCII characters.
 *
 * The automaton starts from a single live cell in the middle of the row and
 * wraps at both edges, matching the toroidal grid the game itself simulates.
 * The rows it returns are the ornament of the design programme: the decoration
 * of the interface is produced by the same kind of process the game is about.
 *
 * @param columns - Width of a row in cells. Must be at least 1.
 * @param generations - Number of rows to produce, the seed row included. Must be at least 1.
 * @param ruleNumber - Wolfram rule number in the range 0–255.
 * @returns One string per generation, oldest first, each `columns` characters wide.
 * @throws {RangeError} If columns or generations is less than 1, or the rule number is out of range.
 */
export function generateAutomatonRows(
  columns: number,
  generations: number,
  ruleNumber: number,
): string[] {
  if (columns < 1) {
    throw new RangeError('columns must be at least 1');
  }
  if (generations < 1) {
    throw new RangeError('generations must be at least 1');
  }
  if (ruleNumber < 0 || ruleNumber >= RULE_COUNT || !Number.isInteger(ruleNumber)) {
    throw new RangeError('ruleNumber must be an integer in the range 0-255');
  }

  let cells = new Array<boolean>(columns).fill(false);
  cells[Math.floor(columns / 2)] = true;

  const rows = [renderRow(cells)];
  for (let generation = 1; generation < generations; generation += 1) {
    cells = stepRow(cells, ruleNumber);
    rows.push(renderRow(cells));
  }

  return rows;
}

/**
 * Advances one row of cells by a single generation.
 *
 * @param cells - The current generation.
 * @param ruleNumber - Wolfram rule number in the range 0–255.
 * @returns The next generation, of the same width.
 */
function stepRow(cells: ReadonlyArray<boolean>, ruleNumber: number): boolean[] {
  const columns = cells.length;

  return cells.map((_cell, index) => {
    const left = cells[(index - 1 + columns) % columns];
    const center = cells[index];
    const right = cells[(index + 1) % columns];
    const pattern = (Number(left) << 2) | (Number(center) << 1) | Number(right);

    return ((ruleNumber >> pattern) & 1) === 1;
  });
}

/**
 * Renders one generation as ASCII characters.
 *
 * @param cells - The generation to render.
 * @returns A string of {@link LIVE_CELL_CHARACTER} and {@link DEAD_CELL_CHARACTER}.
 */
function renderRow(cells: ReadonlyArray<boolean>): string {
  return cells.map((cell) => (cell ? LIVE_CELL_CHARACTER : DEAD_CELL_CHARACTER)).join('');
}
