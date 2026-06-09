import charactersData from "@/data/characters.json";
import { CharacterIndex } from "@/features/characters/domain/character-index";
import type { Alignment, Character } from "@/types";

/**
 * Thin abstraction over the local character catalogue. It reads the normalized
 * `src/data/characters.json` produced by `npm run sync` and exposes fast lookups
 * via {@link CharacterIndex}. The async-friendly shape keeps the door open for a
 * future remote provider without touching consumers.
 */
export interface CharacterService {
  getAll(): Character[];
  getById(id: string): Character | undefined;
  search(query: string): Character[];
  getByFaction(faction: string): Character[];
  getByAlignment(alignment: Alignment): Character[];
  getFactions(): string[];
}

const index = new CharacterIndex(charactersData as Character[]);

export const characterService: CharacterService = {
  getAll: () => index.getAll(),
  getById: (id) => index.getById(id),
  search: (query) => index.search(query),
  getByFaction: (faction) => index.getByFaction(faction),
  getByAlignment: (alignment) => index.getByAlignment(alignment),
  getFactions: () => index.getFactions(),
};
