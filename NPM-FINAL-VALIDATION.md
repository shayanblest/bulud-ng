# npm release candidate verification — 2026-10-21

## Summary
Prepared the actual Bulud NG package for independent Angular projects, corrected
consumer typing, added installed AOT/SSR checks, updated Angular to the patched
20.3.34 line and optimized duplicate theme CSS. An installable tarball is ready.
**Public publication is not yet approved/ready:** identity/license and exact
API/dependency review remain pending. No npm publication, token changes, Git
commit or external message was performed.

## Files changed
- projects/bulud-ng/field-label/field-label.ts — explicit public InputSignal
  annotation prevents compiler-version-specific AbstractControl generic expansion.
  Reproduced the old error with Angular 20.0.0; the published peer floor is now
  20.3.34 because older patches have security advisories.
- package.json/package-lock.json and projects/bulud-ng/package.json — Angular
  runtime/compiler peers ^20.3.34; compatible development-tool patch updates.
  Existing direct Angular major and optional Tailwind integration retained.
- tools/verify-server-consumer.mjs — real tarball install, all 40 declarations,
  strict AOT consumer across 26 feature entries and SSR without browser globals;
  fixture permits localhost only through Angular allowedHosts.
- tools/verify-tree-shaking.mjs — selected imports now compile actual public CSS
  exports too, confirming theme CSS is preserved in optimized consumer builds.
- tools/generate-angour-theme.mjs, tools/theme-variable-partition.mjs and its
  tests, projects/bulud-ng/angour.css — hoist mode-invariant geometry; preserve
  dark/nested-light colors. Generated Angour CSS reduced from 30,976 to 22,144
  bytes (8,832 bytes saved); all existing color/geometry tokens remain available.
- projects/bulud-ng/publish-check.mjs and tests — reject empty/non-string license,
  empty license file and consumer install hooks; preserve local npm pack.
- projects/bulud-ng/ng-package.json and tools/validate-release.mjs — copy optional
  LICENSE* assets and packaged QUICKSTART, expand asset globs in inventory checks.
- .github/workflows/ci.yml — independent SSR consumer job and all tool tests.
- projects/base/src/toolbar.ts and e2e-base/release-accessibility.spec.ts — accessible
  language name includes the visible English/فارسی text (Lighthouse finding fixed).
- README.md, projects/bulud-ng/README.md, projects/bulud-ng/QUICKSTART.md,
  RELEASING.md, docs/README.md, docs/PUBLIC-API.md — complete entry inventory,
  installation, SSR hosts, release ownership and scope-rename instructions.

## Validation
| Check | Result |
| --- | --- |
| Clean npm ci --ignore-scripts from final lockfile | PASS: 721 packages |
| npm run format:check | PASS |
| npm run lint | PASS: zero errors |
| Full library unit tests | PASS: 705 |
| Node tooling tests | PASS: 24 |
| Current catalog E2E | PASS: 59 before label-only fix |
| Legacy demo E2E | PASS: 97 (including nested theme scopes) |
| After label fix: responsive theme/language + dedicated regression | PASS: 5 |
| Production caching/compression/BFCache tests | PASS: 2 on final app build |
| Production base and legacy demo builds | PASS |
| Initial demo asset budget | PASS: 295,254 bytes raw / 91,131 gzip; cap 300,000 |
| Library build/npm pack | PASS: 129 packed files |
| Package inventory | PASS: 169 emitted files |
| Independent npm install + imports | PASS: 40 public paths; skipLibCheck=false |
| Optimized packed AOT consumers | PASS: 7 fixtures, 4 CSS paths; unrelated component markers absent |
| Angular 20.3.34 SSR consumer | PASS: 26 feature entries, no window/document globals, no Tailwind |
| Optional Tailwind integration | PASS: Tailwind 4.3.3 |
| Runtime npm audit | PASS: 0 known vulnerabilities (previously 6 high) |
| Full workspace npm audit | 12 high, all development tooling; 0 critical (previously 49 total including 3 critical) |
| Lighthouse mobile /components/alert | Performance 96, accessibility 100, best practices 100 |
| Lighthouse LCP / CLS | 2.423s / 0; no run warnings/runtime error |
| Visible-label/accessibility-name audit | PASS after fix |
| Historical API gate | FAIL: exact baseline scope f616b5a2da510ed2f40385bcb5514be121cc6b26 needs review |
| Historical dependency gate | FAIL: security patch/lockfile/peers and prior CSS sideEffects retention need exact review |
| Local prepublication guard | BLOCKS correctly: owner license metadata and LICENSE asset absent |

