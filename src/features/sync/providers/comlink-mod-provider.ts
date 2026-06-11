import type { ModRecommendationProvider } from "@/features/mods/domain/mod-recommendation-provider";
import type {
  ModRecommendation,
  ModRecommendationMap,
  ModSetId,
  ModSlotId,
  PrimaryOption,
  SetLoadoutOption,
  StatId,
} from "@/types";
import { slugify } from "./provider-utils";

/**
 * Builds per-character mod recommendations from a self-hosted **swgoh-comlink**
 * instance (https://github.com/swgoh-utils/swgoh-comlink, set `COMLINK_URL`).
 * Comlink proxies the official Capital Games game API and returns *raw* data, so
 * unlike a meta site there is no pre-aggregated "usage %" — we build it:
 *
 *   1. Pull the GAC leaderboard for the Kyber league → top player ids.
 *   2. Fetch each player's roster (`/player`) → their equipped mods.
 *   3. Aggregate per character: count set loadouts and per-slot primaries,
 *      rank them, and emit the top {@link TOP_N} with a usage fraction (0..1).
 *
 * Like the other comlink providers in this repo, this is a correct-shaped
 * starting point that has not been exercised against a live instance; the field
 * reads are tolerant and may need tuning against the real payloads. `sample`
 * caps how many rosters are fetched (rate-limit friendly).
 */
const TOP_N = 4;

/** Mod set ids encoded in a comlink mod `definitionId` (game-canonical). */
const SET_BY_ID: Record<number, ModSetId> = {
  1: "health",
  2: "offense",
  3: "defense",
  4: "speed",
  5: "criticalChance",
  6: "criticalDamage",
  7: "potency",
  8: "tenacity",
};

/** Mod slot ids encoded in a comlink mod `definitionId`; only variable slots. */
const SLOT_BY_ID: Record<number, ModSlotId> = {
  2: "arrow",
  4: "triangle",
  5: "circle",
  6: "cross",
};

/** Comlink `unitStatId` → our primary stat id (mod primaries only). */
const PRIMARY_BY_STAT_ID: Record<number, StatId> = {
  5: "speed",
  16: "criticalDamage",
  17: "potency",
  18: "tenacity",
  48: "offensePct",
  49: "defensePct",
  52: "accuracy",
  53: "criticalChance",
  54: "criticalAvoidance",
  55: "healthPct",
  56: "protectionPct",
};

interface ComlinkMetadata {
  latestGamedataVersion: string;
  latestLocalizationBundleVersion: string;
}

interface ComlinkUnitDef {
  baseId: string;
  nameKey: string;
  combatType: number; // 1 = character
}

/** A leaderboard row; comlink shapes vary, so several id fields are tolerated. */
interface LeaderboardPlayer {
  playerId?: string;
  allyCode?: string | number;
  memberContestId?: string;
}

interface ComlinkMod {
  definitionId?: string;
  primaryStat?: { stat?: { unitStatId?: number } };
}

interface ComlinkRosterUnit {
  definitionId?: string; // e.g. "AAYLASECURA:SEVEN_STAR"
  baseId?: string;
  equippedStatMod?: ComlinkMod[];
}

interface ComlinkPlayer {
  rosterUnit?: ComlinkRosterUnit[];
}

/** A per-character tally of set loadouts and per-slot primaries. */
interface Tally {
  total: number;
  setCombos: Map<string, { sets: ModSetId[]; count: number }>;
  primaries: Partial<Record<ModSlotId, Map<StatId, number>>>;
}

function parseLocalization(raw: unknown): Record<string, string> {
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    return raw as Record<string, string>;
  }
  const map: Record<string, string> = {};
  if (typeof raw === "string") {
    for (const line of raw.split(/\r?\n/)) {
      const sep = line.indexOf("|");
      if (sep > 0) map[line.slice(0, sep)] = line.slice(sep + 1);
    }
  }
  return map;
}

/** Decodes a comlink mod `definitionId` ("[set][rarity][slot]") into set + slot. */
function decodeMod(definitionId: string | undefined): {
  set: ModSetId | null;
  slot: ModSlotId | null;
} {
  const digits = (definitionId ?? "").replace(/\D/g, "");
  if (digits.length < 3) return { set: null, slot: null };
  return {
    set: SET_BY_ID[Number(digits[0])] ?? null,
    slot: SLOT_BY_ID[Number(digits[digits.length - 1])] ?? null,
  };
}

function rankTop<T>(entries: Array<T & { count: number }>, total: number) {
  return entries
    .sort((a, b) => b.count - a.count)
    .slice(0, TOP_N)
    .map((entry) => ({ ...entry, usage: total > 0 ? entry.count / total : 0 }));
}

export class ComlinkModProvider implements ModRecommendationProvider {
  readonly name = "swgoh-comlink";

  constructor(
    private readonly baseUrl: string,
    private readonly sample = 200,
  ) {}

