# PR #75 CI correction — 2026-10-24

## Summary

Diagnosed the three failed jobs at commit `5cec9750b2c63ccfa73a3ef8e502b721437558c9` using their GitHub Actions logs. The catalog job failed eight assertions of computed `outline-width`; the API and dependency jobs rejected unapproved contract scopes relative to PR base `f616b5a2da510ed2f40385bcb5514be121cc6b26`.

The computed width of an outline whose style is `none` is not a reliable assertion of visible rendering across Chromium versions. Both browser specs now check `outline-style: none`, retain focus and border assertions, and explicitly verify the search wrapper's 1px border and 8px radius in both directions and themes. Component styling was not changed.

## Files changed

- `e2e-base/shared.spec.ts` — verify actual outline visibility and the rounded search container.
- `e2e-base/upload-polish.spec.ts` — the same checks for the upload/shared showcase.
- `projects/bulud-ng/period-picker/period-picker.spec.ts` — three boundary regression cases.
- `docs/PR75-CONTRACT-REVIEW.json` — exact owner-approved scopes and the explicit approval evidence.
- `tools/release-approvals.json` — approved arrays under the exact PR baseline, preserving historical scopes.
- `docs/PUBLIC-API.md` — individual sections/examples for all 15 missing entries, root additions and chart exports.
- `tools/public-api-docs.mjs`, `tools/public-api-docs.test.mjs`, `tools/validate-release.mjs` — recognize exact exported helper names in documentation; retain existing namespaced stale-symbol detection.
- This report — findings, checks, and outstanding release gates.

## Terminal year review

The screenshot's year-9999 defect is not reproducible at the reviewed commit: `buludPeriodRange` subtracts one day from the next period's Date **before** calling `toISOString().slice(0, 10)`. The terminal dates are therefore `9999-12-31`, not an extended-year string. No runtime rewrite was needed.

New tests verify whole-year and December 9999 inclusive ranges; year 1 and out-of-contract inputs; real month/year selection when navigating from 9998; disabled forward navigation at 9999; and max-bound validation when the maximum changes to `9999-12-30`. All pass on the existing implementation.

## Validation

Runtime: Node 22.22.3 / npm 10.9.8; local Chromium 143. Tested staged files are byte-identical to the files copied into the actual bulud-ng checkout. No live user server was reused.

- `npm run format:check`: PASS.
- Explicit Prettier on all three changed TypeScript specs: PASS.
- `npm run lint`: PASS, zero errors.
- Scoped period-picker unit tests: PASS, 6 tests (including 3 new cases).
- `CHROME_BIN=/usr/bin/google-chrome npm run test`: PASS, 708 tests.
- `npm run build`: PASS, library build.
- `npm run build:base`: PASS, production catalog build.
- `node tools/measure-base.mjs`: PASS, within 300,000-byte initial JS budget.
- `npx playwright test --config playwright.base.config.ts`: PASS, 60 tests, including the 8 previously failing cases.
- `node --test tools/*.test.mjs`: PASS, 26 tests after the documentation-validator correction (24 existing + 2 new).
- Public API diff in this correction: NONE; no runtime source changes.
- Dependency diff in this correction: NONE; manifests and lockfile unchanged.
- `validate:api` against the actual PR base: PASS, all 40 entries, public-symbol inventory, generated declarations and declaration fixtures match. Initial missing-scope failure was reproduced before owner approval; the subsequent documentation gaps were corrected.
- `validate:deps` against the actual PR base: PASS, exact approved scope, normalized lockfile, built manifest and runtime-dependency boundaries validated.

## Owner-approved contract review

The review file records the source head and exact baseline. It was initially pending; the owner explicitly replied “تأیید می‌کنم؛ دامنهٔ دقیق را ثبت کن” on 2026-10-24. Its status is now `owner-approved`, and its unchanged arrays are recorded under the exact baseline in the approval file. It contains 798 API/CSS contract changes and 907 dependency/lockfile contract changes; the counts are exact gate entries, not numbers of new packages or components. It was extracted with an instrumented temporary copy of the validator that captures the arrays before invoking the original approval enforcement. The repository validator and approval logic were not altered.

Scope summary:

- 24 secondary entry points added, plus explicit Angour and Angour base CSS exports.
- No existing entry-point/export removals or CSS custom-property usage removals were reported. Theme and locale types expanded; object-literal consumers of their complete types may need additional fields.
- Root Angular runtime and compiler minimum raised from `^20.3.0` to `^20.3.34`; library Angular peers raised from `^20.0.0` to `^20.3.34`.
- Library CSS `sideEffects` retained intentionally as `["**/*.css"]`; JavaScript remains tree-shakable.
- No new root direct dependency names or library runtime dependency names; library runtime remains tslib. The historical lockfile comparison includes 172 version changes, 90 added package records and 96 removed records, with related metadata changes. These are historical PR changes, not changes in this correction.

The exact scope was registered only after the owner’s explicit approval. Historical approval entries are preserved. The baseline and contract enforcement were not reset or disabled. The original API and dependency commands were then rerun successfully.

The API command exposed two additional issues after accepting the scope: 15 missing standalone inventory sections (the APIs were previously only mentioned in grouped guides), and the documentation parser ignoring lowercase helper names and exports without Bulud in their names. The new helper recognizes exact current exported identifiers, with boundary tests to prevent partial-name matches; the existing namespaced stale-symbol detection remains. The inventory now documents all 40 entry points and their symbols, including root theme/locale additions and the chart additions. This changes release tooling and documentation only, not library runtime behavior or approved API signatures.

## Risks / unresolved issues

Both local contract gates pass with the owner-approved scope. Future API/dependency changes require their own exact review; this is not blanket approval. Remote CI still reflects the pushed commit; these local changes have not been committed or pushed. No GitHub comment or conversation resolution was posted. Public npm publication still requires the owner to supply package identity, license, version and publication authorization as documented in `RELEASING.md`.

## Out of scope

No unrelated design changes, dependency upgrades, automatic approvals, commits, pushes, or publication. Library unit/E2E/build results above are from the preceding identical runtime source; this metadata/tooling follow-up reran both gates, lint, formatting and all tool tests.
