import type { ModSetId } from "./mod-sets";
import type { ModSlotId, StatId } from "./mods";

/**
 * One ranked mod-set loadout for a character (e.g. a 4-piece Speed + 2-piece
 * Health combo), with the share of top players that run it. `usage` is a
 * fraction in `[0, 1]`.
 */
export interface SetLoadoutOption {
  /** Full set combination, most-impactful set first (e.g. `["speed", "health"]`). */
  sets: ModSetId[];
  /** Share of sampled players running this loadout (0..1). */
  usage: number;
}

/** One ranked primary stat for a variable slot, with its usage share (0..1). */
export interface PrimaryOption {
  stat: StatId;
  usage: number;
}

/**
 * The mod meta for a character, as aggregated from top-ranked players (see
 * `sync:mods`). Powers the in-app recommendation wizard: the user picks one set
 * loadout and one primary per variable slot, and every field stays editable
 * afterwards. Empty until a sync runs, so the wizard simply hides when absent.
 */
export interface ModRecommendation {
  /** Top set loadouts, most common first. */
  setOptions: SetLoadoutOption[];
  /** Top primaries per variable slot (arrow/triangle/circle/cross), most common first. */
  primaryOptions: Partial<Record<ModSlotId, PrimaryOption[]>>;
}

/** Recommendations keyed by character id (the same slug used in characters.json). */
export type ModRecommendationMap = Record<string, ModRecommendation>;
