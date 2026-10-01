import { cutoutFromMask, normalizeMask, resizeMask } from './mask';
import { removeBackgroundFromPixels, type SegmentResult } from './segment';

import type { BackgroundRemovalResult } from './index';

export type { BackgroundRemovalResult } from './index';

/** Working size of the cut-out (the model itself always sees 320×320). */
const MAX_SIDE = 1024;
const MODEL_SIZE = 320;
const MEAN = [0.485, 0.456, 0.406];
const STD = [0.229, 0.224, 0.225];

// Minimal typing of the onnxruntime-web global (loaded as a script from public/ort).
type OrtTensor = { data: Float32Array };
type OrtSession = {
  inputNames: readonly string[];
  outputNames: readonly string[];
  run: (feeds: Record<string, OrtTensor>) => Promise<Record<string, OrtTensor>>;
};
type Ort = {
  env: { wasm: { wasmPaths: string; numThreads: number } };
  Tensor: new (type: 'float32', data: Float32Array, dims: number[]) => OrtTensor;
  InferenceSession: { create: (url: string, options: object) => Promise<OrtSession> };
};
declare global {
  interface Window {
    ort?: Ort;
  }
}

const base = process.env.EXPO_BASE_URL ?? '';

function loadScript(src: string) {
  return new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Could not load ${src}`));
    document.head.appendChild(script);
  });
}

let session: Promise<{ ort: Ort; session: OrtSession }> | null = null;

/** Loads runtime (≈11 MB) and model (≈4.6 MB) once, on first use; the browser caches both. */
function getSession() {
  session ??= (async () => {
    if (!window.ort) await loadScript(`${base}/ort/ort.wasm.min.js`);
    const ort = window.ort!;
    ort.env.wasm.wasmPaths = `${base}/ort/`;
    ort.env.wasm.numThreads = 1; // GitHub Pages is not cross-origin isolated, so no WASM threads
    const s = await ort.InferenceSession.create(`${base}/models/u2netp.onnx`, { executionProviders: ['wasm'] });
    return { ort, session: s };
  })().catch((e) => {
    session = null; // allow a retry later (e.g. after being offline)
    throw e;
  });
  return session;
}

/** Starts downloading the model in the background, e.g. when the add-item screen opens. */
export function preloadBackgroundRemoval() {
  getSession().catch(() => {});
}

function loadImage(uri: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Could not load image'));
    img.src = uri;
  });
}

/** Saliency mask (0–1) at model resolution from the U²-Net-P model. */
async function predictMask(img: HTMLImageElement) {
  const { ort, session: s } = await getSession();
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = MODEL_SIZE;
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  ctx.drawImage(img, 0, 0, MODEL_SIZE, MODEL_SIZE);
  const { data } = ctx.getImageData(0, 0, MODEL_SIZE, MODEL_SIZE);

  // Same preprocessing as the reference implementation (rembg): scale by the brightest value,
  // then ImageNet mean/std, channels first.
  let max = 1;
  for (let i = 0; i < data.length; i += 4) max = Math.max(max, data[i], data[i + 1], data[i + 2]);
  const plane = MODEL_SIZE * MODEL_SIZE;
  const input = new Float32Array(3 * plane);
  for (let p = 0; p < plane; p++) {
    for (let c = 0; c < 3; c++) input[c * plane + p] = (data[p * 4 + c] / max - MEAN[c]) / STD[c];
  }
  const output = await s.run({ [s.inputNames[0]]: new ort.Tensor('float32', input, [1, 3, MODEL_SIZE, MODEL_SIZE]) });
  return normalizeMask(output[s.outputNames[0]].data);
}

/**
 * Returns a transparent WebP (or PNG where WebP encoding is unsupported) as a data URL.
 * Uses the AI model; falls back to the colour-based algorithm if the model can't be loaded.
 */
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
  const pixels = { data: ctx.getImageData(0, 0, width, height).data, width, height };

  let result: SegmentResult;
  try {
    const mask = await predictMask(img);
    result = cutoutFromMask(pixels, resizeMask(mask, MODEL_SIZE, MODEL_SIZE, width, height));
  } catch (e) {
    console.warn('AI background removal unavailable, using the colour-based fallback', e);
    result = removeBackgroundFromPixels(pixels);
  }
  if (!result.ok) return result;

  const { data, width: w, height: h } = result.image;
  canvas.width = w;
  canvas.height = h;
  ctx.putImageData(new ImageData(new Uint8ClampedArray(data), w, h), 0, 0);
  const webp = canvas.toDataURL('image/webp', 0.9);
  return { ok: true, uri: webp.startsWith('data:image/webp') ? webp : canvas.toDataURL('image/png') };
}
