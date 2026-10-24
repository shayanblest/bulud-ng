# Foundation validation — 2026-10-21

## Summary

Reviewed every current library surface before implementation; see
`FOUNDATION-AUDIT.md`. Added the independent `base` application with a global
Angour design, persisted light/dark and Persian/English preferences, an eager
first page and lazy form route. Added reusable validators and corrected control
lifecycle, form accessibility, validation boundaries and unnecessary work.

## Files changed

- `projects/base/` — responsive application shell, preferences, overview, typed reactive form, localized field errors and first-invalid focus.
- `angular.json`, `tsconfig.json` — independent base target and validators entry/test alias; existing targets retained.
- `projects/bulud-ng/validators/` — optional validators entry with composition/negative/unit coverage.
- `projects/bulud-ng/dropdown/` — disabled-open lifecycle, guarded deferred focus, opt-in membership/count/type validation, cached search labels, dynamic locale, input ID and error relationships.
- `projects/bulud-ng/radio/` — opt-in projected option validation, finite value rejection, error relationship and revalidation when options change.
- `projects/bulud-ng/datepicker/` — malformed/reversed bounds validation; lazy day/year DOM and open-only document pointer listener.
- `projects/bulud-ng/src/lib/theme/angour-theme.ts`, `angour.css`, `angour-base.css`, `tools/generate-angour-theme.mjs` — source-matched input/trigger body surfaces and accessible small danger/error text.
- `projects/bulud-ng/package.json` — preserve explicit CSS imports through `sideEffects: ["**/*.css"]`; JavaScript remains eligible for tree shaking.
- Adjacent Checkbox/Switch/Dialog/Dropdown/Textarea specs and `theme-test-helpers.ts` — stabilize unit state/event testing; real native focus/keyboard behavior remains covered in browser tests.
- `e2e-base/`, `playwright.base.config.ts`, `e2e/angour.spec.ts` — base and theme browser coverage.
- `tools/measure-base.mjs` — reproducible initial asset and gzip measurements with a 300 kB check.
- `docs/BASE.md`, public API/README/form-control documentation — commands, examples, API/error contracts and application boundaries.

## Validation

| Check                                                             | Result                                                                                                                                                        |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run format:check`                                            | PASS, staged and actual destination                                                                                                                           |
| Prettier check of every changed source/config/docs/test file      | PASS                                                                                                                                                          |
| `npm run lint`                                                    | PASS, zero errors                                                                                                                                             |
| Complete final headless Chrome unit suite                         | PASS, 577/577                                                                                                                                                 |
| Complete library browser suite                                    | PASS, 97/97, including actual focus/keyboard/ARIA/theme behavior                                                                                              |
| Final Angour browser rerun after error-text contrast adjustment   | PASS, 5/5                                                                                                                                                     |
| Final base browser suite                                          | PASS, 5/5; both directions/themes, mobile width, preference persistence, error-color assertions, all form rules, async demo error, reset and valid submission |
| Library production build                                          | PASS, staged and actual destination                                                                                                                           |
| Base production build                                             | PASS, staged and actual destination; no initial budget warning                                                                                                |
| Original demo production build                                    | PASS; pre-existing Dropdown stylesheet warning remains, 59 bytes over 6 kB                                                                                    |
| `npm run validate:package`                                        | PASS, built exports/assets/metadata verified                                                                                                                  |
| npm package dry run                                               | PASS; validators declarations and FESM bundle included                                                                                                        |
| Installed-layout declaration consumer, strict, skipLibCheck false | PASS; root/Dropdown/Radio/Validators imports and new inputs compile                                                                                           |
| Public API review                                                 | Intentional `bulud-ng/validators` entry and documented Dropdown/Radio inputs; existing root exports unchanged during this task                                |
| Dependency review                                                 | No new/updated dependencies; root package.json and lockfile unchanged during this task                                                                        |
| Source delivery                                                   | Guarded source hashes before both transfers; all unrelated work preserved                                                                                     |
| Actual-destination visual check                                   | PASS, light/dark overview, localized error messages, first-invalid focus, no browser console errors                                                           |

The full library browser suite passed before the final small contrast change;
the affected Angour cases and the complete base suite were rerun afterward.
An earlier browser run overlapped watched-source edits and reloaded during two
tests; the unchanged final source run passed all 97 cases.

Previously recorded focus-unit failures are now deterministic: authored theme
states are tested independently of prior browser input modality, and CVA/focusout
unit tests dispatch the relevant events. Native focus restoration, keyboard
navigation and outside interaction remain verified by real browser tests.
No production component uses manual change detection or timing workarounds.

## Performance evidence

Measured from actual destination production assets referenced by index.html:

- Initial JavaScript + CSS, including the usable overview: **290,679 bytes**.
- Sum of independently gzipped initial assets: **84,519 bytes**; excludes HTTP headers.
- Form route is separate/lazy, about 124 kB raw. No form payload is required for the overview.
- Initial production warning/error budgets: 300/350 kB. Independent measurement script fails above 300 kB.
- Closed datepickers construct **zero** day/year buttons; year rails render at most 80 entries when opened.
- Closed Dropdown/Datepicker instances have no outside pointer listener.
- Dropdown search normalizes labels once per options/label dependency change, rather than once per search keystroke.
- No remote runtime assets or new dependency are required for the starter.

These are reproducible bundle/work measurements, not a claim of a universal
maximum performance score. Compare profiles against the consuming application's
actual data and deployment environment when adding features.

## Risks / unresolved issues

No failing unit/browser tests remain in the runs above. The original demo's
59-byte Dropdown CSS warning is unchanged. The starter is a frontend foundation:
submission validates locally, and the async email rule is a local example.
Connect authentication, real async validation and server-side business rules to
an application API before using the example as a production account flow.

## Out of scope

No backend, authentication service, dependency upgrade, package publication,
commit or push. Existing generic Bulud defaults remain available to consumers;
the independent base application explicitly opts into the complete Angour preset.
