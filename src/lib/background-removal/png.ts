/**
 * Minimal PNG reader/writer for 8-bit RGB/RGBA, non-interlaced images – exactly what
 * expo-image-manipulator produces and what we write back. Pure JS (fflate for zlib),
 * so it runs on Hermes without native code or TextDecoder.
 */
import { unzlibSync, zlibSync } from 'fflate';

import type { RgbaImage } from './segment';

const SIGNATURE = [137, 80, 78, 71, 13, 10, 26, 10];

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(bytes: Uint8Array, start: number, end: number) {
  let c = 0xffffffff;
  for (let i = start; i < end; i++) c = CRC_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

const readUint32 = (b: Uint8Array, o: number) => ((b[o] << 24) | (b[o + 1] << 16) | (b[o + 2] << 8) | b[o + 3]) >>> 0;
const chunkType = (b: Uint8Array, o: number) => String.fromCharCode(b[o], b[o + 1], b[o + 2], b[o + 3]);

export function decodePng(bytes: Uint8Array): RgbaImage {
  for (let i = 0; i < 8; i++) if (bytes[i] !== SIGNATURE[i]) throw new Error('Not a PNG file');

  let width = 0;
  let height = 0;
  let channels = 0;
  const idat: Uint8Array[] = [];
  let offset = 8;
  while (offset < bytes.length) {
    const length = readUint32(bytes, offset);
    const type = chunkType(bytes, offset + 4);
    const body = bytes.subarray(offset + 8, offset + 8 + length);
    if (type === 'IHDR') {
      width = readUint32(body, 0);
      height = readUint32(body, 4);
      const bitDepth = body[8];
      const colorType = body[9];
      const interlace = body[12];
      if (bitDepth !== 8 || interlace !== 0 || (colorType !== 2 && colorType !== 6)) {
        throw new Error(`Unsupported PNG (depth ${bitDepth}, color type ${colorType}, interlace ${interlace})`);
      }
      channels = colorType === 6 ? 4 : 3;
    } else if (type === 'IDAT') {
      idat.push(body);
    } else if (type === 'IEND') {
      break;
    }
    offset += 12 + length;
  }

  const compressed = new Uint8Array(idat.reduce((sum, c) => sum + c.length, 0));
  let pos = 0;
  for (const c of idat) {
    compressed.set(c, pos);
    pos += c.length;
  }
  const raw = unzlibSync(compressed);

  // Undo the per-row filters (PNG spec section 9).
  const stride = width * channels;
  const pixels = new Uint8Array(stride * height);
  for (let y = 0; y < height; y++) {
    const filter = raw[y * (stride + 1)];
    const src = y * (stride + 1) + 1;
    const dst = y * stride;
    for (let x = 0; x < stride; x++) {
      const left = x >= channels ? pixels[dst + x - channels] : 0;
      const up = y > 0 ? pixels[dst - stride + x] : 0;
      const upLeft = y > 0 && x >= channels ? pixels[dst - stride + x - channels] : 0;
      let predictor = 0;
      if (filter === 1) predictor = left;
      else if (filter === 2) predictor = up;
      else if (filter === 3) predictor = (left + up) >> 1;
      else if (filter === 4) {
        const p = left + up - upLeft;
        const pa = Math.abs(p - left);
        const pb = Math.abs(p - up);
        const pc = Math.abs(p - upLeft);
        predictor = pa <= pb && pa <= pc ? left : pb <= pc ? up : upLeft;
      }
      pixels[dst + x] = (raw[src + x] + predictor) & 0xff;
    }
  }

  if (channels === 4) return { data: pixels, width, height };
  const rgba = new Uint8Array(width * height * 4);
  for (let i = 0, j = 0; i < pixels.length; i += 3, j += 4) {
    rgba[j] = pixels[i];
    rgba[j + 1] = pixels[i + 1];
    rgba[j + 2] = pixels[i + 2];
    rgba[j + 3] = 255;
  }
  return { data: rgba, width, height };
}

export function encodePng({ data, width, height }: RgbaImage): Uint8Array {
  // Filter type 1 ("Sub") on every row compresses photos well and is trivial to compute.
  const stride = width * 4;
  const raw = new Uint8Array((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    const row = y * (stride + 1);
    raw[row] = 1;
    for (let x = 0; x < stride; x++) {
      const left = x >= 4 ? data[y * stride + x - 4] : 0;
      raw[row + 1 + x] = (data[y * stride + x] - left) & 0xff;
    }
  }
  const idat = zlibSync(raw, { level: 6 });

  const ihdr = new Uint8Array(13);
  const view = new DataView(ihdr.buffer);
  view.setUint32(0, width);
  view.setUint32(4, height);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA

  const chunks: [string, Uint8Array][] = [
    ['IHDR', ihdr],
    ['IDAT', idat],
    ['IEND', new Uint8Array(0)],
  ];
  const total = 8 + chunks.reduce((sum, [, body]) => sum + 12 + body.length, 0);
  const out = new Uint8Array(total);
  out.set(SIGNATURE, 0);
  let offset = 8;
  for (const [type, body] of chunks) {
    const dv = new DataView(out.buffer);
    dv.setUint32(offset, body.length);
    for (let i = 0; i < 4; i++) out[offset + 4 + i] = type.charCodeAt(i);
    out.set(body, offset + 8);
    dv.setUint32(offset + 8 + body.length, crc32(out, offset + 4, offset + 8 + body.length));
    offset += 12 + body.length;
  }
  return out;
}
