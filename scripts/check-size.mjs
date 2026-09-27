import { readFile, readdir, stat } from "node:fs/promises";
import { basename, extname, join } from "node:path";
import { gzipSync } from "node:zlib";
import { fileURLToPath } from "node:url";

const limits = Object.freeze({
  // Measured 2026-09-27 with `pnpm run build && pnpm run check:size` (gzip level 9).
  // javascriptGzip 126814. Canvas chunk DeskTableSurfaceCanvas-C02AhHdN.js gzip 2693.
  // Entry index-DL7c-GTN.js only dynamic-imports LocalGamePage; LocalGamePage dynamic-imports
  // DeskTable; DeskTable dynamic-imports the canvas chunk. The sum rose above 124000 because
  // per-chunk gzip no longer shares one dictionary. Ceiling 128000 leaves 1186 bytes.
  javascriptGzip: 128000,
  cssGzip: 10 * 1024,
  // Phase 20D official play UI brand assets (21 compressed PNGs in public/brand/play); Freeze §8 authorizes this raise.
  total: 6 * 1024 * 1024,
});
const distDirectory = fileURLToPath(new URL("../dist/", import.meta.url));

async function listFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...await listFiles(path));
    } else {
      files.push(path);
    }
  }
  return files;
}

const files = await listFiles(distDirectory);
let javascriptGzip = 0;
let cssGzip = 0;
let total = 0;
const canvasChunks = [];

for (const file of files) {
  const info = await stat(file);
  total += info.size;
  const extension = extname(file);
  if (extension === ".js" || extension === ".css") {
    const content = await readFile(file);
    const gzipSize = gzipSync(content, { level: 9 }).byteLength;
    if (extension === ".js") {
      javascriptGzip += gzipSize;
      if (basename(file).startsWith("DeskTableSurfaceCanvas-")) {
        canvasChunks.push({ file: basename(file), gzip: gzipSize });
      }
    } else {
      cssGzip += gzipSize;
    }
  }
}

const metrics = { javascriptGzip, cssGzip, total };
console.log(JSON.stringify({ metrics, limits, canvasChunks }, null, 2));

for (const key of Object.keys(limits)) {
  if (metrics[key] > limits[key]) {
    throw new Error(`${key} exceeds the size limit.`);
  }
}
