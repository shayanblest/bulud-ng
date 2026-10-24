# Shared transfer validation — 2026-10-21

## Summary

Transferred Angour's domain-independent shared behavior into eleven standalone Bulud secondary entry points. The original dataset helpers were found in `angour/libs/shared/utilities/src/lib/dataset.ts` and now have typed pure functions plus an injectable, stateless URL/query facade. Existing Bulud components were reused rather than duplicated. Preview: http://127.0.0.1:4310/shared.

## Files changed

- `projects/bulud-ng/query/` — URL/list request conversion, filter grammar, URL patching and HttpParams facade.
- `projects/bulud-ng/table/` — native semantic table, sorting, local/server pagination, projected cells/details, loading/empty/error states.
- `projects/bulud-ng/{otp,file-upload,rating}/` — CVA/Validator form controls and native keyboard/input behavior.
- `projects/bulud-ng/{tooltip,feedback,stepper,carousel,countdown}/` — accessible supporting UI and signal notification store.
- `projects/bulud-ng/utilities/` — pipes, date/range helpers and SSR-safe connection/password/date services.
- `projects/bulud-ng/src/lib/theme/shared-ui-theme.*` and root public API — typed instance/component/global theme precedence and tests.
- `projects/base/src/{main.ts,shared.ts,shared.html}` — lazy shared page, URL-backed search/filter/sort/page integration, localized demo.
- `e2e-base/shared.spec.ts` — eleven browser scenarios, including four direction/theme combinations.
- `angular.json`, `tsconfig.json` — secondary paths and test discovery.
- `projects/bulud-ng/ng-package.json`, `projects/bulud-ng/SHARED.md` — include complete shared API guide in npm output.
- `tools/validate-release.mjs` — require CSS exports only for CSS assets; retain inventory validation for Markdown assets.
- `SHARED.md`, `SHARED-TRANSFER-AUDIT.md`, README/API/base docs — public contracts, transfer decisions and usage.

71 source/config/documentation files were applied using hash guards against concurrent edits, followed by this report. Previous work and all unrelated files were preserved. Final delivered file hashes matched the tested source; no Angour source was changed.

## Validation

- `npm run format:check`: PASS in destination.
- Prettier check of all 71 changed files: PASS.
- `npm run lint`: PASS, zero errors, in destination.
- `CHROME_BIN=/usr/bin/google-chrome npm run test`: PASS, **630/630** headless Chrome unit tests in the staging checkout (same delivered TypeScript/source hashes). Includes the prior 577 tests and 53 new cases.
- Existing component Playwright regression: PASS, **97/97**, isolated demo port 4311, one worker; temporary review configuration was not delivered.
- Base + shared Playwright: PASS, **16/16**, isolated base port 4313. After the final file-picker styling/empty-selection adjustment, shared cases rerun in the destination: **11/11 PASS**. There are 113 distinct successful browser scenarios in total.
- `npm run build`: PASS, destination production package, no new component stylesheet warnings.
- `npm run ng -- build base`: PASS, destination production app, shared route lazy-loaded.
- `node tools/measure-base.mjs`: PASS, **296,317 initial bytes**, **86,691 gzip bytes**, below 300,000-byte budget. Includes usable overview; forms/shared are lazy.
- `npm run validate:package`: PASS in destination, **127 output files**, derived from secondary exports/assets/metadata.
- `npm pack --dry-run --json`: PASS, 97 packaged files; `SHARED.md` included. No npm publication performed.
- Independent consumer typecheck: PASS with `strict:true`, `skipLibCheck:false`, physically installed package copy and imports from all eleven entries, no source path aliases.
- `git diff --check`: PASS.
- Public API review: intentional eleven new secondary entry points; root adds `BULUD_SHARED_UI_CONFIG`, `BuludSharedUiConfig`, `BuludSharedUiTheme`, `BuludSharedUiFeature`, `buludSharedUiStyles`. Prior root exports unchanged.
- Dependency review: no changes to root package.json/package-lock.json or library dependencies/peerDependencies in this task; no installations/upgrades.
- Visual QA: destination preview inspected in Persian RTL, light and dark. Screenshots: `/tmp/bulud-shared-light.jpg`, `/tmp/bulud-shared-dark.jpg`. Preview tab remains open on `/shared` with original dark preference restored.

## Risks / unresolved issues

- Table row/column keys must be stable and unique; consumer templates own their controls' labels/focus. Server paging needs the consumer's actual API and handling of out-of-range URL pages; the sample only simulates it.
- Filter parsing throws SyntaxError for malformed grammar. Callers should catch invalid URLs; backend field/operator authorization remains server-owned. Quoted values use JSON escaping; verify compatibility with the target server's parser before connecting an API.
- File constraints use metadata only. The library never uploads, changes application cookies or calls an account API. Native file inputs cannot be populated from programmatic form values; the selected filename list reflects those values.
- Tooltip uses an anchored containing block rather than a portal/viewport collision engine; complex overlays should use the existing Dropdown/Dialog.
- Input validation timing and localized error text belong to the consuming form (documented invalid/describedBy bindings).

## Out of scope (noticed, not done)

Financial/domain services, authentication/permissions/profile/logout UI, hardcoded cookie domains, analytics/chat plugins and chart dependencies remain in Angour. Standalone month-only/year-only selection is not ported; BuludDatepicker already provides date navigation. No claim of a full business-application migration or chart transfer is made. Full inventory and rationale are in SHARED-TRANSFER-AUDIT.md.
