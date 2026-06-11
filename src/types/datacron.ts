/** Datacron base tiers that grant a rollable stat: levels 3, 6 and 9. */
export type DatacronLevel = 3 | 6 | 9;

export const DATACRON_LEVELS: readonly DatacronLevel[] = [3, 6, 9];

export interface DatacronTier {
  level: DatacronLevel;
  /** Recommended secondary stats for this tier — free text, entered by hand. */
  recommendedSecondaries: string;
}

/**
 * A perk picked from a set's reference (an ability or a stat), tagged with the
 * datacron level it belongs to. Rendered per level in the exported template.
 */
export interface DatacronPerk {
  level: number;
  kind: "ability" | "stat";
  /** Display text: ability = "Focus — description"; stat = "Stat value". */
  text: string;
}

/** A datacron documented for a single squad member. */
export interface MemberDatacron {
  /** Set name / number, typed manually or picked from the loaded set list. */
  setName: string;
  /** Id when chosen from the loaded set list; empty for manual entries. */
  setId: string;
  /** Active tiers (a subset of 3/6/9), each with its recommended secondaries. */
  tiers: DatacronTier[];
  /** Perks chosen from the selected set's abilities / stat pool, by level. */
  perks: DatacronPerk[];
  /** Whether the datacron is leveled past 9 ("focused"). */
  focused: boolean;
  /** Target level when focused (e.g. 12, 15, 20); null otherwise. */
  focusedLevel: number | null;
  /** Free-form notes. */
  notes: string;
}

/**
 * A faction-scoped ability granted by a set at a focus level (3/6/9). `text` is
 * the localized description with its target faction already substituted in.
 */
export interface DatacronAbility {
  /** Datacron level that unlocks it (typically 3, 6 or 9). */
  level: number;
  /** Focus path label — the character/faction the ability is built around. */
  focus: string;
  text: string;
}

/** A rollable stat option available at a given level (the secondary pool). */
export interface DatacronStatOption {
  level: number;
  /** Localized stat label, e.g. "Health", "Critical Avoidance". */
  stat: string;
  /** Formatted magnitude, e.g. "30%". */
  value: string;
}

/**
 * A loadable datacron set option, served from `src/data/datacrons.json`
 * (populated by an optional DatacronProvider sync). `id`/`name` are always
 * present; the enriched fields are filled by sources that expose game data
 * (the GitHub mirror / comlink) and power the in-app reference panel.
 */
export interface DatacronSet {
  id: string;
  name: string;
  /** Epoch ms when the set rotates out of the game, when known. */
  expiresAt?: number;
  /** Focus abilities unlocked at levels 3/6/9, across the set's character paths. */
  abilities?: DatacronAbility[];
  /** Rollable stat options by level (the secondary pool). */
  statPool?: DatacronStatOption[];
}
