/**
 * Export abstraction. PNG is implemented today; JPG and PDF are part of the
 * contract so they can be added later without changing callers (Open/Closed).
 */
export type ExportFormat = "png" | "jpg" | "pdf";

export interface ExportOptions {
  /** Output scale factor — 2 produces a crisp, share-ready image. */
  pixelRatio?: number;
  /** Solid background applied behind the node. */
  backgroundColor?: string;
}

export interface ImageExporter {
  readonly supportedFormats: readonly ExportFormat[];
  supports(format: ExportFormat): boolean;
  toBlob(
    node: HTMLElement,
    format: ExportFormat,
    options?: ExportOptions,
  ): Promise<Blob>;
}
