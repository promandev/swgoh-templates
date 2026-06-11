import recommendationsData from "@/data/mod-recommendations.json";
import type { ModRecommendation, ModRecommendationMap } from "@/types";

/**
 * Reads the locally-stored mod recommendations (`src/data/mod-recommendations.json`,
 * populated by the optional `npm run sync:mods`, ideally against a self-hosted
 * swgoh-comlink). Empty until a sync runs; until then `get` returns undefined,
 * the wizard stays hidden, and members are filled in by hand. The async-friendly
 * shape mirrors {@link characterService}.
 */
export interface ModRecommendationService {
  get(characterId: string | null): ModRecommendation | undefined;
  /** Whether a character has any usable recommendation (gates the wizard button). */
  hasRecommendation(characterId: string | null): boolean;
}

const map = recommendationsData as ModRecommendationMap;

function hasContent(rec: ModRecommendation | undefined): rec is ModRecommendation {
  if (!rec) return false;
  return (
    rec.setOptions.length > 0 ||
    Object.values(rec.primaryOptions).some((options) => (options?.length ?? 0) > 0)
  );
}

export const modRecommendationService: ModRecommendationService = {
  get: (characterId) => (characterId ? map[characterId] : undefined),
  hasRecommendation: (characterId) =>
    hasContent(characterId ? map[characterId] : undefined),
};
