import { removeBackgroundFromPixels } from './segment';

import type { BackgroundRemovalResult } from './index';

export type { BackgroundRemovalResult } from './index';

// Browsers run the same algorithm with a JIT, so a larger working size is fine.
const MAX_SIDE = 768;

function loadImage(uri: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Could not load image'));
    img.src = uri;
  });
}

/** Returns a transparent WebP (or PNG where WebP encoding is unsupported) as a data URL. */
export async function removeBackground(uri: string): Promise<BackgroundRemovalResult> {
  const img = await loadImage(uri);
  const scale = Math.min(1, MAX_SIDE / Math.max(img.naturalWidth, img.naturalHeight));
  const width = Math.round(img.naturalWidth * scale);
  const height = Math.round(img.naturalHeight * scale);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('Canvas 2D is not available');
  ctx.drawImage(img, 0, 0, width, height);
  const pixels = ctx.getImageData(0, 0, width, height);

  await new Promise((resolve) => setTimeout(resolve, 50));
  const result = removeBackgroundFromPixels({ data: pixels.data, width, height });
  if (!result.ok) return result;

  const { data, width: w, height: h } = result.image;
  canvas.width = w;
  canvas.height = h;
  ctx.putImageData(new ImageData(new Uint8ClampedArray(data), w, h), 0, 0);
  const webp = canvas.toDataURL('image/webp', 0.9);
  return { ok: true, uri: webp.startsWith('data:image/webp') ? webp : canvas.toDataURL('image/png') };
}
