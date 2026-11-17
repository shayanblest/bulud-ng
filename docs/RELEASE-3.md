# Version 3 migration review

The user authorized moving the reusable Angour UI to Bulud, consolidating renamed
feature duplicates, using Angour as the configurable default design system,
converting component styling to Tailwind and upgrading to current stable Angular.
This is a major release because the Angular peer baseline moves from 20 to 22
and the default visual palette/geometry changes for existing Bulud consumers.

The reviewed baseline is `4d54ab092b880d86e0f481df5426fce9c31672a8`.
The exact API/dependency inventories are recorded under that baseline in
`tools/release-approvals.json`. Release validation still rejects any unreviewed
addition or stale inventory entry; no checks are disabled.

Reviewed API groups:

- Existing OTP, carousel, stepper, tabs, period picker, upload and charts own
  the imported Angour presentation modes; unpublished duplicate entry points
  were consolidated into those canonical features.
- New reusable runtime adapters, appearance, language switch, account card,
  access/input behaviors, date range, optional chart engine and tour entries.
  Project APIs, authentication, routing, storage policies and permission
  decisions remain in Angour.
- Theme/configuration inputs support project CSS tokens, typed defaults and
  instance overrides. Angour tokens are now the single default source. Font
  weight and focus geometry remain configurable. Layout widths are fluid and
  constrained responsively; screenshots record measured sizes, not fixed
  component widths.
- Legacy stylesheet-to-Tailwind file moves account for most CSS inventory
  changes. These include both authored and generated styles. Optional CSS
  exports remain explicit; component imports have no global theme side effects.
- Angular framework/compiler/ng-packagr 22.2.6, CLI/build 22.2.7 and TypeScript
  6.0.3 are the necessary toolchain changes. The library runtime dependency
  remains tslib; no chart engine, Bootstrap or translation framework is added.
  Lockfile changes follow the upgraded Angular toolchain.
- Native ID inputs and group prefixes are project-owned and reactive. Existing
  Angour IDs are preserved verbatim; underscore and hyphen formats are both
  supported. Label/ARIA references update together, with no duplicate host ID.
- ng-packagr 22 declaration outputs live in `types/`; package verification checks
  those exact paths, source exports and consumer declaration compilation.

Validation and production performance evidence is retained separately. This
review inventory alone does not authorize treating a failed check as passing.
Publication and installation must use the tested compiled package.

Final user-requested API review: optional native IDs and group prefixes preserve project naming and ARIA references; button appearance adds outline/link using Angour semantic colors; dropdown typography/geometry follows locale and viewport and accepts scoped/global overrides. These additions account for the final signature/token inventory update.

The final demo review connects both foundation theme/direction controls to the page state, uses the exported Angour palette for live swatch labels, and aligns catalogue card spacing and typography. Dropdowns join the expanded trigger and panel with square connecting corners while preserving closed radii. Projected tabs now fall back to semantic surface/subtle colors in dark scopes instead of light literals; existing consumer variables still take precedence. The API inventory explicitly records the two added uses of the existing subtle token.

Configuration token implementations for account card, upload, dropdown adapter and the chart engine live in the configuration-only root entry. Their feature entry points re-export the same token identities and existing fields. Applications can provide callbacks without eagerly importing those component renderers. A tenth packed AOT consumer verifies that configuration-only imports contain none of these selectors.

The demo mounts offscreen catalogue examples when they enter the viewport or when their hash is requested. Stable section shells preserve anchors. The explicit `/#all` opt-in renders every example for inspection and the catalogue browser suite; production Lighthouse measures normal `/#top` navigation with viewport loading. Unique examples remain available.
