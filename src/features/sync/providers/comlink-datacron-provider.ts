import type { DatacronProvider } from "@/features/datacrons/domain/datacron-provider";
import type { DatacronSet } from "@/types";

/**
 * Experimental datacron loader for a self-hosted swgoh-comlink instance. Reads
 * the `datacronSet` definitions from game data and resolves their names via the
 * localization bundle. Configure `COMLINK_URL`. Untested against a live instance
 * here — a correct-shaped starting point, consistent with the character comlink
 * provider.
 */
interface ComlinkMetadata {
  latestGamedataVersion: string;
  latestLocalizationBundleVersion: string;
}

interface ComlinkDatacronSet {
  id?: string | number;
  displayName?: string;
  nameKey?: string;
  expirationTimeMs?: string;
}

function parseLocalization(raw: unknown): Record<string, string> {
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    return raw as Record<string, string>;
  }
  const map: Record<string, string> = {};
  if (typeof raw === "string") {
    for (const line of raw.split(/\r?\n/)) {
      const separator = line.indexOf("|");
      if (separator > 0) map[line.slice(0, separator)] = line.slice(separator + 1);
    }
  }
  return map;
}

export class ComlinkDatacronProvider implements DatacronProvider {
  readonly name = "swgoh-comlink";

  constructor(private readonly baseUrl: string) {}

  private async post<T>(path: string, body: unknown): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      throw new Error(`comlink ${path} responded with ${response.status}`);
    }
    return (await response.json()) as T;
  }

  async getSets(): Promise<DatacronSet[]> {
    const metadata = await this.post<ComlinkMetadata>("/metadata", {});

    const data = await this.post<{ datacronSet?: ComlinkDatacronSet[] }>("/data", {
      payload: {
        version: metadata.latestGamedataVersion,
        includePveUnits: false,
        requestSegment: 0,
      },
      enums: false,
    });

    const localization = await this.post<Record<string, unknown>>(
      "/localization",
      { payload: { id: metadata.latestLocalizationBundleVersion }, unzip: true },
    );
    const strings = parseLocalization(localization["Loc_ENG_US.txt"]);

    return (data.datacronSet ?? [])
      .map((set) => {
        const id = String(set.id ?? "");
        const nameKey = set.displayName ?? set.nameKey ?? "";
        const name = strings[nameKey] ?? nameKey ?? (id && `Set ${id}`);
        return id && name ? { id, name } : null;
      })
      .filter((set): set is DatacronSet => set !== null);
  }
}
