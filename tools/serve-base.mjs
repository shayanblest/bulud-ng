import { createServer } from "node:http";
import { readdir, readFile, realpath } from "node:fs/promises";
import { resolve, relative, extname, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { brotliCompressSync, gzipSync, constants } from "node:zlib";

const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".txt": "text/plain; charset=utf-8",
};
function quality(header, encoding, fallback = 0) {
  const entries = new Map(
    String(header ?? "")
      .split(",")
      .map((part) => {
        const [name, ...params] = part.trim().toLowerCase().split(";");
        const value = params.find((p) => p.trim().startsWith("q="));
        const q = value ? Number(value.trim().slice(2)) : 1;
        return [name, Number.isFinite(q) && q >= 0 && q <= 1 ? q : 0];
      }),
  );
  return entries.get(encoding) ?? entries.get("*") ?? fallback;
}
function variant(data) {
  return {
    data,
    etag: `"${createHash("sha256").update(data).digest("base64url")}"`,
  };
}
/** Serves a fixed production build; no watcher, WebSocket or analytics. Optional demo uploads are discarded. */
export async function createBasePreview(
  directory,
  { demoUploads = false } = {},
) {
  const root = await realpath(directory);
  const files = new Map();
  async function load(folder) {
    for (const entry of await readdir(folder, { withFileTypes: true })) {
      if (entry.name.startsWith(".") || entry.isSymbolicLink()) continue;
      const path = resolve(folder, entry.name);
      if (entry.isDirectory()) {
        await load(path);
        continue;
      }
      if (!entry.isFile()) continue;
      const extension = extname(path);
      const data = await readFile(path);
      const text = [".html", ".js", ".css", ".json", ".svg", ".txt"].includes(
        extension,
      );
      files.set("/" + relative(root, path).split(sep).join("/"), {
        type: types[extension] ?? "application/octet-stream",
        identity: variant(data),
        ...(text
          ? {
              br: variant(
                brotliCompressSync(data, {
                  params: { [constants.BROTLI_PARAM_QUALITY]: 5 },
                }),
              ),
              gzip: variant(gzipSync(data)),
            }
          : {}),
      });
    }
  }
  await load(root);
  if (!files.has("/index.html"))
    throw new Error(
      "Missing production index.html. Run: npm run ng -- build base",
    );
  return createServer((req, res) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    if (demoUploads && req.url?.split("?")[0] === "/api/demo-upload") {
      res.setHeader("Cache-Control", "no-store");
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      if (req.method !== "POST") {
        res.writeHead(405, { Allow: "POST" });
        res.end();
        return;
      }
      if (
        !String(req.headers["content-type"] ?? "").startsWith(
          "multipart/form-data;",
        )
      ) {
        res.writeHead(415);
        res.end();
        return;
      }
      let bytes = 0,
        tooLarge = false;
      req.on("data", (chunk) => {
        bytes += chunk.length;
        if (bytes > 3 * 1024 * 1024 && !tooLarge) {
          tooLarge = true;
          res.writeHead(413);
          res.end();
        }
      });
      req.on("end", () => {
        if (tooLarge) return;
        res.writeHead(200);
        res.end(JSON.stringify({ receivedBytes: bytes, stored: false }));
      });
      req.on("error", () => {
        if (!res.writableEnded) {
          res.writeHead(400);
          res.end();
        }
      });
      return;
    }
    if (req.method !== "GET" && req.method !== "HEAD") {
      res.writeHead(405, { Allow: "GET, HEAD" });
      res.end();
      return;
    }
    let pathname;
    try {
      pathname = decodeURIComponent(
        new URL(req.url, "http://localhost").pathname,
      );
    } catch {
      res.writeHead(400);
      res.end();
      return;
    }
    const resolved = resolve(root, "." + pathname);
    if (
      pathname.includes("\0") ||
      (resolved !== root && !resolved.startsWith(root + sep))
    ) {
      res.writeHead(403);
      res.end();
      return;
    }
    let key = pathname === "/" ? "/index.html" : pathname;
    let file = files.get(key);
    if (
      !file &&
      !extname(pathname) &&
      String(req.headers.accept ?? "").includes("text/html")
    ) {
      key = "/index.html";
      file = files.get(key);
    }
    if (!file) {
      res.writeHead(404);
      res.end();
      return;
    }
    const br = quality(req.headers["accept-encoding"], "br");
    const gz = quality(req.headers["accept-encoding"], "gzip");
    const encoding =
      file.br && br > 0 && br >= gz
        ? "br"
        : file.gzip && gz > 0
          ? "gzip"
          : "identity";
    if (
      encoding === "identity" &&
      quality(req.headers["accept-encoding"], "identity", 1) === 0
    ) {
      res.writeHead(406);
      res.end();
      return;
    }
    const body = file[encoding];
    res.setHeader("Content-Type", file.type);
    res.setHeader("Vary", "Accept-Encoding");
    res.setHeader(
      "Cache-Control",
      key === "/index.html"
        ? "no-cache"
        : /-[a-z0-9]{8,}\.(js|css)$/i.test(key)
          ? "public, max-age=31536000, immutable"
          : "public, max-age=3600",
    );
    res.setHeader("ETag", body.etag);
    if (encoding !== "identity") res.setHeader("Content-Encoding", encoding);
    if (
      String(req.headers["if-none-match"] ?? "")
        .split(",")
        .map((v) => v.trim())
        .some((value) => value === body.etag || value === "*")
    ) {
      res.writeHead(304);
      res.end();
      return;
    }
    res.setHeader("Content-Length", body.data.length);
    res.writeHead(200);
    res.end(req.method === "HEAD" ? undefined : body.data);
  });
}
if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const args = process.argv.slice(2);
  const option = (name, fallback) => {
    const index = args.indexOf(name);
    return index < 0 ? fallback : args[index + 1];
  };
  if (args.includes("--build")) {
    const workspace = fileURLToPath(new URL("..", import.meta.url));
    execFileSync(
      process.execPath,
      [
        resolve(workspace, "node_modules/@angular/cli/bin/ng.js"),
        "build",
        "base",
        "--configuration",
        "production",
      ],
      { cwd: workspace, stdio: "inherit" },
    );
  }
  const port = Number(option("--port", "4314"));
  if (!Number.isInteger(port) || port < 0 || port > 65535)
    throw new Error("Invalid --port");
  const directory = option(
    "--dir",
    fileURLToPath(new URL("../dist/base/browser", import.meta.url)),
  );
  const server = await createBasePreview(directory, {
    demoUploads: process.argv.includes("--demo-uploads"),
  });
  server.listen(port, "127.0.0.1", () =>
    console.log(`Bulud NG: http://127.0.0.1:${server.address().port}/`),
  );
}
