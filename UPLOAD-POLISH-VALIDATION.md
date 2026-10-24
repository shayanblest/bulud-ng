# Angour upload and design revision — 2026-10-21

## Summary

Restored the former boxed Angour pagination, while preserving SVG centering and RTL fixes. Updated stepper circles/checks/dotted connectors and rounded borderless dropdown search. Removed the confirmed default border from Show notification. Added source-like file/image selection and a reusable, explicit multipart uploader with real progress, cancel/retry, validation and resource cleanup.

## Files changed

- `projects/bulud-ng/src/lib/theme/angour-theme.ts`, generated `angour.css`, `table/table.scss`: previous pagination preset/alignment.
- `projects/bulud-ng/stepper/`: 40px circles, primary current/completed states, completed SVG check and dotted connectors; existing model, semantics, projection and keyboard retained.
- `projects/bulud-ng/dropdown/bulud-dropdown/bulud-dropdown.scss`: rounded panel top and inset borderless search; color-token precedence preserved even though border width is zero.
- `projects/base/src/styles.css`: borderless primary action buttons, with explicit keyboard focus indication.
- `projects/bulud-ng/file-upload/`: native accessible picker/drop zone, raster previews (at most 8 URLs), individual removal, size/count/type/total/empty-file validation, optional user-triggered XHR upload, actual progress, success/error/cancel/retry. URL callbacks/subscriptions clean up. Explicit border resets prevent application `.surface` styles adding an unwanted outer frame.
- `tools/serve-base.mjs`, tests and base proxy: optional local multipart receiver with 3 MiB request cap, enabled only by `--demo-uploads`; consumes/counts bytes and discards data. Default preview remains read-only. No business/storage API was copied.
- `projects/base/src/shared.*`, `SHARED.md`, packaged guide and public API inventory: reachable demonstrations and typed usage contracts.
- Feature unit tests, `e2e-base/upload-polish.spec.ts`, `e2e-upload/upload.spec.ts` and `playwright.upload.config.ts`: unit, mocked failure/cancel/retry, theme/direction and real multipart round-trip coverage.

## Validation

- `npm run format:check`: PASS.
- `npm run lint`: PASS, zero errors.
- Full library unit suite: **654 passed**.
- Full base E2E: **29 passed**.
- Final upload/design E2E after final frame/success styling: **6 passed**, covering upload, retry, cancel and all four theme/direction combinations.
- Targeted original Angour/dropdown/pagination regression suite: **21 passed**.
- `node --test tools/serve-base.test.mjs`: **7 passed**.
- `npx playwright test --config=playwright.upload.config.ts`: **1 passed**, real multipart upload to a separately started local receiver, no request interception; server returned counted bytes and stored=false, UI reached success/100%, clear/reset worked.
- Library and base production builds: PASS, no new compiler or budget warnings.
- Initial base assets: **298,787 bytes**, **88,577 bytes gzip**, within existing 300,000-byte budget; transport stays in the lazy shared feature. No new Lighthouse score is claimed.
- Package validation: PASS, **139 files** derived from exports/assets/metadata.
- API review: intentional additions in `bulud-ng/file-upload`: constraints type/pure validator, upload options/events/error/service and lazy request factory. Root export list unchanged. No dependency manifest or lockfile changes.

## Risks / unresolved issues

No known blocking defect in scope. Client metadata validation and a successful image preview do not certify uploaded content; actual authorization/content validation/storage are server-owned. The sample endpoint intentionally discards files. Production consumers must set their own uploadOptions URL and any authentication headers/credentials; no upload starts without explicit user action. Response T is a caller assertion over the JSON response, not runtime schema validation.

## Out of scope

No third-party upload dependency, clipboard permissions, automatic resends, automatic image resizing, cloud storage/account setup or external upload destination. Existing application/business services and unrelated controls were preserved.
