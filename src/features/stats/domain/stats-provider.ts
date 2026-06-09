import type { CharacterStats } from "@/types";

/**
 * Abstraction for relic stats. No data source exists yet, so the app ships with
 * a null implementation; a real provider can be swapped in later without
 * touching consumers (Open/Closed).
 */
export interface StatsProvider {
  readonly name: string;
  getStats(characterId: string): Promise<CharacterStats | null>;
}

export const nullStatsProvider: StatsProvider = {
  name: "null",
  async getStats() {
    return null;
  },
};
