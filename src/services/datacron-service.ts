import datacronSetsData from "@/data/datacrons.json";
import type { DatacronSet } from "@/types";

/**
 * Reads the locally-stored datacron sets (`src/data/datacrons.json`, populated
 * by the optional `npm run sync:datacrons`). Empty until a sync runs against a
 * reachable source (self-hosted comlink or swgoh.gg); the modal still works with
 * manual set entry.
 */
export interface DatacronService {
  getSets(): DatacronSet[];
}

export const datacronService: DatacronService = {
  getSets: () => datacronSetsData as DatacronSet[],
};
