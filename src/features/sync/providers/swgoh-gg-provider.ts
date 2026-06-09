import type { Alignment } from "@/types";
import type {
  CharacterProvider,
  ProviderCharacter,
} from "../domain/character-provider";
import { filterFactions, slugFromUrl } from "./provider-utils";

/**
 * CharacterProvider backed by the public swgoh.gg API
 * (https://swgoh.gg/api/characters/). No auth required.
 *
 * Note: swgoh.gg sits behind Cloudflare bot protection and may answer `403`
 * from challenged networks; the swgoh-bot GitHub dataset is the default, more
 * reachable provider. All source-specific shape handling stays contained here.
 */
const API_URL = "https://swgoh.gg/api/characters/";

interface RawCharacter {
  name?: string;
  base_id?: string;
  url?: string;
  image?: string;
  alignment?: string | number;
  categories?: string[];
}

function mapAlignment(value: string | number | undefined): Alignment {
  if (typeof value === "number") {
    if (value === 2) return "dark";
    if (value === 1) return "light";
    return "neutral";
  }
  const normalized = (value ?? "").toLowerCase();
  if (normalized.includes("dark")) return "dark";
  if (normalized.includes("light")) return "light";
  return "neutral";
}

function normalizeImageUrl(url: string | undefined): string | null {
  if (!url) return null;
  if (url.startsWith("//")) return `https:${url}`;
  return url;
}

export class SwgohGgProvider implements CharacterProvider {
  readonly name = "swgoh.gg";
  private cache: ProviderCharacter[] | null = null;

  async getCharacters(): Promise<ProviderCharacter[]> {
    if (this.cache) return this.cache;

    const response = await fetch(API_URL, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        Accept: "application/json, text/plain, */*",
        "Accept-Language": "en-US,en;q=0.9",
        Referer: "https://swgoh.gg/characters/",
      },
    });
    if (!response.ok) {
      throw new Error(`swgoh.gg responded with ${response.status}`);
    }

    const raw = (await response.json()) as RawCharacter[];
    this.cache = raw
      .map((entry) => this.mapEntry(entry))
      .filter((entry): entry is ProviderCharacter => entry !== null);
    return this.cache;
  }

  async getCharacter(id: string): Promise<ProviderCharacter | null> {
    const all = await this.getCharacters();
    return all.find((character) => character.id === id) ?? null;
  }

  private mapEntry(raw: RawCharacter): ProviderCharacter | null {
    if (!raw.name) return null;
    const id = slugFromUrl(raw.url, raw.base_id ?? raw.name);
    if (!id) return null;

    return {
      id,
      name: raw.name,
      alignment: mapAlignment(raw.alignment),
      factions: filterFactions(raw.categories),
      imageUrl: normalizeImageUrl(raw.image),
    };
  }
}
