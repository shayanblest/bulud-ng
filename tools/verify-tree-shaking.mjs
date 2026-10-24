import {
  mkdtemp,
  readFile,
  writeFile,
  mkdir,
  readdir,
  symlink,
  rm,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve, join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import { gzipSync } from "node:zlib";
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const workspace = await mkdtemp(join(tmpdir(), "bulud-package-consumer-"));
try {
  const modules = join(workspace, "node_modules");
  await mkdir(modules);
  for (const entry of await readdir(join(root, "node_modules"), {
    withFileTypes: true,
  })) {
    if (entry.name.startsWith(".") || entry.name === "bulud-ng") continue;
    await symlink(
      join(root, "node_modules", entry.name),
      join(modules, entry.name),
      "dir",
    );
  }
  const packed = JSON.parse(
    execFileSync(
      "npm",
      [
        "pack",
        join(root, "dist/bulud-ng"),
        "--json",
        "--pack-destination",
        workspace,
        "--cache",
        join(workspace, "cache"),
      ],
      { encoding: "utf8" },
    ),
  );
  const tarball = join(workspace, packed[0].filename);
  execFileSync("tar", ["-xzf", tarball, "-C", workspace]);
  await symlink(join(workspace, "package"), join(modules, "bulud-ng"), "dir");
  await writeFile(
    join(workspace, "package.json"),
    JSON.stringify({ private: true, type: "module" }),
  );
  await writeFile(
    join(workspace, "index.html"),
    '<html><head><base href="/"></head><body><test-root></test-root></body></html>',
  );
  await writeFile(
    join(workspace, "tsconfig.json"),
    JSON.stringify({
      compilerOptions: {
        target: "ES2022",
        module: "preserve",
        moduleResolution: "bundler",
        experimentalDecorators: true,
        strict: true,
        skipLibCheck: true,
        lib: ["ES2022", "dom"],
      },
      angularCompilerOptions: { strictTemplates: true },
      files: ["main.ts"],
    }),
  );
  await writeFile(
    join(workspace, "angular.json"),
    JSON.stringify({
      version: 1,
      projects: {
        consumer: {
          projectType: "application",
          root: "",
          architect: {
            build: {
              builder: "@angular/build:application",
              options: {
                browser: "main.ts",
                index: "index.html",
                tsConfig: "tsconfig.json",
                outputPath: "out",
                styles: ["styles.css"],
                optimization: true,
                sourceMap: false,
                outputHashing: "none",
              },
            },
          },
        },
      },
    }),
  );
  await writeFile(
    join(workspace, "styles.css"),
    '@import "bulud-ng/theme.css";\n@import "bulud-ng/angour.css";\n@import "bulud-ng/angour-base.css";',
  );
  const manifest = JSON.parse(
    await readFile(join(workspace, "package/package.json"), "utf8"),
  );
  const entries = Object.keys(manifest.exports).filter(
    (key) => key !== "./package.json" && !key.endsWith(".css"),
  );
  for (const key of Object.keys(manifest.exports).filter((key) =>
    key.endsWith(".css"),
  )) {
    const target = manifest.exports[key].default;
    await readFile(join(workspace, "package", target));
  }
  await writeFile(
    join(workspace, "consumer-types.ts"),
    entries
      .map(
        (key, index) =>
          `import * as Entry${index} from ${JSON.stringify(key === "." ? "bulud-ng" : "bulud-ng/" + key.slice(2))};\nexport type Public${index} = typeof Entry${index};`,
      )
      .join("\n"),
  );
  await writeFile(
    join(workspace, "tsconfig.types.json"),
    JSON.stringify({
      compilerOptions: {
        strict: true,
        noEmit: true,
        skipLibCheck: false,
        target: "ES2022",
        module: "ESNext",
        moduleResolution: "Bundler",
        types: [],
      },
      files: ["consumer-types.ts"],
    }),
  );
  execFileSync(
    process.execPath,
    [
      join(root, "node_modules/typescript/bin/tsc"),
      "--project",
      join(workspace, "tsconfig.types.json"),
      "--pretty",
      "false",
    ],
    { cwd: workspace, stdio: "pipe" },
  );
  const reports = [];
  for (const test of [
    {
      name: "button",
      entry: "button",
      type: "BuludButton",
      template: "<bulud-button>Consumer</bulud-button>",
      present: "bulud-button",
      absent: [
        "bulud-chart",
        "bulud-skeleton",
        "bulud-confirm",
        "bulud-donut-chart",
        "bulud-file-upload",
        "bulud-period-picker",
        "XMLHttpRequest",
        "bulud-chat",
        "buludNumber",
        "buludRelativeTime",
      ],
    },
    {
      name: "donut",
      entry: "charts",
      type: "BuludDonutChart",
      template:
        '<bulud-donut-chart caption="Consumer" [segments]="[{label: \'A\', value: 2}]"/>',
      present: "bulud-donut-chart",
      absent: [
        "bulud-chart",
        "bulud-progress",
        "bulud-file-upload",
        "bulud-period-picker",
      ],
    },
    {
      name: "period",
      entry: "period-picker",
      type: "BuludPeriodPicker",
      template: '<bulud-period-picker label="Period"/>',
      present: "bulud-period-picker",
      absent: ["bulud-datepicker", "bulud-chart", "bulud-file-upload"],
    },
    {
      name: "chat",
      entry: "chat",
      type: "BuludChat",
      template: "<bulud-chat/>",
      present: "bulud-chat",
      absent: [
        "bulud-file-upload",
        "bulud-chart",
        "bulud-dropdown",
        "buludNumber",
        "buludRelativeTime",
      ],
    },
    {
      name: "number-pipe",
      entry: "utilities",
      type: "BuludNumberPipe",
      template: "{{1234 | buludNumber:'fa-IR'}}",
      present: "buludNumber",
      absent: [
        "bulud-chat",
        "bulud-chart",
        "buludFileExtension",
        "buludRelativeTime",
      ],
    },
    {
      name: "skeleton",
      entry: "skeleton",
      type: "BuludSkeleton",
      template: '<bulud-skeleton shape="card"/>',
      present: "bulud-skeleton",
      absent: [
        "bulud-dialog",
        "bulud-confirm",
        "bulud-file-upload",
        "bulud-chart",
      ],
    },
    {
      name: "confirm",
      entry: "confirm",
      type: "BuludConfirm",
      template: '<bulud-confirm title="Continue?"/>',
      present: "bulud-confirm",
      absent: ["bulud-skeleton", "bulud-file-upload", "bulud-chart"],
    },
  ]) {
    await writeFile(
      join(workspace, "main.ts"),
      `import {Component,provideZonelessChangeDetection} from '@angular/core';import {bootstrapApplication} from '@angular/platform-browser';import {${test.type}} from 'bulud-ng/${test.entry}';@Component({selector:'test-root',imports:[${test.type}],template:${JSON.stringify(test.template)}})class App{}bootstrapApplication(App,{providers:[provideZonelessChangeDetection()]});`,
    );
    execFileSync(
      process.execPath,
      [join(root, "node_modules/@angular/cli/bin/ng.js"), "build", "consumer"],
      { cwd: workspace, stdio: "pipe" },
    );
    const directory = join(workspace, "out/browser");
    const cssFiles = (await readdir(directory)).filter((file) =>
      file.endsWith(".css"),
    );
    const css = (
      await Promise.all(
        cssFiles.map((file) => readFile(join(directory, file), "utf8")),
      )
    ).join("\n");
    if (!css.includes("--bulud-color-primary"))
      throw new Error("Consumer theme CSS was removed or not resolved");
    let js = "";
    for (const file of await readdir(directory))
      if (file.endsWith(".js"))
        js += await readFile(join(directory, file), "utf8");
    if (!js.includes(test.present))
      throw new Error(`Missing selected component: ${test.name}`);
    for (const marker of test.absent)
      if (js.includes(`"${marker}"`) || js.includes(`'${marker}'`))
        throw new Error(`Unused feature leaked into ${test.name}: ${marker}`);
    reports.push({
      fixture: test.name,
      bytes: Buffer.byteLength(js),
      gzipBytes: gzipSync(js).length,
      unusedFeaturesAbsent: test.absent,
    });
    await rm(join(workspace, "out"), { recursive: true, force: true });
  }
  console.log(
    JSON.stringify(
      {
        package: packed[0].filename,
        declarationEntries: entries.length,
        cssExports: Object.keys(manifest.exports).filter((key) =>
          key.endsWith(".css"),
        ).length,
        fixtures: reports,
      },
      null,
      2,
    ),
  );
} finally {
  await rm(workspace, { recursive: true, force: true });
}
