> This is the original implementation report. The current dropdown redesign and
> its validation are recorded in [DATEPICKER-ANGOUR-VALIDATION.md](DATEPICKER-ANGOUR-VALIDATION.md).

# Checkbox, radio and datepicker validation — 2026-10-20

## Summary

Angour's checkbox geometry is applied through the shared preset. New
`bulud-ng/radio` and `bulud-ng/datepicker` secondary entry points provide native
radio grouping and a Persian/Gregorian date-only control with single/range
selection. Both support Angular Forms, typed themes, explicit overrides,
light/dark modes and RTL/LTR. No dependency was added.

## Files changed

- `radio/` — group/option components, native grouping, Forms/required validation, styles, public entry and unit tests.
- `datepicker/` — dialog-based calendar, Intl conversion helpers, date/range Forms model, bounds, config token, styles, public entry and tests.
- `src/lib/theme/bulud-theme.ts`, `form-control-themes.ts` — optional typed Radio/Datepicker theme sections, provider and variable mapping.
- `src/lib/theme/angour-theme.ts`, `theme.css`, `angour.css` — source checkbox/radio geometry and light/dark calendar colors.
- `src/lib/i18n/` — compatible optional Datepicker locale section with partial override resolution.
- `src/public-api.ts`, `angular.json`, `tsconfig.json` — intentional root exports, feature aliases and test discovery.
- `projects/demo/src/app/angour-controls-demo.ts`, `app.ts`, `app.html` — all supported states, form actions and instance overrides; deferred loading keeps the initial bundle below 500 kB.
- `e2e/radio.spec.ts`, `e2e/datepicker.spec.ts` — rendered styling, all modes/directions, keyboard, Forms, bounds and focus behavior.
- Library README, public API docs, `FORM-CONTROLS.md`, `FORM-CONTROLS-AUDIT.md` — usage, contract and review evidence.

Paths for feature/theme/locale files above are relative to `projects/bulud-ng`.

## Validation

| Check                                                               | Result                                                                                            |
| ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `npm run format:check`                                              | PASS                                                                                              |
| Extended Prettier check of new controls, styles, tests and guide    | PASS                                                                                              |
| `npm run lint`                                                      | PASS, 0 errors                                                                                    |
| New unit coverage                                                   | PASS, all 18 new tests; radio 4, calendar/datepicker 11, theme 2, locale 1                        |
| Scoped radio unit suite                                             | PASS, 4/4                                                                                         |
| Scoped calendar/datepicker suite before two extra boundary tests    | PASS, 9/9; both additional cases pass in the final full suite                                     |
| Scoped existing/new theme and locale suite                          | PASS, 10/10                                                                                       |
| Final full unit suite in destination                                | FAIL, 559/563 pass; 4 existing focus-dependent tests fail                                         |
| Pre-change full unit baseline                                       | FAIL, 537/545 pass; 8 existing focus-dependent failures; failing counts vary by browser focus/run |
| Complete browser suite                                              | PASS, 96/96, one worker                                                                           |
| Datepicker browser suite after final weekday text adjustment        | PASS, 6/6                                                                                         |
| Library build, staged and actual destination                        | PASS                                                                                              |
| Production demo build                                               | PASS, initial budget met; existing dropdown stylesheet warning remains (59 bytes over 6 kB)       |
| Legacy declaration-consumer compile                                 | PASS                                                                                              |
| Packaged Radio/Datepicker/theme/locale consumer declaration compile | PASS                                                                                              |
| npm package dry run                                                 | PASS, 60 files; both secondary entry declarations and FESM bundles included                       |
| Public API review                                                   | Intentional additions documented in `PUBLIC-API.md`; existing APIs retained                       |
| Dependency review                                                   | No root package.json / lockfile dependency changes                                                |
| Source delivery                                                     | Guarded hashes preserve existing user changes; delivered files match validated source             |

Browser tests cover actual selection colors and 16px/8px geometry, disabled and
invalid states, reset/disable behavior, calendar-language changes without ISO
value drift, range ordering, inclusive bounds, shorter-month navigation, year
changes, focus trap/restore, required validation and per-instance CSS precedence.
Calendar units cover Gregorian/Persian leap years and era boundaries. Root theme
units check that omitted feature tokens do not pin defaults and explicit colors
and geometry remain available in dark mode.

## Risks / unresolved issues

The full unit suite is not green before this task. Final remaining failures are:

- Checkbox: marks the Angular control touched on blur and validates required state.
- TextareaAutosize: remeasures when ancestor focus-within changes line height.
- Dropdown: marks a single control touched only after focus leaves.
- Dropdown: does not steal focus when focus leaves.

These are focus-dependent baseline tests; Checkbox/Dropdown cases reproduce in
the pre-change run, and the Textarea case is recorded in the earlier Angour
validation. Their component implementations were not changed. All new unit
cases and the complete browser suite pass. No unrelated focus implementation
was altered to make the unit suite appear green.

## Out of scope

No dependency upgrade, source application modification, font/icon redistribution,
backend integration, timestamp/time selection, commit, push or publication.
Dates intentionally use ISO date-only strings; the public API documents that
contract. See `FORM-CONTROLS.md` for configuration, keyboard and naming details.
