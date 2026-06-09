import type { DatacronSet } from "@/types";

/**
 * Abstraction for datacron data. The feature is not implemented yet; this null
 * provider keeps the architecture in place so a real source can be added later
 * without changing consumers.
 */
export interface DatacronProvider {
  readonly name: string;
  getSets(): Promise<DatacronSet[]>;
}

export const nullDatacronProvider: DatacronProvider = {
  name: "null",
  async getSets() {
    return [];
  },
};
