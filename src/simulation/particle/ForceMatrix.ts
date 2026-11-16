/** Strongest repulsion a matrix entry may hold. */
const MINIMUM_ATTRACTION = -1;

/** Strongest attraction a matrix entry may hold. */
const MAXIMUM_ATTRACTION = 1;

/** Attraction returned for a pair of types the matrix does not list. */
const UNKNOWN_PAIR_ATTRACTION = 0;

/**
 * How strongly each particle type is drawn toward, or pushed away from, each
 * other type.
 *
 * Row = the type of the particle being moved, column = the type of the
 * neighbour acting on it. The matrix need not be symmetric: type 1 may chase
 * type 2 while type 2 flees type 1.
 *
 * Use the static factory method {@link ForceMatrix.create} to construct an instance.
 */
export class ForceMatrix {
  /** Attraction keyed by acting type, then neighbour type. */
  private readonly values: ReadonlyMap<number, ReadonlyMap<number, number>>;

  private constructor(values: ReadonlyMap<number, ReadonlyMap<number, number>>) {
    this.values = values;
  }

  /**
   * Creates a {@link ForceMatrix} instance.
   *
   * @param types - The particle types, in the order of the rows and columns of `values`.
   * @param values - Square matrix of attractions in `[-1, 1]`; row = particle moved, column = neighbour.
   * @returns A validated ForceMatrix instance.
   * @throws {RangeError} If `values` is not square, does not match `types` in size, or holds a value outside `[-1, 1]`.
   * @throws {Error} If `types` holds a duplicate.
   */
  public static create(types: number[], values: number[][]): ForceMatrix {
    if (new Set(types).size !== types.length) {
      throw new Error("types must be unique");
    }
    if (values.length !== types.length) {
      throw new RangeError("values must have one row per type");
    }

    const rows = new Map<number, Map<number, number>>();
    for (let row = 0; row < types.length; row += 1) {
      if (values[row].length !== types.length) {
        throw new RangeError("values must be square");
      }

      const columns = new Map<number, number>();
      for (let column = 0; column < types.length; column += 1) {
        const value = values[row][column];
        if (!(value >= MINIMUM_ATTRACTION && value <= MAXIMUM_ATTRACTION)) {
          throw new RangeError("values must be in [-1, 1]");
        }
        columns.set(types[column], value);
      }
      rows.set(types[row], columns);
    }

    return new ForceMatrix(rows);
  }

  /**
   * Returns how strongly `neighbourType` acts on a particle of `actingType`.
   *
   * @param actingType - Type of the particle being moved.
   * @param neighbourType - Type of the neighbour acting on it.
   * @returns The attraction in `[-1, 1]`, or 0 when either type is not in the matrix.
   */
  public attraction(actingType: number, neighbourType: number): number {
    return this.values.get(actingType)?.get(neighbourType) ?? UNKNOWN_PAIR_ATTRACTION;
  }
}
