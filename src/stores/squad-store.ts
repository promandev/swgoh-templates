import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { createEmptyMods } from "@/features/mods/constants/mod-rules";
import type { ModSlotConfig, ModSlotId, Squad, SquadMember, SquadSize } from "@/types";
import { createId } from "@/utils/id";

function createMember(): SquadMember {
  return { characterId: null, mods: createEmptyMods(), datacronNotes: "" };
}

function createSquad(name: string, size: SquadSize): Squad {
  const now = Date.now();
  return {
    id: createId(),
    name,
    size,
    members: Array.from({ length: size }, createMember),
    createdAt: now,
    updatedAt: now,
  };
}

/** Resize a member list while preserving as much existing data as possible. */
function resizeMembers(members: SquadMember[], size: SquadSize): SquadMember[] {
  if (members.length === size) return members;
  if (members.length > size) return members.slice(0, size);
  return [
    ...members,
    ...Array.from({ length: size - members.length }, createMember),
  ];
}

interface SquadState {
  squads: Squad[];
  activeSquadId: string | null;
  hasHydrated: boolean;

  createSquad: (name: string, size?: SquadSize) => string;
  deleteSquad: (id: string) => void;
  renameSquad: (id: string, name: string) => void;
  setActiveSquad: (id: string | null) => void;
  setSquadSize: (id: string, size: SquadSize) => void;
  setSquadBackground: (id: string, background: string) => void;

  setMemberCharacter: (squadId: string, index: number, characterId: string | null) => void;
  setMemberDatacron: (squadId: string, index: number, notes: string) => void;
  setMemberMod: (squadId: string, index: number, slot: ModSlotId, config: ModSlotConfig) => void;

  setHasHydrated: (value: boolean) => void;
}

/** Immutably update one squad by id, bumping its `updatedAt`. */
function patchSquad(
  squads: Squad[],
  id: string,
  updater: (squad: Squad) => Squad,
): Squad[] {
  return squads.map((squad) =>
    squad.id === id ? { ...updater(squad), updatedAt: Date.now() } : squad,
  );
}

/** Immutably update one member within a squad. */
function patchMember(
  squad: Squad,
  index: number,
  updater: (member: SquadMember) => SquadMember,
): Squad {
  return {
    ...squad,
    members: squad.members.map((member, i) =>
      i === index ? updater(member) : member,
    ),
  };
}

export const useSquadStore = create<SquadState>()(
  persist(
    (set) => ({
      squads: [],
      activeSquadId: null,
      hasHydrated: false,

      createSquad: (name, size = 5) => {
        const squad = createSquad(name, size);
        set((state) => ({
          squads: [...state.squads, squad],
          activeSquadId: squad.id,
        }));
        return squad.id;
      },

      deleteSquad: (id) =>
        set((state) => {
          const squads = state.squads.filter((squad) => squad.id !== id);
          const activeSquadId =
            state.activeSquadId === id
              ? (squads[0]?.id ?? null)
              : state.activeSquadId;
          return { squads, activeSquadId };
        }),

      renameSquad: (id, name) =>
        set((state) => ({
          squads: patchSquad(state.squads, id, (squad) => ({ ...squad, name })),
        })),

      setActiveSquad: (id) => set({ activeSquadId: id }),

      setSquadBackground: (id, background) =>
        set((state) => ({
          squads: patchSquad(state.squads, id, (squad) => ({
            ...squad,
            background,
          })),
        })),

      setSquadSize: (id, size) =>
        set((state) => ({
          squads: patchSquad(state.squads, id, (squad) => ({
            ...squad,
            size,
            members: resizeMembers(squad.members, size),
          })),
        })),

      setMemberCharacter: (squadId, index, characterId) =>
        set((state) => ({
          squads: patchSquad(state.squads, squadId, (squad) =>
            patchMember(squad, index, (member) => ({ ...member, characterId })),
          ),
        })),

      setMemberDatacron: (squadId, index, notes) =>
        set((state) => ({
          squads: patchSquad(state.squads, squadId, (squad) =>
            patchMember(squad, index, (member) => ({
              ...member,
              datacronNotes: notes,
            })),
          ),
        })),

      setMemberMod: (squadId, index, slot, config) =>
        set((state) => ({
          squads: patchSquad(state.squads, squadId, (squad) =>
            patchMember(squad, index, (member) => ({
              ...member,
              mods: { ...member.mods, [slot]: config },
            })),
          ),
        })),

      setHasHydrated: (value) => set({ hasHydrated: value }),
    }),
    {
      name: "swgoh-squad-builder",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        squads: state.squads,
        activeSquadId: state.activeSquadId,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);
