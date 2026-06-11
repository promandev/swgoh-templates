import { brotliDecompressSync } from "node:zlib";

import type { DatacronProvider } from "@/features/datacrons/domain/datacron-provider";
import type { DatacronAbility, DatacronSet, DatacronStatOption } from "@/types";

/**
 * Datacron provider backed by the public `swgoh-utils/gamedata` GitHub mirror —
 * raw game data dumped from swgoh-comlink, reachable from restricted networks
 * (same approach as the character sync). It joins four collections and the
 * English localization bundle to produce enriched sets: each carries its focus
 * abilities (levels 3/6/9, per alignment / faction / character) and the rollable
 * stat pool with value ranges.
 *
 * Only each set's `base` template is read: it already lists every L3/L6/L9
 * ability option and every stat tier. The separate `_focused_` templates are a
 * reroll mechanic that would only add duplicates. Shapes verified against the
 * live mirror (2026-06).
 */
const BASE_URL = "https://raw.githubusercontent.com/swgoh-utils/gamedata/main";

interface GameDataFile<T> {
  data: T;
}

interface RawDatacronSet {
  id: number | string;
  displayName: string;
  expirationTimeMs?: string;
}

interface RawTier {
  affixTemplateSetId?: string[];
  id?: number | string;
}

interface RawTemplate {
  setId: number | string;
  focused?: boolean;
  tier?: RawTier[];
}

interface RawAffix {
  abilityId?: string;
  targetRule?: string;
  statValueMin?: string;
  statValueMax?: string;
  scopeIcon?: string;
}

interface RawAffixTemplateSet {
  id: string;
  affix?: RawAffix[];
}

/** Stat tokens (from compound stat-set ids) → display label + whether `%`. */
const STAT_TOKENS: Record<string, { label: string; percent: boolean }> = {
  maxhealth: { label: "Health", percent: false },
  maxhealthpctadd: { label: "Health", percent: true },
  maxheath: { label: "Health", percent: true },
  maxshield: { label: "Protection", percent: false },
  maxshieldpctadd: { label: "Protection", percent: true },
  offense: { label: "Offense", percent: false },
  offensepctadd: { label: "Offense", percent: true },
  offenseperc: { label: "Offense", percent: true },
  defense: { label: "Defense", percent: true },
  speed: { label: "Speed", percent: false },
  resistance: { label: "Tenacity", percent: true },
  critchance: { label: "Critical Chance", percent: true },
  criticalchance: { label: "Critical Chance", percent: true },
  criticalchancepctadd: { label: "Critical Chance", percent: true },
  critdamage: { label: "Critical Damage", percent: true },
  criticaldamage: { label: "Critical Damage", percent: true },
  critnegatepctadd: { label: "Critical Avoidance", percent: true },
  accuracy: { label: "Accuracy", percent: true },
  armorpen: { label: "Armor Penetration", percent: false },
  defensepenetration: { label: "Defense Penetration", percent: false },
  suppen: { label: "Resistance Penetration", percent: false },
  healthsteal: { label: "Health Steal", percent: true },
};

const ALIGNMENT_LABELS: Record<string, string> = {
  lightside: "Light Side",
  darkside: "Dark Side",
};