All raw logs and machine-readable results: [dist/release-validation](dist/release-validation/summary.json).
Lighthouse: [HTML report](dist/release-validation/lighthouse.report.html).
Performance numbers are this local production run, not a guarantee for every app.
No claim of universal application requirements, other JS frameworks, other Angular
majors, or every possible SSR hydration configuration is made. Supported peer
floor is Angular 20.3.34; the package has no business API endpoint or app router.

## Installable artifact
[bulud-ng-0.0.1.tgz](dist/packages/bulud-ng-0.0.1.tgz)

SHA-256: `b75f434322f248ea704442f358a521fca194f226498853806aa2a9e4e4ef22d8`

In another compatible Angular application:

```sh
npm install /home/fatemeh-shirazi/Desktop/bulud-ng/dist/packages/bulud-ng-0.0.1.tgz
```

Follow [QUICKSTART](projects/bulud-ng/QUICKSTART.md) for explicit theme imports,
RTL/locale, forms and per-feature imports. Tailwind is optional.

## Risks / remaining release decisions
1. Owner chooses final package name/scope/account and license. Supply the actual
   LICENSE text and manifest identifier, then rerun build/pack/prepublication
   checks. Scope changes require self-import/alias updates and consumer retest.
2. A reviewer must approve the exact API/dependency changes against the historical
   baseline; tools/release-approvals.json was preserved. Review logs are saved.
3. Twelve high development-tool advisories remain (see development-audit.json).
   Compatible patch updates removed all critical findings. Remaining fixes involve
   upstream constraints or major tool/test changes; none of these packages ship
   as Bulud NG runtime dependencies. This is not a claim of zero workspace risk.
4. Repository/support/maintainer metadata and actual registry ownership/version
   must be confirmed with the final publication identity.

