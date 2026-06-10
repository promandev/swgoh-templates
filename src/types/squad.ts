import type { MemberDatacron } from "./datacron";
import type { ModConfiguration } from "./mods";

export type SquadSize = 3 | 5;

export interface SquadMember {
  characterId: string | null;
  mods: ModConfiguration;
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
