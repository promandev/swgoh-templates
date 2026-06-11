import type { ModRecommendationMap } from "@/types";

/**
 * Source of per-character mod recommendations (sets + primaries) for the
 * `sync:mods` script. Implementations normalize their source into our stable
 * {@link ModRecommendationMap} keyed by character slug.
 */
export interface ModRecommendationProvider {
  readonly name: string;
  getRecommendations(): Promise<ModRecommendationMap>;
}
