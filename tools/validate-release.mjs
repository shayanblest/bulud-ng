import { execFileSync } from "node:child_process";
import {
  mkdtempSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
  rmSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, relative, resolve } from "node:path";
import ts from "typescript";

const root = resolve(dirname(new URL(import.meta.url).pathname), "..");
const packageRoot = join(root, "dist", "bulud-ng");
const sourcePackagePath = join(root, "projects", "bulud-ng", "package.json");
const sourceApiRoot = join(root, "projects", "bulud-ng");
const publicApiDocsPath = join(root, "docs", "PUBLIC-API.md");
const releaseApprovalsPath = join(root, "tools", "release-approvals.json");

function fail(message) {
  throw new Error(`Release validation failed: ${message}`);
}

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function approvedChanges(category) {
  const approvals = readJson(releaseApprovalsPath);
  const changes = approvals[category];
  if (!Array.isArray(changes))
    fail(`release approval file has no ${category} change list`);
  return new Set(changes);
}

function enforceApprovedChanges(category, changes) {
  const approved = approvedChanges(category);
  const unexpected = changes.filter((change) => !approved.has(change));
  const stale = [...approved].filter((change) => !changes.includes(change));
  if (unexpected.length || stale.length)
    fail(
      `${category} contract differs from its approved baseline; update tools/release-approvals.json in the same reviewed change. unexpected=${formatList(unexpected)} stale=${formatList(stale)}`,
    );
}

