# Component catalog upgrade validation — 2026-10-21

## Summary

Added modern pure display pipes, filled Angour badges, automatic required markers, and a controlled two-sided chat extracted from Angour ticket UI. Replaced the unified Demo with overview + 41 lazy feature pages, each with live example, sample code and API notes, and nested component navigation. Header theme switching uses the existing Angour switch.

## Files changed

- projects/bulud-ng/utilities/display-pipes.ts, public-api.ts and tests: number/currency/percent/compact Intl formatting, explicit-clock relative time, duration, Unicode code-point truncation and fallback preserving zero/false.
- projects/bulud-ng/field-label/**: standalone native label/legend/span decoration from AbstractControl required metadata; reactive validator changes and explicit override for opaque policies.
- projects/bulud-ng/{otp,rating,file-upload,period-picker}/*.ts: internal labels automatically mark their required input.
- projects/bulud-ng/chat/**: typed controlled messages, mirrored logical incoming/outgoing layout, safe text, timestamps/statuses, retries/attachment actions, composer validation, busy/disabled/empty/error states, keyboard/IME handling and reader-preserving scrolling.
- projects/bulud-ng/src/lib/theme/angour-theme.ts, angour.css and tests: filled semantic badge palettes, 8px radius, weight 600, contrast checked in both themes. Existing badge APIs/dismiss behavior preserved.
- shared-ui-theme.ts and tests: chat/field-label typed configuration precedence.
- projects/base/src/catalog/**, catalog.routes.ts, sidebar.ts: 41 independent lazy feature routes, searchable catalog, live examples, copyable source samples and API sections; native nested disclosure navigation.
- projects/base/src/{main,overview,toolbar,forms}.ts, forms.html, styles.css: explanatory overview, removed Demo menu/source, compatible /demo redirect, auto required labels and Angour theme switch. Existing workflow URLs remain for regression/integration compatibility.
- tools/verify-tree-shaking.mjs: five real packed-package production consumers; serve-base.mjs prints the overview URL.
- angular.json, tsconfig.json: deliberate new secondary entry/test discovery.
- e2e-base/**: requested navigation/switch updates plus new catalog/chat/required-marker tests; all 41 pages are visited.
- COMPONENT-CATALOG.md, README/SHARED packaged/workspace guides, DEMO-AND-PACKAGING.md, CATALOG-UPGRADE-AUDIT.md: API contracts, run/install, source-extraction decisions and application-owned transport boundaries.

## Validation

| Check                                                             | Result                                                                                                                                  |
| ----------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| npm run format:check on actual project                            | PASS                                                                                                                                    |
| Prettier over every changed source/config/document                | PASS                                                                                                                                    |
| npm run lint on actual project                                    | PASS, zero errors                                                                                                                       |
| Full final library unit suite                                     | PASS: 688                                                                                                                               |
| Focused badge token/contrast checks                               | PASS: 4; all filled variants exceed 4.5:1 text contrast in light/dark                                                                   |
| Full final base browser suite on actual project                   | PASS: 36, including all 41 lazy pages, four locale/theme combinations, chat/retry/required markers and prior workflows                  |
| Existing legacy component browser suite                           | PASS: 97                                                                                                                                |
| Library production build                                          | PASS                                                                                                                                    |
| Base production build and retained 300000-byte initial asset cap  | PASS                                                                                                                                    |
| npm run package:local                                             | PASS; final installable tarball built in actual project                                                                                 |
| Final actual-package AOT consumers / tree shaking                 | PASS: five fixtures, no source aliases or downloaded dependencies                                                                       |
| Direct inspection of final export target paths                    | PASS: 43 exports, zero missing target paths                                                                                             |
| npm run validate:package                                          | PASS: 159 emitted files/exports/assets                                                                                                  |
| Final Lighthouse overview                                         | PASS: performance 97, accessibility 100, best practices 100, SEO 100                                                                    |
| Chat Lighthouse after mobile CLS fix                              | Performance 96, LCP 2.4 s, CLS 0                                                                                                        |
| Production compression/cache/BFCache tests                        | PASS: 2                                                                                                                                 |
| Final visual review                                               | PASS: actual production chat, nested navigation, pointer-operated Angour theme switch; screenshot saved                                 |
| Root public-api.ts relative to this task snapshot                 | Unchanged; new intentional secondary entries chat and field-label; utilities exports add five pure pipes, shared feature union expanded |
| Dependencies/root package/lockfile relative to this task snapshot | Unchanged                                                                                                                               |

## Performance and package

Initial referenced JS/CSS: **298,602 bytes**, gzip **89,848 bytes**. No initial-budget increase, framework upgrade, new dependency, remote fonts, auto-injected CSS, clock polling in pipes or eager import of all features. Formatter caches are bounded; lazy feature routes keep the library catalog out of the startup graph.

| Packed production consumer | JS bytes including Angular | gzip bytes |
| -------------------------- | -------------------------: | ---------: |
| button                     |                     121089 |      39766 |
| donut                      |                     126412 |      42266 |
| period                     |                     150580 |      50097 |
| chat                       |                     159261 |      51985 |
| number-pipe                |                      93175 |      30910 |

Run `npm start`, open http://127.0.0.1:4314/ or http://127.0.0.1:4314/components. Current optimized preview serves these pages.

Installable tarball: `/home/fatemeh-shirazi/Desktop/bulud-ng/dist/packages/bulud-ng-0.0.1.tgz` (357035 bytes), SHA-256 `e96b154df139ff2ddd2750e0c9d2efb8c0a24f651b2c9592cfd35870bfaf483c`.

```sh
npm install /home/fatemeh-shirazi/Desktop/bulud-ng/dist/packages/bulud-ng-0.0.1.tgz
```

## Risks / unresolved issues

Initial automatic-approval HTTP 404 failures were resolved after the user's explicit retry approval; all final checks above completed. The first chat Lighthouse run exposed a real mobile layout shift (CLS 0.376, score 78). Collapsed mobile navigation with stable initial geometry removed it: chat score 96, CLS 0. The final overview also fixes a missing favicon request and scores 100 for best practices. These are local simulated-mobile measurements, not guarantees for every host, device or application payload.

Chat is a reusable controlled UI, not a bundled backend: the consuming app owns HTTP/WebSocket transport, authentication, attachment download authorization, persistence, delivery acknowledgements and pagination of long histories. The example visibly identifies its simulated local replies. Required labels detect known required-validator references; opaque/custom rules use an explicit required override. Update dynamic validators with events enabled.

Public npm account/scope and license remain deferred by owner; no registry publication occurred. The existing legacy dropdown component CSS size warning remains; its threshold was not loosened. Historical API approval metadata was not rewritten or claimed as passing.

## Out of scope

Business ticket/account/receipt/auth services, remote tracking, dependency upgrades and public npm publication.

## Lighthouse artifacts

- [Full interactive overview report](docs/CATALOG-LIGHTHOUSE.html)
- [Overview JSON](docs/CATALOG-LIGHTHOUSE.json)
- [Chat performance JSON](docs/CATALOG-CHAT-LIGHTHOUSE.json)

Final overview: performance **97/100**, accessibility **100/100**, best practices **100/100**, SEO **100/100**, LCP **2.3 s**, FCP **1.7 s**, TBT **90 ms**, CLS **0**. The chat performance measurement was taken after correcting mobile CLS; the subsequent favicon-only HTML correction does not change feature JavaScript or CSS.
