# ITB button and badge polish

## Summary
Applied directly to /home/fatemeh-shirazi/Desktop/bulud-ng. Matched Angour brand-secondary filled buttons, gray disabled states and pressed halos from the Angour button styles. Reduced badge geometry to compact informational labels, preserving semantic colors and accessible contrast.

## Files changed
- projects/bulud-ng/src/lib/theme/angour-theme.ts: explicit ITB preset colors, disabled and active tokens; badge sizes 20/24/28px, padding 6/8/10px and 6px corners.
- projects/bulud-ng/src/lib/theme/bulud-theme.ts: ten optional button theme fields and corresponding variables; legacy public default shape preserved, omitted overrides remain scoped CSS fallbacks; explicit overrides apply in light and dark modes.
- projects/bulud-ng/button/bulud-button/bulud-button.scss: token-driven disabled colors and pressed shadows.
- projects/bulud-ng/angour.css: regenerated from the typed preset.
- projects/base/src/catalog/badge.ts: demo reset action uses BuludButton.
- theme unit specs and e2e-base/button-badge.spec.ts: defaults, token mapping, override precedence, both themes/directions, disabled/loading/focus/press and badge dismissal.
- e2e-base/foundation.spec.ts: expected compact preset corners.
- projects/bulud-ng/README.md: optional token API and compact badge behavior documented.

## Validation
- format:check and changed-source Prettier: PASS.
- ESLint: PASS, zero errors.
- Full unit suite: PASS, 691 tests.
- Staged browser suite: PASS, 11 tests (four theme/direction cases plus catalog/foundation regressions).
- Actual-project browser suite: PASS, four theme/direction cases.
- Actual production app build: PASS.
- Actual production library build and npm pack: PASS.
- Package inventory: PASS, 160 emitted files.
- Packed consumer validation: PASS, all 38 JS declaration entries, four CSS exports and five isolated AOT tree-shaking fixtures.
- Initial assets: 299492 raw bytes / 89922 gzip bytes, below the unchanged 300000-byte budget.
- Visual QA: PASS on actual 4310 development preview, light/dark button and badge pages; production 4314 preview restarted with the new build.
- Source verification: all eleven applied files match the tested staging source.
- Public API: backward-compatible optional fields added to BuludButtonTheme; root export list unchanged in this task.
- Root package, lockfile and dependencies: unchanged in this task.

## Risks / unresolved issues
Earlier release prerequisites (owner-selected license/name and historical API/dependency contract review) remain. Existing baseline-browser-mapping age notice and explicit publish-only lifecycle-script notice remain. No public npm publication.

## Evidence
- /tmp/bulud-itb-buttons.jpg and /tmp/bulud-itb-buttons-dark.jpg
- /tmp/bulud-itb-badges.jpg and /tmp/bulud-itb-badges-dark.jpg
- Updated package: dist/packages/bulud-ng-0.0.1.tgz, SHA-256 6e2a54338e4c15c23e825325dbc0a235b89e1e9b7280469a35e5a8aea9a55c01.

## Out of scope
Other components, dependency upgrades, font distribution and public npm publication.