function gitOutput(args) {
  return execFileSync("git", args, {
    cwd: root,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
}

function dependencyChanges(label, baseline, current) {
  const changes = [];
  const names = new Set([
    ...Object.keys(baseline ?? {}),
    ...Object.keys(current ?? {}),
  ]);
  for (const name of sorted(names)) {
    const had = Object.hasOwn(baseline ?? {}, name);
    const has = Object.hasOwn(current ?? {}, name);
    if (!had)
      changes.push(`${label}: added ${name}=${JSON.stringify(current[name])}`);
    else if (!has)
      changes.push(
        `${label}: removed ${name}=${JSON.stringify(baseline[name])}`,
      );
    else if (JSON.stringify(baseline[name]) !== JSON.stringify(current[name]))
      changes.push(
        `${label}: changed ${name}: ${JSON.stringify(baseline[name])} -> ${JSON.stringify(current[name])}`,
      );
  }
  return changes;
}

function dependencyBaseRef() {
  const explicit = process.env.BULUD_BASE_REF || process.env.GITHUB_BASE_SHA;
  if (explicit) return explicit;
  for (const candidate of ["origin/develop", "develop", "HEAD^"]) {
    try {
      return gitOutput(["rev-parse", "--verify", candidate]);
    } catch {
      // Try the next deterministic local fallback.
    }
  }
  fail(
    "dependency baseline is unavailable; set BULUD_BASE_REF to the PR base revision",
  );
}

function readBaseJson(baseRef, path) {
  try {
    return JSON.parse(gitOutput(["show", `${baseRef}:${path}`]));
  } catch {
    fail(`could not read ${path} from dependency baseline ${baseRef}`);
  }
}

function baseRevisionDirectory(baseRef) {
  const directory = mkdtempSync(join(tmpdir(), "bulud-ng-api-baseline-"));
  try {
    const projectPrefix = "projects/bulud-ng/";
    const projectRoot = join(directory, projectPrefix);
    const paths = gitOutput([
      "ls-tree",
      "-r",
      "--name-only",
      baseRef,
      "projects/bulud-ng",
    ]).split("\n");
    for (const path of paths) {
      if (!path) continue;
      const target = join(directory, path);
      mkdirSync(dirname(target), { recursive: true });
      writeFileSync(
        target,
        execFileSync("git", ["show", `${baseRef}:${path}`], {
          cwd: root,
          encoding: "utf8",
          stdio: ["ignore", "pipe", "pipe"],
        }),
      );
    }
    if (!statSafe(join(projectRoot, "src", "public-api.ts")))
      fail(`API baseline ${baseRef} does not contain the library public API`);
    return directory;
  } catch {
    rmSync(directory, { recursive: true, force: true });
    fail(`could not materialize API baseline ${baseRef}`);
  }
}

function documentedIdentifiers(text) {
  return new Set(
    text.match(
      /\b(?:Bulud[A-Za-z0-9_$]*|[A-Za-z_$][A-Za-z0-9_$]*Bulud[A-Za-z0-9_$]*|BULUD[A-Za-z0-9_$]*)\b/g,
    ) ?? [],
  );
}

function documentationSection(text, entry) {
  const heading =
    entry === "."
      ? "## Root entry point: `bulud-ng`"
      : `### \`bulud-ng/${entry.slice(2)}\``;
  const start = text.indexOf(heading);
  if (start < 0) return "";
  const body = text.slice(start + heading.length);
  const end = body.search(entry === "." ? /^## /m : /^### |^## /m);
  return end < 0 ? body : body.slice(0, end);
}

function sorted(values) {
  return [...values].sort();
}

function formatList(values) {
  return values.length === 0 ? "(none)" : values.join(", ");
}

function sourceEntryPoints(apiRoot = sourceApiRoot) {
  const entries = new Map([[".", join(apiRoot, "src", "public-api.ts")]]);
  for (const name of readdirSync(apiRoot)) {
    if (name === "src") continue;
    const api = join(apiRoot, name, "public-api.ts");
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

function packageNameFromSpecifier(specifier) {
  if (specifier.startsWith("@"))
    return specifier.split("/").slice(0, 2).join("/");
  return specifier.split("/")[0];
}

function validateBuiltImportContract(packageJson) {
  const declared = new Set([
    packageJson.name,
    ...Object.keys(packageJson.dependencies ?? {}),
    ...Object.keys(packageJson.peerDependencies ?? {}),
  ]);
  const unexpected = [];
  for (const target of [...packageExports(packageJson).values()]
    .flatMap(exportTargets)
    .filter((target) => target.endsWith(".mjs"))) {
    const path = join(packageRoot, target.replace(/^\.\//, ""));
    const source = readFileSync(path, "utf8");
    for (const match of source.matchAll(
      /\b(?:from\s+|import\s*\(\s*)["']([^"']+)["']/g,
    )) {
      const specifier = match[1];
      if (specifier.startsWith(".") || specifier.startsWith("node:")) continue;
      const packageName = packageNameFromSpecifier(specifier);
      if (!declared.has(packageName))
        unexpected.push(`${relative(root, path)} -> ${specifier}`);
    }
  }
  if (unexpected.length)
    fail(
      `built package contains undeclared bare imports; add an intentional dependency/peer dependency or remove the import:\n${unexpected.map((item) => `- ${item}`).join("\n")}`,
    );
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

function validateApiBaseline(currentEntries, baseRef) {
  const baselineRoot = baseRevisionDirectory(baseRef);
  try {
    const baselineEntries = sourceEntryPoints(
      join(baselineRoot, "projects", "bulud-ng"),
    );
    const differences = [];
    const currentNames = new Set(currentEntries.keys());
    const baselineNames = new Set(baselineEntries.keys());
    for (const entry of sorted(baselineNames)) {
      if (!currentNames.has(entry))
        differences.push(
          `entry point removed: ${entry === "." ? "bulud-ng" : `bulud-ng/${entry.slice(2)}`}`,
        );
    }
    for (const entry of sorted(currentNames)) {
      if (!baselineNames.has(entry))
        differences.push(
          `entry point added: ${entry === "." ? "bulud-ng" : `bulud-ng/${entry.slice(2)}`}`,
        );
    }
    for (const entry of sorted(currentNames).filter((name) =>
      baselineNames.has(name),
    )) {
      const currentSymbols = moduleExportNames(currentEntries.get(entry));
      const baselineSymbols = moduleExportNames(baselineEntries.get(entry));
      const removed = sorted(
        [...baselineSymbols].filter((name) => !currentSymbols.has(name)),
      );
      const added = sorted(
        [...currentSymbols].filter((name) => !baselineSymbols.has(name)),
      );
      if (removed.length || added.length)
        differences.push(
          `${entry === "." ? "bulud-ng" : `bulud-ng/${entry.slice(2)}`}: removed=${formatList(removed)} added=${formatList(added)}`,
        );
    }
    enforceApprovedChanges("api", differences);
  } finally {
    rmSync(baselineRoot, { recursive: true, force: true });
  }
}

function validateApi() {
  const packageJson = readJson(join(packageRoot, "package.json"));
  const sourceEntries = sourceEntryPoints();
  const baseRef = dependencyBaseRef();
  validateApiBaseline(sourceEntries, baseRef);
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
  const undocumentedSymbols = [];
  const staleSymbols = [];
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
    const documentedNames = documentedIdentifiers(
      documentationSection(docs, entry),
    );
    undocumentedSymbols.push(
      ...[...sourceNames]
        .filter((name) => !documentedNames.has(name))
        .map((name) => `${entry}:${name}`),
    );
    staleSymbols.push(
      ...[...documentedNames]
        .filter((name) => !sourceNames.has(name))
        .map((name) => `${entry}:${name}`),
    );
  }
  if (declarationMismatches.length)
    fail(
      `generated declarations differ from the approved source API:\n${declarationMismatches.join("\n")}`,
    );
  if (undocumentedSymbols.length || staleSymbols.length)
    fail(
      `documented public symbols do not match source exports exactly; undocumented=${formatList(sorted(undocumentedSymbols))} stale=${formatList(sorted(staleSymbols))}`,
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
  const baseRef = dependencyBaseRef();
  const baseRoot = readBaseJson(baseRef, "package.json");
  const baseLibrary = readBaseJson(baseRef, "projects/bulud-ng/package.json");
  const baselineChanges = [
    ...["dependencies", "devDependencies", "optionalDependencies"].flatMap(
      (field) =>
        dependencyChanges(
          `root package.json ${field}`,
          baseRoot[field],
          rootPackage[field],
        ),
    ),
    ...["dependencies", "peerDependencies", "peerDependenciesMeta"].flatMap(
      (field) =>
        dependencyChanges(
          `projects/bulud-ng/package.json ${field}`,
          baseLibrary[field],
          source[field],
        ),
    ),
  ];
  const baseLockfile = readBaseJson(baseRef, "package-lock.json");
  const lockfileChanges = lockfileContractChanges(baseLockfile, lockfile);
  enforceApprovedChanges("dependencies", [
    ...baselineChanges,
    ...lockfileChanges,
  ]);
  console.log(
    `Dependency contract validated against ${baseRef}: declarations and normalized lockfile are approved, built metadata matches the library manifest, and no workspace-only runtime dependency is present.`,
  );
}

function stableValue(value) {
  if (Array.isArray(value)) return value.map(stableValue);
  if (value && typeof value === "object")
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, stableValue(value[key])]),
    );
  return value;
}

function normalizedLockfile(lockfile) {
  const fields = [
    "version",
    "resolved",
    "integrity",
    "link",
    "dependencies",
    "devDependencies",
    "optionalDependencies",
    "peerDependencies",
    "peerDependenciesMeta",
  ];
  return Object.fromEntries(
    Object.keys(lockfile.packages ?? {})
      .sort()
      .map((path) => {
        const packageRecord = lockfile.packages[path] ?? {};
        const normalized = Object.fromEntries(
          fields
            .filter((field) => Object.hasOwn(packageRecord, field))
            .map((field) => [field, stableValue(packageRecord[field])]),
        );
        return [path, normalized];
      }),
  );
}

function lockfileContractChanges(baseline, current) {
  const basePackages = normalizedLockfile(baseline);
  const currentPackages = normalizedLockfile(current);
  const changes = [];
  const paths = new Set([
    ...Object.keys(basePackages),
    ...Object.keys(currentPackages),
  ]);
  for (const path of sorted(paths)) {
    const baseRecord = basePackages[path];
    const currentRecord = currentPackages[path];
    const label = `package-lock packages[${JSON.stringify(path)}]`;
    if (!baseRecord) {
      changes.push(`${label}: added ${JSON.stringify(currentRecord)}`);
      continue;
    }
    if (!currentRecord) {
      changes.push(`${label}: removed ${JSON.stringify(baseRecord)}`);
      continue;
    }
    const fields = new Set([
      ...Object.keys(baseRecord),
      ...Object.keys(currentRecord),
    ]);
    for (const field of sorted(fields)) {
      if (
        JSON.stringify(baseRecord[field]) !==
        JSON.stringify(currentRecord[field])
      )
        changes.push(
          `${label}.${field}: ${JSON.stringify(baseRecord[field])} -> ${JSON.stringify(currentRecord[field])}`,
        );
    }
  }
  return changes;
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
  validateBuiltImportContract(packageJson);
  const temporaryRoot = mkdtempSync(join(tmpdir(), "bulud-ng-package-smoke-"));
  try {
    const smokeNpmEnv = {
      ...process.env,
      npm_config_cache: join(temporaryRoot, "npm-cache"),
    };
    writeFileSync(
      join(temporaryRoot, "package.json"),
      JSON.stringify(
        { name: "bulud-ng-package-smoke", private: true, version: "0.0.0" },
        null,
        2,
      ),
    );
    execFileSync(
      "npm",
      [
        "pack",
        `./${relative(root, packageRoot)}`,
        "--pack-destination",
        temporaryRoot,
      ],
      { cwd: root, env: smokeNpmEnv, stdio: "ignore" },
    );
    const packedFilename = readdirSync(temporaryRoot).find((name) =>
      name.endsWith(".tgz"),
    );
    if (!packedFilename) fail("npm pack produced no package tarball");
    const peerPackages = Object.keys(packageJson.peerDependencies ?? {})
      .filter(
        (dependency) =>
          !packageJson.peerDependenciesMeta?.[dependency]?.optional,
      )
      .map((dependency) => `${dependency}@${smokePackageVersion(dependency)}`);
    const smokeDependencies = ["@angular/compiler", ...peerPackages];
    try {
      execFileSync(
        "npm",
        [
          "install",
          "--prefix",
          temporaryRoot,
          "--install-strategy=nested",
          "--ignore-scripts",
          "--no-audit",
          "--no-fund",
          "--package-lock=false",
          "--no-save",
          join(temporaryRoot, packedFilename),
          ...smokeDependencies,
        ],
        { cwd: temporaryRoot, env: smokeNpmEnv, stdio: "inherit" },
      );
    } catch (error) {
      fail(
        `isolated package installation failed; npm could not install the packed package and explicit peers in the temporary consumer: ${error instanceof Error ? error.message : error}`,
      );
    }
    const smokeScript = join(temporaryRoot, "smoke.mjs");
    writeFileSync(
      smokeScript,
      `import "@angular/compiler";\n${expectedImports.map((specifier) => `await import(${JSON.stringify(specifier)});`).join("\n")}\n`,
    );
    try {
      execFileSync(process.execPath, [smokeScript], {
        cwd: temporaryRoot,
        env: { ...process.env, NODE_PATH: "" },
        stdio: "inherit",
      });
    } catch (error) {
      fail(
        `isolated package-path import failed after nested consumer installation; check the package's declared dependencies and peers: ${error instanceof Error ? error.message : error}`,
      );
    }
    console.log(
      `Package-path imports validated: ${expectedImports.length} public paths imported from dist/bulud-ng.`,
    );
  } finally {
    rmSync(temporaryRoot, { recursive: true, force: true });
  }
}

function smokePackagePath(name) {
  return join(root, "node_modules", ...name.split("/"));
}

function smokePackageVersion(name) {
  const manifestPath = join(smokePackagePath(name), "package.json");
  if (!statSafe(manifestPath))
    fail(
      `isolated package smoke test requires installed peer dependency ${name}; install the declared peer dependency before running smoke validation`,
    );
  return readJson(manifestPath).version;
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
