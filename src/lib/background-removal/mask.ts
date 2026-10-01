import type { RgbaImage, SegmentResult } from './segment';

/** Bilinear upscaling of a model-resolution mask (values 0–1) to the image size. */
export function resizeMask(mask: Float32Array, mw: number, mh: number, w: number, h: number) {
  const out = new Float32Array(w * h);
  for (let y = 0; y < h; y++) {
    const sy = Math.min(mh - 1, Math.max(0, ((y + 0.5) * mh) / h - 0.5));
    const y0 = Math.floor(sy);
    const y1 = Math.min(mh - 1, y0 + 1);
    const fy = sy - y0;
    for (let x = 0; x < w; x++) {
      const sx = Math.min(mw - 1, Math.max(0, ((x + 0.5) * mw) / w - 0.5));
      const x0 = Math.floor(sx);
      const x1 = Math.min(mw - 1, x0 + 1);
      const fx = sx - x0;
      const top = mask[y0 * mw + x0] * (1 - fx) + mask[y0 * mw + x1] * fx;
      const bottom = mask[y1 * mw + x0] * (1 - fx) + mask[y1 * mw + x1] * fx;
      out[y * w + x] = top * (1 - fy) + bottom * fy;
    }
  }
  return out;
}

/** Rescales raw model output to 0–1 (the model's absolute values vary per image). */
export function normalizeMask(raw: Float32Array) {
  let min = Infinity;
  let max = -Infinity;
  for (const v of raw) {
    if (v < min) min = v;
    if (v > max) max = v;
  }
  const range = max - min || 1;
  return Float32Array.from(raw, (v) => (v - min) / range);
}

/**
 * Turns a soft saliency mask (same size as the image) into a cut-out: keeps the main object and
 * sizeable parts next to it, drops stray blobs (other objects in the photo), softens the edges
 * and crops to the garment.
 */
export function cutoutFromMask(image: RgbaImage, mask: Float32Array): SegmentResult {
  const { data, width: w, height: h } = image;
  const n = w * h;

  // Connected regions of the confident foreground (4-neighbourhood).
  const label = new Int32Array(n).fill(-1);
  const queue = new Int32Array(n);
  const sizes: number[] = [];
  for (let p = 0; p < n; p++) {
    if (mask[p] <= 0.5 || label[p] >= 0) continue;
    const id = sizes.length;
    let head = 0;
    let tail = 0;
    queue[tail++] = p;
    label[p] = id;
    while (head < tail) {
      const c = queue[head++];
      const x = c % w;
      const neighbors = [x > 0 ? c - 1 : -1, x < w - 1 ? c + 1 : -1, c >= w ? c - w : -1, c < n - w ? c + w : -1];
      for (const q of neighbors) {
        if (q >= 0 && mask[q] > 0.5 && label[q] < 0) {
          label[q] = id;
          queue[tail++] = q;
        }
      }
    }
    sizes.push(tail);
  }
  const largest = Math.max(0, ...sizes);
  if (largest < n * 0.02) return { ok: false, reason: 'no-subject' };
  const keep = sizes.map((s) => s >= Math.max(largest * 0.15, n * 0.003));

  // Kept regions, grown by a few pixels so their soft edges survive.
  const kept = new Uint8Array(n);
  for (let p = 0; p < n; p++) if (label[p] >= 0 && keep[label[p]]) kept[p] = 1;
  const grown = dilate(kept, w, h, 3);

  // Soft alpha: ramp between 0.2 and 0.8 of the model's confidence.
  const alpha = new Uint8Array(n);
  for (let p = 0; p < n; p++) {
    if (!grown[p]) continue;
    const t = Math.min(1, Math.max(0, (mask[p] - 0.2) / 0.6));
    alpha[p] = Math.round(t * t * (3 - 2 * t) * 255);
  }
  return { ok: true, image: cropToAlpha(data, w, h, alpha) };
}

function dilate(mask: Uint8Array, w: number, h: number, r: number) {
  const rows = new Uint8Array(mask.length);
  for (let y = 0; y < h; y++) {
    let count = 0;
    for (let x = -r; x < w; x++) {
      if (x + r < w) count += mask[y * w + x + r];
      if (x - r - 1 >= 0) count -= mask[y * w + x - r - 1];
      if (x >= 0) rows[y * w + x] = count > 0 ? 1 : 0;
    }
  }
  const out = new Uint8Array(mask.length);
  for (let x = 0; x < w; x++) {
    let count = 0;
    for (let y = -r; y < h; y++) {
      if (y + r < h) count += rows[(y + r) * w + x];
      if (y - r - 1 >= 0) count -= rows[(y - r - 1) * w + x];
      if (y >= 0) out[y * w + x] = count > 0 ? 1 : 0;
    }
  }
  return out;
}

/** Crops to the visible pixels (plus a small margin) and applies the alpha channel. */
export function cropToAlpha(
  data: Uint8Array | Uint8ClampedArray,
  w: number,
  h: number,
  alpha: Uint8Array,
): RgbaImage {
  let minX = w;
  let minY = h;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (alpha[y * w + x] < 8) continue;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }
  const margin = Math.round(Math.max(maxX - minX, maxY - minY) * 0.04);
  minX = Math.max(0, minX - margin);
  minY = Math.max(0, minY - margin);
  maxX = Math.min(w - 1, maxX + margin);
  maxY = Math.min(h - 1, maxY + margin);

  const outW = maxX - minX + 1;
  const outH = maxY - minY + 1;
  const out = new Uint8Array(outW * outH * 4);
  for (let y = 0; y < outH; y++) {
    for (let x = 0; x < outW; x++) {
      const src = (y + minY) * w + (x + minX);
      const o = (y * outW + x) * 4;
      out[o] = data[src * 4];
      out[o + 1] = data[src * 4 + 1];
      out[o + 2] = data[src * 4 + 2];
      out[o + 3] = alpha[src];
    }
  }
  return { data: out, width: outW, height: outH };
}
