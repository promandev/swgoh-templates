import type { ModSetId } from "@/types";

/**
 * Single source of truth for the eight SWGOH mod set bonuses. Set bonuses come
 * in two sizes: 4-piece (Speed, Offense, Critical Damage) and 2-piece (the
 * rest). The chip colours mirror swgoh.gg's colour-coding so the sets read at a
 * glance. Labels live in i18n (`Sets.names`).
 */
export interface ModSetDefinition {
  id: ModSetId;
  /** Mods required for the full set bonus. */
  pieces: 2 | 4;
  /** Chip classes for the in-app editor (theme aware). */
  chipClass: string;
  /** Chip classes for the export card (always on a dark background). */
  exportChipClass: string;
}

export const MOD_SET_DEFINITIONS: Record<ModSetId, ModSetDefinition> = {
  speed: {
    id: "speed",
    pieces: 4,
    chipClass:
      "bg-emerald-500/15 text-emerald-700 ring-emerald-500/30 dark:text-emerald-300",
    exportChipClass: "bg-emerald-500/15 text-emerald-300 ring-emerald-400/30",
  },
  offense: {
    id: "offense",
    pieces: 4,
    chipClass:
      "bg-red-500/15 text-red-700 ring-red-500/30 dark:text-red-300",
    exportChipClass: "bg-red-500/15 text-red-300 ring-red-400/30",
  },
  criticalDamage: {
    id: "criticalDamage",
    pieces: 4,
    chipClass:
      "bg-rose-500/15 text-rose-700 ring-rose-500/30 dark:text-rose-300",
    exportChipClass: "bg-rose-500/15 text-rose-300 ring-rose-400/30",
  },
  criticalChance: {
    id: "criticalChance",
    pieces: 2,
    chipClass:
      "bg-sky-500/15 text-sky-700 ring-sky-500/30 dark:text-sky-300",
    exportChipClass: "bg-sky-500/15 text-sky-300 ring-sky-400/30",
  },
  health: {
    id: "health",
    pieces: 2,
    chipClass:
      "bg-green-500/15 text-green-700 ring-green-500/30 dark:text-green-300",
    exportChipClass: "bg-green-500/15 text-green-300 ring-green-400/30",
  },
  defense: {
    id: "defense",
    pieces: 2,
    chipClass:
      "bg-amber-500/15 text-amber-700 ring-amber-500/30 dark:text-amber-300",
    exportChipClass: "bg-amber-500/15 text-amber-300 ring-amber-400/30",
  },
  potency: {
    id: "potency",
    pieces: 2,
    chipClass:
      "bg-violet-500/15 text-violet-700 ring-violet-500/30 dark:text-violet-300",
    exportChipClass: "bg-violet-500/15 text-violet-300 ring-violet-400/30",
  },
  tenacity: {
    id: "tenacity",
    pieces: 2,
    chipClass:
      "bg-orange-500/15 text-orange-700 ring-orange-500/30 dark:text-orange-300",
    exportChipClass: "bg-orange-500/15 text-orange-300 ring-orange-400/30",
  },
};

/** Set ids in display order: 4-piece sets first, then 2-piece. */
export const MOD_SET_IDS: readonly ModSetId[] = Object.values(MOD_SET_DEFINITIONS)
  .sort((a, b) => b.pieces - a.pieces)
  .map((definition) => definition.id);

/** Maximum number of set bonuses a loadout can hold (three 2-piece sets). */
export const MAX_SETS = 3;
