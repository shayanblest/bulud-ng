# Angour uploader and theme switch

## Summary
Applied twelve source/test/documentation files directly to actual bulud-ng. Upload success now has one compact icon/status/progress row instead of a bordered app-styled paragraph and detached percentage. Selection changes restore upload actions after completion. Header uses an opt-in Angour theme switch with white thumb, neutral track and sun/moon icons.

## Files changed
- file-upload.ts / file-upload.scss: component-specific error/status classes, consolidated native progress, completion icon, no duplicate upload button after success, ITB disabled button fill.
- switch TS/HTML/SCSS: optional appearance default | theme, retaining native Forms/keyboard/accessibility behavior; 54x22px neutral track, 24px white thumb, physical left/right position in both directions, decorative icons.
- base toolbar and switch catalog: theme appearance and documented example.
- Switch unit tests, uploader/theme browser tests and existing upload regression selector.
- Packaged README documents appearance and completion/reset behavior.

## Validation
- Scoped Chrome unit suite: PASS, 47 switch/upload tests.
- Staging browser suite: PASS, 10 tests including both themes/directions, thumb geometry, Space, in-flight/success progress and selection reset; existing upload validation/cancel/retry regressions pass.
- Applied-source hash checks: PASS, all twelve files match tested staging.
- Production app build from actual project: PASS.
- Production library build/local npm pack from actual project: PASS.
- Package output validation: PASS, 160 emitted files.
- Format and ESLint on identical staging source: PASS; zero lint errors.
- Actual initial bundle size: 299492 bytes raw, below existing 300000 cap; no threshold change.
- Public API: additive optional BuludSwitch appearance input; root exports unchanged in this task.
- Package manifests, dependency lockfile and dependencies unchanged in this task.

## Risks / unresolved issues
Earlier automatic-approval HTTP 404 failures were resolved after the user-authorized retry. Live visual review on actual 4310 passed: a generated non-sensitive 20-byte CSV was uploaded to the local discarding receiver; compact success row and both icon switch appearances were inspected. No action remains blocked. Previous npm name/license/release-approval prerequisites remain.

## Visual evidence
- /tmp/bulud-angour-upload-success.jpg
- /tmp/bulud-angour-upload-dark.jpg
- /tmp/bulud-angour-theme-light.jpg
- /tmp/bulud-angour-theme-dark.jpg

## Out of scope
Other component designs, backend storage, dependency changes and npm publication.
