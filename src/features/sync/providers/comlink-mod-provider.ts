import { buildHmacHeaders } from "./comlink-hmac";
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

/**
 * Mods needed to complete one set bonus. Used to fold a unit's 6 raw mod sets
 * into the set-*bonus* loadout the wizard shows (e.g. 4×offense + 2×defense →
 * ["offense", "defense"]), matching the baseline provider's representation.
 */
const SET_PIECES: Record<ModSetId, number> = {
  health: 2,
  offense: 4,
  defense: 2,
  speed: 4,
  criticalChance: 2,
  criticalDamage: 4,
  potency: 2,
  tenacity: 2,
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

/** A GAC leaderboard player entry (nested under leaderboard[].player[]). */
interface LeaderboardPlayer {
  id?: string;
  name?: string;
}

interface LeaderboardResponse {
  leaderboard?: Array<{ player?: LeaderboardPlayer[] }>;
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
    private readonly accessKey?: string,
    private readonly secretKey?: string,
  ) {}

  async getRecommendations(): Promise<ModRecommendationMap> {
    const baseIdToSlug = await this.buildBaseIdToSlug();
    const playerIds = await this.fetchTopPlayerIds();

    const tallies = new Map<string, Tally>();
    for (const playerId of playerIds.slice(0, this.sample)) {
      const roster = await this.fetchRoster(playerId);
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

  /**
   * Unique player ids from the top of the Kyber GAC leaderboard. Players sit at
   * `leaderboard[].player[].id` (each bracket holds ~50). We sweep the Kyber
   * divisions (top-first) to gather a larger sample, deduping by id.
   */
  private async fetchTopPlayerIds(): Promise<string[]> {
    // leaderboardType 6 = Grand Arena; league 100 = Kyber. Divisions run 25..5
    // (top-first); each returns a bracket of ~50 players.
    const divisions = [25, 20, 15, 10, 5];
    const ids: string[] = [];
    const seen = new Set<string>();
    for (const division of divisions) {
      const payload = await this.post<LeaderboardResponse>("/getLeaderboard", {
        payload: { leaderboardType: 6, league: 100, division },
        enums: false,
      }).catch(() => ({}) as LeaderboardResponse);
      for (const bracket of payload.leaderboard ?? []) {
        for (const player of bracket.player ?? []) {
          if (player.id && !seen.has(player.id)) {
            seen.add(player.id);
            ids.push(player.id);
          }
        }
      }
    }
    return ids;
  }

  private async fetchRoster(playerId: string): Promise<ComlinkRosterUnit[]> {
    try {
      const data = await this.post<ComlinkPlayer>("/player", {
        payload: { playerId },
        enums: false,
      });
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

    const rawCounts = new Map<ModSetId, number>();
    for (const mod of mods) {
      const { set, slot } = decodeMod(mod.definitionId);
      if (set) rawCounts.set(set, (rawCounts.get(set) ?? 0) + 1);
      const statId = mod.primaryStat?.stat?.unitStatId;
      const primary = statId != null ? PRIMARY_BY_STAT_ID[statId] : null;
      if (slot && primary) {
        const bySlot = (tally.primaries[slot] ??= new Map<StatId, number>());
        bySlot.set(primary, (bySlot.get(primary) ?? 0) + 1);
      }
    }

    // Fold the 6 raw mod sets into completed set bonuses (e.g. 4×offense +
    // 2×defense → ["defense", "offense"]); incomplete sets contribute nothing.
    const bonuses: ModSetId[] = [];
    for (const [set, count] of rawCounts) {
      for (let i = 0; i < Math.floor(count / SET_PIECES[set]); i++) {
        bonuses.push(set);
      }
    }

    // A loadout is the multiset of set bonuses (order-independent), keyed sorted.
    if (bonuses.length > 0) {
      const sets = bonuses.sort();
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
