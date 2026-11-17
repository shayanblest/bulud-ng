import { partitionThemeVariables } from "./theme-variable-partition.mjs";
import { build } from "esbuild";
import { format } from "prettier";
import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath, pathToFileURL } from "node:url";
import { resolve } from "node:path";

const root = fileURLToPath(new URL("..", import.meta.url));
const generated = resolve(root, ".angular/angour-theme.mjs");
await mkdir(resolve(root, ".angular"), { recursive: true });
await build({
  stdin: {
    contents: `export * from './projects/bulud-ng/src/lib/theme/angour-theme'; export { createBuludThemeVariables } from './projects/bulud-ng/src/lib/theme/bulud-theme';`,
    resolveDir: root,
    loader: "ts",
  },
  bundle: true,
  platform: "node",
  format: "esm",
  packages: "external",
  outfile: generated,
});
const {
  BULUD_ANGOUR_LIGHT_THEME,
  BULUD_ANGOUR_DARK_THEME,
  BULUD_ANGOUR_TOKENS,
  createBuludThemeVariables,
} = await import(pathToFileURL(generated).href);
const selector = '[data-bulud-preset="angour"]';
const dark = ':is(.dark, [data-theme="dark"], [data-bs-theme="dark"])';
const light = ':is(.light, [data-theme="light"], [data-bs-theme="light"])';
const declarations = (values) =>
  Object.entries(values)
    .map(([key, value]) => `  ${key}: ${value};`)
    .join("\n");
const foundations = {};
for (const group of ["spacing", "radius", "shadow"]) {
  for (const [key, value] of Object.entries(BULUD_ANGOUR_TOKENS[group]))
    foundations[`--bulud-${group}-${key}`] = value;
}
for (const [key, value] of Object.entries(BULUD_ANGOUR_TOKENS.font)) {
  if (typeof value === "string") foundations[`--bulud-font-${key}`] = value;
  else
    for (const [size, length] of Object.entries(value))
      foundations[`--bulud-font-size-${size}`] = length;
}
function variables(mode, theme) {
  const palette = BULUD_ANGOUR_TOKENS[mode];
  const values = {
    ...createBuludThemeVariables(theme),
    "--bulud-body-bg": palette.body,
    "--bulud-body-color": palette.foreground,
  };
  for (const name of [
    "secondary",
    "success",
    "info",
    "warning",
    "muted",
    "subtle",
  ])
    values[`--bulud-color-${name}`] = palette[name];
  values["--bulud-alert-brand-opacity"] = mode === "dark" ? "25%" : "20%";
  values["--bulud-alert-neutral-opacity"] = mode === "dark" ? "20%" : "10%";
  values["--bulud-color-danger-text"] = palette.dangerText;
  // Component defaults follow the project palette; explicit component overrides remain independent.
  const equal = (a, b) =>
    typeof a === "string" && a.toLowerCase() === b.toLowerCase();
  for (const [key, value] of Object.entries(values)) {
    if (
      key.startsWith("--bulud-color-") ||
      key.startsWith("--bulud-body-") ||
      key.startsWith("--bulud-alert-")
    )
      continue;
    let target;
    if (key.endsWith("-focus") && equal(value, palette.focus))
      target = "--bulud-color-focus";
    else if (equal(value, palette.primary)) target = "--bulud-color-primary";
    else if (equal(value, palette.primaryHover))
      target = "--bulud-color-primary-hover";
    else if (equal(value, palette.primaryActive))
      target = "--bulud-color-primary-active";
    else if (key.includes("foreground") || key.endsWith("-thumb")) {
      if (equal(value, palette.foreground)) target = "--bulud-color-on-surface";
      else if (equal(value, palette.onPrimary))
        target = "--bulud-color-on-primary";
    } else if (equal(value, palette.surface)) target = "--bulud-color-surface";
    else if (equal(value, palette.surfaceHover))
      target = "--bulud-color-surface-hover";
    else if (equal(value, palette.surfaceActive))
      target = "--bulud-color-surface-active";
    else if (equal(value, palette.body)) target = "--bulud-body-bg";
    if (!target && equal(value, palette.border))
      target = "--bulud-color-border";
    if (!target && equal(value, palette.muted)) target = "--bulud-color-muted";
    if (target) values[key] = `var(${target})`;
  }
  return values;
}
const lightVariables = variables("light", BULUD_ANGOUR_LIGHT_THEME);
const darkVariables = variables("dark", BULUD_ANGOUR_DARK_THEME);
const modes = partitionThemeVariables(lightVariables, darkVariables);
// Re-evaluate aliases at a nested theme boundary instead of inheriting a resolved light color.
for (const [name, value] of Object.entries({ ...modes.common }))
  if (value.startsWith("var(--bulud-")) {
    delete modes.common[name];
    modes.light[name] = lightVariables[name];
    modes.dark[name] = darkVariables[name];
  }

for (const name of ["--bulud-button-ghost-background"]) {
  delete modes.common[name];
  modes.light[name] = lightVariables[name];
  modes.dark[name] = darkVariables[name];
}
function controlTypography(scope) {
  return `${scope} { --bulud-font-size-control: var(--bulud-font-size-7,12px); }
${scope}:lang(fa) { --bulud-font-size-control: var(--bulud-font-size-6,14px); }
@media (max-width:36rem) { ${scope}, ${scope}:lang(fa) { --bulud-font-size-control: var(--bulud-font-size-7,12px); } }`;
}
const css = `/* Generated by node tools/generate-angour-theme.mjs. Import explicitly. */
${selector} {\n${declarations({ ...foundations, ...modes.common, ...modes.light })}\n}

${controlTypography(selector)}

/* React to the consuming app's ancestor; the library never owns its switcher. */
${dark} ${selector}, ${selector}${dark} {\n${declarations(modes.dark)}\n}

/* An explicit light scope overrides inherited dark mode. */
${selector}${light} {\n${declarations(modes.light)}\n}
`;
await writeFile(
  resolve(root, "projects/bulud-ng/tailwind/angour.input.css"),
  await format('@import "tailwindcss/utilities" source(none);\n' + css, {
    parser: "css",
  }),
);

const defaultCss = `@import "tailwindcss/utilities" source(none);
${controlTypography(":root")}
/* Generated from the canonical Angour tokens. Import explicitly; no global styles are injected by JavaScript. */
:root {
${declarations({ ...foundations, ...modes.common, ...modes.light })}
}
:root:is(.dark,[data-theme="dark"],[data-bs-theme="dark"]), :where(.dark,[data-theme="dark"],[data-bs-theme="dark"]) {
${declarations(modes.dark)}
}
:root:is(.light,[data-theme="light"],[data-bs-theme="light"]), :where(.light,[data-theme="light"],[data-bs-theme="light"]) {
${declarations(modes.light)}
}
`;
await writeFile(
  resolve(root, "projects/bulud-ng/tailwind/theme.input.css"),
  await format(defaultCss, { parser: "css" }),
);
