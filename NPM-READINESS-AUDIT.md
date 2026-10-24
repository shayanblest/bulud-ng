# npm readiness audit

Existing feature audits remain applicable; no new UI component is required. Prior requests are implemented in actual projects/bulud-ng and projects/base: Angour light/dark and locale/RTL; checkbox/radio; Persian/Gregorian datepicker; pagination/ellipsis; field-label/validators; shared query/table/filter; uploads; stepper; line/candle/donut/progress; chat; utility pipes/services; lazy per-feature source/API pages; menu/theme switch and recent input/search polish.

Gaps found before implementation:
1. CI validates the legacy demo but omits the current base catalog, production budget and packed consumer/tree-shaking check. Add dedicated jobs without changing the existing historical API/dependency gates.
2. Public license/account/name remain owner-deferred. Add a self-contained publish guard that refuses source/uncompiled packages and a missing/UNLICENSED license. Do not invent a license or publish. npm pack must remain usable for local testing.
3. Consumer smoke uses only five AOT fixtures. Extend the existing offline packed-consumer check to compile declarations for every exported JS entry with skipLibCheck=false and resolve explicit CSS exports.
4. Packaged README starts with an unconditional public installation command although the package is not published; make current local installation and publication status explicit. Update the stale three-consumer count.

No UI refactor, dependency upgrade or new public Angular API is necessary. Existing root API and dependency approval gates must be reported honestly, not bypassed or self-approved. Angular 20.3 is the tested toolchain; no claim of Angular 21+ support is made.

5. Packaged README links to repository-only ../../docs paths. Replace those broken package-relative links with the included SHARED.md guide or explicit source-workspace references.
