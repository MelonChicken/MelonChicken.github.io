import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

export type AssetDownloadResult = {
  src: string;
  filename: string;
  downloaded: boolean;
  error?: string;
};

export async function downloadNotionAsset(sourceUrl: string, slug: string, blockId: string): Promise<AssetDownloadResult> {
  const extensionFromSource = extensionFromUrl(sourceUrl);
  const fallbackName = `${sanitizeBlockId(blockId)}${extensionFromSource || '.bin'}`;

  try {
    const response = await fetch(sourceUrl);
    if (!response.ok) {
      throw new Error(`${response.status} ${response.statusText}`.trim());
    }

    const contentType = response.headers.get('content-type') || '';
    const extension = extensionFromSource || extensionFromContentType(contentType) || '.bin';
    const filename = `${sanitizeBlockId(blockId)}${extension}`;
    const outputDir = path.join(process.cwd(), 'public', 'notion-assets', slug);
    const outputPath = path.join(outputDir, filename);

    await fs.mkdir(outputDir, { recursive: true });
    await fs.writeFile(outputPath, Buffer.from(await response.arrayBuffer()));

    return {
      src: `/notion-assets/${slug}/${filename}`,
      filename,
      downloaded: true,
    };
  } catch (error) {
    const urlHash = crypto.createHash('sha1').update(sourceUrl).digest('hex').slice(0, 8);
    return {
      src: sourceUrl,
      filename: `${path.basename(fallbackName, path.extname(fallbackName))}-${urlHash}${path.extname(fallbackName)}`,
      downloaded: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

function sanitizeBlockId(blockId: string) {
  return blockId.replace(/-/g, '').replace(/[^a-zA-Z0-9]/g, '').slice(0, 32) || 'asset';
}

function extensionFromUrl(value: string) {
  try {
    const pathname = new URL(value).pathname;
    const extension = path.extname(pathname).toLowerCase();
    return extension && extension.length <= 10 ? extension : '';
  } catch {
    return '';
  }
}

function extensionFromContentType(value: string) {
  if (value.includes('avif')) return '.avif';
  if (value.includes('webp')) return '.webp';
  if (value.includes('png')) return '.png';
  if (value.includes('jpeg') || value.includes('jpg')) return '.jpg';
  if (value.includes('gif')) return '.gif';
  if (value.includes('svg')) return '.svg';
  if (value.includes('pdf')) return '.pdf';
  if (value.includes('zip')) return '.zip';
  return '';
}
