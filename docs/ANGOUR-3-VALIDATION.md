# Angour migration release validation — 3.0.0

The candidate consolidates reusable Angour UI under canonical Bulud features,
with explicit Tailwind styles, configurable Angour light/dark tokens, responsive
layout, arbitrary project locales, native control IDs, outline/link buttons and
the reusable tour. Business APIs, routing policies and marketing identifiers
remain owned by Angour. The reviewed baseline is
`4d54ab092b880d86e0f481df5426fce9c31672a8`.

## Checks

| Check                                                                | Result                                                                           |
| -------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| Formatting                                                           | Pass                                                                             |
| ESLint                                                               | Pass, zero errors                                                                |
| Library unit tests                                                   | 860 pass                                                                         |
| Demo browser tests                                                   | 135 pass                                                                         |
| Base browser tests, including skeleton and deferred theme activation | 71 pass                                                                          |
| Tailwind source/generated consistency                                | 48 stylesheets pass                                                              |
| Library production build                                             | Pass, no warnings                                                                |
| Demo and base production builds                                      | Pass                                                                             |
| Public declarations/API                                              | 53 entries pass                                                                  |
| Dependency and package inventory                                     | Pass                                                                             |
| Isolated installed-package declarations and imports                  | 53 paths pass; skipLibCheck disabled                                             |
| Packed AOT tree-shaking                                              | 10 fixtures pass, including configuration-only imports                           |
| Angular 22.2.6 server consumer                                       | 53 public entries; 26 AOT features; SSR pass without browser globals or Tailwind |
| Tool regression tests                                                | Pass                                                                             |
| Angour production apps                                               | trader, supporter, introducer, corporate, tools pass                             |
| Angour tour business adapter                                         | 3 tests pass                                                                     |
| Angour marketing ID audit                                            | 330 original bindings preserved; zero missing                                    |

Trader's initial static chunks contain its connection dialog, appearance,
not-found route, runtime/access policies and tour. Account card, upload, dropdown,
chart-host, field-label and deferred default-artwork selectors are absent.
Global callbacks import configuration tokens from the root entry; feature
re-exports retain the same token identities.

## Production performance

Three final runs per form factor measured the normal viewport-deferred demo.
Mobile scores were 99, 98, 98 (median **98**); desktop was **100** in all three.
FCP and LCP were about **0.6 s** on mobile and **0.2 s** on desktop. All FCP,
LCP, total-blocking-time, layout-shift and speed-index metric scores were green.
Raw summaries and report digests are in [performance.json](validation/3.0.0/performance.json).

The base initial assets are **298,377 bytes**, below the unchanged 300,000-byte
measurement gate. Its shell gets a generated subset of the same Angour tokens;
complete feature tokens load once before the first feature route activates.
See [base-size.json](validation/3.0.0/base-size.json). No budget was raised.

Normal scrolling and direct feature hashes render each unique example on demand.
`/#all` explicitly mounts the complete catalogue for inspection and browser
coverage. Stable section shells preserve anchors.

## Angour visual/behavior evidence

The final candidate passed 96 compatible-component comparisons plus 16 live
pagination cases, 152 dropdown cases, 160 line-chart cases plus 16 hover cases,
256 date/chart cases, 160 radial-chart cases, 56 modal cases, 56 primitive cases,
96 visual-matrix cases and 16 tour cases across themes, directions, locales and
mobile/desktop sizes. Some chart/date cases retain only the documented tiny
font-antialiasing differences; those are not claimed pixel-identical.
The original Gold baseline is the verified published 2.1.0 native chart, rather
than the legacy Apex wrapper used by other charts.

## Limits and publication

These are controlled local production measurements, not field measurements of
all Angour routes or end-user network conditions. Demo build warnings remain:
507.45 kB initial against a 500 kB warning and component-style warnings for
button, dropdown, period picker and upload. They are documented; limits were
not increased to hide them. The strict Lighthouse and base-size gates passed.

At validation time npm still published 2.1.0. Local npm authentication returned
E401, and the web-login endpoint failed to return a usable login URL. Publishing
3.0.0 and installing that exact official registry version in Angour remain
separate steps. Angour currently uses the tested local candidate; its package
manifest/lock still point at official 2.1.0. Angour must not be committed or pushed.
