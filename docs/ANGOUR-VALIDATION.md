# Angour transfer validation — 2026-10-20

Transferred Angour's light/dark foundations into optional Bulud NG presets and
application CSS primitives. Existing Bulud components consume the preset through
their existing custom-property and theme APIs. The demo adds `/#angour`.

## Files changed

- `projects/bulud-ng/src/lib/theme/angour-theme.ts` — typed foundation tokens and light/dark presets.
- `projects/bulud-ng/src/lib/theme/angour-theme.spec.ts` — provider, caller override and dark mapping tests.
- `projects/bulud-ng/src/public-api.ts` — exports the three new constants.
- `projects/bulud-ng/angour.css` — generated, opt-in component and foundation tokens.
- `projects/bulud-ng/angour-base.css` — optional application, panel, form and table presentation.
- `projects/bulud-ng/ng-package.json`, `projects/bulud-ng/package.json` — package both CSS assets and expose their style paths.
- `projects/demo/src/app/angour-demo.ts`, `app.ts`, `app.html`, `projects/demo/src/styles.css` — preview, switches, all existing component surfaces and overrides.
- `e2e/angour.spec.ts` — actual browser colors, direction, selectors, keyboard access and focus restoration.
- `tools/generate-angour-theme.mjs` — builds the CSS from typed presets with deterministic formatting.
- `projects/bulud-ng/README.md`, `docs/README.md`, `docs/PUBLIC-API.md`, `docs/ANGOUR.md`, `docs/ANGOUR-TRANSFER-REVIEW.md` — setup, contract and transfer review.

## Validation

| Check                                                         | Result                                                                                                       |
| ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `npm run format:check`                                        | PASS                                                                                                         |
| Prettier check of new source, CSS, tests, generator and guide | PASS                                                                                                         |
| `npm run lint`                                                | PASS, 0 errors                                                                                               |
| New Angour unit spec, headless Chrome                         | PASS, 3/3                                                                                                    |
| Full unit suite                                               | FAIL, 538/545 pass; 7 existing focus-dependent failures                                                      |
| Unchanged baseline unit suite                                 | FAIL, 534/542 pass; the same 7 failures plus a checkbox focus/blur failure                                   |
| Angour browser tests                                          | PASS, 5/5                                                                                                    |
| Full browser suite, one worker                                | PASS, 86/86                                                                                                  |
| Initial browser suite, two workers                            | 85/86; one transient textarea growth timing failure; serial full run passes                                  |
| Library build in destination                                  | PASS; distributable created in `dist/bulud-ng`                                                               |
| Production demo build                                         | PASS; existing dropdown stylesheet budget warning (59 bytes over 6 kB)                                       |
| npm package dry run                                           | PASS; both Angour stylesheets included in the 54-file package                                                |
| CSS generation repeatability                                  | PASS; regeneration leaves identical CSS bytes                                                                |
| `git diff --check`                                            | PASS                                                                                                         |
| Public API review                                             | Additive: `BULUD_ANGOUR_TOKENS`, `BULUD_ANGOUR_LIGHT_THEME`, `BULUD_ANGOUR_DARK_THEME`; two CSS export paths |
| Dependency review                                             | No dependency, root package.json or lockfile changes; library metadata adds CSS exports only                 |

Tests ran against identical staged source because the destination initially lay
outside the chat's writable roots. Applied files were hash-verified against that
source; the library was also built in the actual destination. Browser validation
used an isolated local port, because port 4200 was occupied by Angour.

## Risks / unresolved issues

The full unit suite is not green in the unchanged baseline. Existing failures
concern textarea ancestor focus metrics, Switch CVA/touch and focus dimensions,
and Dialog focus styling. No component implementation changed in this transfer.
The three new unit tests and the complete browser suite pass. Font files remain
consumer-owned; system fallbacks work without remote requests.

## Out of scope

Angour application services, domain translations, routing, authentication,
Bootstrap utilities, custom icons and font binaries are not incorporated into
the shared library. Existing Bulud locale APIs are preserved. No dependency
upgrade, commit, push or publication was performed.
