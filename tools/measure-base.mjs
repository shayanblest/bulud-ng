import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { gzipSync } from "node:zlib";
const root = join(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "dist",
  "base",
  "browser",
);
if (!existsSync(join(root, "index.html")))
  throw new Error("Build first: npm run ng -- build base");
const html = readFileSync(join(root, "index.html"), "utf8");
const assets = [
  ...new Set(
    [...html.matchAll(/(?:src|href)="([^"?#]+\.(?:js|css))"/g)].map(
      (match) => match[1],
    ),
  ),
];
const rows = assets.map((asset) => {
  const data = readFileSync(join(root, asset));
  return { asset, bytes: data.length, gzipBytes: gzipSync(data).length };
});
const result = {
  initial: rows,
  totalBytes: rows.reduce((n, row) => n + row.bytes, 0),
  totalGzipBytes: rows.reduce((n, row) => n + row.gzipBytes, 0),
};
if (rows.length === 0 || result.totalBytes > 300000)
  throw new Error(
    "Initial base assets exceed the 300 kB budget, or build output was not recognized.",
  );
console.log(JSON.stringify(result, null, 2));
