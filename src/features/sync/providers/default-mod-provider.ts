import charactersData from "@/data/characters.json";
import type { ModRecommendationProvider } from "@/features/mods/domain/mod-recommendation-provider";
import type {
  Character,
  ModRecommendation,
  ModRecommendationMap,
} from "@/types";

/**
 * Offline, network-free provider that emits a sensible **baseline** mod
 * recommendation for *every* character in `characters.json`, so the in-app
 * wizard works for the whole roster without a reachable data source. The
 * baseline follows standard SWGOH mod conventions, refined per role when the
 * character carries a role category (attacker / tank / support / healer).
 *
 * These are conventions, not measured top-Kyber usage — the comlink provider
 * (`--provider=comlink`) overwrites them with real, per-character stats when a
 * `COMLINK_URL` instance is available. Used as the default for `sync:mods` so a
 * bare run always produces a full, working dataset.
 */
type Archetype = "attacker" | "tank" | "support" | "healer";

const ROLE_CATEGORY: Record<string, Archetype> = {
  CATEGORY_ROLEATTACKER_DESC: "attacker",
  CATEGORY_ROLETANK_DESC: "tank",
  CATEGORY_ROLESUPPORT_DESC: "support",
  CATEGORY_ROLEHEALER_DESC: "healer",
};

/**
 * Per-archetype baseline. Set loadouts are valid 6-mod combinations (one 4-piece
 * + one 2-piece, or three 2-piece sets). Usage values are illustrative shares.
 */
const BASELINE: Record<Archetype, ModRecommendation> = {
  attacker: {
    setOptions: [
      { sets: ["speed", "criticalChance"], usage: 0.48 },
      { sets: ["criticalDamage", "criticalChance"], usage: 0.27 },
      { sets: ["offense", "criticalChance"], usage: 0.15 },
      { sets: ["speed", "health"], usage: 0.1 },
    ],
    primaryOptions: {
      arrow: [
        { stat: "speed", usage: 0.92 },
        { stat: "offensePct", usage: 0.08 },
      ],
      triangle: [
        { stat: "criticalDamage", usage: 0.68 },
        { stat: "offensePct", usage: 0.22 },
        { stat: "criticalChance", usage: 0.1 },
      ],
      circle: [
        { stat: "protectionPct", usage: 0.55 },
        { stat: "healthPct", usage: 0.45 },
      ],
      cross: [
        { stat: "offensePct", usage: 0.42 },
        { stat: "potency", usage: 0.33 },
        { stat: "protectionPct", usage: 0.25 },
      ],
    },
  },
  tank: {
    setOptions: [
      { sets: ["health", "health", "health"], usage: 0.44 },
      { sets: ["defense", "health", "health"], usage: 0.29 },
      { sets: ["speed", "health"], usage: 0.17 },
      { sets: ["health", "tenacity", "potency"], usage: 0.1 },
    ],
    primaryOptions: {
      arrow: [
        { stat: "protectionPct", usage: 0.56 },
        { stat: "speed", usage: 0.44 },
      ],
      triangle: [
        { stat: "protectionPct", usage: 0.62 },
        { stat: "healthPct", usage: 0.38 },
      ],
      circle: [
        { stat: "protectionPct", usage: 0.66 },
        { stat: "healthPct", usage: 0.34 },
      ],
      cross: [
        { stat: "protectionPct", usage: 0.4 },
        { stat: "tenacity", usage: 0.32 },
        { stat: "potency", usage: 0.28 },
      ],
    },
  },
  support: {
    setOptions: [
      { sets: ["speed", "potency"], usage: 0.41 },
      { sets: ["speed", "health"], usage: 0.31 },
      { sets: ["potency", "health", "health"], usage: 0.16 },
      { sets: ["health", "health", "health"], usage: 0.12 },
    ],
    primaryOptions: {
      arrow: [
        { stat: "speed", usage: 0.9 },
        { stat: "protectionPct", usage: 0.1 },
      ],
      triangle: [
        { stat: "protectionPct", usage: 0.5 },
        { stat: "healthPct", usage: 0.34 },
        { stat: "criticalDamage", usage: 0.16 },
      ],
      circle: [
        { stat: "protectionPct", usage: 0.58 },
        { stat: "healthPct", usage: 0.42 },
      ],
      cross: [
        { stat: "potency", usage: 0.52 },
        { stat: "protectionPct", usage: 0.26 },
        { stat: "tenacity", usage: 0.22 },
      ],
    },
  },
  healer: {
    setOptions: [
      { sets: ["health", "health", "health"], usage: 0.43 },
      { sets: ["speed", "health"], usage: 0.34 },
      { sets: ["health", "potency", "tenacity"], usage: 0.13 },
      { sets: ["defense", "health", "health"], usage: 0.1 },
    ],
    primaryOptions: {
      arrow: [
        { stat: "speed", usage: 0.87 },
        { stat: "protectionPct", usage: 0.13 },
      ],
      triangle: [
        { stat: "healthPct", usage: 0.52 },
        { stat: "protectionPct", usage: 0.48 },
      ],
      circle: [
        { stat: "healthPct", usage: 0.51 },
        { stat: "protectionPct", usage: 0.49 },
      ],
      cross: [
        { stat: "tenacity", usage: 0.44 },
        { stat: "potency", usage: 0.3 },
        { stat: "protectionPct", usage: 0.26 },
      ],
    },
  },
};

function archetypeOf(character: Character): Archetype {
  for (const faction of character.factions) {
    const role = ROLE_CATEGORY[faction];
    if (role) return role;
  }
  return "attacker";
}

export class DefaultModProvider implements ModRecommendationProvider {
  readonly name = "baseline-defaults";

  async getRecommendations(): Promise<ModRecommendationMap> {
    const characters = charactersData as Character[];
    const map: ModRecommendationMap = {};
    for (const character of characters) {
      map[character.id] = BASELINE[archetypeOf(character)];
    }
    return map;
  }
}
