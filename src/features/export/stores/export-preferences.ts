import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import type { ExportFormat } from "../domain/image-exporter";

/**
 * Persisted export preferences and last-export metadata. Kept separate from the
 * squad store so visual/export settings can grow independently.
 */
interface ExportPreferencesState {
  format: ExportFormat;
  pixelRatio: number;
  lastExportedSquadId: string | null;
  lastExportedAt: number | null;
  setFormat: (format: ExportFormat) => void;
  setPixelRatio: (pixelRatio: number) => void;
  recordExport: (squadId: string) => void;
}

export const useExportPreferences = create<ExportPreferencesState>()(
  persist(
    (set) => ({
      format: "png",
      pixelRatio: 2,
      lastExportedSquadId: null,
      lastExportedAt: null,
      setFormat: (format) => set({ format }),
      setPixelRatio: (pixelRatio) => set({ pixelRatio }),
      recordExport: (squadId) =>
        set({ lastExportedSquadId: squadId, lastExportedAt: Date.now() }),
    }),
    {
      name: "swgoh-export-preferences",
      version: 1,
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
