import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { publicationIssues } from "../projects/bulud-ng/publish-check.mjs";
function fixture(run) {
  const root = mkdtempSync(join(tmpdir(), "bulud-publish-check-"));
  const manifest = {
    name: "example-package",
    version: "1.0.0",
    license: "MIT",
    exports: { ".": { types: "./index.d.ts", default: "./index.mjs" } },
  };
  for (const file of ["LICENSE", "index.d.ts", "index.mjs"])
    writeFileSync(join(root, file), "fixture");
  try {
    run(root, manifest);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}
function check(root, manifest) {
  writeFileSync(join(root, "package.json"), JSON.stringify(manifest));
  return publicationIssues(root);
}
test("accepts complete built package without publishing", () =>
  fixture((root, m) => assert.deepEqual(check(root, m), [])));
test("blocks deferred or unlicensed publication", () =>
  fixture((root, m) => {
    delete m.license;
    assert.ok(check(root, m).some((x) => x.includes("license")));
    m.license = "UNLICENSED";
    assert.ok(check(root, m).some((x) => x.includes("license")));
  }));
test("requires actual license asset", () =>
  fixture((root, m) => {
    rmSync(join(root, "LICENSE"));
    assert.ok(check(root, m).some((x) => x.includes("LICENSE")));
  }));
test("blocks private workspace and source manifests", () =>
  fixture((root, m) => {
    m.private = true;
    delete m.exports;
    assert.equal(check(root, m).length, 2);
  }));
test("rejects missing or escaping export targets", () =>
  fixture((root, m) => {
    m.exports["./bad"] = "../outside.mjs";
    m.exports["./missing"] = "./missing.mjs";
    assert.equal(check(root, m).length, 2);
  }));

test("rejects an empty license asset", () =>
  fixture((root, m) => {
    writeFileSync(join(root, "LICENSE"), " ");
    assert.ok(check(root, m).some((x) => x.includes("LICENSE")));
  }));
test("rejects malformed license metadata and consumer install hooks", () =>
  fixture((root, m) => {
    m.license = { type: "MIT" };
    m.scripts = { postinstall: "node arbitrary.js" };
    const issues = check(root, m);
    assert.ok(issues.some((x) => x.includes("license")));
    assert.ok(issues.some((x) => x.includes("postinstall")));
  }));
