import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { request } from "node:http";
import { brotliDecompressSync, gunzipSync } from "node:zlib";
import { createBasePreview } from "./serve-base.mjs";
let directory, server, port;
const html = "<!doctype html><title>App</title>";
const javascript = 'export const example = "a production bundle";'.repeat(100);
before(async () => {
  directory = await mkdtemp(join(tmpdir(), "bulud-preview-test-"));
  await writeFile(join(directory, "index.html"), html);
  await writeFile(join(directory, "main-ABCDEFGH.js"), javascript);
  await writeFile(join(directory, "image.png"), Buffer.from([137, 80, 78, 71]));
  server = await createBasePreview(directory);
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  port = server.address().port;
});
after(async () => {
  if (server) await new Promise((resolve) => server.close(resolve));
  if (directory) await rm(directory, { recursive: true, force: true });
});
function get(path, headers = {}, method = "GET") {
  return new Promise((resolve, reject) => {
    const req = request(
      { host: "127.0.0.1", port, path, headers, method },
      (res) => {
        const chunks = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () =>
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: Buffer.concat(chunks),
          }),
        );
      },
    );
    req.on("error", reject);
    req.end();
  });
}
test("serves direct/SPA navigations as revalidated HTML, not no-store", async () => {
  for (const path of ["/", "/shared?filter=status:eq(%22draft%22)", "/forms"]) {
    const r = await get(path, { accept: "text/html" });
    assert.equal(r.status, 200);
    assert.equal(r.body.toString(), html);
    assert.equal(r.headers["cache-control"], "no-cache");
  }
});
test("compresses text with Brotli/gzip and uses immutable caching only for hashed bundles", async () => {
  const br = await get("/main-ABCDEFGH.js", { "accept-encoding": "br, gzip" });
  assert.equal(br.headers["content-encoding"], "br");
  assert.equal(brotliDecompressSync(br.body).toString(), javascript);
  assert.ok(br.body.length < javascript.length / 4);
  assert.equal(
    br.headers["cache-control"],
    "public, max-age=31536000, immutable",
  );
  assert.equal(br.headers.vary, "Accept-Encoding");
  const gzip = await get("/main-ABCDEFGH.js", {
    "accept-encoding": "br;q=0, gzip;q=1",
  });
  assert.equal(gzip.headers["content-encoding"], "gzip");
  assert.equal(gunzipSync(gzip.body).toString(), javascript);
  assert.notEqual(br.headers.etag, gzip.headers.etag);
  const png = await get("/image.png", { "accept-encoding": "br,gzip" });
  assert.equal(png.headers["content-encoding"], undefined);
  assert.equal(png.headers["cache-control"], "public, max-age=3600");
});
test("supports representation ETags, conditional GET and bodyless HEAD", async () => {
  const r = await get("/main-ABCDEFGH.js");
  const cached = await get("/main-ABCDEFGH.js", {
    "if-none-match": r.headers.etag,
  });
  assert.equal(cached.status, 304);
  assert.equal(cached.body.length, 0);
  const head = await get("/main-ABCDEFGH.js", {}, "HEAD");
  assert.equal(head.status, 200);
  assert.equal(head.body.length, 0);
  assert.equal(
    Number(head.headers["content-length"]),
    Buffer.byteLength(javascript),
  );
});
test("does not mask missing assets or API-like JSON requests with HTML", async () => {
  assert.equal((await get("/missing.js", { accept: "text/html" })).status, 404);
  assert.equal(
    (await get("/api/items", { accept: "application/json" })).status,
    404,
  );
  assert.equal((await get("/shared", {}, "POST")).status, 405);
});
test("rejects malformed and escaping paths without reading outside build directory", async () => {
  assert.equal((await get("/%ZZ")).status, 400);
  assert.equal((await get("/%2e%2e%2fsecret.txt")).status, 403);
  assert.equal((await get("/%00")).status, 403);
});
test("honors refused encodings and supports uncompressed clients", async () => {
  const plain = await get("/main-ABCDEFGH.js", {
    "accept-encoding": "br;q=0,gzip;q=0",
  });
  assert.equal(plain.headers["content-encoding"], undefined);
  assert.equal(plain.body.toString(), javascript);
  assert.equal(
    (
      await get("/main-ABCDEFGH.js", {
        "accept-encoding": "identity;q=0,*;q=0",
      })
    ).status,
    406,
  );
});
test("optional local upload receiver discards multipart data and rejects bad types/oversized requests", async () => {
  const receiver = await createBasePreview(directory, { demoUploads: true });
  await new Promise((resolve) => receiver.listen(0, "127.0.0.1", resolve));
  const url = `http://127.0.0.1:${receiver.address().port}/api/demo-upload`;
  try {
    const body = new FormData();
    body.append(
      "files",
      new Blob(["csv,data"], { type: "text/csv" }),
      "data.csv",
    );
    const response = await fetch(url, { method: "POST", body });
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("cache-control"), "no-store");
    const result = await response.json();
    assert.equal(result.stored, false);
    assert.ok(result.receivedBytes > 8);
    assert.equal(
      (await fetch(url, { method: "POST", body: "bad" })).status,
      415,
    );
    assert.equal((await fetch(url)).status, 405);
    assert.equal(
      (
        await fetch(url, {
          method: "POST",
          headers: { "content-type": "multipart/form-data; boundary=demo" },
          body: Buffer.alloc(3 * 1024 * 1024 + 1),
        })
      ).status,
      413,
    );
  } finally {
    await new Promise((resolve) => receiver.close(resolve));
  }
});
