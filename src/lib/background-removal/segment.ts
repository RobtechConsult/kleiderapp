/**
 * Removes a plain background from a photo of a clothing item.
 *
 * Works on raw RGBA pixels, so the same code runs on iOS, Android and web. It targets the
 * typical wardrobe photo: one garment lying on (or hanging in front of) a fairly uniform
 * surface. The background color is estimated from the image border, then flood-filled from
 * the edges inward; soft shadows and gentle lighting gradients are followed as long as they
 * stay close to the background's hue. Whatever is not reachable that way is the garment.
 */

export type RgbaImage = { data: Uint8Array | Uint8ClampedArray; width: number; height: number };

/** busy-background: the border is not a plain surface; no-subject: nothing (or everything) stood out. */
export type SegmentFailure = 'busy-background' | 'no-subject';

export type SegmentResult = { ok: true; image: RgbaImage } | { ok: false; reason: SegmentFailure };

/** Perceptual-ish RGB distance ("redmean"), scaled to roughly 0–255. */
function colorDistance(r1: number, g1: number, b1: number, r2: number, g2: number, b2: number) {
  const rMean = (r1 + r2) / 2;
  const dr = r1 - r2;
  const dg = g1 - g2;
  const db = b1 - b2;
  return Math.sqrt((2 + rMean / 256) * dr * dr + 4 * dg * dg + (2 + (255 - rMean) / 256) * db * db) / 3;
}

const median = (values: number[]) => {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
};

export function removeBackgroundFromPixels(input: RgbaImage): SegmentResult {
  const { data, width: w, height: h } = input;
  const n = w * h;

  // 1. Background color and how uniform it is, from a thin band along the border.
  const band = Math.max(2, Math.round(Math.min(w, h) * 0.02));
  const rs: number[] = [];
  const gs: number[] = [];
  const bs: number[] = [];
  const step = Math.max(1, Math.floor((2 * (w + h) * band) / 4000)); // cap samples at ~4000
  let k = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (x >= band && x < w - band && y >= band && y < h - band) continue;
      if (k++ % step) continue;
      const i = (y * w + x) * 4;
      rs.push(data[i]);
      gs.push(data[i + 1]);
      bs.push(data[i + 2]);
    }
  }
  const bgR = median(rs);
  const bgG = median(gs);
  const bgB = median(bs);
  const spreads = rs.map((_, j) => colorDistance(rs[j], gs[j], bs[j], bgR, bgG, bgB));
  const spread = median(spreads);
  if (spread > 40) return { ok: false, reason: 'busy-background' };

  const globalTolerance = Math.min(70, Math.max(22, spread * 2.5 + 16));
  const localTolerance = 8;
  const bgLum = 0.299 * bgR + 0.587 * bgG + 0.114 * bgB;
  const bgSum = bgR + bgG + bgB || 1;

  const isBackgroundLike = (i: number) => {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    if (colorDistance(r, g, b, bgR, bgG, bgB) < globalTolerance) return true;
    // Shadow: same hue as the background, just darker.
    const lum = 0.299 * r + 0.587 * g + 0.114 * b;
    const sum = r + g + b || 1;
    const chroma = Math.abs(r / sum - bgR / bgSum) + Math.abs(g / sum - bgG / bgSum) + Math.abs(b / sum - bgB / bgSum);
    return lum > bgLum * 0.55 && lum < bgLum * 1.05 && chroma < 0.035;
  };

  // 2. Flood fill from every border pixel.
  const background = new Uint8Array(n);
  const queue = new Int32Array(n);
  let head = 0;
  let tail = 0;
  const seed = (p: number) => {
    if (!background[p] && isBackgroundLike(p * 4)) {
      background[p] = 1;
      queue[tail++] = p;
    }
  };
  for (let x = 0; x < w; x++) {
    seed(x);
    seed((h - 1) * w + x);
  }
  for (let y = 0; y < h; y++) {
    seed(y * w);
    seed(y * w + w - 1);
  }
  while (head < tail) {
    const p = queue[head++];
    const x = p % w;
    const y = (p - x) / w;
    const pi = p * 4;
    const neighbors = [x > 0 ? p - 1 : -1, x < w - 1 ? p + 1 : -1, y > 0 ? p - w : -1, y < h - 1 ? p + w : -1];
    for (const q of neighbors) {
      if (q < 0 || background[q]) continue;
      const qi = q * 4;
      const nearNeighbor =
        colorDistance(data[qi], data[qi + 1], data[qi + 2], data[pi], data[pi + 1], data[pi + 2]) < localTolerance &&
        colorDistance(data[qi], data[qi + 1], data[qi + 2], bgR, bgG, bgB) < globalTolerance * 2;
      if (nearNeighbor || isBackgroundLike(qi)) {
        background[q] = 1;
        queue[tail++] = q;
      }
    }
  }

  // 3. Solidify the silhouette. Light fabric close to the background color (white stripes on a
  //    white floor) lets the fill leak into the garment; closing narrow gaps and then filling
  //    every hole that is not connected to the border restores it.
  const radius = Math.min(10, Math.max(2, Math.round(Math.max(w, h) * 0.015)));
  const solid = smooth(fillHoles(close(invert(background), w, h, radius), w, h, queue), w, h, Math.ceil(radius / 2));
  for (let p = 0; p < n; p++) background[p] = solid[p] ? 0 : 1;

  // 4. Keep the garment: drop small specks, keep every sizeable foreground region.
  const label = new Int32Array(n).fill(-1);
  const sizes: number[] = [];
  for (let p = 0; p < n; p++) {
    if (background[p] || label[p] >= 0) continue;
    const id = sizes.length;
    let size = 0;
    head = tail = 0;
    queue[tail++] = p;
    label[p] = id;
    while (head < tail) {
      const c = queue[head++];
      size++;
      const x = c % w;
      const y = (c - x) / w;
      const neighbors = [x > 0 ? c - 1 : -1, x < w - 1 ? c + 1 : -1, y > 0 ? c - w : -1, y < h - 1 ? c + w : -1];
      for (const q of neighbors) {
        if (q >= 0 && !background[q] && label[q] < 0) {
          label[q] = id;
          queue[tail++] = q;
        }
      }
    }
    sizes.push(size);
  }
  const largest = Math.max(0, ...sizes);
  const minSize = Math.max(n * 0.004, largest * 0.08);
  const keep = sizes.map((s) => s >= minSize);
  const mask = new Uint8Array(n);
  let foreground = 0;
  for (let p = 0; p < n; p++) {
    if (label[p] >= 0 && keep[label[p]]) {
      mask[p] = 255;
      foreground++;
    }
  }
  if (foreground < n * 0.02 || foreground > n * 0.92) return { ok: false, reason: 'no-subject' };

  // 5. Soft edges: 3×3 box blur of the mask becomes the alpha channel.
  const alpha = new Uint8Array(n);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let sum = 0;
      let count = 0;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const xx = x + dx;
          const yy = y + dy;
          if (xx < 0 || yy < 0 || xx >= w || yy >= h) continue;
          sum += mask[yy * w + xx];
          count++;
        }
      }
      // Only fade outward-facing edges; never let background pixels become half-visible blobs.
      alpha[y * w + x] = mask[y * w + x] ? Math.round(sum / count) : 0;
    }
  }

  // 6. Crop to the garment with a small margin.
  let minX = w;
  let minY = h;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (!alpha[y * w + x]) continue;
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
  return { ok: true, image: { data: out, width: outW, height: outH } };
}

