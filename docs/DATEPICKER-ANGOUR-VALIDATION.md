# Angour datepicker dropdown — 2026-10-21

## Summary

Replaced the datepicker modal with the compact anchored calendar from Angour's
`libs/shared/ui/src/lib/components/datetime-picker`. The panel keeps the calendar
on the left and the descending scrollable year rail on the right in both
RTL/LTR. It matches the supplied light/dark references: thin chevrons, a plain
month/year heading, Latin day numbers, gray single selection and unpadded
`year/month/day` display. Form values remain Gregorian ISO date-only strings.

The native nonmodal popover escapes ancestor clipping, follows scrolling and
resizing, flips above when needed, and stays within narrow viewports. Escape
and date selection restore focus; Tab and outside clicks preserve destination
focus. Year navigation does not commit a date. Single/range Forms validation,
calendar bounds and theme precedence remain covered.

## Files changed

- `projects/bulud-ng/datepicker/bulud-datepicker/` — popup, year rail, compact styling, positioning, keyboard/focus behavior and regression tests.
- `projects/bulud-ng/src/lib/theme/form-control-themes.ts` — year surface/selection and range endpoint tokens; compact geometry defaults.
- `projects/bulud-ng/src/lib/theme/form-control-themes.spec.ts` — explicit year/range colors persist in dark mode.
- `projects/bulud-ng/src/lib/theme/angour-theme.ts`, `projects/bulud-ng/angour.css`, `projects/bulud-ng/theme.css` — Angour selection colors and light/dark year surfaces.
- `projects/demo/src/app/angour-controls-demo.ts` — wider bounds for the single-date example to demonstrate the year rail; bounded range example retained.
- `e2e/datepicker.spec.ts` — both themes/directions, popup anchoring, year scrolling, mobile geometry, ISO stability, keyboard selection and dismissal.
- `docs/FORM-CONTROLS.md` — current behavior, date display, tokens and keyboard documentation.

## Validation

| Check                                                     | Result                                                                                                                |
| --------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `npm run format:check`                                    | PASS                                                                                                                  |
| Prettier check of all changed source/demo/test/docs files | PASS                                                                                                                  |
| `npm run lint`, final source                              | PASS, zero errors                                                                                                     |
| Final scoped datepicker/calendar/theme units              | PASS, 136/136; includes the new leap-day/year-navigation/Escape regression                                            |
| Full unit suite before the final extra regression         | FAIL, 562/563 pass; one existing Checkbox blur/focus failure                                                          |
| Datepicker browser scenarios                              | PASS, 7/7                                                                                                             |
| Complete browser suite, final source                      | PASS, 97/97, one worker                                                                                               |
| Library build in staging                                  | PASS                                                                                                                  |
| Library build in actual bulud-ng destination              | PASS                                                                                                                  |
| Production demo build                                     | PASS, initial bundle 477.96 kB; existing Dropdown stylesheet warning remains, 59 bytes over 6 kB                      |
| Public API review                                         | No root/secondary export changes in this redesign; four intentional additional datepicker theme properties documented |
| Dependency review                                         | Root package.json and package-lock.json unchanged; no new dependency                                                  |
| Destination source verification                           | PASS, 12 implementation/documentation files transferred only after checking original hashes                           |
| Visual verification in actual destination                 | PASS, Persian calendar 1405/7/29 in both themes at port 4309; screenshots saved                                       |

The browser runner used a temporary local configuration on port 4311, so it
could not accidentally reuse the Angour application on port 4200. The local
configuration is not part of the delivered source. Unit tests used the installed
`/usr/bin/google-chrome` because `/snap/bin/chromium` is absent.

## Risks / unresolved issues

The only full-unit failure is the previously recorded Checkbox case, “marks the
Angular control touched on blur and validates required state.” Its implementation
was not changed by this redesign. All datepicker/theme units and all browser
scenarios pass. The full unit suite was not rerun after adding the final extra
regression; the final scoped run includes it.

The popup requires a browser supporting the native Popover API. Font assets
remain owned by the consuming application. Year lists render a maximum of 80
entries; month and Shift+Page navigation can reach older/future dates within the
configured ISO bounds.

## Out of scope

No Angour source edits, dependency changes, unrelated focus fixes, commits,
pushes or publication.
