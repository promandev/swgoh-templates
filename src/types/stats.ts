/**
 * Future-facing stat models. The data does not exist yet; these types let the
 * sync layer and UI be built against a stable shape so relic stats can be
 * wired in later without refactors.
 */
export interface RelicStat {
  relicLevel: number;
  health: number;
  protection: number;
  speed: number;
  offense: number;
  defense: number;
}

export interface CharacterStats {
  characterId: string;
  relicStats: RelicStat[];
}
