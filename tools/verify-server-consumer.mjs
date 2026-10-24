import { mkdtempSync, writeFileSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const version =
  process.argv[2] ??
  JSON.parse(
    readFileSync(join(root, "node_modules/@angular/core/package.json"), "utf8"),
  ).version;
if (!/^20\.\d+\.\d+$/.test(version))
  throw new Error(
    "Supply an Angular 20 patch version; other major versions are not declared supported.",
  );
const dir = mkdtempSync(join(tmpdir(), "bulud-server-consumer-"));
const run = (cmd, args) =>
  execFileSync(cmd, args, { cwd: dir, stdio: "inherit", timeout: 180000 });
try {
  const pack = JSON.parse(
    execFileSync(
      "npm",
      [
        "pack",
        join(root, "dist/bulud-ng"),
        "--json",
        "--pack-destination",
        dir,
        "--cache",
        join(tmpdir(), "bulud-consumer-npm-cache"),
      ],
      { encoding: "utf8", timeout: 60000 },
    ),
  );
  writeFileSync(
    join(dir, "package.json"),
    JSON.stringify({
      name: "bulud-server-consumer",
      private: true,
      type: "module",
      version: "0.0.0",
    }),
  );
  run("npm", [
    "install",
    "--ignore-scripts",
    "--no-audit",
    "--no-fund",
    "--package-lock=false",
    "--cache",
    join(tmpdir(), "bulud-consumer-npm-cache"),
    ...[
      "core",
      "common",
      "forms",
      "compiler",
      "compiler-cli",
      "platform-browser",
      "platform-server",
    ].map((name) => `@angular/${name}@${version}`),
    "typescript@5.8.3",
    "rxjs@7.8.2",
    join(dir, pack[0].filename),
  ]);
  const manifest = JSON.parse(
    readFileSync(join(dir, "node_modules/bulud-ng/package.json"), "utf8"),
  );
  const entries = Object.keys(manifest.exports).filter(
    (p) => p !== "./package.json" && !p.endsWith(".css"),
  );
  writeFileSync(
    join(dir, "types.ts"),
    entries
      .map(
        (p, i) =>
          `import * as E${i} from '${p === "." ? "bulud-ng" : "bulud-ng/" + p.slice(2)}'; export type T${i}=typeof E${i};`,
      )
      .join("\n"),
  );
  const features = {
    button: ["BuludButton", "<bulud-button>SSR button</bulud-button>"],
    badge: ["BuludBadge", "<bulud-badge>SSR badge</bulud-badge>"],
    checkbox: ["BuludCheckbox", "<bulud-checkbox>Accept</bulud-checkbox>"],
    radio: [
      "BuludRadioGroup,BuludRadio",
      '<bulud-radio-group aria-label="Choice"><bulud-radio value="one">One</bulud-radio></bulud-radio-group>',
    ],
    switch: ["BuludSwitch", "<bulud-switch>Theme</bulud-switch>"],
    dropdown: ["BuludDropdown", '<bulud-dropdown aria-label="Choice"/>'],
    datepicker: ["BuludDatepicker", '<bulud-datepicker aria-label="Date"/>'],
    pagination: ["BuludPagination", '<bulud-pagination [pageCount]="8"/>'],
    dialog: [
      "BuludDialog",
      '<bulud-dialog aria-label="Details" [open]="true">Details</bulud-dialog>',
    ],
    skeleton: ["BuludSkeleton", '<bulud-skeleton shape="card"/>'],
    feedback: [
      "BuludAlert,BuludNotifications",
      '<bulud-alert kind="success" title="Saved">Server message</bulud-alert><bulud-notifications/>',
    ],
    confirm: ["BuludConfirm", '<bulud-confirm title="Continue?"/>'],
    avatar: ["BuludAvatar", '<bulud-avatar name="Server User"/>'],
    "empty-state": [
      "BuludEmptyState",
      '<bulud-empty-state title="No records"/>',
    ],
    charts: [
      "BuludChart,BuludDonutChart,BuludProgress",
      '<bulud-chart caption="Trend"/><bulud-donut-chart caption="Share"/><bulud-progress label="Progress"/>',
    ],
    chat: ["BuludChat", "<bulud-chat/>"],
    countdown: [
      "BuludCountdown",
      '<bulud-countdown label="Countdown" [deadline]="deadline"/>',
    ],
    "file-upload": ["BuludFileUpload", '<bulud-file-upload label="Upload"/>'],
    "loading-bar": ["BuludLoadingBar", "<bulud-loading-bar/>"],
    otp: ["BuludOtp", '<bulud-otp label="Code"/>'],
    "period-picker": [
      "BuludPeriodPicker",
      '<bulud-period-picker label="Period"/>',
    ],
    rating: ["BuludRating", '<bulud-rating label="Rating"/>'],
    table: [
      "BuludTable,BuludTableFilters",
      '<bulud-table caption="Records" [rows]="[]" [columns]="[]" [rowKey]="key"/><bulud-table-filters [definitions]="[]"/>',
    ],
    tooltip: [
      "BuludTooltip",
      '<bulud-tooltip text="Help"><button>Help</button></bulud-tooltip>',
    ],
    stepper: ["BuludStepper", '<bulud-stepper label="Steps"/>'],
    carousel: ["BuludCarousel", '<bulud-carousel label="Slides"/>'],
  };
  const imports = Object.entries(features)
    .map(([entry, [types]]) => `import {${types}} from 'bulud-ng/${entry}';`)
    .join("\n");
  const types = Object.values(features)
    .map(([type]) => type)
    .join(",");
  const template = Object.values(features)
    .map(([, html]) => html)
    .join("\n");
  writeFileSync(
    join(dir, "fixture.ts"),
    `import {Component,inject} from '@angular/core';\nimport {provideBuludTheme,provideBuludLocale} from 'bulud-ng';\nimport {BuludConnectionService} from 'bulud-ng/utilities';\n${imports}\nexport {provideBuludTheme,provideBuludLocale};\n@Component({selector:'consumer-root',imports:[${types}],template:${JSON.stringify(template)}})export class App {readonly connection=inject(BuludConnectionService);readonly deadline=Date.now()+60000;readonly key=(row:unknown)=>String(row);}`,
  );
  writeFileSync(
    join(dir, "tsconfig.json"),
    JSON.stringify({
      compilerOptions: {
        target: "ES2022",
        module: "ES2022",
        moduleResolution: "Bundler",
        strict: true,
        skipLibCheck: false,
        experimentalDecorators: true,
        outDir: "out",
        types: [],
      },
      angularCompilerOptions: {
        strictTemplates: true,
        compilationMode: "full",
      },
      files: ["fixture.ts", "types.ts"],
    }),
  );
  run(process.execPath, [
    join(dir, "node_modules/@angular/compiler-cli/bundles/src/bin/ngc.js"),
    "-p",
    "tsconfig.json",
  ]);
  writeFileSync(
    join(dir, "server.mjs"),
    `import '@angular/compiler';import * as ng from '@angular/core';import {bootstrapApplication} from '@angular/platform-browser';import {renderApplication,provideServerRendering} from '@angular/platform-server';import {App,provideBuludTheme,provideBuludLocale} from './out/fixture.js';
const html=await renderApplication(context=>bootstrapApplication(App,{providers:[provideServerRendering(),(ng.provideZonelessChangeDetection??ng.provideExperimentalZonelessChangeDetection)(),provideBuludTheme({colors:{primary:'#123456'}}),provideBuludLocale({language:'fa',direction:'rtl'})]},context),{document:'<html><head></head><body><consumer-root></consumer-root></body></html>',url:'http://localhost/',allowedHosts:['localhost']});
for(const marker of ['SSR button','Server message','bulud-file-upload','bulud-chart','bulud-chat','bulud-skeleton','--bulud-color-primary: #123456','lang="fa"'])if(!html.includes(marker))throw new Error('Missing SSR content: '+marker);
if(typeof document!=='undefined'||typeof window!=='undefined')throw new Error('Fixture unexpectedly has browser globals');console.log('SSR rendering passed without browser globals');`,
  );
  run(process.execPath, [join(dir, "server.mjs")]);
  console.log(
    JSON.stringify({
      angular: version,
      installedFromTarball: true,
      publicEntries: entries.length,
      skipLibCheck: false,
      aotFeatureEntries: Object.keys(features).length,
      serverRendering: true,
      tailwindInstalled: false,
    }),
  );
} finally {
  rmSync(dir, { recursive: true, force: true });
}
