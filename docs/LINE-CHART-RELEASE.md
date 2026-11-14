# Bulud 2.0.0 native line chart

The separate `bulud-ng/line-chart` entry adds native SVG multi-series lines, dash patterns, configurable axes, escaped financial tooltips, null gaps, keyboard navigation and reactive inputs. It accepts arbitrary BCP 47 locales and consumer-supplied text; no language list or chart-engine dependency is bundled. Angular standalone/signals/OnPush and static Tailwind utilities follow the existing library conventions. The original charts API remains unchanged.

Validation before publication:

- Format: pass (`npm run format:check`); changed TypeScript/demo/E2E files also formatted.
- Lint: pass, zero errors.
- Unit: pass, 11 scoped Chromium tests, including configuration precedence, keyboard, data/axis updates and arbitrary locales.
- E2E: pass, 3 Playwright tests covering demo states, directions, pointer/keyboard, theme override and live locale changes.
- Library build: pass, no new warnings.
- Demo build: pass; existing dropdown 6kB CSS budget warning remains, no new line-chart budget warning. Demo line chart is deferred.
- API: pass against pre-release master `d3dda77a2887ef17c9c77c059decd6ecbfe16a9a`; additive line-chart entry/CSS scope recorded explicitly.
- Dependencies: pass; workspace manifest and lockfile unchanged, no new runtime dependency.
- Package: pass; compiled public entries, CSS exports, MIT license and publish prerequisite checks validated.
- Consumer parity: 144 static configurations plus 16 tooltip comparisons across fa/en/ar/tr, light/dark, 375px/1280px. Additional 16 Gold-page viewport-style comparisons pass. Static differences are limited to antialiasing (maximum 29 pixels, channel difference 15); tooltip bounds differ by less than 0.02px. This is component validation using Angour assets, not authenticated application E2E.

The Angour application retains its data generation, API calls, year filters and line/candle switching. Its old line renderer is removed after parity checks. Generic application Jest smoke tests still encounter missing providers such as AUTH_SCOPE; these are reported separately from the library's passing browser tests.
