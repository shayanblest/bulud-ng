# PR #75: local midnight and dotted filter operators — 2026-10-24

## Summary

Reproduced both review findings from source revision `6aed8f4278762f0ec8700c056903fbcdce38bddb`. Before the fixes, the four new Gregorian/Persian midnight cases and the dotted-operator round-trip case failed (5 failures, 23 existing tests passed in the scoped run).

The datepicker now stores today reactively and refreshes the local date on opening, day keyboard navigation (including Ctrl+Home) and its today action. An empty calendar anchors to the refreshed day, year navigation uses the refreshed current year, and `aria-current="date"` updates. Existing selected values and min/max bounds remain authoritative. There are no intervals or background midnight timers.

The filter parser accepts dotted operators such as `range.gte`, using the same identifier validation as the serializer. Building, parsing and rebuilding filters preserves the expression. Prototype-changing operator segments remain rejected; value quoting/escaping is unchanged.

## Files changed

- `projects/bulud-ng/datepicker/bulud-datepicker/bulud-datepicker.ts` — reactive local today with event-triggered refresh.
- `projects/bulud-ng/datepicker/bulud-datepicker/bulud-datepicker.html` — reactive current-date marker.
- `projects/bulud-ng/datepicker/bulud-datepicker/bulud-datepicker.spec.ts` — five regression cases: opening after local midnight and Ctrl+Home across midnight in both calendars; preserved selection and maximum bound.
- `projects/bulud-ng/query/query.ts` — allow dots in the operator capture, retaining the shared identifier guard.
- `projects/bulud-ng/query/query.spec.ts` — dotted field/operator round-trip and unsafe-operator rejection.
- `e2e-base/datepicker-midnight.spec.ts` — four real-browser cases, Gregorian/Persian and single/range; explicit Asia/Tehran timezone with local year rollover while UTC is still December 31; focus, marker, Ctrl+Home and reopening.
- `docs/FORM-CONTROLS.md`, `projects/bulud-ng/SHARED.md` — documented refresh and identifier behavior.
- This report and `NPM-FINAL-VALIDATION.md` — validation evidence and current package artifact.

## Validation

Node 22.22.3 / npm 10.9.8, Chromium 143. The tested staged files were copied with original-hash guards and byte-for-byte verification to the actual bulud-ng checkout. Its library output was then rebuilt in that checkout.

- Explicit Prettier on changed TypeScript/HTML files: PASS.
- `npm run format:check`: PASS.
- `npm run lint`: PASS, zero errors.
- `CHROME_BIN=/usr/bin/google-chrome npm run test`: PASS, 714 tests (6 new cases).
- `npm run build`: PASS, staged and actual library builds.
- `npm run build:base`: PASS.
- `node tools/measure-base.mjs`: PASS, initial assets 295,254 bytes / gzip 91,136 bytes; below the 300,000-byte budget.
- Catalog Playwright suite: PASS, 64 tests (4 new cases).
- Existing legacy datepicker Playwright spec: PASS, 7 tests, including light/dark and RTL/LTR coverage; isolated demo port 4315, no user server reused.
- `validate:api`: PASS, all 40 entries, documentation, declarations and declaration fixtures against PR base `f616b5a2da510ed2f40385bcb5514be121cc6b26`.
- `validate:deps`: PASS against the same approved baseline.
- `validate:package`: PASS in both stage and actual checkout, 169-file inventory.
- Local npm pack from the rebuilt actual library: PASS, `dist/packages/bulud-ng-0.0.1.tgz`, 380,406 bytes; SHA-256 `4ef8188cbe7d07b05a3b4f4ce57c1b1052800a244b66d34e508cbd0f3a434057`.
- Public exports / supported input-output contract: no additions or removals. Protected today implementation state is now a signal; no new consumer configuration is required. Original approved API scope still passes unchanged.
- Dependency and approval-file diff: NONE. No manifests, lockfile or release scopes were changed.

## Risks / unresolved issues

An idle open calendar refreshes on its next relevant interaction, rather than waking a background timer at midnight. This is intentional and documented. The new changes are local and have not been committed or pushed; remote checks still refer to the already-pushed revision. The GitHub comments were not replied to or resolved. Public npm publication still requires the deferred owner identity/license/version decisions and explicit publication authorization.

## Out of scope

No unrelated design changes, dependency upgrades, approval changes, commits, pushes, merge, or public npm publication. Temporary Playwright port configuration and test-result changes were not copied into the repository.
