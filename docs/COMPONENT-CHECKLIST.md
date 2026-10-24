# Component and feature checklist

Use this checklist for new work and the §7 audit. Mark items not applicable with
the reason; do not silently omit them.

## Discovery and API

- [ ] Existing implementation, conventions, tests, demo, and docs inspected.
- [ ] Public symbols are exported only through the intended `public-api.ts`.
- [ ] Inputs, outputs, models, and configuration are strictly typed.
- [ ] Configuration precedence is tested: instance → component → global → library.
- [ ] No unapproved dependency or accidental public API change is introduced.

## Angular behavior

- [ ] Standalone API and `OnPush` are used.
- [ ] State is signal-based and reactive updates work in zoneless mode.
- [ ] No `any`, `NgZone.run`, manual `detectChanges()`, or timing workaround is needed.
- [ ] Browser-only APIs are guarded and cleaned up on destroy.
- [ ] Forms controls implement `ControlValueAccessor` and `Validator` where applicable.

## Accessibility and interaction

- [ ] Semantic native HTML is used wherever possible.
- [ ] Accessible name, role, value, state, description, and error relationships are defined.
- [ ] Focus-visible styling and focus entry, movement, restoration, and exit are tested.
- [ ] Keyboard behavior follows the applicable WAI-ARIA APG pattern.
- [ ] Disabled, loading, empty, invalid, and unavailable states are announced or represented correctly.
- [ ] Consumer-side ARIA responsibilities are documented.

## Theme, locale, and layout

- [ ] Themeable values use CSS custom properties rather than hardcoded component values.
- [ ] Root/scope variables, typed global config, and per-instance overrides work together.
- [ ] Explicit light and dark themes are covered.
- [ ] Ancestor `dir`, RTL logical properties, locale, and localized accessible labels are covered where applicable.
- [ ] Tailwind classes are static and variant maps are typed.

## Coverage and release

- [ ] Unit tests cover behavior, edge cases, precedence, interaction, accessibility, and reactivity.
- [ ] Demo reaches every applicable state: default, variants, sizes, disabled, loading, error/invalid, focus-visible, hover, empty, RTL, light, and dark.
- [ ] Playwright covers real keyboard/pointer behavior and computed-style theme overrides when required.
- [ ] Documentation includes purpose, typed API, example, states, keyboard guidance, and consumer ARIA notes.
- [ ] `format:check`, lint, tests, build, and required E2E checks pass.
- [ ] Public API and dependency diffs are explicitly reviewed.
