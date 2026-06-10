import type { DatacronProvider } from "@/features/datacrons/domain/datacron-provider";
import type { DatacronSet } from "@/types";

/**
 * Loads datacron sets from the swgoh.gg public API. Like the character API it
 * sits behind Cloudflare, so it may answer `403` from challenged networks; run
 * it from an unrestricted environment. Shapes are handled defensively because
 * the endpoint isn't reachable to verify here.
 */
const API_URL = "https://swgoh.gg/api/datacron-sets/";

interface RawDatacronSet {
  id?: number | string;
  set_id?: number | string;
  name?: string;
  display_name?: string;
}

export class SwgohGgDatacronProvider implements DatacronProvider {
  readonly name = "swgoh.gg";

  async getSets(): Promise<DatacronSet[]> {
    const response = await fetch(API_URL, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        Accept: "application/json, text/plain, */*",
      },
    });
    if (!response.ok) {
      throw new Error(`swgoh.gg datacron-sets responded with ${response.status}`);
    }

    const raw = (await response.json()) as RawDatacronSet[];
    return raw
      .map((entry) => {
        const id = String(entry.set_id ?? entry.id ?? "");
        const name = entry.name ?? entry.display_name ?? (id && `Set ${id}`);
        return id && name ? { id, name } : null;
      })
      .filter((set): set is DatacronSet => set !== null);
  }
}
