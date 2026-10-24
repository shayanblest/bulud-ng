# Foundation audit — 2026-10-21

Audit completed before new work, using the existing secondary public APIs,
adjacent unit specs, demo templates and browser specs. Existing Angular signals,
OnPush and zoneless architecture is retained. “Complete” applies to the current
library surfaces; business rules belong to consuming applications.

| Surface            | API/config/theme                                 | Accessibility/forms                                                                    | Demo/unit/browser coverage and action                                                                                                  |
| ------------------ | ------------------------------------------------ | -------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Button             | Secondary export, typed variants/theme           | Native disabled/loading button                                                         | Existing coverage; retain                                                                                                              |
| Badge              | Secondary export, typed theme                    | Named dismiss, status colors                                                           | Existing coverage; retain                                                                                                              |
| Dropdown           | Secondary export, typed callbacks/theme          | CVA, required; gaps in disabled-open lifecycle and error descriptions                  | Fix lifecycle, opt-in membership and selection-count validation, cached search, error ARIA; add regressions                            |
| Checkbox           | Secondary export, CSS theme                      | Native checkbox/CVA/required                                                           | Existing browser coverage passes; investigate unit blur baseline without changing native behavior                                      |
| Switch             | Secondary export, CSS theme                      | Native switch/CVA/required                                                             | Existing coverage; retain                                                                                                              |
| Radio              | Secondary export, theme input/global theme       | CVA/required; error relationship absent on group                                       | Add forwarded error relationship; validate against projected options and notify on option changes                                      |
| Datepicker         | Secondary export, component/default/global theme | CVA/required/ISO/bounds; malformed bounds and oversized ranges need explicit rejection | Add negative tests and validation; attach outside listeners only while open                                                            |
| Dialog             | Secondary export, typed theme/policies           | Top-layer focus trapping, nested modal handling                                        | Existing extensive unit/browser cases; retain                                                                                          |
| Pagination         | Secondary export, typed theme/locale             | Controlled bounded requests, nearest RTL                                               | Direction fix already validated; retain                                                                                                |
| Tabs               | Secondary export, config/theme                   | Tab/panel IDs, roving keys                                                             | Existing coverage; retain                                                                                                              |
| Accordion          | Secondary export, config/theme                   | Triggers/regions/headings                                                              | Existing coverage; retain                                                                                                              |
| Textarea autosize  | Secondary export, config                         | Native textarea; native Angular validators remain available                            | Extensive measurement coverage; keep out of initial starter bundle                                                                     |
| Click outside      | Secondary export                                 | Pointer/focus output, cleanup                                                          | Existing coverage; retain                                                                                                              |
| Resize observer    | Secondary export                                 | Deduplicated size output, cleanup                                                      | Existing coverage; retain                                                                                                              |
| Digit pipes        | Secondary exports                                | Pure display transforms                                                                | Existing units/demo; retain                                                                                                            |
| Initials pipe      | Secondary export                                 | Unicode graphemes                                                                      | Existing units/demo; retain                                                                                                            |
| File size pipe     | Secondary export                                 | Locale output, invalid handling                                                        | Existing units/demo; retain                                                                                                            |
| Theme/locale       | Intentional root exports, explicit CSS import    | Consumers own language/direction/theme                                                 | Existing cross-component precedence tests; preserve                                                                                    |
| Native form fields | Angour CSS primitives                            | Angular built-in validators; consumer owns error messages                              | Provide real starter forms with labels, error ARIA, required/email/length/pattern/min/max/custom cross-field/async validation examples |

## Ordered implementation work

1. Correct disabled lifecycle, malformed values/bounds and error relationships.
2. Cache search indexing and avoid document listeners on closed controls.
3. Add an independent lean starter target using the Angour preset globally,
   lazy-loaded routes, responsive layouts and both languages/themes.
4. Run targeted and complete validation, package/build checks and measure
   production entry sizes. Record limitations and baseline failures honestly.

No dependency upgrade or new dependency is necessary. Existing public component
behavior and optional Bulud defaults remain available to library consumers.
