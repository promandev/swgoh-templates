import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { createEmptyDatacron } from "@/features/datacrons/domain/datacron";
import { createEmptyMods } from "@/features/mods/constants/mod-rules";
import type {
  MemberDatacron,
  ModConfiguration,
  ModSetId,
  ModSlotConfig,
  ModSlotId,
  Squad,
  SquadMember,
  SquadSize,
  StatTarget,
} from "@/types";
import { createId } from "@/utils/id";

/** Legacy persisted shapes, used only by the v1 → v2 migration. */
type PersistedMember = {
  characterId: string | null;
  mods: ModConfiguration;
  sets?: ModSetId[];
  targetStats?: StatTarget[];
  datacronNotes?: string;
  datacron?: MemberDatacron;
};

type PersistedSquad = {
  id: string;
  name: string;
  size: SquadSize;
  members: PersistedMember[];
  background?: string;
  createdAt: number;
  updatedAt: number;
};

function createMember(): SquadMember {
  return {
    characterId: null,
    mods: createEmptyMods(),
    sets: [],
    targetStats: [],
    datacron: createEmptyDatacron(),
  };
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
  setMemberDatacron: (squadId: string, index: number, datacron: MemberDatacron) => void;
  setMemberMod: (squadId: string, index: number, slot: ModSlotId, config: ModSlotConfig) => void;
  setMemberSets: (squadId: string, index: number, sets: ModSetId[]) => void;
  setMemberTargetStats: (squadId: string, index: number, targetStats: StatTarget[]) => void;

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

      setMemberDatacron: (squadId, index, datacron) =>
        set((state) => ({
          squads: patchSquad(state.squads, squadId, (squad) =>
            patchMember(squad, index, (member) => ({ ...member, datacron })),
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

      setMemberSets: (squadId, index, sets) =>
        set((state) => ({
          squads: patchSquad(state.squads, squadId, (squad) =>
            patchMember(squad, index, (member) => ({ ...member, sets })),
          ),
        })),

      setMemberTargetStats: (squadId, index, targetStats) =>
        set((state) => ({
          squads: patchSquad(state.squads, squadId, (squad) =>
            patchMember(squad, index, (member) => ({ ...member, targetStats })),
          ),
        })),

      setHasHydrated: (value) => set({ hasHydrated: value }),
    }),
    {
      name: "swgoh-squad-builder",
      version: 3,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        squads: state.squads,
        activeSquadId: state.activeSquadId,
      }),
      // v1 → v2: free-text `datacronNotes` becomes a structured `datacron`.
      // v2 → v3: members gain `sets` and `targetStats` (default empty).
      migrate: (persisted, version) => {
        const state = persisted as {
          squads?: PersistedSquad[];
          activeSquadId?: string | null;
        };
        if (version < 2 && state?.squads) {
          state.squads = state.squads.map((squad) => ({
            ...squad,
            members: (squad.members ?? []).map((member) =>
              member.datacron
                ? member
                : {
                    characterId: member.characterId,
                    mods: member.mods,
                    datacron: {
                      ...createEmptyDatacron(),
                      notes: member.datacronNotes ?? "",
                    },
                  },
            ),
          }));
        }
        if (version < 3 && state?.squads) {
          state.squads = state.squads.map((squad) => ({
            ...squad,
            members: (squad.members ?? []).map((member) => ({
              ...member,
              sets: member.sets ?? [],
              targetStats: member.targetStats ?? [],
            })),
          }));
        }
        return state as unknown as SquadState;
      },
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);
