import { File, Paths } from 'expo-file-system';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

import { decodePng, encodePng } from './png';
import { removeBackgroundFromPixels, type SegmentFailure } from './segment';

export type BackgroundRemovalResult = { ok: true; uri: string } | { ok: false; reason: SegmentFailure };

/**
 * Working size. The algorithm runs in JavaScript (Hermes has no JIT), so the photo is
 * downscaled first; 640 px keeps it at a couple of seconds on a phone.
 */
const MAX_SIDE = 640;

/** Lets the "removing background" overlay render before the JS thread gets busy. */
const nextFrame = () => new Promise((resolve) => setTimeout(resolve, 50));

/** Returns a transparent PNG of the garment, written to the cache directory. */
export async function removeBackground(uri: string): Promise<BackgroundRemovalResult> {
  const original = await ImageManipulator.manipulate(uri).renderAsync();
  const scale = Math.min(1, MAX_SIDE / Math.max(original.width, original.height));
  const context = ImageManipulator.manipulate(uri);
  if (scale < 1) {
    context.resize({ width: Math.round(original.width * scale), height: Math.round(original.height * scale) });
  }
  const small = await (await context.renderAsync()).saveAsync({ format: SaveFormat.PNG });

  const bytes = await new File(small.uri).bytes();
  await nextFrame();
  const result = removeBackgroundFromPixels(decodePng(bytes));
  if (!result.ok) return result;

  const cutout = new File(Paths.cache, `cutout-${Date.now()}.png`);
  cutout.write(encodePng(result.image));
  return { ok: true, uri: cutout.uri };
}
