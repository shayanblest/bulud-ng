# Final foundation validation — 2026-10-21

## Summary

Centered boxed pagination now uses ellipses for more than five pages with a constant-size window. Re-audited Angour shared sources, added reusable period selection, avatar, empty state, donut/progress and pure date/query helpers, and completed a one-page Demo with deferred groups. Public npm publication is deferred by the owner; the local installable tarball and secondary-entry tree shaking are verified.

## Files changed

- `projects/bulud-ng/pagination/**`, `table/table.scss`: centered pagination, five-number window and safe large-count behavior.
- `projects/bulud-ng/{avatar,empty-state,period-picker}/**`: three standalone themeable secondary entries with tests and Forms validation where applicable.
- `projects/bulud-ng/charts/{donut,progress,extras.spec}*`, `charts/public-api.ts`: SVG donut and ring/bar progress, finite/bounded data validation.
- `projects/bulud-ng/utilities/{utilities.ts,foundation.spec.ts}`: immutable cleanup, UTC clamped year shifts, explicit time units, bounded slots and period-aware pure timestamp pipe.
- `projects/bulud-ng/datepicker/public-api.ts`: intentional calendar-helper/type exports, reused through the public entry.
- `projects/bulud-ng/src/lib/theme/shared-ui-theme*`: typed new-feature configuration and instance/component/global/inherited precedence tests.
- `projects/bulud-ng/tabs/bulud-tabs/{bulud-tab-panel.scss,bulud-tabs.spec.ts}`: inactive panels honor hidden; regression checks computed visibility.
- `projects/base/src/{main,toolbar,demo,primitives,extras,forms}.ts`: searchable catalog of 35 secondary entries, every group on one Demo page, deferred toolbar/groups, stable navigation after asynchronous expansion.
- `tools/verify-tree-shaking.mjs`, `tools/serve-base.mjs`, root/library `package.json`, `angular.json`, `tsconfig.json`: one-command optimized preview, package creation and verification, intentional entry resolution/test discovery. No dependency changes.
- `e2e-base/foundation.spec.ts`: new components, form states, overrides, responsiveness, centered large-page pagination and stable deferred section navigation in fa/en and light/dark.
- `e2e/demo.spec.ts`: the existing autosize regression now waits for its asserted rendered height rather than reading it before resize observation completes. No timer wait or component change.
- `README.md`, packaged README/SHARED guide, `SHARED.md`, `DEMO-AND-PACKAGING.md`, `FINAL-FOUNDATION-AUDIT.md`: source-transfer decisions, public API contracts, one-command run and local/public publication distinction.

## Validation

| Check                                                                   | Result                                                                                                                                                                                                                              |
| ----------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| npm run format:check                                                    | PASS                                                                                                                                                                                                                                |
| Prettier on every changed code/config/doc file                          | PASS                                                                                                                                                                                                                                |
| npm run lint                                                            | PASS, zero errors                                                                                                                                                                                                                   |
| Full library unit suite, headless Chrome                                | PASS: 672 tests, including new feature/theme/bounds and inactive-tab cases                                                                                                                                                          |
| Library production build                                                | PASS                                                                                                                                                                                                                                |
| Base production build and hard 300000-byte initial asset check          | PASS                                                                                                                                                                                                                                |
| Legacy demo build                                                       | PASS; existing dropdown component CSS 6 kB warning remains (6.75 kB)                                                                                                                                                                |
| Complete base E2E suite on actual project                               | PASS: 34 tests                                                                                                                                                                                                                      |
| Final deferred navigation follow-up, all four locale/theme combinations | PASS: 4 tests                                                                                                                                                                                                                       |
| Legacy component E2E                                                    | 96/97 passed on full run; the autosize test failed an immediate unsettled height read. Corrected to a condition-based render assertion and the focused rerun passed (1/1). All 97 scenarios have passing results across these runs. |
| Production compression/cache/URL/BFCache browser suite                  | PASS: 2 tests                                                                                                                                                                                                                       |
| Local preview server compression/cache/upload-bound tests               | PASS: 7 tests                                                                                                                                                                                                                       |
| CSS custom-property contract unit suite                                 | PASS: 8 tests                                                                                                                                                                                                                       |
| npm run validate:package                                                | PASS: 151 emitted files/exports/assets validated                                                                                                                                                                                    |
| Actual packed-package isolated Angular AOT consumers                    | PASS: button-only, donut-only, period-only; unused feature selectors absent, including other chart models from a donut-only import                                                                                                  |
| Root public-api.ts relative to this task's initial snapshot             | Unchanged; new public features are secondary entries; shared theme union and datepicker helper exports are deliberate                                                                                                               |
| Dependency/lockfile changes relative to task snapshot                   | None; script and distribution metadata changes implement the requested run/pack flow                                                                                                                                                |
| Visual review                                                           | PASS: actual production Demo, stable anchors, charts/progress, catalog, both direction/theme browser coverage                                                                                                                       |

The historical automated API-approval baseline is not claimed as passing or rewritten by this task; the intentional public additions above were reviewed directly. No registry publication was attempted.

## Performance

- Initial referenced production JS/CSS: **295,614 bytes**, **88,825 bytes gzip**. The 300000-byte limit was retained. Compared with the prior recorded 298787 raw bytes, the final raw initial output is smaller despite adding the deferred demo.
- Lighthouse production `/demo`, default simulated mobile, this local run: **98/100**, LCP **2.0 s**, FCP **1.7 s**, TBT **70 ms**, CLS **0**. A local measurement is not a guarantee for other hosts/networks/content.
- No new dependencies, remote fonts/assets, automatic CSS injection or eager feature barrel imports. Intl caches and page/segment/time-slot allocation are bounded.

| Installed consumer | JS bytes incl. Angular | gzip bytes |
| ------------------ | ---------------------: | ---------: |
| button             |                 121089 |      39766 |
| donut              |                 126412 |      42266 |
| period             |                 136736 |      45567 |

## Package and run

- Run: `npm start`; open **http://127.0.0.1:4314/demo**. The live preview serves the completed build.
- Local package: `dist/packages/bulud-ng-0.0.1.tgz` (341428 bytes; SHA-256 `9aeea9a6e955ff9b3374245a0660006150f3b7e873499b707bbcbc621269848b`).
- Consumer: `npm install /absolute/path/to/bulud-ng/dist/packages/bulud-ng-0.0.1.tgz` then import specific `bulud-ng/<feature>` entries. See DEMO-AND-PACKAGING.md for explicit CSS imports and peer requirements.

## Risks / unresolved issues

- Owner explicitly deferred npm account/scope and license choice. Local installation is ready; `npm install bulud-ng` from the public registry is not yet available through this work.
- The optional demo upload receiver discards data; the consuming application supplies its real authenticated upload endpoint.
- Existing legacy dropdown CSS budget warning and historical API-approval records are documented rather than hidden by loosening thresholds or rewriting approvals.

## Out of scope

Angour-specific auth/account/trading/ticket APIs, tracking/plugin injections and branded data/assets remain consumer-owned. Generic behavior was extracted without these dependencies; the per-source decisions are in FINAL-FOUNDATION-AUDIT.md. Public npm publication waits for the owner's later decision.