const invert = (mask: Uint8Array) => mask.map((v) => (v ? 0 : 1));

/**
 * Square dilation (or erosion) of a binary mask, separable into rows then columns.
 * A sliding count of set pixels keeps it linear in the image size, whatever the radius.
 */
function morph(mask: Uint8Array, w: number, h: number, r: number, dilate: boolean) {
  // Erosion of the mask is dilation of its complement.
  const src = dilate ? mask : invert(mask);
  const pass = (input: Uint8Array, length: number, lines: number, index: (line: number, i: number) => number) => {
    const out = new Uint8Array(input.length);
    for (let line = 0; line < lines; line++) {
      let count = 0;
      for (let i = -r; i < length; i++) {
        if (i + r < length) count += input[index(line, i + r)];
        if (i - r - 1 >= 0) count -= input[index(line, i - r - 1)];
        if (i >= 0) out[index(line, i)] = count > 0 ? 1 : 0;
      }
    }
    return out;
  };
  const rows = pass(src, w, h, (y, x) => y * w + x);
  const both = pass(rows, h, w, (x, y) => y * w + x);
  return dilate ? both : invert(both);
}

/** Morphological closing: bridges gaps narrower than 2·r in the foreground mask. */
const close = (mask: Uint8Array, w: number, h: number, r: number) =>
  morph(morph(mask, w, h, r, true), w, h, r, false);

/** Marks as foreground every background region that does not touch the image border. */
function fillHoles(mask: Uint8Array, w: number, h: number, queue: Int32Array) {
  const outside = new Uint8Array(mask.length);
  let head = 0;
  let tail = 0;
  const push = (p: number) => {
    if (!mask[p] && !outside[p]) {
      outside[p] = 1;
      queue[tail++] = p;
    }
  };
  for (let x = 0; x < w; x++) {
    push(x);
    push((h - 1) * w + x);
  }
  for (let y = 0; y < h; y++) {
    push(y * w);
    push(y * w + w - 1);
  }
  while (head < tail) {
    const p = queue[head++];
    const x = p % w;
    if (x > 0) push(p - 1);
    if (x < w - 1) push(p + 1);
    if (p >= w) push(p - w);
    if (p < (h - 1) * w) push(p + w);
  }
  return outside.map((v) => (v ? 0 : 1));
}

/** Rounds off blocky corners: blur the mask twice with a box filter, then threshold at 50 %. */
function smooth(mask: Uint8Array, w: number, h: number, r: number) {
  let values = Float32Array.from(mask);
  for (let pass = 0; pass < 2; pass++) values = boxBlur(values, w, h, r);
  return Uint8Array.from(values, (v) => (v >= 0.5 ? 1 : 0));
}

function boxBlur(src: Float32Array, w: number, h: number, r: number) {
  const tmp = new Float32Array(src.length);
  const out = new Float32Array(src.length);
  for (let y = 0; y < h; y++) {
    let sum = 0;
    let count = 0;
    for (let x = -r; x < w; x++) {
      const add = x + r;
      if (add < w) {
        sum += src[y * w + add];
        count++;
      }
      const drop = x - r - 1;
      if (drop >= 0) {
        sum -= src[y * w + drop];
        count--;
      }
      if (x >= 0) tmp[y * w + x] = sum / count;
    }
  }
  for (let x = 0; x < w; x++) {
    let sum = 0;
    let count = 0;
    for (let y = -r; y < h; y++) {
      const add = y + r;
      if (add < h) {
        sum += tmp[add * w + x];
        count++;
      }
      const drop = y - r - 1;
      if (drop >= 0) {
        sum -= tmp[drop * w + x];
        count--;
      }
      if (y >= 0) out[y * w + x] = sum / count;
    }
  }
  return out;
}
