# Line chart compatibility audit — 2026-11-14

The existing foundation audit is in FOUNDATION-AUDIT.md. This task audits the chart surface before extending it.

| Check                 | Existing BuludChart                                     | Required work                                                                                                                         |
| --------------------- | ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| API                   | Public charts entry; one line series                    | Add independently tree-shakable native line entry, multiple series, null gaps, axis formatters/bounds and dash patterns               |
| Configuration/theme   | Shared typed theme, CSS variable overrides              | New typed feature token, instance → component default → global → CSS precedence tests                                                 |
| Accessibility         | Named SVG and data table; title-only point descriptions | Keyboard point/series exploration, escaped text tooltip, disabled/loading/error states, live descriptions                             |
| Forms                 | Not a form control                                      | No CVA required                                                                                                                       |
| Demo                  | Basic single-series chart                               | Add multi-series, grade axis, empty, negative/constant, loading/error/disabled, custom theme and RTL cases                            |
| Unit/browser          | Existing simple geometry coverage                       | Add behavioral/config/reactivity tests and demo E2E; compare all Angour line configurations against the original renderer             |
| Packaging/performance | Native SVG, no chart runtime dependencies               | Retain dependency-free rendering, static Tailwind utilities, explicit feature CSS without preflight; inspect production import graphs |

No changes to existing charts APIs are required. Angour business data generation remains in Angour; rendering belongs to Bulud.
