# Performance: measure the production build

Port **4310** is the Angular development preview. It deliberately includes unminified framework code, development diagnostics and an HMR WebSocket. Use **4314** for Lighthouse/LCP checks.

```sh
# One command: optimized build, then compressed static preview.
node tools/serve-base.mjs --build
```

Open `http://127.0.0.1:4314/shared?filter=status:eq(%22draft%22)`. `--port 4315` selects another port. To serve an already-built app, omit `--build`. `--dir /absolute/path/to/browser` selects another build directory. The default build directory is `dist/base/browser`.

The preview binds only to 127.0.0.1. It takes a snapshot of the build at startup: after changing app code, restart it with `--build`. Development/HMR remains on 4310. This Node tool is a local production preview, not a deployment platform.

## What changed

- The existing Angular production optimization is now served through a reproducible preview rather than evaluated through ng serve's development runtime.
- Text assets use Brotli or gzip according to the browser's Accept-Encoding, including q=0 handling. Compression is prepared before the server accepts requests.
- Hashed JS/CSS have a one-year immutable cache policy. HTML uses no-cache revalidation so a new deployment can provide its new hashed asset URLs. Representation-specific ETags allow 304 responses.
- Client-side deep links receive index.html; missing assets and JSON/API-like paths still return 404. Only GET/HEAD are supported, and paths cannot escape the build folder.
- There is no development WebSocket or unload hook, so back/forward cache can work in production.
- All existing routes remain lazy as before. No design tokens, components or form behavior were removed to manufacture a better score. No project dependency or lockfile changed.

## Reproduce verification

```sh
node --test tools/serve-base.test.mjs
npm run ng -- build base
node tools/measure-base.mjs
npx playwright test --config playwright.performance.config.ts
```

The performance browser configuration enables back/forward cache (Playwright otherwise disables it by default), verifies an actual persisted pageshow on cross-document Back, and checks deep links, compression, ETags, immutable asset caching, theme/language and mobile layout.

For Lighthouse, use Chrome DevTools on **4314**, or use an external Lighthouse CLI. The initial validation used Lighthouse **13.5.0**, performance category, default simulated mobile settings, fresh browser storage, the same query route and Chrome binary for both runs. The CLI tool was downloaded only into a temporary npm cache; it is not a project dependency.

See PERFORMANCE-VALIDATION.md for measured scores and timing, raw report locations and precise validation results. Production measurements depend on the machine/network/profile; this is not a promise of the same score in every deployment. For a hosted deployment, configure equivalent compression and caching on its actual web server/CDN and measure there too.
