import type { Rule } from "../rule/Rule";

/** Represents a player participating in the simulation. */
export interface Player {
  /** Unique identifier for this player. */
  id: number;

  /** Display name for this player. */
  name: string;

  /** The set of rules that determine when this player claims a cell. */
  rules: Rule[];
}
