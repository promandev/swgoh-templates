import type { Alignment } from "@/types";
import type {
  CharacterProvider,
  ProviderCharacter,
} from "../domain/character-provider";
import { filterFactions, slugFromUrl } from "./provider-utils";

/**
 * Default CharacterProvider, backed by the public, GitHub-hosted dataset from
 * the SWGoHBot project. Served from raw.githubusercontent.com — reachable from
 * restricted networks where swgoh.gg's Cloudflare blocks direct API calls — and
 * it already carries portrait URLs (game-assets.swgoh.gg), which the downloader
 * fetches locally.
 */
const DATA_URL =
  "https://raw.githubusercontent.com/jmiln/SWGoHBot/master/data/characters.json";

interface RawBotCharacter {
  name?: string;
  uniqueName?: string;
  url?: string;
  avatarURL?: string;
  side?: string;
  factions?: string[];
}

function mapAlignment(side: string | undefined): Alignment {
  const normalized = (side ?? "").toLowerCase();
  if (normalized === "dark") return "dark";
  if (normalized === "light") return "light";
  return "neutral";
}

export class SwgohBotDataProvider implements CharacterProvider {
  readonly name = "swgoh-bot-data (github)";
  private cache: ProviderCharacter[] | null = null;

  async getCharacters(): Promise<ProviderCharacter[]> {
    if (this.cache) return this.cache;

    const response = await fetch(DATA_URL, {
      headers: { "User-Agent": "swgoh-squad-builder/sync" },
    });
    if (!response.ok) {
      throw new Error(`dataset responded with ${response.status}`);
    }

    const raw = (await response.json()) as RawBotCharacter[];
    this.cache = raw
      .map((entry) => this.mapEntry(entry))
      .filter((entry): entry is ProviderCharacter => entry !== null);
    return this.cache;
  }

  async getCharacter(id: string): Promise<ProviderCharacter | null> {
    const all = await this.getCharacters();
    return all.find((character) => character.id === id) ?? null;
  }

  private mapEntry(raw: RawBotCharacter): ProviderCharacter | null {
    if (!raw.name) return null;
    const id = slugFromUrl(raw.url, raw.uniqueName ?? raw.name);
    if (!id) return null;

    return {
      id,
      name: raw.name,
      alignment: mapAlignment(raw.side),
      factions: filterFactions(raw.factions),
      imageUrl: raw.avatarURL ?? null,
    };
  }
}
