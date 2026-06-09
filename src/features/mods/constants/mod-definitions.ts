import {
  CircleIcon,
  DiamondIcon,
  MoveUpIcon,
  PlusIcon,
  SquareIcon,
  TriangleIcon,
  type LucideIcon,
} from "lucide-react";

import type { ModSlotId, StatId } from "@/types";

/**
 * The single source of truth for SWGOH mod-slot rules. Every consumer — the
 * editor, the table header, validations and the PNG export — derives its
 * options, icons and i18n labels from these definitions. Update the game rules
 * here and the whole app follows.
 */
export interface ModDefinition {
  id: ModSlotId;
  /** Canonical display order (square → cross). */
  order: number;
  icon: LucideIcon;
  /** i18n key under the "Slots" namespace. */
  nameKey: `${ModSlotId}.name`;
  tooltipKey: `${ModSlotId}.tooltip`;
  /** Fixed primary stat (square/diamond) or null when the user chooses. */
  fixedPrimary: StatId | null;
  /** Allowed primary stats for this slot. */
  primaryOptions: readonly StatId[];
  /** Allowed secondary stats for this slot. */
  secondaryOptions: readonly StatId[];
}

/**
 * The complete pool of valid secondary stats in SWGOH. Critical Damage,
 * Accuracy and Critical Avoidance only exist as primaries, so they are absent.
 */
export const SECONDARY_STAT_POOL: readonly StatId[] = [
  "speed",
  "health",
  "healthPct",
  "protection",
  "protectionPct",
  "offense",
  "offensePct",
  "defense",
  "defensePct",
  "potency",
  "tenacity",
  "criticalChance",
] as const;

export const MOD_DEFINITIONS: Record<ModSlotId, ModDefinition> = {
  square: {
    id: "square",
    order: 0,
    icon: SquareIcon,
    nameKey: "square.name",
    tooltipKey: "square.tooltip",
    fixedPrimary: "offensePct",
    primaryOptions: ["offensePct"],
    secondaryOptions: SECONDARY_STAT_POOL,
  },
  arrow: {
    id: "arrow",
    order: 1,
    icon: MoveUpIcon,
    nameKey: "arrow.name",
    tooltipKey: "arrow.tooltip",
    fixedPrimary: null,
    primaryOptions: [
      "speed",
      "accuracy",
      "criticalAvoidance",
      "healthPct",
      "protectionPct",
      "offensePct",
      "defensePct",
    ],
    secondaryOptions: SECONDARY_STAT_POOL,
  },
  diamond: {
    id: "diamond",
    order: 2,
    icon: DiamondIcon,
    nameKey: "diamond.name",
    tooltipKey: "diamond.tooltip",
    fixedPrimary: "defense",
    primaryOptions: ["defense"],
    secondaryOptions: SECONDARY_STAT_POOL,
  },
  triangle: {
    id: "triangle",
    order: 3,
    icon: TriangleIcon,
    nameKey: "triangle.name",
    tooltipKey: "triangle.tooltip",
    fixedPrimary: null,
    primaryOptions: [
      "criticalDamage",
      "criticalChance",
      "healthPct",
      "protectionPct",
      "offensePct",
      "defensePct",
    ],
    secondaryOptions: SECONDARY_STAT_POOL,
  },
  circle: {
    id: "circle",
    order: 4,
    icon: CircleIcon,
    nameKey: "circle.name",
    tooltipKey: "circle.tooltip",
    fixedPrimary: null,
    primaryOptions: ["healthPct", "protectionPct"],
    secondaryOptions: SECONDARY_STAT_POOL,
  },
  cross: {
    id: "cross",
    order: 5,
    icon: PlusIcon,
    nameKey: "cross.name",
    tooltipKey: "cross.tooltip",
    fixedPrimary: null,
    primaryOptions: [
      "potency",
      "tenacity",
      "healthPct",
      "protectionPct",
      "offensePct",
      "defensePct",
    ],
    secondaryOptions: SECONDARY_STAT_POOL,
  },
};

/** Mod definitions in canonical order. */
export const MOD_DEFINITION_LIST: readonly ModDefinition[] = Object.values(
  MOD_DEFINITIONS,
).sort((a, b) => a.order - b.order);

export function getModDefinition(slot: ModSlotId): ModDefinition {
  return MOD_DEFINITIONS[slot];
}