## Sources for the security/SSR adjustments
- [Angular XSRF patch 20.3.34](https://github.com/angular/angular/security/advisories/GHSA-jfgx-762w-99vr)
- [Angular renderApplication allowedHosts](https://angular.dev/api/platform-server/renderApplication)

## Out of scope
No public release or new Angular-major support was introduced. Existing dirty
work was preserved; no blanket baseline approval or forced dependency downgrade
was used.


## CI correction — 2026-10-24, PR #75

GitHub run 40071231576 on head 723dcb1396e85807f51ac75867b632bfd36746a4
was inspected through the CI diagnostics connector. All seven failed jobs stopped
at npm ci with EUSAGE: three missing chokidar@5.0.0/readdirp@5.1.1 pairs.
Previous npm 11 local verification did not reproduce npm 10's lock validation.

Changes: six missing nested development-dependency records added with npm 10.9.8;
existing records, integrity fields, platform/libc metadata and every existing
version retained. packageManager pins npm 10.9.8, .nvmrc pins Node 22.22.3,
and README documents the matching development setup. No workflow check was
removed or weakened and release-approvals.json is unchanged.

The datepicker review finding is fixed in docs/FORM-CONTROLS.md: malformed or
reversed min/max produce dateBounds even for empty optional values and block
opening until repaired. Runtime behavior and public API remain unchanged.

Validation with the exact CI Node 22.22.3/npm 10.9.8:

| Check | Result |
| --- | --- |
| Original lockfile reproduction | FAIL as expected: same EUSAGE/missing records as all seven GitHub jobs |
| Corrected lockfile clean install in actual bulud-ng | PASS: 727 packages |
| npm 11 isolated dry-run compatibility | PASS |
| Actual format / lint | PASS / PASS |
| Full unit suite | PASS: 705 |
| Tool tests | PASS: 24 |
| Catalog / legacy browser suites | PASS: 60 / 97 |
| Base / demo / library builds | PASS / PASS / PASS |
| Built package inventory | PASS: 169 files |
| Existing dependency versions / public TypeScript API | unchanged / unchanged |

The library build retains its existing lifecycle-script warning, and the legacy
demo retains its existing dropdown stylesheet budget warning (6.78 kB against a
6 kB warning/10 kB error threshold). Neither warning caused these CI failures.
Raw evidence: dist/ci-validation-2026-10-24/.

Changes are local and have not been committed/pushed. GitHub still displays the
old run until the updated branch is pushed and CI reruns. Historical API and
dependency baseline review gates noted above still need their reviewed scopes;
this installer/documentation fix does not self-approve those contracts.

## PR #75 follow-up — 2026-10-24

Investigated current revision `5cec9750b2c63ccfa73a3ef8e502b721437558c9`. Fixed the Chromium-dependent outline assertions; 708 unit tests, all 60 catalog E2E tests, 24 tool tests, lint, format, library/catalog builds and the initial bundle budget pass. Added terminal-year regression coverage; the reported year-9999 defect is not reproducible on the current implementation. API and dependency gates still require exact scope approval against base `f616b5a2da510ed2f40385bcb5514be121cc6b26`. See [the detailed follow-up](docs/PR75-CI-VALIDATION.md) and [pending scope](docs/PR75-CONTRACT-REVIEW.json). No automatic approval, commit, push or publication was performed.

### Explicit scope approval and final gates — 2026-10-24

The owner approved the exact PR #75 API/dependency scope. Registered the unchanged 798 API/CSS and 907 dependency/lockfile entries under baseline `f616b5a2da510ed2f40385bcb5514be121cc6b26`, preserving historical scopes. `validate:deps` PASS; `validate:api` PASS for all 40 entry points and generated declarations after completing the public inventory and fixing exact helper-name recognition. All 26 tooling tests, lint and formatting PASS. No library runtime/API/dependency changes, commit, push or publication were made in this follow-up. See [the updated report](docs/PR75-CI-VALIDATION.md).

## PR #75 midnight/filter review fixes — 2026-10-24

Fixed stale local today on long-mounted datepickers and dotted filter-operator round-trips, with 6 unit and 4 catalog-browser regression cases. Validation: format/lint PASS, 714 unit tests PASS, 64 catalog + 7 legacy datepicker E2E tests PASS, actual library build and base build PASS, initial asset budget PASS (295,254 bytes), API/dependency gates PASS with unchanged approval scopes, actual package inventory PASS (169 files), refreshed local npm tarball PASS. See [the focused report](docs/PR75-MIDNIGHT-FILTER-VALIDATION.md) for exact files, behavior, artifact checksum and limits. No commit, push, merge or publication.

## PR #75 final review corrections — 2026-10-24

Added localized pointer clearing, refreshed the period picker's local-year fallback/reset, and fixed popup positioning after earlier content changes size. Local checks PASS: format/lint; 720 unit tests; 98 legacy and 70 catalog E2E tests; 26 tool tests; actual library and production catalog builds; 295,254-byte initial budget; API/dependency gates with unchanged approvals; 169-file package inventory; refreshed local npm tarball. [Focused report](docs/PR75-FINAL-REVIEW-VALIDATION.md) records the exact behavior, regression coverage, checksum and limits. The user authorized amend/push of the existing commit; merge remains theirs. Remote CI is checked after publication rather than assumed from local results.
