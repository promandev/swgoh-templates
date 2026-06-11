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
import { slugFromUrl } from "./provider-utils";

/** How many ranked options to keep per slot / per set list. */
const TOP_N = 4;

/** Normalizes a raw usage figure (percentage 0..100 or fraction) to 0..1. */
function toUsage(entry: RankedEntry): number {
  const raw = entry.percentage ?? entry.count ?? 0;
  return raw > 1 ? raw / 100 : raw;
}

/**
 * Loads per-character mod recommendations from the swgoh.gg mod meta report
 * (the "average" sets and primaries shown on each character page).
 *
 * Like the character and datacron APIs, swgoh.gg sits behind Cloudflare and may
 * answer `403` from challenged networks, so run `sync:mods` from an unrestricted
 * environment. The exact response shape can't be verified from here, so parsing
 * is deliberately tolerant of both numeric ids and human labels and of a few
 * plausible field names; adjust the field reads if swgoh.gg changes its schema.
 *
 * The `filter` segment selects the population (e.g. `"all"`, `"guilds_100_gp"`).
 * The top-1000-Kyber cut is a premium slice and may not be reachable publicly.
 */
const BASE_URL = "https://swgoh.gg/stats/mod-meta-report";

/** swgoh.gg set ids → our set ids (game-canonical numbering). */
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

const SET_BY_LABEL: Record<string, ModSetId> = {
  health: "health",
  offense: "offense",
  defense: "defense",
  speed: "speed",
  "critical chance": "criticalChance",
  "crit chance": "criticalChance",
  "critical damage": "criticalDamage",
  "crit damage": "criticalDamage",
  potency: "potency",
  tenacity: "tenacity",
};

/** swgoh.gg slot ids → our slot ids; only the four variable slots matter. */
const SLOT_BY_ID: Record<number, ModSlotId> = {
  2: "arrow",
  4: "triangle",
  5: "circle",
  6: "cross",
};

const SLOT_BY_LABEL: Record<string, ModSlotId> = {
  arrow: "arrow",
  triangle: "triangle",
  circle: "circle",
  cross: "cross",
};

/**
 * Primary-stat labels → our stat ids. On mods the flat Health/Protection/etc.
 * never appear as a primary, so a bare "Health"/"Protection"/"Offense"/"Defense"
 * primary resolves to its percentage variant.
 */
const PRIMARY_BY_LABEL: Record<string, StatId> = {
  speed: "speed",
  health: "healthPct",
  protection: "protectionPct",
  offense: "offensePct",
  defense: "defensePct",
  potency: "potency",
  tenacity: "tenacity",
  accuracy: "accuracy",
  "critical chance": "criticalChance",
  "crit chance": "criticalChance",
  "critical damage": "criticalDamage",
  "crit damage": "criticalDamage",
  "critical avoidance": "criticalAvoidance",
  "crit avoidance": "criticalAvoidance",
};

/** Well-known swgoh stat ids used for mod primaries. */
const PRIMARY_BY_ID: Record<number, StatId> = {
  5: "speed",
  16: "criticalDamage",
  17: "potency",
  18: "tenacity",
};

function norm(value: unknown): string {
  return String(value ?? "").trim().toLowerCase();
}

function mapSet(value: unknown): ModSetId | null {
  if (typeof value === "number") return SET_BY_ID[value] ?? null;
  return SET_BY_LABEL[norm(value)] ?? null;
}

function mapSlot(value: unknown): ModSlotId | null {
  if (typeof value === "number") return SLOT_BY_ID[value] ?? null;
  return SLOT_BY_LABEL[norm(value)] ?? null;
}

function mapPrimary(value: unknown): StatId | null {
  if (typeof value === "number") return PRIMARY_BY_ID[value] ?? null;
  return PRIMARY_BY_LABEL[norm(value)] ?? null;
}

/** A row of `{ value, count }`-ish records, sorted by usage, most common first. */
interface RankedEntry {
  value?: unknown;
  id?: unknown;
  name?: unknown;
  count?: number;
  percentage?: number;
}

function rank(entries: RankedEntry[] | undefined): RankedEntry[] {
  return [...(entries ?? [])].sort(
    (a, b) => (b.percentage ?? b.count ?? 0) - (a.percentage ?? a.count ?? 0),
  );
}

