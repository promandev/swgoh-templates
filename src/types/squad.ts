import type { MemberDatacron } from "./datacron";
import type { ModSetId, StatTarget } from "./mod-sets";
import type { ModConfiguration } from "./mods";

export type SquadSize = 3 | 5;

export interface SquadMember {
  characterId: string | null;
  mods: ModConfiguration;
  /** Recommended mod set bonuses for this character (e.g. Speed + Health). */
  sets: ModSetId[];
  /** Up to MAX_TARGET_STATS aggregate stat goals (the "radio spinner"). */
  targetStats: StatTarget[];
  datacron: MemberDatacron;
}

export interface Squad {
  id: string;
  name: string;
  size: SquadSize;
  members: SquadMember[];
  /** Id of the chosen export background preset; falls back to the default. */
  background?: string;
  createdAt: number;
  updatedAt: number;
}
