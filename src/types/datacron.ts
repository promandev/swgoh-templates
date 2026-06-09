/** Datacron base tiers that grant a rollable stat: levels 3, 6 and 9. */
export type DatacronLevel = 3 | 6 | 9;

export const DATACRON_LEVELS: readonly DatacronLevel[] = [3, 6, 9];

export interface DatacronTier {
  level: DatacronLevel;
  /** Recommended secondary stats for this tier — free text, entered by hand. */
  recommendedSecondaries: string;
}

/** A datacron documented for a single squad member. */
export interface MemberDatacron {
  /** Set name / number, typed manually or picked from the loaded set list. */
  setName: string;
  /** Id when chosen from the loaded set list; empty for manual entries. */
  setId: string;
  /** Active tiers (a subset of 3/6/9), each with its recommended secondaries. */
  tiers: DatacronTier[];
  /** Whether the datacron is leveled past 9 ("focused"). */
  focused: boolean;
  /** Target level when focused (e.g. 12, 15, 20); null otherwise. */
  focusedLevel: number | null;
  /** Free-form notes. */
  notes: string;
}

/**
 * A loadable datacron set option, served from `src/data/datacrons.json`
 * (populated by an optional DatacronProvider sync).
 */
export interface DatacronSet {
  id: string;
  name: string;
}
