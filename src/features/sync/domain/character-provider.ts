import type { Alignment } from "@/types";

/**
 * A character as returned by an external source, before local normalization and
 * avatar download. `imageUrl` is the only remote reference and is used solely
 * during sync — it never reaches the frontend.
 */
export interface ProviderCharacter {
  id: string;
  name: string;
  alignment: Alignment;
  factions: string[];
  imageUrl: string | null;
}

/**
 * Abstraction over the external data source. Implementations can target an
 * official API, a public API, public data or controlled scraping — the sync
 * pipeline depends only on this interface, so the provider is swappable.
 */
export interface CharacterProvider {
  readonly name: string;
  getCharacters(): Promise<ProviderCharacter[]>;
  getCharacter(id: string): Promise<ProviderCharacter | null>;
}
