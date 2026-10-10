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
import { createRequire } from "node:module";
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

function resolvedCommit(ref) {
  try {
    return gitOutput(["rev-parse", `${ref}^{commit}`]);
  } catch {
    fail(`could not resolve approval baseline ${ref}`);
  }
}

function approvedChanges(category, baseRef) {
  const approvals = readJson(releaseApprovalsPath);
  const scopes = approvals[category];
  if (!scopes || typeof scopes !== "object" || Array.isArray(scopes))
    fail(`release approval file has no ${category} baseline scopes`);
  const changes = scopes[resolvedCommit(baseRef)];
  if (changes === undefined) return null;
  if (!Array.isArray(changes))
    fail(`release approval scope for ${category} must be an array`);
  return new Set(changes);
}

function enforceApprovedChanges(category, changes, baseRef) {
  const approved = approvedChanges(category, baseRef);
  if (approved === null) {
    if (changes.length)
      fail(
        `${category} contract differs from its baseline and has no approved scope for ${resolvedCommit(baseRef)}; review the diff and add exact entries under that baseline in tools/release-approvals.json. unexpected=${formatList(changes)}`,
      );
    return;
  }
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
    for (const path of ["package.json", "package-lock.json", "tsconfig.json"]) {
      writeFileSync(
        join(directory, path),
        execFileSync("git", ["show", `${baseRef}:${path}`], {
          cwd: root,
          encoding: "utf8",
          stdio: ["ignore", "pipe", "pipe"],
        }),
      );
    }
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
    const installArgs = ["--ignore-scripts", "--no-audit", "--no-fund"];
    try {
      execFileSync("npm", ["ci", ...installArgs], {
        cwd: directory,
        stdio: ["ignore", "ignore", "pipe"],
        encoding: "utf8",
      });
    } catch (error) {
      const stderr = String(error?.stderr ?? "");
      if (
        !/package\.json and package-lock\.json are in sync|Missing:/i.test(
          stderr,
        )
      )
        fail(
          `could not install isolated API baseline ${baseRef}: ${stderr.trim() || (error instanceof Error ? error.message : error)}`,
        );
      console.warn(
        `Historical API baseline ${baseRef} has an inconsistent lockfile; npm ci failed with a package sync error. Using isolated npm install from the baseline package.json ranges.`,
      );
      execFileSync("npm", ["install", "--package-lock=false", ...installArgs], {
        cwd: directory,
        stdio: "inherit",
      });
    }
    return directory;
  } catch (error) {
    rmSync(directory, { recursive: true, force: true });
    fail(
      `could not materialize isolated API baseline ${baseRef}: ${error instanceof Error ? error.message : error}`,
    );
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

function cssExportTarget(value) {
  return JSON.stringify(stableValue(value));
}

function sourceCustomPropertyUsage(apiRoot) {
  const usage = new Map();
  for (const path of walkFiles(apiRoot).filter(
    (file) =>
      /\.(?:css|scss)$/.test(file) &&
      !/(?:^|[/.])[^/]*\.spec\.[^/]*$/.test(file),
  )) {
    const source = readFileSync(join(apiRoot, path), "utf8");
    const names = new Set(
      [...source.matchAll(/--bulud-[A-Za-z0-9_-]+/g)].map((match) => match[0]),
    );
    if (names.size) usage.set(path, sorted(names));
  }
  return usage;
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

function isExternalPackageSpecifier(specifier) {
  return !specifier.startsWith(".") && !specifier.startsWith("node:");
}

function declarationImportSpecifiers(path) {
  const sourceFile = ts.createSourceFile(
    path,
    readFileSync(path, "utf8"),
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );
  const specifiers = [];
  const addStringSpecifier = (value) => {
    if (ts.isStringLiteralLike(value)) specifiers.push(value.text);
  };
  const visit = (node) => {
    if (ts.isImportDeclaration(node) || ts.isExportDeclaration(node))
      if (node.moduleSpecifier) addStringSpecifier(node.moduleSpecifier);
    if (ts.isImportEqualsDeclaration(node)) {
      const reference = node.moduleReference;
      if (ts.isExternalModuleReference(reference) && reference.expression)
        addStringSpecifier(reference.expression);
    }
    if (ts.isImportTypeNode(node)) {
      const argument = node.argument;
      if (ts.isLiteralTypeNode(argument)) addStringSpecifier(argument.literal);
    }
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);
  return specifiers;
}

function validateBuiltImportContract(packageJson) {
  const declared = new Set([
    packageJson.name,
    ...Object.keys(packageJson.dependencies ?? {}),
    ...Object.keys(packageJson.peerDependencies ?? {}),
    ...Object.keys(packageJson.optionalDependencies ?? {}),
  ]);
  const unexpected = [];
  for (const target of [...packageExports(packageJson).values()]
    .flatMap(exportTargets)
    .filter((target) => target.endsWith(".mjs"))) {
    const path = join(packageRoot, target.replace(/^\.\//, ""));
    const source = readFileSync(path, "utf8");
    for (const match of source.matchAll(
      /\b(?:from\s+|import\s*\(\s*|import\s+)["']([^"']+)["']/g,
    )) {
      const specifier = match[1];
      if (!isExternalPackageSpecifier(specifier)) continue;
      const packageName = packageNameFromSpecifier(specifier);
      if (!declared.has(packageName))
        unexpected.push(`${relative(root, path)} -> ${specifier}`);
    }
  }
  if (unexpected.length)
    fail(
      `built package contains undeclared bare imports; add an intentional dependency/peer dependency or remove the import:\n${unexpected.map((item) => `- ${item}`).join("\n")}`,
    );
  const undeclaredDeclarations = [];
  for (const path of walkFiles(packageRoot).filter((file) =>
    file.endsWith(".d.ts"),
  )) {
    for (const specifier of declarationImportSpecifiers(
      join(packageRoot, path),
    )) {
      if (!isExternalPackageSpecifier(specifier)) continue;
      const packageName = packageNameFromSpecifier(specifier);
      if (!declared.has(packageName))
        undeclaredDeclarations.push({ path, specifier, packageName });
    }
  }
  if (undeclaredDeclarations.length)
    fail(
      `built package declarations contain undeclared bare imports; add an intentional dependency/peer/optional dependency or remove the declaration import:\n${undeclaredDeclarations
        .map(
          ({ path, specifier, packageName }) =>
            `- declaration file=${path} specifier=${specifier} normalized package=${packageName}`,
        )
        .join("\n")}`,
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

function angularDeclarationProgram(apiRoot, toolchainRoot, typescript = ts) {
  const outputRoot = mkdtempSync(join(tmpdir(), "bulud-ng-angular-api-"));
  try {
    execFileSync(
      join(toolchainRoot, "node_modules", ".bin", "ngc"),
      [
        "-p",
        join(apiRoot, "tsconfig.lib.prod.json"),
        "--outDir",
        outputRoot,
        "--sourceMap",
      ],
      { cwd: toolchainRoot, stdio: "inherit" },
    );
    const declarationFiles = walkFiles(outputRoot)
      .filter((path) => path.endsWith(".d.ts"))
      .map((path) => join(outputRoot, path));
    const program = typescript.createProgram(declarationFiles, {
      allowJs: false,
      module: typescript.ModuleKind.ESNext,
      moduleResolution: typescript.ModuleResolutionKind.Bundler,
      noEmit: true,
      skipLibCheck: true,
      target: typescript.ScriptTarget.ES2022,
    });
    const declarationEntries = new Map(
      [...sourceEntryPoints(apiRoot)].map(([entry, sourcePath]) => [
        entry,
        join(
          outputRoot,
          relative(apiRoot, sourcePath).replace(/\.ts$/, ".d.ts"),
        ),
      ]),
    );
    return {
      declarationEntries,
      outputRoot,
      program,
      typescript,
      toolchainRoot,
    };
  } catch (error) {
    rmSync(outputRoot, { recursive: true, force: true });
    fail(
      `could not emit Angular API declarations from ${relative(root, apiRoot)}: ${error instanceof Error ? error.message : error}`,
    );
  }
}

function expectedEntryExports(sourceEntries, packageName) {
  return new Map(
    [...sourceEntries.keys()].map((entry) => {
      const name =
        entry === "." ? packageName : `${packageName}-${entry.slice(2)}`;
      const declaration =
        entry === "." ? "./index.d.ts" : `${entry}/index.d.ts`;
      return [
        entry,
        {
          types: declaration,
          default: `./fesm2022/${name}.mjs`,
        },
      ];
    }),
  );
}

function validateBuiltEntryExports(packageJson, sourceEntries) {
  const expected = expectedEntryExports(sourceEntries, packageJson.name);
  const actual = packageExports(packageJson);
  const mismatches = [];
  for (const [key, expectedTarget] of expected) {
    const actualTarget = actual.get(key);
    if (
      JSON.stringify(stableValue(expectedTarget)) !==
      JSON.stringify(stableValue(actualTarget))
    )
      mismatches.push(
        `export key=${key} expected target=${JSON.stringify(stableValue(expectedTarget))} actual target=${JSON.stringify(stableValue(actualTarget))}`,
      );
  }
  if (mismatches.length)
    fail(
      `built JavaScript/declaration export targets differ from source entry points:\n${mismatches.map((mismatch) => `- ${mismatch}`).join("\n")}`,
    );
}

function publicDeclarationNode(declaration, typescript = ts) {
  let printable = declaration;
  if (typescript.isClassDeclaration(declaration)) {
    const members = declaration.members.filter((member) => {
      const modifiers = typescript.getModifiers(member) ?? [];
      return (
        !modifiers.some(
          (modifier) => modifier.kind === typescript.SyntaxKind.PrivateKeyword,
        ) &&
        (!member.name || !typescript.isPrivateIdentifier(member.name))
      );
    });
    printable = typescript.factory.updateClassDeclaration(
      declaration,
      typescript.getModifiers(declaration),
      declaration.name,
      declaration.typeParameters,
      declaration.heritageClauses,
      members,
    );
  }
  return printable;
}

function publicDeclarationText(declaration, typescript = ts) {
  const sourceFile = declaration.getSourceFile();
  return typescript
    .createPrinter({ removeComments: true })
    .printNode(
      typescript.EmitHint.Unspecified,
      publicDeclarationNode(declaration, typescript),
      sourceFile,
    )
    .replace(/\s+/g, " ")
    .trim();
}

function moduleDeclarationSignatures(
  program,
  path,
  declarationRoot,
  typescript = ts,
) {
  const sourceFile = program.getSourceFile(path);
  if (!sourceFile)
    fail(`could not read declarations from ${relative(root, path)}`);
  const moduleSymbol = program.getTypeChecker().getSymbolAtLocation(sourceFile);
  if (!moduleSymbol)
    fail(`could not inspect declarations from ${relative(root, path)}`);
  const checker = program.getTypeChecker();
  const sourceOrder = new Map(
    program.getSourceFiles().map((file, index) => [file.fileName, index]),
  );
  const declarationOrder = (left, right) => {
    const leftFile = sourceOrder.get(left.getSourceFile().fileName) ?? Infinity;
    const rightFile =
      sourceOrder.get(right.getSourceFile().fileName) ?? Infinity;
    return leftFile - rightFile || left.getStart() - right.getStart();
  };
  const resolvedSymbol = (symbol) =>
    symbol.flags & typescript.SymbolFlags.Alias
      ? checker.getAliasedSymbol(symbol)
      : symbol;
  const isInternalDeclaration = (declaration) => {
    const relativePath = relative(
      declarationRoot,
      declaration.getSourceFile().fileName,
    );
    return (
      relativePath !== "" &&
      !relativePath.startsWith("..") &&
      !relativePath.startsWith("/")
    );
  };
  const isReachablePublicDeclaration = (declaration) =>
    typescript.isClassDeclaration(declaration) ||
    typescript.isEnumDeclaration(declaration) ||
    typescript.isInterfaceDeclaration(declaration) ||
    typescript.isTypeAliasDeclaration(declaration) ||
    typescript.isVariableDeclaration(declaration) ||
    typescript.isFunctionDeclaration(declaration) ||
    typescript.isModuleDeclaration(declaration);
  const referencedSymbols = (declaration) => {
    const references = new Set();
    const visit = (node) => {
      if (typescript.isIdentifier(node)) {
        const symbol = checker.getSymbolAtLocation(node);
        if (symbol) {
          const resolved = resolvedSymbol(symbol);
          if (
            resolved.declarations?.some(
              (candidate) =>
                isInternalDeclaration(candidate) &&
                isReachablePublicDeclaration(candidate),
            )
          )
            references.add(resolved);
        }
      }
      typescript.forEachChild(node, visit);
    };
    visit(publicDeclarationNode(declaration, typescript));
    return [...references];
  };
  const signatures = new Map();
  for (const exported of checker.getExportsOfModule(moduleSymbol)) {
    const visited = new Set();
    const parts = [];
    const visit = (symbol) => {
      const resolved = resolvedSymbol(symbol);
      if (visited.has(resolved)) return;
      visited.add(resolved);
      const declarations = [...(resolved.declarations ?? [])].sort(
        declarationOrder,
      );
      parts.push(
        ...declarations.map((declaration) =>
          publicDeclarationText(declaration, typescript),
        ),
      );
      const references = declarations
        .flatMap(referencedSymbols)
        .sort((left, right) => {
          const leftDeclaration = left.declarations?.[0];
          const rightDeclaration = right.declarations?.[0];
          return leftDeclaration && rightDeclaration
            ? declarationOrder(leftDeclaration, rightDeclaration)
            : 0;
        });
      for (const reference of references) visit(reference);
    };
    visit(exported);
    if (parts.length) signatures.set(exported.name, parts.join(" "));
  }
  return signatures;
}

function validateApiBaseline(currentEntries, baseRef) {
  const baselineRoot = baseRevisionDirectory(baseRef);
  const currentDeclarations = angularDeclarationProgram(sourceApiRoot, root);
  const baselineTypescript = createRequire(join(baselineRoot, "package.json"))(
    "typescript",
  );
  const baselineEntries = sourceEntryPoints(
    join(baselineRoot, "projects", "bulud-ng"),
  );
  const baselineDeclarations = angularDeclarationProgram(
    join(baselineRoot, "projects", "bulud-ng"),
    baselineRoot,
    baselineTypescript,
  );
  try {
    const differences = [];
    const baselineManifest = readJson(
      join(baselineRoot, "projects", "bulud-ng", "package.json"),
    );
    const currentManifest = readJson(sourcePackagePath);
    const baselineCssExports = new Map(
      [...packageExports(baselineManifest)].filter(([key]) =>
        key.endsWith(".css"),
      ),
    );
    const currentCssExports = new Map(
      [...packageExports(currentManifest)].filter(([key]) =>
        key.endsWith(".css"),
      ),
    );
    const cssExportKeys = sorted(
      new Set([...baselineCssExports.keys(), ...currentCssExports.keys()]),
    );
    for (const key of cssExportKeys) {
      const had = baselineCssExports.has(key);
      const has = currentCssExports.has(key);
      if (!had)
        differences.push(
          `CSS export added: ${key} target=${cssExportTarget(currentCssExports.get(key))}`,
        );
      else if (!has)
        differences.push(
          `CSS export removed: ${key} target=${cssExportTarget(baselineCssExports.get(key))}`,
        );
      else if (
        cssExportTarget(baselineCssExports.get(key)) !==
        cssExportTarget(currentCssExports.get(key))
      )
        differences.push(
          `CSS export changed: ${key} baseline=${cssExportTarget(baselineCssExports.get(key))} current=${cssExportTarget(currentCssExports.get(key))}`,
        );
    }
    const baselineCustomPropertyUsage = sourceCustomPropertyUsage(
      join(baselineRoot, "projects", "bulud-ng"),
    );
    const currentCustomPropertyUsage = sourceCustomPropertyUsage(sourceApiRoot);
    const customPropertySurfaces = sorted(
      new Set([
        ...baselineCustomPropertyUsage.keys(),
        ...currentCustomPropertyUsage.keys(),
      ]),
    );
    for (const surface of customPropertySurfaces) {
      const baselineProperties = new Set(
        baselineCustomPropertyUsage.get(surface) ?? [],
      );
      const currentProperties = new Set(
        currentCustomPropertyUsage.get(surface) ?? [],
      );
      for (const property of sorted(
        [...currentProperties].filter((name) => !baselineProperties.has(name)),
      ))
        differences.push(
          `CSS custom property usage added: ${surface}: ${property}`,
        );
      for (const property of sorted(
        [...baselineProperties].filter((name) => !currentProperties.has(name)),
      ))
        differences.push(
          `CSS custom property usage removed: ${surface}: ${property}`,
        );
    }
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
      const currentSymbols = moduleDeclarationSignatures(
        currentDeclarations.program,
        currentDeclarations.declarationEntries.get(entry),
        currentDeclarations.outputRoot,
        currentDeclarations.typescript,
      );
      const baselineSymbols = moduleDeclarationSignatures(
        baselineDeclarations.program,
        baselineDeclarations.declarationEntries.get(entry),
        baselineDeclarations.outputRoot,
        baselineDeclarations.typescript,
      );
      const removed = sorted(
        [...baselineSymbols.keys()].filter((name) => !currentSymbols.has(name)),
      );
      const added = sorted(
        [...currentSymbols.keys()].filter((name) => !baselineSymbols.has(name)),
      );
      if (removed.length || added.length)
        differences.push(
          `${entry === "." ? "bulud-ng" : `bulud-ng/${entry.slice(2)}`}: removed=${formatList(removed)} added=${formatList(added)}`,
        );
      for (const name of sorted(
        [...currentSymbols.keys()].filter((symbol) =>
          baselineSymbols.has(symbol),
        ),
      )) {
        const baselineSignature = baselineSymbols.get(name);
        const currentSignature = currentSymbols.get(name);
        if (baselineSignature !== currentSignature)
          differences.push(
            `${entry === "." ? "bulud-ng" : `bulud-ng/${entry.slice(2)}`} ${name}: signature changed; baseline=${baselineSignature} current=${currentSignature}`,
          );
      }
    }
    enforceApprovedChanges("api", differences, baseRef);
  } finally {
    rmSync(currentDeclarations.outputRoot, { recursive: true, force: true });
    rmSync(baselineDeclarations.outputRoot, {
      recursive: true,
      force: true,
    });
    rmSync(baselineRoot, { recursive: true, force: true });
  }
}

function validateApi() {
  const packageJson = readJson(join(packageRoot, "package.json"));
  const sourceEntries = sourceEntryPoints();
  const baseRef = dependencyBaseRef();
  validateApiBaseline(sourceEntries, baseRef);
  validatePackageJsEntries(packageJson);
  validateBuiltEntryExports(packageJson, sourceEntries);

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
    "optionalDependencies",
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
    ...[
      "dependencies",
      "peerDependencies",
      "peerDependenciesMeta",
      "optionalDependencies",
    ].flatMap((field) =>
      dependencyChanges(
        `projects/bulud-ng/package.json ${field}`,
        baseLibrary[field],
        source[field],
      ),
    ),
  ];
  const baseLockfile = readBaseJson(baseRef, "package-lock.json");
  const lockfileChanges = lockfileContractChanges(baseLockfile, lockfile);
  enforceApprovedChanges(
    "dependencies",
    [...baselineChanges, ...lockfileChanges],
    baseRef,
  );
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
  // Preserve every top-level and package-record field. Only object-key ordering
  // is normalized; npm behavior-affecting metadata must remain comparable.
  return stableValue(lockfile);
}

function lockfileContractChanges(baseline, current) {
  const baseContract = normalizedLockfile(baseline);
  const currentContract = normalizedLockfile(current);
  const changes = [];
  const basePackages = baseContract.packages ?? {};
  const currentPackages = currentContract.packages ?? {};
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
  const topLevelFields = new Set([
    ...Object.keys(baseContract),
    ...Object.keys(currentContract),
  ]);
  topLevelFields.delete("packages");
  for (const field of sorted(topLevelFields)) {
    if (
      JSON.stringify(baseContract[field]) !==
      JSON.stringify(currentContract[field])
    )
      changes.push(
        `package-lock ${field}: ${JSON.stringify(baseContract[field])} -> ${JSON.stringify(currentContract[field])}`,
      );
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
  const sourceEntries = sourceEntryPoints();
  validatePackageJsEntries(packageJson);
  validateBuiltEntryExports(packageJson, sourceEntries);
  const source = readJson(
    join(root, "projects", "bulud-ng", "ng-package.json"),
  );
  const sourceManifest = readJson(sourcePackagePath);
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
  const sourceCssExports = new Map(
    [...packageExports(sourceManifest)].filter(([key]) => key.endsWith(".css")),
  );
  const unexpectedCssExports = sorted(
    [...cssExports].filter((entry) => !sourceCssExports.has(entry)),
  );
  const missingCssExports = sorted(
    [...sourceCssExports.keys()].filter((entry) => !cssExports.has(entry)),
  );
  if (unexpectedCssExports.length || missingCssExports.length)
    fail(
      `CSS package export keys differ from projects/bulud-ng/package.json; unexpected=${formatList(unexpectedCssExports)} missing=${formatList(missingCssExports)}`,
    );
  const cssTargetMismatches = sorted([...sourceCssExports.keys()])
    .filter(
      (key) =>
        cssExportTarget(sourceCssExports.get(key)) !==
        cssExportTarget(exports.get(key)),
    )
    .map(
      (key) =>
        `${key}: expected target=${cssExportTarget(sourceCssExports.get(key))} actual target=${cssExportTarget(exports.get(key))}`,
    );
  if (cssTargetMismatches.length)
    fail(
      `CSS package export targets differ from projects/bulud-ng/package.json:\n${cssTargetMismatches.map((mismatch) => `- ${mismatch}`).join("\n")}`,
    );
  const expectedCssExports = new Set(
    [...assetPaths].map((asset) => `./${asset}`),
  );
  const assetCssExportMismatches = sorted(
    [...expectedCssExports].filter((entry) => !sourceCssExports.has(entry)),
  );
  if (assetCssExportMismatches.length)
    fail(
      `CSS source package exports do not cover configured ng-package assets: ${formatList(assetCssExportMismatches)}`,
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
    const peerDependencies = Object.keys(packageJson.peerDependencies ?? {})
      .filter(
        (dependency) =>
          !packageJson.peerDependenciesMeta?.[dependency]?.optional,
      )
      .map((dependency) => [dependency, smokePackageVersion(dependency)]);
    const smokeManifest = {
      name: "bulud-ng-package-smoke",
      private: true,
      version: "0.0.0",
      dependencies: Object.fromEntries([
        ["@angular/compiler", smokePackageVersion("@angular/compiler")],
        ...peerDependencies,
      ]),
    };
    writeFileSync(
      join(temporaryRoot, "package.json"),
      JSON.stringify(smokeManifest, null, 2),
    );
    try {
      execFileSync(
        "npm",
        ["install", "--ignore-scripts", "--no-audit", "--no-fund"],
        { cwd: temporaryRoot, env: smokeNpmEnv, stdio: "inherit" },
      );
      smokeManifest.dependencies["bulud-ng"] = `file:./${packedFilename}`;
      writeFileSync(
        join(temporaryRoot, "package.json"),
        JSON.stringify(smokeManifest, null, 2),
      );
      execFileSync(
        "npm",
        ["install", "--ignore-scripts", "--no-audit", "--no-fund"],
        { cwd: temporaryRoot, env: smokeNpmEnv, stdio: "inherit" },
      );
    } catch (error) {
      fail(
        `isolated package installation failed; npm could not install the packed package and explicit peers in the temporary consumer: ${error instanceof Error ? error.message : error}`,
      );
    }
    validateInstalledCssExports(temporaryRoot, packageJson);
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
        `isolated package-path import failed after consumer installation; check the package's declared dependencies and peers: ${error instanceof Error ? error.message : error}`,
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

function validateInstalledCssExports(temporaryRoot, packageJson) {
  const installedPackageRoot = join(
    temporaryRoot,
    "node_modules",
    ...packageJson.name.split("/"),
  );
  const installedManifestPath = join(installedPackageRoot, "package.json");
  if (!statSafe(installedManifestPath))
    fail(
      `packed package installation is missing its manifest at ${relative(root, installedManifestPath)}`,
    );
  const installedManifest = readJson(installedManifestPath);
  const cssExports = [...packageExports(installedManifest)].filter(([key]) =>
    key.endsWith(".css"),
  );
  for (const [key, value] of cssExports) {
    const targets = [...new Set(exportTargets(value))];
    if (targets.length === 0)
      fail(
        `installed CSS export has no target: export key=${key} target=${cssExportTarget(value)}`,
      );
    for (const target of targets) {
      const installedPath = join(
        installedPackageRoot,
        target.replace(/^\.\//, ""),
      );
      if (!statSafe(installedPath))
        fail(
          `packed package CSS export is missing: export key=${key} target=${target} missing installed path=${relative(root, installedPath)}`,
        );
    }
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
