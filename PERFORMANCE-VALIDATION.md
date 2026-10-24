# Production performance validation — 2026-10-21

## Summary

The reported 3 MB payload was reproduced on the Angular development server. Its runtime is intentionally unminified and holds an HMR WebSocket, which Lighthouse identified as the BFCache blocker. An optimized compressed static preview is now available in the project on port 4314; development remains on 4310. No UI, library behavior or design was removed.

## Measured result

Same route `/shared?filter=status:eq(%22draft%22)`, default Persian/light preferences, fresh browser storage, Lighthouse 13.5.0 performance category, simulated mobile Moto G Power/Slow 4G, Chrome 143. Values below are from actual JSON reports, not estimates based on bundle size.

| Metric | Development :4310 | Final production :4314 |
| --- | ---: | ---: |
| Performance score | 47 | 96 |
| LCP | 19,936 ms | 2,038 ms |
| FCP | 9,444 ms | 1,801 ms |
| Total blocking time | 393 ms | 163.5 ms |
| CLS | 0 | 0 |
| Transferred payload | 3,304,579 bytes | 122,166 bytes |
| BFCache audit | Fail: HMR WebSocket | Pass |

Payload reduced by approximately 96.3%. A preliminary production run scored 97 with LCP 2,121 ms; the final destination run scored 96 with LCP 2,038 ms. This 96–97 range reflects run variation; 100 is not claimed.

Final Lighthouse minify-JS, minify-CSS, unused-JS, unused-CSS, total-byte-weight and BFCache audit scores are all 1 (pass). Audit pass means the warning threshold is satisfied, not that every byte of code/CSS is used. Four main-thread tasks remain informational; final total blocking time is approximately 164 ms.

## Files changed

- `tools/serve-base.mjs` — optimized-build command, loopback static server, precomputed Brotli/gzip, negotiated encodings, immutable hashed assets, revalidated HTML, variant ETags/304 and safe SPA fallback.
- `tools/serve-base.test.mjs` — six HTTP integration cases for compression, q=0, cache validators, HEAD, deep routes, missing assets and path boundaries.
- `playwright.performance.config.ts`, `e2e-performance/production.spec.ts` — isolated production browser checks on port 4316, with BFCache enabled explicitly in the test browser.
- `eslint.config.mjs` — include the new performance spec/config in existing lint rules.
- `PERFORMANCE-AUDIT.md`, `PERFORMANCE.md`, `BASE.md` — audit, repeatable production/Lighthouse workflow and preview distinction.
- `docs/PERFORMANCE-RESULTS.json` — compact captured measurement data.

## Validation

- `npm run format:check`: PASS.
- Prettier on changed files: PASS.
- `npm run lint`: PASS, zero errors; new browser spec/config included.
- `node --test tools/serve-base.test.mjs`: PASS, 6/6.
- `npx playwright test --config playwright.performance.config.ts`: PASS, 2/2 in destination. Verifies compressed production documents/assets, cache policy/304, absence of HMR sockets, actual persisted pageshow on Back, deep-link query rendering, theme/locale changes and mobile overflow.
- `npm run build`: PASS, destination production library.
- `node tools/serve-base.mjs --build --port 4314`: PASS, destination production app and preview running.
- Production build initial budget: 296,317 bytes, unchanged and below 300,000. Wire compression accounts for the smaller Lighthouse transfer total; the app's raw source bundle was not claimed to shrink.
- Lighthouse final run: PASS, performance 96, LCP 2.038 s, no runtime errors or run warnings.
- `git diff --check`: PASS.
- Public API/configuration contract: unchanged for the library.
- Dependencies: root package.json/package-lock.json and library dependencies unchanged. Lighthouse CLI is only in `/tmp/bulud-perf-npm-cache`, not a project dependency.
- UI proof: real Lighthouse report inspected in the in-app browser, screenshot `/tmp/bulud-lighthouse-96.jpg`.

## Evidence

- Compact results: `docs/PERFORMANCE-RESULTS.json`.
- Full generated reports: `.angular/performance-reports/2026-10-21/development-before.report.json`, `production.report.json`, `production.report.html` (generated, not committed).
- Report preview: http://127.0.0.1:4317/.
- App preview: http://127.0.0.1:4314/shared.

## Risks / unresolved issues

Measurements are local lab results; hosted latency, device speed, server caching and network conditions can change them. Configure equivalent compression/cache policies at deployment and measure that URL. The preview caches a snapshot of a build at startup; restart with `--build` after changes. HTML is revalidated and hashed URLs change with new builds.

## Out of scope

No fake score UI, removal of functional components, application prerender/SSR, server deployment or production dependency was added. Existing development warnings remain expected on port 4310. Angular component unit tests were not rerun because their sources and public API did not change; this task's new server logic and production delivery have dedicated tests above.
