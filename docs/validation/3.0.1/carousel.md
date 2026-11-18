# Carousel render phases — 3.0.1 candidate

Native scroll carousels now measure their viewport and computed direction in Angular's early-read phase before applying scroll positions in the write phase. Multiple instances no longer alternate layout reads and writes. ResizeObserver schedules the phased update; dragging uses pointer deltas without reading offsetLeft on every movement. Asynchronously inserted slides receive the requested default and removals clamp the current slide.

## Files changed

- carousel/carousel.ts: phased layout, resize scheduling and drag coordinates; disabled goToSlide calls do not move the viewport.
- carousel/scroll-carousel-scroll-carousel.spec.ts: multiple-instance read/write ordering and delayed projection/removal regressions.
- package.json: patch version 3.0.1; no dependency change.

## Validation

- Format: pass (npm run format:check; changed TypeScript formatted with Prettier).
- Lint: pass, no errors.
- Chromium unit tests: pass, 862 tests; scoped carousel tests: 9 pass.
- Production package build: pass, no new warnings.
- Browser: native scrolling/dots, keyboard, mobile resize and live RTL pass on isolated port 4317. The initial run mistakenly reused Trader on port 4200; it is excluded from validation.
- Public API: 53 entry points unchanged, using BULUD_BASE_REF=225235ea17f479c184d463cb8c67c65828a6f255.
- Dependencies: pass against that same released baseline; no package or lockfile dependency change.
- Tree shaking: 10 packed AOT fixtures pass; unrelated renderers absent.
- Package output: 227 derived files validated.
- Production demo Lighthouse: mobile 99 (LCP 0.6s), desktop 100 (LCP 0.2s). See performance.json; complete lab reports are under dist/validation/3.0.1.

## Limits

This confirms component behavior and prevents interleaved reads/writes in the tested render pass. It does not claim all layout work is removed or substitute the demo score for authenticated Trader performance. The previously recorded demo component CSS budget warnings remain; no budget was raised. npm authentication expired; publication and official Angour installation await restored login.

Reference: https://angular.dev/api/core/afterRenderEffect
