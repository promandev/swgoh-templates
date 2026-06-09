import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";

import type { ProviderCharacter } from "./domain/character-provider";

export interface ManifestEntry {
  hash: string;
  avatar: boolean;
  updatedAt: string;
}

export type Manifest = Record<string, ManifestEntry>;

/** Stable content hash of a source character, used to detect changes. */
export function hashCharacter(character: ProviderCharacter): string {
  const payload = JSON.stringify({
    id: character.id,
    name: character.name,
    alignment: character.alignment,
    factions: character.factions,
    imageUrl: character.imageUrl,
  });
  return createHash("sha1").update(payload).digest("hex");
}

/**
 * Persists a sync manifest (hash + avatar flag + timestamp per character) so
 * updates are incremental: unchanged characters are skipped and existing
 * avatars are not re-downloaded.
 */
export class SyncCache {
  constructor(private readonly file: string) {}

  async read(): Promise<Manifest> {
    try {
      const content = await readFile(this.file, "utf8");
      return JSON.parse(content) as Manifest;
    } catch {
      return {};
    }
  }

  async write(manifest: Manifest): Promise<void> {
    await mkdir(path.dirname(this.file), { recursive: true });
    await writeFile(this.file, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  }
}
