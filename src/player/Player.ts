import type { Rule } from "../simulation/rule/Rule";

/** Represents a player participating in the simulation. */
export interface Player {
  /** Unique identifier for this player. */
  id: number;

  /** The set of rules that determine when this player claims a cell. */
  rules: Rule[];
}
