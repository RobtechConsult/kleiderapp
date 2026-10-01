// Copies the onnxruntime-web WASM build into public/ort so the web app can load it from its own
// origin (no CDN). Runs on `npm install`; public/ort is git-ignored.
const fs = require('fs');
const path = require('path');

const src = path.join(__dirname, '..', 'node_modules', 'onnxruntime-web', 'dist');
const dest = path.join(__dirname, '..', 'public', 'ort');
const files = ['ort.wasm.min.js', 'ort-wasm-simd-threaded.wasm', 'ort-wasm-simd-threaded.mjs'];

if (!fs.existsSync(src)) {
  console.warn('onnxruntime-web not installed, skipping copy');
  process.exit(0);
}
fs.mkdirSync(dest, { recursive: true });
for (const file of files) fs.copyFileSync(path.join(src, file), path.join(dest, file));
console.log(`Copied ${files.length} onnxruntime-web files to public/ort`);
