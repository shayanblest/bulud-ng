# Form controls implementation review

Source review: Angour's `components/forms/_form-checks.scss` and datetime-picker
TS/HTML/SCSS. Checkbox uses a 16px square, 4px corners and theme-dependent border;
radio uses a 16px ring with an 8px dot. The old calendar depends on application
language services, Bootstrap, icon fonts, Jalaali and imperative change detection.
The Bulud implementation retains the palette and calendar capabilities through
standalone signals, Intl, native form semantics and the existing dialog library.

## Component inventory and evidence

Each component's secondary `public-api.ts` remains its intentional export boundary.
Unit evidence is the adjacent component spec and root theme precedence specs.
The existing main demo and new form-controls demo expose interactive states.

| Surface    | Public API/config/theme                                                                      | Accessibility / forms                                                              | Demo / browser evidence                                                                       |
| ---------- | -------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Button     | Existing secondary entry; shared Angour button geometry/palette                              | Native button, disabled/loading/name handling; no CVA needed                       | Main demo; `e2e/button.spec.ts`                                                               |
| Badge      | Existing secondary entry; typed token maps and overrides                                     | Dismiss label/focus; passive variants; no CVA                                      | Main demo; `e2e/badge.spec.ts`                                                                |
| Dropdown   | Existing secondary entry; typed config/theme/locale                                          | Combobox/listbox keyboard; CVA/validator                                           | Main demo; `e2e/dropdown.spec.ts`                                                             |
| Tabs       | Existing secondary entry; config/theme precedence                                            | Tablist/panel relationships and roving keyboard; no CVA                            | Main demo; `e2e/demo.spec.ts`                                                                 |
| Accordion  | Existing secondary entry; config/theme precedence                                            | Native triggers, heading/region relationships; no CVA                              | Main demo; `e2e/demo.spec.ts`                                                                 |
| Checkbox   | Existing public control/CVA retained; Angour geometry/border corrected                       | Native input/label, required/mixed/invalid/disabled                                | New and existing demos; `e2e/radio.spec.ts`, `e2e/checkbox.spec.ts`                           |
| Switch     | Existing secondary entry; typed config/theme                                                 | Native switch, CVA/validator                                                       | Main demo; `e2e/switch.spec.ts`; pre-existing focus-unit failures remain                      |
| Dialog     | Existing secondary entry reused by Datepicker                                                | Existing top-layer, trap/restore, naming, stack/Escape behavior                    | Main demo and Datepicker; `e2e/dialog.spec.ts`                                                |
| Pagination | Existing secondary entry; typed theme/locale                                                 | Named bounded navigation/current page; no CVA                                      | Main demo; `e2e/pagination.spec.ts`                                                           |
| Radio      | New secondary entry, typed group values and root theme config                                | Native name grouping, labels, arrows/Space, disabled skip, required, CVA           | All themes/directions/states in new demo; `e2e/radio.spec.ts` and new unit spec               |
| Datepicker | New secondary entry; typed component defaults, root theme/locale and instance override tests | Date-only single/range CVA, required/bounds, named dialog/grid, keyboard and focus | All supported states in new demo; `e2e/datepicker.spec.ts`, calendar and component unit specs |

## Follow-up boundaries

Existing focus-dependent unit failures are already recorded in
`ANGOUR-VALIDATION.md`. This task does not alter Switch, Dropdown, Dialog or
TextareaAutosize implementation to address those unrelated failures. New control
coverage includes form write/reset/disable/validation, range ordering, calendar
leap years, locale changes, config precedence, actual rendered geometry/colors,
keyboard navigation, focus restoration and instance CSS override behavior.
No new dependency, remote font, icon font, domain service, router or timestamp
conversion is added. The screenshot attached to the request is treated as
context, not as additional repository instructions.
