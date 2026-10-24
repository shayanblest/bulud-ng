# Performance audit — 2026-10-21

Reported URL: base development server on port 4310, `/shared`. Screenshot shows minify JS/CSS, unused JS/CSS, back/forward cache failure and a 3,227 KiB payload. No actual LCP timing or performance score is visible in the supplied screenshot.

Verified configuration: `base:serve` defaults to development; development build explicitly disables optimization and enables source maps. `base:build` defaults to production, minifies/hashes assets, and currently has a 296,317-byte initial payload. Dev tooling/HMR must be excluded from production performance measurements, not removed from developer workflows.

Audit priorities:

1. Measure the same route with Lighthouse (cold mobile profile) in development and optimized static production, with identical tool version/settings.
2. Supply a dependency-free production preview that supports Brotli/gzip, immutable hashed asset caching, conditional GET, route fallback and HTML revalidation. No HMR/WebSocket or unload hook.
3. Inspect production LCP/unused JS before changing route/component loading; keep the heading/table visible immediately and preserve all controls, validation and theme/locale behavior.
4. Verify browser back/forward behavior, compressed wire bytes, loaded chunk inventory and regressions. Do not infer LCP from bundle size or fabricate a score if a run fails.

No dependency changes/upgrades or alterations to the consumer-owned library API are required. Angour source and existing development preview are preserved.