function prettify(token: string): string {
  return token
    .split(/[_-]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export class GithubDatacronProvider implements DatacronProvider {
  readonly name = "github (swgoh-utils/gamedata)";

  async getSets(): Promise<DatacronSet[]> {
    const [sets, templates, affixSets, localization] = await Promise.all([
      this.fetchData<RawDatacronSet[]>("datacronSet.json"),
      this.fetchData<RawTemplate[]>("datacronTemplate.json"),
      this.fetchData<RawAffixTemplateSet[]>("datacronAffixTemplateSet.json"),
      this.fetchLocalization(),
    ]);

    const affixById = new Map(affixSets.map((set) => [set.id, set]));
    const loc = (key: string) =>
      localization[key] ?? localization[key.toUpperCase()];

    return sets
      .map((set) => this.mapSet(set, templates, affixById, loc))
      .sort((a, b) =>
        a.name.localeCompare(b.name, undefined, { numeric: true }),
      );
  }

  private async fetchData<T>(file: string): Promise<T> {
    const response = await fetch(`${BASE_URL}/${file}`, {
      headers: { "User-Agent": "swgoh-squad-builder/sync" },
    });
    if (!response.ok) {
      throw new Error(`${file} responded with ${response.status}`);
    }
    return ((await response.json()) as GameDataFile<T>).data;
  }

  /** The localization bundle ships Brotli-compressed (`*.txt.json.br`). */
  private async fetchLocalization(): Promise<Record<string, string>> {
    const response = await fetch(`${BASE_URL}/Loc_ENG_US.txt.json.br`, {
      headers: { "User-Agent": "swgoh-squad-builder/sync" },
    });
    if (!response.ok) {
      throw new Error(`localization responded with ${response.status}`);
    }
    const buffer = Buffer.from(await response.arrayBuffer());
    const json = JSON.parse(brotliDecompressSync(buffer).toString("utf8"));
    return (json.data ?? json) as Record<string, string>;
  }

  private mapSet(
    set: RawDatacronSet,
    templates: RawTemplate[],
    affixById: Map<string, RawAffixTemplateSet>,
    loc: (key: string) => string | undefined,
  ): DatacronSet {
    const id = String(set.id);
    const base = templates.find(
      (template) => String(template.setId) === id && !template.focused,
    );

    const abilities: DatacronAbility[] = [];
    const statPool: DatacronStatOption[] = [];
    const seenAbility = new Set<string>();
    const seenStat = new Set<string>();

    for (const tier of base?.tier ?? []) {
      const level = Number(tier.id) || 0;
      for (const affixSetId of tier.affixTemplateSetId ?? []) {
        const affixSet = affixById.get(affixSetId);
        if (!affixSet) continue;

        if (affixSetId.startsWith("ability_set_")) {
          const ability = this.ability(affixSetId, affixSet, level, loc);
          if (!ability) continue;
          const key = `${ability.level}|${ability.focus}|${ability.text}`;
          if (seenAbility.has(key)) continue;
          seenAbility.add(key);
          abilities.push(ability);
        } else if (affixSetId.startsWith("stat_set_")) {
          for (const stat of this.statOptions(affixSetId, affixSet, level)) {
            const key = `${stat.level}|${stat.stat}|${stat.value}`;
            if (seenStat.has(key)) continue;
            seenStat.add(key);
            statPool.push(stat);
          }
        }
      }
    }

    abilities.sort((a, b) => a.level - b.level || a.focus.localeCompare(b.focus));
    statPool.sort((a, b) => a.level - b.level || a.stat.localeCompare(b.stat));

    return {
      id,
      name: loc(set.displayName) ?? set.displayName,
      expiresAt: set.expirationTimeMs ? Number(set.expirationTimeMs) : undefined,
      abilities,
      statPool,
    };
  }

  private ability(
    affixSetId: string,
    affixSet: RawAffixTemplateSet,
    level: number,
    loc: (key: string) => string | undefined,
  ): DatacronAbility | null {
    const affix = affixSet.affix?.find((entry) => entry.abilityId);
    const text = affix?.abilityId && loc(`${affix.abilityId}_DESC`);
    if (!affix || !text) return null;

    const token = affixSetId
      .replace(/^ability_set_/, "")
      .replace(/_\d+$/, "")
      .replace(/_generic$/, "");
    const focus =
      ALIGNMENT_LABELS[token] ??
      loc(`UNIT_${token.toUpperCase()}_NAME`) ??
      prettify(token);

    const target = affix.targetRule
      ? ALIGNMENT_LABELS[
          affix.targetRule.replace(/^target_datacron_/, "")
        ] ?? prettify(affix.targetRule.replace(/^target_datacron_/, ""))
      : "";
    const resolved = target ? text.replace(/\{0\}/g, target) : text;

    return { level, focus, text: resolved };
  }

  /** Zip the compound id's stat tokens with the affix array (same order). */
  private statOptions(
    affixSetId: string,
    affixSet: RawAffixTemplateSet,
    level: number,
  ): DatacronStatOption[] {
    const tokens = affixSetId
      .replace(/^stat_set_/, "")
      .replace(/_\d+$/, "")
      .split("_");
    const affixes = affixSet.affix ?? [];

    return tokens
      .map((token, index): DatacronStatOption | null => {
        const meta = STAT_TOKENS[token];
        if (!meta) return null;
        const affix = affixes[index];
        const suffix = meta.percent ? "%" : "";
        return {
          level,
          stat: meta.label,
          value: this.formatRange(affix?.statValueMin, affix?.statValueMax, suffix),
        };
      })
      .filter((option): option is DatacronStatOption => option !== null);
  }

  private formatRange(min?: string, max?: string, suffix = ""): string {
    const lo = min ? Number(min) / 1_000_000 : 0;
    const hi = max ? Number(max) / 1_000_000 : lo;
    if (!lo && !hi) return "";
    return lo === hi ? `${lo}${suffix}` : `${lo}–${hi}${suffix}`;
  }
}
