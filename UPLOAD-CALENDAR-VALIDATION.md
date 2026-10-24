# Bilingual upload and readable weekday headers

## Summary
Applied directly to actual bulud-ng. The file-upload catalog now translates its heading, description, all twelve visible/accessibility/action/status labels, API explanation and demo note using the existing reactive fa/en preferences. Selection survives language changes. Datepicker weekday labels are compact, distinct Persian initials and two-letter English names with full localized accessible column names and native title tooltips. Equal-width columns and zero inline header padding prevent overlap in every instance, including forms and range mode.

## Files changed
- projects/base/src/catalog/file-upload.ts: bilingual labels, matching consumer sample and multiple-file example.
- projects/base/src/catalog/datepicker.ts: reactive language/calendar demo, localized explanatory text and labels associated with accessible triggers.
- projects/base/src/catalog/frame.ts: localized component breadcrumb.
- projects/bulud-ng/datepicker/bulud-datepicker/bulud-datepicker.ts: compact weekday display respects firstDayOfWeek and display language.
- datepicker HTML/SCSS: full column names/tooltips, equal header columns without overflowing padding.
- datepicker unit spec and e2e-base/upload-calendar.spec.ts: ordering, accessibility, responsive geometry, reactive translation and preserved file state.

## Validation
- Scoped datepicker Chrome units: PASS, 15.
- Staging browser/form regressions: PASS, nine.
- Actual project browser checks: PASS, four (fa/en x light/dark), including upload validation/error/retry labels, preserved selection and seven equal-width non-overlapping headers in single/range calendars at mobile width.
- Actual production app build: PASS.
- Actual library build/npm pack: PASS.
- Actual package inventory: PASS, 160 files.
- Actual format:check and changed-source Prettier: PASS.
- Actual ESLint: PASS, zero errors.
- Initial assets: 299492 bytes raw / 89924 gzip; unchanged 300000-byte cap.
- Visual QA: PASS on actual 4310 upload and calendar pages in fa/en. Both-theme coverage comes from browser tests. Optimized preview 4314 restarted with the new build.
- Source hash verification: all nine changed source/test/audit files match the tested stage.
- Public API, package manifests, lockfile and dependencies: unchanged in this task.

## Evidence
/tmp/bulud-upload-fa.jpg, /tmp/bulud-upload-en.jpg, /tmp/bulud-calendar-fa-fixed.jpg, /tmp/bulud-calendar-en-fixed.jpg.
Latest local package: dist/packages/bulud-ng-0.0.1.tgz, SHA-256 348aafaf799338b0ab391486b01af045c570213c2eb7fe7f970715cda8491fd8.

## Risks / unresolved issues
Native abbreviation tooltips require hover; full names are also supplied to screen readers independently. Existing calendar keyboard controls and week-start configuration remain supported. Earlier npm owner/license/release-review requirements remain unchanged.

## Out of scope
Translating all remaining component examples, new public locale APIs, backend storage and npm publication.
