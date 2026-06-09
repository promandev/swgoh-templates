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

    // We build the font CSS ourselves and hand it to `toBlob`. Passing
    // `fontEmbedCSS` stops html-to-image from scanning `document.styleSheets`,
    // which throws `SecurityError: Cannot access rules` whenever a cross-origin
    // sheet is present (a browser extension is enough to trigger it).
    const fontEmbedCSS = await buildFontEmbedCSS();

    const blob = await toBlob(node, {
      pixelRatio: options.pixelRatio ?? 2,
      backgroundColor: options.backgroundColor,
      cacheBust: true,
      fontEmbedCSS,
    });

    if (!blob) {
      throw new Error("Failed to render the export image");
    }
    return blob;
  }
}

/**
 * Collects the page's `@font-face` rules and inlines their font files as data
 * URLs, so the fonts survive the SVG/foreignObject snapshot html-to-image
 * renders into. Any stylesheet we can't read (cross-origin) is skipped instead
 * of throwing — that's the whole point of doing this ourselves.
 */
async function buildFontEmbedCSS(): Promise<string> {
  const fontFaces: string[] = [];

  for (const sheet of Array.from(document.styleSheets)) {
    let rules: CSSRuleList;
    try {
      rules = sheet.cssRules;
    } catch {
      continue; // cross-origin sheet — `cssRules` is not accessible.
    }
    for (const rule of Array.from(rules)) {
      if (rule instanceof CSSFontFaceRule) {
        fontFaces.push(rule.cssText);
      }
    }
  }

  let css = fontFaces.join("\n");

  const urls = new Set(
    Array.from(css.matchAll(/url\(["']?([^"')]+)["']?\)/g), (m) => m[1]),
  );

  await Promise.all(
    Array.from(urls).map(async (url) => {
      try {
        const absolute = new URL(url, document.baseURI).href;
        const response = await fetch(absolute, { cache: "force-cache" });
        const dataUrl = await blobToDataURL(await response.blob());
        css = css.split(url).join(dataUrl);
      } catch {
        // Couldn't fetch this font — leave the original url(); export still works.
      }
    }),
  );

  return css;
}

function blobToDataURL(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}
