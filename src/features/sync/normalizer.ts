import type { Character } from "@/types";
import type { ProviderCharacter } from "./domain/character-provider";

/** Remove duplicate factions while preserving order. */
function dedupe(values: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const value of values) {
    const key = value.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      result.push(value);
    }
  }
  return result;
}

/**
 * Maps a source character + resolved local avatar path into the app's
 * normalized {@link Character}. Source-agnostic: the same normalizer works for
 * any provider.
 */
export function toCharacter(
  provider: ProviderCharacter,
  avatar: string,
): Character {
  return {
    id: provider.id,
    name: provider.name,
    avatar,
    alignment: provider.alignment,
    factions: dedupe(provider.factions),
  };
}
