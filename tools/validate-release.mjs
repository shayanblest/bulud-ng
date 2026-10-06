import { execFileSync } from "node:child_process";
import {
  mkdtempSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  realpathSync,
  statSync,
  symlinkSync,
  writeFileSync,
  rmSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, relative, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import ts from "typescript";

const root = resolve(dirname(new URL(import.meta.url).pathname), "..");
const packageRoot = join(root, "dist", "bulud-ng");
const sourcePackagePath = join(root, "projects", "bulud-ng", "package.json");
const sourceApiRoot = join(root, "projects", "bulud-ng");
const publicApiDocsPath = join(root, "docs", "PUBLIC-API.md");

function fail(message) {
  throw new Error(`Release validation failed: ${message}`);
}

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function sorted(values) {
  return [...values].sort();
}

function formatList(values) {
  return values.length === 0 ? "(none)" : values.join(", ");
}

function sourceEntryPoints() {
  const entries = new Map([[".", join(sourceApiRoot, "src", "public-api.ts")]]);
  for (const name of readdirSync(sourceApiRoot)) {
    if (name === "src") continue;
    const api = join(sourceApiRoot, name, "public-api.ts");
    if (statSafe(api)) entries.set(`./${name}`, api);
  }
  return entries;
}

function statSafe(path) {
  try {
    return statSync(path).isFile();
  } catch {
    return false;
  }
}

function packageExports(packageJson) {
  return new Map(Object.entries(packageJson.exports ?? {}));
}

function approvedPackageJsEntries() {
  return new Set(
    [...sourceEntryPoints().keys()].map((entry) =>
      entry === "." ? "bulud-ng" : `bulud-ng/${entry.slice(2)}`,
    ),
  );
}

function packageJsEntries(packageJson) {
  return new Set(
    [...packageExports(packageJson).keys()]
      .filter(
        (key) =>
          key === "." || (!key.endsWith(".css") && key !== "./package.json"),
      )
      .map((entry) =>
        entry === "." ? "bulud-ng" : `bulud-ng/${entry.slice(2)}`,
      ),
  );
}

function validatePackageJsEntries(packageJson) {
  const approved = approvedPackageJsEntries();
  const actual = packageJsEntries(packageJson);
  const unexpected = sorted(
    [...actual].filter((entry) => !approved.has(entry)),
  );
  const missing = sorted([...approved].filter((entry) => !actual.has(entry)));
  if (unexpected.length || missing.length)
    fail(
      `package JS entry points differ from public-api.ts; unexpected=${formatList(unexpected)} missing=${formatList(missing)}`,
    );
}

function exportTargets(value) {
  if (typeof value === "string") return [value];
  if (!value || typeof value !== "object") return [];
  return Object.values(value).flatMap(exportTargets);
}

function moduleExportNames(path) {
  const program = ts.createProgram([path], {
    allowJs: false,
    module: ts.ModuleKind.NodeNext,
    moduleResolution: ts.ModuleResolutionKind.NodeNext,
    noEmit: true,
    skipLibCheck: true,
    target: ts.ScriptTarget.ES2022,
  });
  const sourceFile = program.getSourceFile(path);
  if (!sourceFile)
    fail(`could not read declaration/source file ${relative(root, path)}`);
  const symbol = program.getTypeChecker().getSymbolAtLocation(sourceFile);
  if (!symbol) fail(`could not inspect exports from ${relative(root, path)}`);
  return new Set(
    program
      .getTypeChecker()
      .getExportsOfModule(symbol)
      .map((item) => item.name),
  );
}

function validateApi() {
  const packageJson = readJson(join(packageRoot, "package.json"));
  const sourceEntries = sourceEntryPoints();
  validatePackageJsEntries(packageJson);

  const docs = readFileSync(publicApiDocsPath, "utf8");
  const documentedEntries = new Set(
    [...docs.matchAll(/^### `bulud-ng\/([^`]+)`$/gm)].map(
      (match) => `./${match[1]}`,
    ),
  );
  const sourceSecondaryEntries = new Set(
    [...sourceEntries.keys()].filter((entry) => entry !== "."),
  );
  const undocumented = sorted(
    [...sourceSecondaryEntries].filter(
      (entry) => !documentedEntries.has(entry),
    ),
  );
  const staleDocs = sorted(
    [...documentedEntries].filter(
      (entry) => !sourceSecondaryEntries.has(entry),
    ),
  );
  if (undocumented.length || staleDocs.length) {
    fail(
      `documented entry points do not match public-api.ts; undocumented=${formatList(undocumented)} stale=${formatList(staleDocs)}`,
    );
  }

  const declarationMismatches = [];
  const sourceSymbolNames = new Set();
  for (const [entry, sourcePath] of sourceEntries) {
    const declarationPath =
      entry === "."
        ? join(packageRoot, "index.d.ts")
        : join(packageRoot, entry.slice(2), "index.d.ts");
    if (!statSafe(declarationPath)) {
      declarationMismatches.push(
        `${entry}: missing ${relative(root, declarationPath)}`,
      );
      continue;
    }
    const sourceNames = moduleExportNames(sourcePath);
    for (const name of sourceNames) sourceSymbolNames.add(name);
    const declarationNames = moduleExportNames(declarationPath);
    const missing = sorted(
      [...sourceNames].filter((name) => !declarationNames.has(name)),
    );
    const extra = sorted(
      [...declarationNames].filter((name) => !sourceNames.has(name)),
    );
    if (missing.length || extra.length) {
      declarationMismatches.push(
        `${entry}: missing=${formatList(missing)} extra=${formatList(extra)}`,
      );
    }
  }
  if (declarationMismatches.length)
    fail(
      `generated declarations differ from the approved source API:\n${declarationMismatches.join("\n")}`,
    );
  const documentedSymbols = new Set(
    [...docs.matchAll(/`([A-Za-z_$][\w$]*)`/g)]
      .map((match) => match[1])
      .filter((name) =>
        /^(Bulud|BULUD|provideBulud|resolveBulud|createBulud|defineBulud)/.test(
          name,
        ),
      ),
  );
  const undocumentedSymbols = sorted(
    [...sourceSymbolNames].filter((name) => !docs.includes(name)),
  );
  const staleSymbols = sorted(
    [...documentedSymbols].filter((name) => !sourceSymbolNames.has(name)),
  );
  if (undocumentedSymbols.length || staleSymbols.length)
    fail(
      `documented public symbols do not match source exports; undocumented=${formatList(undocumentedSymbols)} stale=${formatList(staleSymbols)}`,
    );
  execFileSync(
    "npx",
    ["--no-install", "tsc", "-p", "projects/declaration-tests/tsconfig.json"],
    {
      cwd: root,
      stdio: "inherit",
    },
  );
  console.log(
    `Public API validated: ${sourceEntries.size} entry points and generated declarations match.`,
  );
}

function validateDependencies() {
  const source = readJson(sourcePackagePath);
  const built = readJson(join(packageRoot, "package.json"));
  for (const field of [
    "dependencies",
    "peerDependencies",
    "peerDependenciesMeta",
  ]) {
    const expected = JSON.stringify(source[field] ?? {});
    const actual = JSON.stringify(built[field] ?? {});
    if (expected !== actual)
      fail(
        `${field} in dist/package.json differs from projects/bulud-ng/package.json`,
      );
  }
  const rootPackage = readJson(join(root, "package.json"));
  const lockfile = readJson(join(root, "package-lock.json"));
  const lockedRoot = lockfile.packages?.[""] ?? {};
  for (const field of [
    "dependencies",
    "devDependencies",
    "optionalDependencies",
  ]) {
    if (
      JSON.stringify(rootPackage[field] ?? {}) !==
      JSON.stringify(lockedRoot[field] ?? {})
    )
      fail(
        `package.json ${field} does not match the package-lock.json root contract`,
      );
  }
  const rootRuntime = new Set(Object.keys(rootPackage.dependencies ?? {}));
  const workspaceDev = new Set(Object.keys(rootPackage.devDependencies ?? {}));
  const leakedDevDependencies = Object.keys(built.dependencies ?? {}).filter(
    (name) => !rootRuntime.has(name) || workspaceDev.has(name),
  );
  if (leakedDevDependencies.length) {
    fail(
      `package runtime dependencies are not consumer runtime dependencies: ${formatList(sorted(leakedDevDependencies))}`,
    );
  }
  console.log(
    "Dependency contract validated: built metadata matches the library manifest and has no workspace-only runtime dependency.",
  );
}

function walkFiles(directory, prefix = "") {
  const result = [];
  for (const name of readdirSync(join(directory, prefix), {
    withFileTypes: true,
  })) {
    const path = join(prefix, name.name);
    if (name.isDirectory()) result.push(...walkFiles(directory, path));
    else result.push(path);
  }
  return result;
}

function validatePackage() {
  if (!statSafe(join(packageRoot, "package.json")))
    fail(`built package is missing at ${relative(root, packageRoot)}`);
  const packageJson = readJson(join(packageRoot, "package.json"));
  const exports = packageExports(packageJson);
  validatePackageJsEntries(packageJson);
  const source = readJson(
    join(root, "projects", "bulud-ng", "ng-package.json"),
  );
  const assetPaths = new Set(
    (source.assets ?? []).map((asset) =>
      typeof asset === "string" ? asset : asset.destination,
    ),
  );
  const expected = new Set([
    "package.json",
    "README.md",
    ".npmignore",
    ...assetPaths,
  ]);
  for (const target of [...exports.values()].flatMap(exportTargets))
    expected.add(target.replace(/^\.\//, ""));
  for (const target of [...exports.values()].flatMap(exportTargets)) {
    const normalized = target.replace(/^\.\//, "");
    if (normalized.endsWith(".mjs"))
      expected.add(normalized.replace(/\.mjs$/, ".mjs.map"));
  }
  for (const entry of Object.keys(packageJson.exports ?? {}).filter(
    (key) => key === "." || (!key.endsWith(".css") && key !== "./package.json"),
  )) {
    if (entry === ".") continue;
    expected.add(`${entry.slice(2)}/package.json`);
  }
  const actual = new Set(walkFiles(packageRoot));
  const unexpected = sorted([...actual].filter((path) => !expected.has(path)));
  const missing = sorted([...expected].filter((path) => !actual.has(path)));
  const sourceOnly = sorted(
    [...actual].filter((path) =>
      /(^|\/)(src|lib|internal)(\/|$)|\.scss$|(?<!\.d)\.ts$/.test(path),
    ),
  );
  if (unexpected.length || missing.length || sourceOnly.length) {
    fail(
      `package output inventory mismatch; unexpected=${formatList(unexpected)} missing=${formatList(missing)} source-only=${formatList(sourceOnly)}`,
    );
  }
  const cssExports = new Set(
    [...exports.keys()].filter((key) => key.endsWith(".css")),
  );
  const expectedCssExports = new Set(
    [...assetPaths].map((asset) => `./${asset}`),
  );
  const unexpectedCssExports = sorted(
    [...cssExports].filter((entry) => !expectedCssExports.has(entry)),
  );
  const missingCssExports = sorted(
    [...expectedCssExports].filter((entry) => !cssExports.has(entry)),
  );
  if (unexpectedCssExports.length || missingCssExports.length)
    fail(
      `CSS package exports differ from ng-package assets; unexpected=${formatList(unexpectedCssExports)} missing=${formatList(missingCssExports)}`,
    );
  const requiredAssets = ["theme.css", "tailwind.css"];
  const missingAssets = requiredAssets.filter(
    (asset) => !assetPaths.has(asset) || !actual.has(asset),
  );
  if (missingAssets.length)
    fail(
      `required package assets are missing from configured output: ${formatList(missingAssets)}`,
    );
  console.log(
    `Package output validated: ${actual.size} files derived from exports, ng-package assets, and generated metadata.`,
  );
}

async function validateSmokeImports() {
  validatePackage();
  const packageJson = readJson(join(packageRoot, "package.json"));
  const expectedImports = [...approvedPackageJsEntries()];
  validatePackageJsEntries(packageJson);
  const temporaryRoot = mkdtempSync(join(tmpdir(), "bulud-ng-package-smoke-"));
  try {
    const nodeModules = join(temporaryRoot, "node_modules");
    const packageLink = join(nodeModules, "bulud-ng");
    mkdirSync(nodeModules, { recursive: true });
    symlinkSync(realpathSync(packageRoot), packageLink, "dir");
    const smokeScript = join(temporaryRoot, "smoke.mjs");
    writeFileSync(
      smokeScript,
      `import ${JSON.stringify(pathToFileURL(join(root, "node_modules/@angular/compiler/fesm2022/compiler.mjs")).href)};\n${expectedImports.map((specifier) => `await import(${JSON.stringify(specifier)});`).join("\n")}\n`,
    );
    execFileSync(process.execPath, [smokeScript], {
      cwd: temporaryRoot,
      stdio: "inherit",
    });
    console.log(
      `Package-path imports validated: ${expectedImports.length} public paths imported from dist/bulud-ng.`,
    );
  } finally {
    rmSync(temporaryRoot, { recursive: true, force: true });
  }
}

function run(command, args) {
  execFileSync(command, args, { cwd: root, stdio: "inherit" });
}

async function validateRelease() {
  const checks = [
    ["validate:format", "format:check"],
    ["validate:lint", "lint"],
    ["validate:build", "build"],
    ["validate:demo", "build:demo"],
    ["validate:api", "validate:api"],
    ["validate:deps", "validate:deps"],
    ["validate:package", "validate:package"],
    ["validate:smoke", "validate:smoke"],
  ];
  for (const [label, script] of checks) {
    console.log(`\n=== ${label} ===`);
    run("npm", ["run", script]);
  }
  console.log(
    "\nRelease validation passed: all non-browser release checks completed.",
  );
}

const arguments_ = process.argv.slice(2);
const command = arguments_[0];
try {
  if (arguments_.length !== 1)
    fail(
      "usage: node tools/validate-release.mjs <api|deps|package|smoke|release>",
    );
  if (command === "api") validateApi();
  else if (command === "deps") validateDependencies();
  else if (command === "package") validatePackage();
  else if (command === "smoke") await validateSmokeImports();
  else if (command === "release") await validateRelease();
  else
    fail(
      "usage: node tools/validate-release.mjs <api|deps|package|smoke|release>",
    );
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