  async getRecommendations(): Promise<ModRecommendationMap> {
    const baseIdToSlug = await this.buildBaseIdToSlug();
    const players = await this.fetchTopPlayerIds();

    const tallies = new Map<string, Tally>();
    for (const player of players.slice(0, this.sample)) {
      const roster = await this.fetchRoster(player);
      for (const unit of roster) this.tallyUnit(unit, baseIdToSlug, tallies);
    }

    const map: ModRecommendationMap = {};
    for (const [slug, tally] of tallies) {
      const recommendation = this.finalize(tally);
      if (
        recommendation.setOptions.length > 0 ||
        Object.keys(recommendation.primaryOptions).length > 0
      ) {
        map[slug] = recommendation;
      }
    }
    return map;
  }

  private async post<T>(path: string, body: unknown): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      throw new Error(`comlink ${path} responded with ${response.status}`);
    }
    return (await response.json()) as T;
  }

  /** Maps in-game baseId (e.g. AAYLASECURA) → our slug (aayla-secura). */
  private async buildBaseIdToSlug(): Promise<Map<string, string>> {
    const metadata = await this.post<ComlinkMetadata>("/metadata", {});
    const data = await this.post<{ units: ComlinkUnitDef[] }>("/data", {
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

    const map = new Map<string, string>();
    for (const unit of data.units ?? []) {
      if (unit.combatType !== 1 || map.has(unit.baseId)) continue;
      const name = strings[unit.nameKey] ?? unit.baseId;
      map.set(unit.baseId, slugify(name));
    }
    return map;
  }

  /** Top players for the Kyber GAC league. Tolerant of comlink's leaderboard shape. */
  private async fetchTopPlayerIds(): Promise<LeaderboardPlayer[]> {
    // leaderboardType 6 = Grand Arena; league 100 = Kyber (top). Shapes differ
    // across comlink versions, so we read whichever player array is present.
    const payload = await this.post<Record<string, unknown>>("/getLeaderboard", {
      payload: { leaderboardType: 6, league: 100, division: 25 },
      enums: false,
    });
    for (const key of ["player", "players", "playerStatus", "leaderboard"]) {
      const value = payload[key];
      if (Array.isArray(value)) return value as LeaderboardPlayer[];
    }
    return [];
  }

  private async fetchRoster(player: LeaderboardPlayer): Promise<ComlinkRosterUnit[]> {
    const payload = player.playerId
      ? { payload: { playerId: player.playerId }, enums: false }
      : { payload: { allyCode: String(player.allyCode ?? "") }, enums: false };
    try {
      const data = await this.post<ComlinkPlayer>("/player", payload);
      return data.rosterUnit ?? [];
    } catch {
      // Rate-limit / missing player: skip, keep aggregating the rest.
      return [];
    }
  }

  private tallyUnit(
    unit: ComlinkRosterUnit,
    baseIdToSlug: Map<string, string>,
    tallies: Map<string, Tally>,
  ): void {
    const baseId = unit.baseId ?? unit.definitionId?.split(":")[0] ?? "";
    const slug = baseIdToSlug.get(baseId);
    const mods = unit.equippedStatMod ?? [];
    if (!slug || mods.length === 0) return;

    const tally =
      tallies.get(slug) ??
      (() => {
        const fresh: Tally = { total: 0, setCombos: new Map(), primaries: {} };
        tallies.set(slug, fresh);
        return fresh;
      })();
    tally.total += 1;

    const setCounts: ModSetId[] = [];
    for (const mod of mods) {
      const { set, slot } = decodeMod(mod.definitionId);
      if (set) setCounts.push(set);
      const statId = mod.primaryStat?.stat?.unitStatId;
      const primary = statId != null ? PRIMARY_BY_STAT_ID[statId] : null;
      if (slot && primary) {
        const bySlot = (tally.primaries[slot] ??= new Map<StatId, number>());
        bySlot.set(primary, (bySlot.get(primary) ?? 0) + 1);
      }
    }

    // A loadout is the multiset of set bonuses (order-independent), keyed sorted.
    if (setCounts.length > 0) {
      const sets = [...setCounts].sort();
      const key = sets.join("+");
      const combo = tally.setCombos.get(key) ?? { sets, count: 0 };
      combo.count += 1;
      tally.setCombos.set(key, combo);
    }
  }

  private finalize(tally: Tally): ModRecommendation {
    const setOptions: SetLoadoutOption[] = rankTop(
      [...tally.setCombos.values()],
      tally.total,
    ).map((entry) => ({ sets: entry.sets, usage: entry.usage }));

    const primaryOptions: ModRecommendation["primaryOptions"] = {};
    for (const [slot, counts] of Object.entries(tally.primaries) as [
      ModSlotId,
      Map<StatId, number>,
    ][]) {
      const slotTotal = [...counts.values()].reduce((sum, n) => sum + n, 0);
      const options: PrimaryOption[] = rankTop(
        [...counts.entries()].map(([stat, count]) => ({ stat, count })),
        slotTotal,
      ).map((entry) => ({ stat: entry.stat, usage: entry.usage }));
      if (options.length > 0) primaryOptions[slot] = options;
    }

    return { setOptions, primaryOptions };
  }
}
