# npm readiness assessment

## Summary
Current bulud-ng is usable as a locally packed Angular 20 library. Public publication is not yet cleared. Requested UI changes are present in the actual repository; the npm-audit CI, publication guard and documentation improvements are now applied directly to the actual repository.

## Prior request reconciliation (actual repository)
| Request | Actual implementation |
| --- | --- |
| Angour light/dark + RTL/LTR + locale | projects/bulud-ng/src/lib/theme, i18n; angour.css |
| Checkbox/radio/date and period picker | checkbox, radio, datepicker, period-picker secondary entries |
| Pagination centering/ellipsis/direction | pagination entry; catalog pagination page |
| URL-to-query and general services/pipes | query, utilities, digits, initials, filesize entries |
| Table/filter/expandable details/loading | table, loading-bar, textarea entries |
| Rating, badge, stepper and dropdown | rating, badge, stepper, dropdown entries |
| Validated uploader + image preview | file-upload entry; consumer-supplied transport |
| Line/candle/donut/progress | charts entry |
| Automatic required field stars | field-label entry and forms validators |
| Generic incoming/outgoing chat | chat entry; consumer owns backend |
| Per-feature demo/code/API and menu | projects/base/src/catalog (41 pages), sidebar, toolbar |
| Latest input and rounded search polish | SIDEBAR-POLISH-VALIDATION.md, actual sources and screenshots |

## Completed validation on current actual package
- Full Chrome unit suite: PASS, 688.
- Full base browser suite: PASS, 43, including themes/directions, navigation, form/upload/table/chart/chat behavior.
- Current packed AOT consumers/tree shaking: PASS, five independent fixtures.
- Existing production app/library build, package inventory, format/lint: PASS (see SIDEBAR-POLISH-VALIDATION.md).
- Historical dependencies release gate: FAIL, missing approved scope for baseline f616b5a2da510ed2f40385bcb5514be121cc6b26; intentional CSS sideEffects differs from older false value. Do not revert required CSS preservation or self-approve review metadata.
- Historical API release gate: NOT revalidated in this audit. No claim of a green release pipeline.

## Applied improvements / files
- .github/workflows/ci.yml: base catalog/build/budget and packed-consumer jobs.
- tools/verify-tree-shaking.mjs: all 38 entry declarations with skipLibCheck=false and four CSS exports, plus five AOT fixtures.
- projects/bulud-ng/publish-check.mjs: local publication prerequisites, source/private manifest rejection and license/asset/export checks.
- projects/bulud-ng/package.json, ng-package.json: ship and run the guard on publish; no install/postinstall hooks. ng-packagr emits an intentional keepLifecycleScripts warning for this explicitly limited prepublishOnly hook.
- tools/publish-check.test.mjs: five safety/acceptance fixtures with no publication.
- README and DEMO-AND-PACKAGING: accurate local installation, tested compatibility and deferred public release status; no broken package-relative repository links.
- Actual final library build/local npm pack: PASS.
- Actual final package inventory: PASS, 160 emitted files.
- Actual final format checks: PASS; ESLint: PASS, zero errors.
- Actual final guard unit tests: PASS, five.
- Actual packed-consumer validation: PASS, all 38 JS entry declarations with skipLibCheck=false, all four CSS exports, five Angular AOT production fixtures; unrelated features absent.
- Actual package prepublishOnly hook: PASS, expected exit 1 with exactly the two owner-deferred license requirements; no install/postinstall hooks.
- Applied source hash verification: PASS, all nine source/document/test files match the tested stage.
- CI job definitions updated and YAML formatted locally; GitHub-hosted CI execution was not triggered or claimed.
- No Angular UI runtime/API changes, dependency additions, root package or lockfile changes in this audit.
- Earlier automatic-approval HTTP 404 errors were resolved after the user-authorized retry; no transfer or new test remains blocked.
- Installable artifact: dist/packages/bulud-ng-0.0.1.tgz, 358273 bytes, SHA-256 7c5adf1577f6453eaeac9d9efe06a2e1f6b79b70955fefd6bfb97e1e4f1c373a.

## Remaining public-release requirements
1. Owner choice of license, license file included as ng-package asset, final name/account/scope and npm ownership/version check.
2. Reviewed historical API/dependency contract approvals and green CI.
3. Run the updated CI in the repository before the public release.

## Out of scope
No public npm publication, invented license, business/auth/payment/analytics transfer, backend chat or upload storage, Angular/dependency upgrade, or unsupported compatibility claim. Existing source request of high performance is verified by bounded components/lazy pages/packed consumer checks; no claim of maximum performance across every consuming application.

References: https://angular.dev/tools/libraries/angular-package-format and https://docs.npmjs.com/cli/configuring-npm/package-json/ .
