import type { Alignment, Character } from "@/types";

/** Lowercase + strip diacritics for accent-insensitive search ("Padmé"). */
function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

/**
 * In-memory index over the character catalogue, precomputed once for fast
 * lookups by id, faction, alignment and free-text search. The frontend consumes
 * only this local index — never an external source at request time.
 */
export class CharacterIndex {
  private readonly all: Character[];
  private readonly byId: Map<string, Character>;
  private readonly byFaction: Map<string, Character[]>;
  private readonly byAlignment: Map<Alignment, Character[]>;
  private readonly searchText: Map<string, string>;

  constructor(characters: readonly Character[]) {
    this.all = [...characters].sort((a, b) => a.name.localeCompare(b.name));
    this.byId = new Map();
    this.byFaction = new Map();
    this.byAlignment = new Map();
    this.searchText = new Map();

    for (const character of this.all) {
      this.byId.set(character.id, character);

      const alignmentList = this.byAlignment.get(character.alignment) ?? [];
      alignmentList.push(character);
      this.byAlignment.set(character.alignment, alignmentList);

      for (const faction of character.factions) {
        const key = normalize(faction);
        const list = this.byFaction.get(key) ?? [];
        list.push(character);
        this.byFaction.set(key, list);
      }

      this.searchText.set(
        character.id,
        normalize(`${character.name} ${character.factions.join(" ")}`),
      );
    }
  }

  getAll(): Character[] {
    return this.all;
  }

  getById(id: string): Character | undefined {
    return this.byId.get(id);
  }

  getByAlignment(alignment: Alignment): Character[] {
    return this.byAlignment.get(alignment) ?? [];
  }

  getByFaction(faction: string): Character[] {
    return this.byFaction.get(normalize(faction)) ?? [];
  }

  /** All distinct faction display names, alphabetically sorted. */
  getFactions(): string[] {
    const seen = new Set<string>();
    const names: string[] = [];
    for (const character of this.all) {
      for (const faction of character.factions) {
        const key = normalize(faction);
        if (!seen.has(key)) {
          seen.add(key);
          names.push(faction);
        }
      }
    }
    return names.sort((a, b) => a.localeCompare(b));
  }

  search(query: string): Character[] {
    const normalized = normalize(query.trim());
    if (!normalized) return this.all;
    return this.all.filter((character) =>
      this.searchText.get(character.id)?.includes(normalized),
    );
  }
}
