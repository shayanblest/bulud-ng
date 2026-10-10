import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import test from "node:test";
import {
  customPropertyUsageChanges,
  sourceCustomPropertyUsage,
} from "./custom-property-contract.mjs";

const property = "--bulud-dialog-background";
const binding = `<section [style.${property}]="background()"></section>`;
const stylesheet = `section { background: var(${property}); }`;

function fixture(t) {
  const root = mkdtempSync(join(tmpdir(), "bulud-custom-property-control-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const write = (path, source) => {
    const target = join(root, path);
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, source);
  };
  write("dialog.html", binding);
  write("dialog.scss", stylesheet);
  return { write, scan: () => sourceCustomPropertyUsage(root) };
}

test("unchanged template binding and SCSS pass as separate surfaces", (t) => {
  const { scan } = fixture(t);
  const baseline = scan();
  assert.deepEqual(
    [...baseline],
    [
      ["dialog.html#template", [property]],
      ["dialog.scss", [property]],
    ],
  );
  assert.deepEqual(customPropertyUsageChanges(baseline, scan()), []);
});

test("template binding removal is detected while the property remains in SCSS", (t) => {
  const { scan, write } = fixture(t);
  const baseline = scan();
  write("dialog.html", `<!-- ${binding} --><section></section>`);
  const current = scan();
  assert.deepEqual(current.get("dialog.scss"), baseline.get("dialog.scss"));
  assert.deepEqual(customPropertyUsageChanges(baseline, current), [
    `CSS custom property usage removed: dialog.html#template: ${property}`,
  ]);
});

test("template binding rename reports both names while original SCSS remains", (t) => {
  const { scan, write } = fixture(t);
  const baseline = scan();
  write("dialog.html", binding.replace(property, "--bulud-dialog-surface"));
  assert.deepEqual(customPropertyUsageChanges(baseline, scan()), [
    "CSS custom property usage added: dialog.html#template: --bulud-dialog-surface",
    `CSS custom property usage removed: dialog.html#template: ${property}`,
  ]);
});

function componentSource(template, host) {
  return `
    import { Component } from '@angular/core';
    @Component({ template: \`${template}\`, host: { ${host} } })
    export class Dialog {}
  `;
}

const hostBinding = `'[style.${property}]': 'background()'`;

test("inline template removal is detected despite matching host and SCSS properties", (t) => {
  const { scan, write } = fixture(t);
  write("dialog.ts", componentSource(binding, hostBinding));
  const baseline = scan();
  write("dialog.ts", componentSource("<section></section>", hostBinding));
  assert.deepEqual(customPropertyUsageChanges(baseline, scan()), [
    `CSS custom property usage removed: dialog.ts#template:Dialog: ${property}`,
  ]);
});

test("host metadata removal is detected despite matching inline and external templates", (t) => {
  const { scan, write } = fixture(t);
  write("dialog.ts", componentSource(binding, hostBinding));
  const baseline = scan();
  assert.deepEqual(customPropertyUsageChanges(baseline, scan()), []);
  write("dialog.ts", componentSource(binding, ""));
  assert.deepEqual(customPropertyUsageChanges(baseline, scan()), [
    `CSS custom property usage removed: dialog.ts#host:Dialog: ${property}`,
  ]);
});

test("HostBinding decorators are tracked, including Angular import aliases", (t) => {
  const { scan, write } = fixture(t);
  const source = `
    import { Directive as Dir, HostBinding as Bind } from '@angular/core';
    @Dir({ selector: '[theme]' })
    export class Theme {
      @Bind('style.${property}') background = 'red';
    }
  `;
  write("theme.ts", source);
  const baseline = scan();
  assert.deepEqual(baseline.get("theme.ts#host:Theme"), [property]);
  write("theme.ts", source.replace(`@Bind('style.${property}')`, ""));
  assert.deepEqual(customPropertyUsageChanges(baseline, scan()), [
    `CSS custom property usage removed: theme.ts#host:Theme: ${property}`,
  ]);
});

test("specs, tests, fixtures, and nonbinding TypeScript strings are excluded", (t) => {
  const { scan, write } = fixture(t);
  const baseline = scan();
  for (const path of [
    "dialog.spec.html",
    "dialog.test.html",
    "dialog.fixture.html",
    "fixtures/dialog.html",
    "test/dialog.html",
    "__tests__/dialog.html",
  ])
    write(path, binding.replace(property, "--bulud-test-only"));
  write("dialog.spec.scss", ":root { --bulud-test-only: red; }");
  write("dialog.spec.ts", componentSource(binding, hostBinding));
  write("fixtures/dialog.ts", componentSource(binding, hostBinding));
  write("example.ts", `const example = ${JSON.stringify(binding)};`);
  assert.deepEqual([...scan()], [...baseline]);
});

test("surfaces and deduplicated properties have deterministic ordering", (t) => {
  const { scan, write } = fixture(t);
  write(
    "ordered.ts",
    `
    import { Component } from '@angular/core';
    @Component({
      template: '<div [style.--bulud-z]="z" [style.--bulud-a]="a"></div>',
      host: { '[style.--bulud-z]': 'z', '[style.--bulud-a.px]': 'a' }
    })
    class Z {}
    @Component({ template: '<div [style.--bulud-a]="a"></div>' })
    class A {}
  `,
  );
  write("a.html", '<div [style.--bulud-z]="z" [style.--bulud-a]="a"></div>');
  const usage = scan();
  assert.deepEqual(
    [...usage.keys()],
    [
      "a.html#template",
      "dialog.html#template",
      "dialog.scss",
      "ordered.ts#host:Z",
      "ordered.ts#template:A",
      "ordered.ts#template:Z",
    ],
  );
  assert.deepEqual(usage.get("ordered.ts#host:Z"), ["--bulud-a", "--bulud-z"]);
  assert.deepEqual(usage.get("ordered.ts#template:Z"), [
    "--bulud-a",
    "--bulud-z",
  ]);
});
