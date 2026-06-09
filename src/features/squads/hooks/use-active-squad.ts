import { useSquadStore } from "@/stores/squad-store";
import type { Squad } from "@/types";

/** Returns the currently selected squad, or null when none is active. */
export function useActiveSquad(): Squad | null {
  return useSquadStore(
    (state) =>
      state.squads.find((squad) => squad.id === state.activeSquadId) ?? null,
  );
}
