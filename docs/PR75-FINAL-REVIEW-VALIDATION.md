# PR #75 final review corrections — 2026-10-24

## Summary

Addressed both findings on `a5e8beac71490f41675f0ea6deaccc3e38a38cd3` and the failed CI E2E job `120816346817`. That job had 96 passes and one failure asserting popup attachment in the dark RTL datepicker scenario.

- A localized clear button is available for non-null single dates and complete/partial ranges. It uses existing theme tokens, invokes the existing Forms-aware clear method, closes the popup and restores trigger focus. Required controls honestly become invalid when cleared.
- The period picker refreshes its default year on relevant interactions and Forms writes/resets. Its clock is normalized from the **local calendar day** to UTC noon before calendar conversion, so Gregorian and Persian New Year follow the local date even while UTC is still the previous day. Explicit selection remains authoritative. Clearing also resets a browsed year. No background timer is introduced; unchanged days do not invalidate derived month labels.
- While open, the datepicker observes body-size changes as well as its own surface/trigger. Expanding earlier content, including content-visibility demo sections, updates popup placement even without a trigger resize or scroll. The existing strict attachment assertion keeps its anchor in the viewport before measuring the viewport-clamped popup. A separate regression expands preceding content while the popup is already open and verifies attachment.

## Files changed

- Datepicker TypeScript/template/SCSS — page-size observation and named clear action using existing theme tokens.
- Datepicker unit spec — single/range clear, required validation, Forms callbacks and focus restoration.
- Period picker TypeScript/spec — reactive local day, empty fallback and clear/reset across Gregorian and Persian New Year.
- `e2e/datepicker.spec.ts` — attachment precondition and a deterministic preceding-layout-shift regression.
- `e2e-base/date-clear-period.spec.ts` — localized single/range pointer clearing and local New Year in both calendar modes.
- `docs/FORM-CONTROLS.md`, `docs/PUBLIC-API.md`, `projects/bulud-ng/SHARED.md` — user-facing contracts.
- This report and `NPM-FINAL-VALIDATION.md` — validation evidence.

## Validation

Node 22.22.3 / npm 10.9.8, Chromium 143. Staged source is byte-identical to the guarded transfer to the actual bulud-ng checkout, where the library was rebuilt and packed.

- Changed TypeScript/HTML/SCSS Prettier: PASS.
- `npm run format:check`: PASS.
- `npm run lint`: PASS, zero errors.
- Unit suite: PASS, 720 tests (6 new cases).
- Full legacy E2E: PASS, 98 tests, including all four themed/directional datepicker scenarios and the new layout-shift case; isolated port 4315.
- Full catalog E2E: PASS, 70 tests (6 new cases); isolated port 4313 and separate output directory.
- Tool tests: PASS, 26 tests.
- Library build: PASS, staged and actual checkout.
- Production catalog build: PASS.
- Initial asset budget: PASS, 295,254 bytes, gzip 91,136; limit 300,000 bytes.
- API gate: PASS, 40 entries, documentation, declarations and declaration fixtures against approved base `f616b5a2da510ed2f40385bcb5514be121cc6b26`.
- Dependency gate: PASS against the same approved baseline.
- Package inventory: PASS, 169 files, including the actual rebuilt output.
- Actual local npm pack: PASS, `dist/packages/bulud-ng-0.0.1.tgz`, 381,440 bytes, SHA-256 `55a894b184d72cdb1979f891da8e27601e5e3f402f05978b08e75ab67f6f25d9`.
- Public entry points / consumer inputs and outputs: no additions or removals. Internal refresh state and a protected helper changed; the original approved scope passes unchanged.
- Manifest, lockfile, release approvals and root public-api diff: NONE.

The timezone-aware browser tests caught and corrected a UTC/local-year discrepancy in the first iteration. A simultaneous local browser run also collided in its shared trace-output directory; the final catalog run used a separate output directory and ran independently, preserving every assertion. No retry/skip or disabled gate was added.

## Review / publication

Self-review checked disabled/required behavior, single/range semantics, localization, focus restoration, null/browsed-year resets, local calendar boundaries, timer/observer cleanup, theme tokens and packaging scope. No known local blocking findings remain. The owner explicitly requested amending and pushing the existing commit. Preserve one implementation commit and push Change-Design with an explicit force-with-lease against the previously verified remote revision. Remote CI must be inspected after the push; this pre-push report does not claim that a future revision has passed remote checks.

## Risks / out of scope

Merge remains the owner's action. No review bot, test, approval policy, dependency or CI gate was disabled. No review response was fabricated. Idle period clocks refresh at the next relevant interaction rather than using a background timer. Public npm publication still awaits the previously deferred release identity/license/version decisions and explicit publication authorization.
