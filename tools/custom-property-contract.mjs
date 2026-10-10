import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import ts from "typescript";

function sourceFiles(directory, prefix = "") {
  return readdirSync(join(directory, prefix), { withFileTypes: true }).flatMap(
    (entry) => {
      const path = join(prefix, entry.name);
      if (
        /(?:^|[/\\])(?:__)?(?:tests?|specs?|fixtures?)(?:__)?(?:[/\\]|$)/.test(
          path,
        ) ||
        /\.(?:spec|test|fixture)\.[^/\\]+$/.test(path)
      )
        return [];
      return entry.isDirectory() ? sourceFiles(directory, path) : [path];
    },
  );
}

function templateProperties(template) {
  return new Set(
    [
      ...template
        .replace(/<!--[\s\S]*?-->/g, "")
        .matchAll(/\[style\.(--bulud-[A-Za-z0-9_-]+)(?:\.[A-Za-z]+)?\]\s*=/g),
    ].map((match) => match[1]),
  );
}

function styleProperty(binding) {
  return /^style\.(--bulud-[A-Za-z0-9_-]+)(?:\.[A-Za-z]+)?$/.exec(binding)?.[1];
}

function propertyName(node) {
  return ts.isIdentifier(node) || ts.isStringLiteralLike(node) ? node.text : "";
}

function metadataValue(metadata, name) {
  return metadata.properties.find(
    (property) =>
      ts.isPropertyAssignment(property) && propertyName(property.name) === name,
  )?.initializer;
}

function typescriptBindingSurfaces(source, path) {
  const file = ts.createSourceFile(path, source, ts.ScriptTarget.Latest, true);
  const aliases = new Map();
  for (const statement of file.statements) {
    if (
      ts.isImportDeclaration(statement) &&
      ts.isStringLiteral(statement.moduleSpecifier) &&
      statement.moduleSpecifier.text === "@angular/core" &&
      statement.importClause?.namedBindings &&
      ts.isNamedImports(statement.importClause.namedBindings)
    ) {
      for (const imported of statement.importClause.namedBindings.elements)
        aliases.set(
          imported.name.text,
          (imported.propertyName ?? imported.name).text,
        );
    }
  }
  const decoratorName = (call) => {
    const name = ts.isPropertyAccessExpression(call.expression)
      ? call.expression.name.text
      : propertyName(call.expression);
    return aliases.get(name) ?? name;
  };
  const surfaces = new Map();
  for (const declaration of file.statements.filter(ts.isClassDeclaration)) {
    const className = declaration.name?.text ?? "default";
    const hostProperties = new Set();
    for (const decorator of ts.getDecorators(declaration) ?? []) {
      const call = decorator.expression;
      if (
        !ts.isCallExpression(call) ||
        !["Component", "Directive"].includes(decoratorName(call)) ||
        !call.arguments[0] ||
        !ts.isObjectLiteralExpression(call.arguments[0])
      )
        continue;
      const template = metadataValue(call.arguments[0], "template");
      if (template && ts.isStringLiteralLike(template))
        surfaces.set(
          `${path}#template:${className}`,
          templateProperties(template.text),
        );
      const host = metadataValue(call.arguments[0], "host");
      if (host && ts.isObjectLiteralExpression(host)) {
        for (const property of host.properties) {
          if (!ts.isPropertyAssignment(property)) continue;
          const binding = propertyName(property.name);
          if (!binding.startsWith("[") || !binding.endsWith("]")) continue;
          const name = styleProperty(binding.slice(1, -1));
          if (name) hostProperties.add(name);
        }
      }
    }
    for (const member of declaration.members) {
      for (const decorator of ts.getDecorators(member) ?? []) {
        const call = decorator.expression;
        if (
          !ts.isCallExpression(call) ||
          decoratorName(call) !== "HostBinding" ||
          !call.arguments[0] ||
          !ts.isStringLiteralLike(call.arguments[0])
        )
          continue;
        const name = styleProperty(call.arguments[0].text);
        if (name) hostProperties.add(name);
      }
    }
    surfaces.set(`${path}#host:${className}`, hostProperties);
  }
  return surfaces;
}

export function sourceCustomPropertyUsage(apiRoot) {
  const usage = new Map();
  const addSurface = (surface, names) => {
    if (names.size) usage.set(surface, [...names].sort());
  };
  for (const path of sourceFiles(apiRoot).sort()) {
    if (!/\.(?:css|scss|html|ts)$/.test(path) || path.endsWith(".d.ts"))
      continue;
    const source = readFileSync(join(apiRoot, path), "utf8");
    if (/\.(?:css|scss)$/.test(path))
      addSurface(
        path,
        new Set(
          [...source.matchAll(/--bulud-[A-Za-z0-9_-]+/g)].map(
            (match) => match[0],
          ),
        ),
      );
    else if (path.endsWith(".html"))
      addSurface(`${path}#template`, templateProperties(source));
    else
      for (const [surface, names] of typescriptBindingSurfaces(source, path))
        addSurface(surface, names);
  }
  return new Map(
    [...usage].sort(([left], [right]) =>
      left < right ? -1 : left > right ? 1 : 0,
    ),
  );
}

export function customPropertyUsageChanges(baseline, current) {
  const changes = [];
  const surfaces = [...new Set([...baseline.keys(), ...current.keys()])].sort();
  for (const surface of surfaces) {
    const baselineProperties = new Set(baseline.get(surface) ?? []);
    const currentProperties = new Set(current.get(surface) ?? []);
    for (const property of [...currentProperties]
      .filter((name) => !baselineProperties.has(name))
      .sort())
      changes.push(`CSS custom property usage added: ${surface}: ${property}`);
    for (const property of [...baselineProperties]
      .filter((name) => !currentProperties.has(name))
      .sort())
      changes.push(
        `CSS custom property usage removed: ${surface}: ${property}`,
      );
  }
  return changes;
}
