import { access, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

/**
 * Downloads a remote portrait and stores it as a locally-optimized `.webp`.
 * The frontend only ever references the returned public path — never the
 * remote URL.
 */
export class AvatarDownloader {
  constructor(
    private readonly outputDir: string,
    private readonly publicBase = "/assets/characters",
    private readonly size = 128,
  ) {}

  private filePath(id: string): string {
    return path.join(this.outputDir, `${id}.webp`);
  }

  publicPath(id: string): string {
    return `${this.publicBase}/${id}.webp`;
  }

  async exists(id: string): Promise<boolean> {
    try {
      await access(this.filePath(id));
      return true;
    } catch {
      return false;
    }
  }

  async download(id: string, url: string): Promise<void> {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`avatar ${id} responded with ${response.status}`);
    }
    const input = Buffer.from(await response.arrayBuffer());
    const output = await sharp(input)
      .resize(this.size, this.size, { fit: "cover" })
      .webp({ quality: 90 })
      .toBuffer();

    await mkdir(this.outputDir, { recursive: true });
    await writeFile(this.filePath(id), output);
  }
}
