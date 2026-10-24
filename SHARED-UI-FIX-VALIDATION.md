# Shared UI corrections — 2026-10-21

## Summary

Selected rating stars use Angour gold in both light and dark themes; unselected stars remain muted. The old secondary-color fallback changed to navy in dark mode. The rating-accent CSS variable and typed theme overrides still take precedence. Search now has a decorative magnifier placed at inline-start, and all six shared-page state toggles use BuludCheckbox with two-way checked bindings.

## Files changed

- projects/bulud-ng/rating/rating.scss — gold fallback for selected stars.
- projects/base/src/shared.html — search icon and six design-system checkboxes.
- projects/base/src/shared.ts — Checkbox import and scoped stylesheet.
- projects/base/src/shared.scss — logical icon positioning and input padding.
- e2e-base/shared.spec.ts — selected/unselected star colors, theme overrides, icon direction and checkbox rendering in all four language/theme combinations.

## Validation

- format:check: PASS; changed TS/HTML/SCSS/spec files formatted with project Prettier configuration.
- lint: PASS, zero errors.
- scoped unit (rating + checkbox): PASS, 18/18 ChromeHeadless tests.
- base/shared Playwright: PASS, 16/16, including light/dark × RTL/LTR and custom theme overrides.
- production library build: PASS, no new warnings.
- production base build: PASS; initial size remains 296,317 bytes (gzip 86,693), below 300 kB.
- git diff --check: PASS.
- public API diff for this fix: none.
- dependency diff for this fix: none.
- visual QA: Persian RTL dark preview verified. Screenshots: /tmp/bulud-shared-ui-fixed.jpg and /tmp/bulud-rating-gold-fixed.jpg. Temporary test tab closed; original user tab/state preserved.

## Risks / unresolved issues

No known unresolved issue in the three reported defects. Explicit per-instance rating theme overrides intentionally replace the default gold.

## Out of scope

Other shared components and previous transfer boundaries are unchanged.
