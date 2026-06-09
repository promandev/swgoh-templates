"use client";

import { useMemo, useState } from "react";

import { downloadBlob } from "@/utils/download";
import { HtmlToImageExporter } from "../services/html-to-image-exporter";
import { useExportPreferences } from "../stores/export-preferences";

/** Solid backdrop baked into the exported image (matches the card palette). */
const EXPORT_BACKGROUND = "#09090b";

export function useExport() {
  const exporter = useMemo(() => new HtmlToImageExporter(), []);
  const pixelRatio = useExportPreferences((s) => s.pixelRatio);
  const recordExport = useExportPreferences((s) => s.recordExport);
  const [isExporting, setIsExporting] = useState(false);

  async function exportPng(
    node: HTMLElement,
    filename: string,
    squadId: string,
  ): Promise<void> {
    setIsExporting(true);
    try {
      const blob = await exporter.toBlob(node, "png", {
        pixelRatio,
        backgroundColor: EXPORT_BACKGROUND,
      });
      downloadBlob(blob, `${filename}.png`);
      recordExport(squadId);
    } finally {
      setIsExporting(false);
    }
  }

  return { exportPng, isExporting };
}
