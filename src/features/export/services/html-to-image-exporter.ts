import { toBlob } from "html-to-image";

import type {
  ExportFormat,
  ExportOptions,
  ImageExporter,
} from "../domain/image-exporter";

/**
 * {@link ImageExporter} backed by `html-to-image` — the most reliable
 * DOM-to-image library for fonts and SVG. Currently renders PNG; the JPG/PDF
 * branches are reserved for future formats.
 */
export class HtmlToImageExporter implements ImageExporter {
  readonly supportedFormats = ["png"] as const;

  supports(format: ExportFormat): boolean {
    return (this.supportedFormats as readonly ExportFormat[]).includes(format);
  }

  async toBlob(
    node: HTMLElement,
    format: ExportFormat,
    options: ExportOptions = {},
  ): Promise<Blob> {
    if (!this.supports(format)) {
      throw new Error(`Export format "${format}" is not supported yet`);
    }

    const blob = await toBlob(node, {
      pixelRatio: options.pixelRatio ?? 2,
      backgroundColor: options.backgroundColor,
      cacheBust: true,
    });

    if (!blob) {
      throw new Error("Failed to render the export image");
    }
    return blob;
  }
}
