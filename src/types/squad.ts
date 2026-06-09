import type { ModConfiguration } from "./mods";

export type SquadSize = 3 | 5;

export interface SquadMember {
  characterId: string | null;
  mods: ModConfiguration;
  datacronNotes: string;
}

export interface Squad {
  id: string;
  name: string;
  size: SquadSize;
  members: SquadMember[];
  createdAt: number;
  updatedAt: number;
}
