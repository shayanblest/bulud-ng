# Theme and control polish — 2026-10-21

## Summary

Rating's default selected color now follows the current primary token (navy in Angour light, gold in dark). This supersedes the earlier fixed-gold default; explicit rating-accent/theme overrides retain priority. Pagination uses geometrically centered SVG chevrons with the existing nearest-direction RTL transform. Dropdown search keeps a visible 1px focus outline with 1px offset instead of the previous 3px outline.

## Files changed

- projects/bulud-ng/rating/rating.scss — primary fallback for selected stars.
- projects/bulud-ng/pagination/bulud-pagination/bulud-pagination.html — decorative, non-focusable SVG chevrons inside existing direction wrappers.
- projects/bulud-ng/pagination/bulud-pagination/bulud-pagination.scss — equal icon box dimensions and centered SVG geometry.
- projects/bulud-ng/dropdown/bulud-dropdown/bulud-dropdown.scss — thinner search-only focus; trigger/options/clear focus unchanged.
- e2e-base/shared.spec.ts — computed primary/override colors, icon/button center comparison and search focus thickness in all four theme/direction combinations.

## Validation

- format:check and changed-file Prettier: PASS.
- lint: PASS, zero errors.
- scoped unit (rating/pagination/dropdown): PASS, 49/49 ChromeHeadless cases.
- base/shared Playwright: PASS, 16/16.
- existing dropdown/pagination Playwright: PASS, 16/16; isolated temporary review configuration, not delivered.
- production library build: PASS, no new warnings.
- production base build: PASS. Initial bytes remain 296,317 (gzip 86,693), below budget.
- production preview restarted from the new build on port 4314; development HMR remains on 4310.
- git diff --check: PASS.
- public API/dependency changes for this fix: none.
- Visual QA: Persian RTL light, selected navy stars, centered chevrons and thin search ring verified. Proof: /tmp/bulud-theme-polish-light.jpg and /tmp/bulud-rating-primary-light.jpg. Temporary tab closed; original user tab preserved.

## Risks / unresolved issues

No known unresolved issue for the three requested changes. Explicit custom accent overrides continue to replace the default primary color by design.

## Out of scope

Other component behavior, theme palettes and previous performance measurements were not changed or remeasured.
