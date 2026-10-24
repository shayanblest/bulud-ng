# Angour design completion — 2026-10-21

## Summary

Applied the local Angour design and supplied screenshots to Bulud: borderless dropdown search, attached panel, outlined expanded table rows with accessible chevrons, native themed textarea, primary top progress, unboxed Angour pagination, composable table filters, and responsive line/candlestick charts. New features are independent secondary entry points; no chart dependency was added.

## Files changed

- `projects/bulud-ng/dropdown/bulud-dropdown/bulud-dropdown.scss` — no input focus box, visible search-row focus, connected trigger/panel.
- `projects/bulud-ng/src/lib/theme/angour-theme.ts`, generated `angour.css` — Angour body-color dropdown panel, borderless inactive pagination and primary active tile.
- `projects/bulud-ng/table/` — accessible icon-only expansion, outlined details, opt-in text/select/finite-number/real-ISO-date filters; controlled values, local and server behavior, explicit query serialization helper.
- `projects/bulud-ng/textarea/`, `angour-base.css` — styled native textarea preserving built-in Angular forms and validators.
- `projects/bulud-ng/loading-bar/` — concurrent task handles, real progress/indeterminate bar, reduced motion, RTL sweep, no synthetic timers.
- `projects/bulud-ng/charts/` — standalone SVG line/candlestick chart, validated finite/OHLC data, accessible data table, primary line and Angour blue/orange candles. Plot direction stays LTR inside either page direction so Y labels stay outside the grid.
- `projects/base/src/` — working examples, combined URL filters, row notes, router loading bridge, lazy charts and overview routes.
- `SHARED.md`, packaged copy, README and `docs/PUBLIC-API.md` — public contracts, examples, accessibility and consumer responsibilities.
- Feature unit tests and `e2e-base/angour-completion.spec.ts`, updated theme assertions — cover behavior and intended visual changes.

## Validation

- `npm run format:check`: PASS.
- `npm run lint`: PASS, zero errors.
- `CHROME_BIN=/usr/bin/google-chrome npm run test`: PASS, **645 tests** across the library.
- Base E2E: final full run **23 passed**, including no-search-border/attached-panel assertions in all four theme/direction combinations. The new seven scenarios were also repeated twice: **14 passed**. A test race was corrected by waiting for collapse ARIA state before resolving the first expand button, avoiding accidentally opening a different row.
- Existing demo regression suite: **93 passed** on the full 97-case run; four obsolete dropdown surface assertions were updated to the requested Angour body background. Targeted Angour rerun: **5 passed** including those four and ancestor-theme coverage. Thus all **97 distinct demo scenarios** passed across full and targeted runs.
- `npm run build`: PASS including new charts/loading-bar/textarea entries.
- `npm run ng -- build base`: PASS; no new Angular compiler or budget warnings.
- `node tools/measure-base.mjs`: PASS, initial assets **298,577 bytes**, **88,533 bytes gzip** (under existing 300,000-byte budget). Charts remain a lazy route. This is an asset-size check, not a new Lighthouse score.
- `npm run validate:package`: PASS, **139 files**, derived from explicit exports, assets and metadata.
- Public API review against the pre-task snapshot: root export list unchanged; intentionally added secondary entries `charts`, `loading-bar`, `textarea`, table filter exports, optional shared theme color fields `positive`/`negative`/`grid`, and new shared theme feature keys. Existing table state events gain optional filters only when filtering changes.
- Dependency diff against the pre-task snapshot: root `package.json`, lockfile, and library package manifest unchanged. No install or dependency upgrade.
- Visual review: original destination app and production preview; RTL table/filter/details/textarea and both SVG models. Native disclosure, keyboard buttons, disabled/empty/error/loading and theme override are exercised by tests.

## Risks / unresolved issues

No known blocking defects in this scope. Charts deliberately cap data sets at 2,000 points and surface invalid data; they do not silently truncate. Server filter authorization, supported backend operators and real data fetching remain application-owned. Progress must finish when consumer operations cancel or complete. Native filter dates use ISO values; the full Persian/Gregorian Bulud datepicker remains available separately.

## Out of scope

Interactive trading feeds, zoom/pan, ApexCharts plugins, business ticket services and backend endpoints. No new Lighthouse measurement or npm publication was performed. Repository-wide release API approval metadata predating this task was not rewritten.
