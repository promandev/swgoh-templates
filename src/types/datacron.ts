import type { Alignment } from "./character";

/**
 * Future-facing datacron models. Only the structure is defined here — the
 * feature is not implemented yet. A datacron set groups tiers; each tier grants
 * a bonus scoped by level and optionally by alignment or faction.
 */
export interface DatacronBonus {
  /** Human-readable bonus description (or future i18n key). */
  description: string;
}

export interface DatacronTier {
  level: number;
  bonus: DatacronBonus;
  /** Optional alignment scope of the bonus. */
  alignment?: Alignment;
  /** Optional faction scope of the bonus. */
  faction?: string;
}

export interface DatacronSet {
  id: string;
  name: string;
  tiers: DatacronTier[];
}

/** A concrete datacron a player owns/targets, referencing a set + level. */
export interface Datacron {
  id: string;
  setId: string;
  level: number;
  alignment?: Alignment;
  faction?: string;
}
