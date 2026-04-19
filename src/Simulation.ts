import type { Rule } from "./rules/Rule";
import type { Cell, Grid } from "./types";

export interface Player {
  id: number;
  rules: Rule[];
}

export interface SimulationOptions {
  width?: number;
  height?: number;
  players?: Player[];
}

export class Simulation {
  readonly width: number;
  readonly height: number;
  generation: number;

  private readonly players: Player[];
  private grid: Grid;

  constructor(options: SimulationOptions = {}) {
    this.width = options.width ?? 100;
    this.height = options.height ?? 100;
    this.players = options.players ?? [];
    this.generation = 0;
    this.grid = Array.from({ length: this.height }, () =>
      Array.from({ length: this.width }, () => null as Cell),
    );
  }

  getGrid(): Grid {
    return this.grid.map((row) => [...row]);
  }

  setCell(x: number, y: number, value: Cell): void {
    if (x < 0 || y < 0 || x >= this.width || y >= this.height) {
      return;
    }

    this.grid[y][x] = value;
  }

  run(): Grid {
    const nextGrid: Grid = Array.from({ length: this.height }, () =>
      Array.from({ length: this.width }, () => null as Cell),
    );

    for (let y = 0; y < this.height; y += 1) {
      for (let x = 0; x < this.width; x += 1) {
        for (const player of this.players) {
          const isMatch = player.rules.every((rule) =>
            rule.matches(this.grid, x, y, player.id),
          );

          if (isMatch) {
            nextGrid[y][x] = player.id;
            break;
          }
        }
      }
    }

    this.grid = nextGrid;
    this.generation += 1;

    return this.getGrid();
  }
}
