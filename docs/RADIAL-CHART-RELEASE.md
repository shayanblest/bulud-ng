# Bulud 2.1.0 radial chart release report — 2026-11-14

## Summary

Adds the isolated `bulud-ng/radial-chart` native SVG secondary entry for scalar percentages. Angour's win-rate consumer retains its calculation, loading condition, labels, palette, geometry, responsive layout and pointer selection. Existing donut/progress APIs are unchanged. Locale and translated state/label inputs accept arbitrary project languages.

## Files changed

- `projects/bulud-ng/radial-chart/` — standalone OnPush signals component, typed config, public entry, unit tests and static Tailwind utility source.
- `projects/bulud-ng/radial-chart.css` — compiled feature utilities; no reset/preflight.
- `projects/demo/src/app/radial-chart-demo.ts`, demo app imports/template and `e2e/radial-chart.spec.ts` — deferred demo with public API imports and full exposed-state coverage.
- Library manifest/ng-package, workspace paths/test include — version 2.1.0 and secondary-entry packaging.
- `docs/PUBLIC-API.md`, library README, radial audit and release approvals — additive API documentation and baseline review.

## Validation

- Format: PASS (`npm run format:check`).
- Lint: PASS, zero errors (`npm run lint`).
- Unit: PASS, 7/7 ChromeHeadless tests; scalar/fractional/zero/full values, arbitrary locales/reactive labels, pointer/touch/keyboard/disabled, status states, configuration precedence and observer cleanup.
- E2E: PASS, 2/2 demo browser tests; all exposed states, RTL/LTR, pointer and keyboard selection, instance theme, arbitrary locale/label updates and viewport changes.
- Library build: PASS, no new warnings (`npm run build`).
- Demo build: PASS; existing dropdown CSS budget warning remains (6.78 kB against 6 kB).
- Public API: PASS (`BULUD_BASE_REF=561d1572491dcefcd63b75333634b0f4d476e248 npm run validate:api`), 42 entries and generated declarations match. Reviewed additions: radial secondary entry, its explicit CSS export and CSS focus-token usages. Root public API unchanged.
- Dependency contract: PASS (`BULUD_BASE_REF=561d1572491dcefcd63b75333634b0f4d476e248 npm run validate:deps`). Workspace package.json/package-lock.json diff is empty; no dependencies added.
- Package output: PASS (`npm run validate:package`), exports/assets/generated metadata verified.
- Angour parity fixture: PASS, 160/160 pixel-identical comparisons using original application styles/fonts: 128 static (FA/EN/AR/TR × light/dark × 375/1280px × eight percentages), 16 hover and 16 selection. Zero browser page errors. Exact percentages include zero, full and fractional values. Old startup animation disabled only in the comparison fixture for deterministic settled frames.
- Angour adapters: PASS, 62/62 tests across six suites.

## Risks / unresolved issues

The parity fixture validates renderers with actual application CSS/fonts; it is not authenticated end-to-end testing of production account workflows. Angour intentionally keeps its former numeric notation by omitting locale; consumers can opt into any supported Intl locale. No application runtime speed improvement is claimed without profiling.

## Out of scope

Angour's distinct segmented `donut2-chart` and other remaining advanced chart types are unchanged. Apex remains required by those chart types. Existing generic Angour smoke tests require additional application providers and are outside this component replacement.
