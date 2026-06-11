import { buildHmacHeaders } from "./comlink-hmac";
import type { Alignment } from "@/types";
import type {
  CharacterProvider,
  ProviderCharacter,
} from "../domain/character-provider";
import { filterFactions, slugify } from "./provider-utils";

/**
 * Experimental provider for a **self-hosted** swgoh-comlink instance
 * (https://github.com/swgoh-utils/swgoh-comlink). Comlink proxies the official
 * Capital Games game API and returns raw game data, so this provider also pulls
 * the localization bundle to resolve display names and category labels.
 *
 * Configure the base URL via the `COMLINK_URL` environment variable, e.g.
 * `COMLINK_URL=http://localhost:3200 npm run sync -- --provider=comlink`.
 *
 * Not exercised against a live instance here (no server available); it is a
 * correct-shaped starting point. The default provider remains the GitHub
 * dataset, which is reachable and ships portrait URLs.
 */
const ASSET_BASE = "https://game-assets.swgoh.gg/textures";

interface ComlinkMetadata {
  latestGamedataVersion: string;
  latestLocalizationBundleVersion: string;
}

interface ComlinkUnit {
  baseId: string;
  nameKey: string;
  combatType: number; // 1 = character, 2 = ship
  forceAlignment: number; // 1 = neutral, 2 = light, 3 = dark
  categoryId?: string[];
  thumbnailName?: string;
}

function mapAlignment(forceAlignment: number): Alignment {
  if (forceAlignment === 2) return "light";
  if (forceAlignment === 3) return "dark";
  return "neutral";
}

/** Comlink may return localization as a parsed map or raw "key|value" text. */
function parseLocalization(raw: unknown): Record<string, string> {
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    return raw as Record<string, string>;
  }
  const map: Record<string, string> = {};
  if (typeof raw === "string") {
    for (const line of raw.split(/\r?\n/)) {
      const separator = line.indexOf("|");
      if (separator > 0) {
        map[line.slice(0, separator)] = line.slice(separator + 1);
      }
    }
  }
  return map;
}

export class ComlinkProvider implements CharacterProvider {
  readonly name = "swgoh-comlink";

  constructor(
    private readonly baseUrl: string,
    private readonly accessKey?: string,
    private readonly secretKey?: string,
  ) {}

  private async post<T>(path: string, body: unknown): Promise<T> {
    const bodyStr = JSON.stringify(body);
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (this.accessKey && this.secretKey) {
      Object.assign(headers, buildHmacHeaders("POST", path, bodyStr, this.accessKey, this.secretKey));
    }
    const response = await fetch(`${this.baseUrl}${path}`, {
      method: "POST",
      headers,
      body: bodyStr,
    });
    if (!response.ok) {
      throw new Error(`comlink ${path} responded with ${response.status}`);
    }
    return (await response.json()) as T;
  }

  async getCharacters(): Promise<ProviderCharacter[]> {
    const metadata = await this.post<ComlinkMetadata>("/metadata", {});

    const data = await this.post<{ units: ComlinkUnit[] }>("/data", {
      payload: {
        version: metadata.latestGamedataVersion,
        includePveUnits: false,
        requestSegment: 3,
      },
      enums: false,
    });

    const localization = await this.post<Record<string, unknown>>(
      "/localization",
      { payload: { id: metadata.latestLocalizationBundleVersion }, unzip: true },
    );
    const strings = parseLocalization(localization["Loc_ENG_US.txt"]);

    const seen = new Set<string>();
    const characters: ProviderCharacter[] = [];
    for (const unit of data.units ?? []) {
      if (unit.combatType !== 1 || seen.has(unit.baseId)) continue;
      seen.add(unit.baseId);

      const name = strings[unit.nameKey] ?? unit.nameKey;
      characters.push({
        id: slugify(name || unit.baseId),
        name,
        alignment: mapAlignment(unit.forceAlignment),
        factions: filterFactions(
          (unit.categoryId ?? []).map((category) => strings[category] ?? category),
        ),
        imageUrl: unit.thumbnailName
          ? `${ASSET_BASE}/${unit.thumbnailName}.png`
          : null,
      });
    }
    return characters;
  }

  async getCharacter(id: string): Promise<ProviderCharacter | null> {
    const all = await this.getCharacters();
    return all.find((character) => character.id === id) ?? null;
  }
}
