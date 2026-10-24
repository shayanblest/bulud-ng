# Angour UI polish — applied to bulud-ng

## Summary
Applied the Angour sidebar and thin rounded dropdown-search border directly to /home/fatemeh-shirazi/Desktop/bulud-ng. Added the existing bulud-input primitive to catalog pagination, field-label, query, validator and component-search fields and corresponding sample code, including the form example. Invalid pagination counts normalize visibly to one and clamp the selected page.

## Files changed
- projects/base/src/sidebar.ts, sidebar.css: separate navigation/disclosure controls, outline icons, readable links, logical submenu connector, exact fragment active state and route-reactive expansion.
- projects/base/src/styles.css: remove conflicting previous sidebar rules.
- projects/bulud-ng/dropdown/bulud-dropdown/bulud-dropdown.scss: 1px token-based rounded search wrapper, borderless inner input.
- projects/base/src/catalog/{pagination,field-label,query,validators,index,forms}.ts: use the existing Angour input primitive in demos and sample code; normalize numeric input.
- e2e-base/sidebar-polish.spec.ts: seven interaction/style/navigation/input tests.

## Validation
- format:check: PASS. Changed-source Prettier: PASS.
- lint: PASS, zero errors.
- scoped Chrome unit tests: PASS, 31 dropdown tests (correct secondary-entry include).
- browser tests: PASS, 18 catalog/upload/navigation cases in staging plus seven final cases in the actual project (20 distinct cases total). Both themes and directions covered, including enabled section links, pointer/keyboard disclosure, search selection, input style and invalid count normalization.
- production app build: PASS from actual project.
- production library build and local npm pack: PASS from actual project.
- package validation: PASS, 159 emitted files checked.
- initial assets: 298007 bytes raw, under unchanged 300000-byte cap.
- visual QA: PASS on actual development server 4310; /tmp/bulud-pagination-fixed.jpg and /tmp/bulud-dropdown-fixed.jpg.
- source verification: staged changes match actual target files after guarded transfer.
- public API / root package / lockfile / dependencies: unchanged by this task.

## Risks / unresolved issues
Existing outdated baseline-browser-mapping notice remains; no dependency upgrade requested. Existing historical release approval gates and npm publication decisions remain unchanged. No fresh Lighthouse run was requested or claimed for this visual fix.

## Out of scope
No new components or dependency additions. No public npm publication.