function readValue(entry: RankedEntry): unknown {
  return entry.value ?? entry.id ?? entry.name;
}

/** One character entry in the meta report (tolerant of several field names). */
interface RawCharacterMeta {
  base_id?: string;
  url?: string;
  name?: string;
  /** Ranked set bonuses (a primary then secondary list, or a single combined list). */
  sets?: RankedEntry[];
  primary_sets?: RankedEntry[];
  secondary_sets?: RankedEntry[];
  /** Per-slot ranked primaries, keyed or listed by slot. */
  primaries?: Record<string, RankedEntry[]> | RawSlotPrimary[];
}

interface RawSlotPrimary {
  slot?: unknown;
  stats?: RankedEntry[];
  primaries?: RankedEntry[];
}

export class SwgohGgModProvider implements ModRecommendationProvider {
  readonly name = "swgoh.gg";

  constructor(private readonly filter: string = "all") {}

  async getRecommendations(): Promise<ModRecommendationMap> {
    const url = `${BASE_URL}/${this.filter}/?format=json`;
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        Accept: "application/json, text/plain, */*",
        Referer: BASE_URL,
      },
    });
    if (!response.ok) {
      throw new Error(`swgoh.gg mod-meta-report responded with ${response.status}`);
    }

    const payload = (await response.json()) as unknown;
    const rows = this.extractRows(payload);

    const map: ModRecommendationMap = {};
    for (const row of rows) {
      const slug = slugFromUrl(row.url, row.base_id ?? row.name ?? "");
      if (!slug) continue;
      const recommendation = this.mapCharacter(row);
      if (
        recommendation.setOptions.length > 0 ||
        Object.keys(recommendation.primaryOptions).length > 0
      ) {
        map[slug] = recommendation;
      }
    }
    return map;
  }

  /** The report may be a bare array or wrapped under `data`/`results`/`characters`. */
  private extractRows(payload: unknown): RawCharacterMeta[] {
    if (Array.isArray(payload)) return payload as RawCharacterMeta[];
    if (payload && typeof payload === "object") {
      const wrapper = payload as Record<string, unknown>;
      for (const key of ["data", "results", "characters", "report"]) {
        if (Array.isArray(wrapper[key])) return wrapper[key] as RawCharacterMeta[];
      }
    }
    return [];
  }

  private mapCharacter(row: RawCharacterMeta): ModRecommendation {
    return {
      setOptions: this.mapSetOptions(row),
      primaryOptions: this.mapPrimaryOptions(row),
    };
  }

  /**
   * Best-effort set loadouts. The public report exposes per-set frequencies more
   * than full combos, so each top-ranked set becomes a single-set loadout; the
   * comlink provider produces real combinations from sampled rosters.
   */
  private mapSetOptions(row: RawCharacterMeta): SetLoadoutOption[] {
    const list = rank(row.sets ?? row.primary_sets);
    const options: SetLoadoutOption[] = [];
    for (const entry of list.slice(0, TOP_N)) {
      const set = mapSet(readValue(entry));
      if (set) options.push({ sets: [set], usage: toUsage(entry) });
    }
    return options;
  }

  private mapPrimaryOptions(row: RawCharacterMeta): ModRecommendation["primaryOptions"] {
    const result: ModRecommendation["primaryOptions"] = {};
    const source = row.primaries;
    if (!source) return result;

    const assign = (slotValue: unknown, ranked: RankedEntry[] | undefined) => {
      const slot = mapSlot(slotValue);
      if (!slot) return;
      const options: PrimaryOption[] = [];
      for (const entry of rank(ranked).slice(0, TOP_N)) {
        const stat = mapPrimary(readValue(entry));
        if (stat) options.push({ stat, usage: toUsage(entry) });
      }
      if (options.length > 0) result[slot] = options;
    };

    if (Array.isArray(source)) {
      for (const entry of source) assign(entry.slot, entry.stats ?? entry.primaries);
    } else {
      for (const [slotKey, ranked] of Object.entries(source)) assign(slotKey, ranked);
    }
    return result;
  }
}
