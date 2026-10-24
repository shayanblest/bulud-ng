# Angour application foundations

Angour's design system is available as an optional Bulud preset. It carries
Angour's navy/gold light/dark palette, semantic colors, spacing, typography
stacks, radii and shadows into every existing Bulud component. It has no
Bootstrap, router, authentication, cookies, backend or application-service dependency.

## Start an application

Import the CSS explicitly in your application's global stylesheet:

```css
@import "bulud-ng/theme.css";
@import "bulud-ng/angour.css";
@import "bulud-ng/angour-base.css"; /* optional application primitives */
```

Activate the preset on the document root or any subtree:

```html
<html lang="fa" dir="rtl" data-bulud-preset="angour" data-theme="light">
  <body class="bulud-app">
    <main class="bulud-panel bulud-stack">
      <!-- your Angular application -->
    </main>
  </body>
</html>
```

Switch `data-theme` between `light` and `dark` in your application. Ancestor
`.dark` and `data-bs-theme="dark"` are also supported. A preset scope with an
explicit `data-theme="light"` stays light inside a dark ancestor. Keep a single
mode selector per scope; conflicting mode attributes on the same element are
undefined. The library does not read cookies, choose browser preferences or
persist settings. Setting `lang` and `dir` remains the application's responsibility.

Omit `provideBuludTheme` when using only the CSS preset. A custom global theme
provider can override root preset tokens according to the existing provider's
light/dark scoping rules. Prefer scoped CSS variables for dynamic customization
that must apply identically in both modes.

## Typed presets and overrides

The root `bulud-ng` entry point exports:

- `BULUD_ANGOUR_TOKENS`: readonly foundations and light/dark semantic palettes.
- `BULUD_ANGOUR_LIGHT_THEME`: light `BuludThemeConfig` preset.
- `BULUD_ANGOUR_DARK_THEME`: dark `BuludThemeConfig` preset.

A static light application can use the existing provider instead of the CSS preset:

```ts
import { BULUD_ANGOUR_LIGHT_THEME, provideBuludTheme } from "bulud-ng";

export const appConfig = {
  providers: [
    provideBuludTheme({
      ...BULUD_ANGOUR_LIGHT_THEME,
      colors: { ...BULUD_ANGOUR_LIGHT_THEME.colors, primary: "#15375b" },
    }),
  ],
};
```

For a custom dynamic palette use the typed constants with
`createBuludThemeVariables` to obtain the full variable map for either mode.
The existing theme provider is initialization-only; it is not a reactive theme
switcher. `angour.css` supplies the complete switching rules for the preset.

CSS precedence remains instance custom properties, then component/scoped
custom properties, then global configuration, then library defaults:

```html
<section data-bulud-preset="angour" data-theme="dark" style="--bulud-button-background: #15375b">
  <bulud-button>Scoped color</bulud-button>
  <bulud-button style="--bulud-button-background: #7c3aed"> Instance color </bulud-button>
</section>
```

## Foundations and application primitives

The preset supplies `--bulud-spacing-0` through `--bulud-spacing-8` (0, 4, 8,
12, 16, 24, 32, 40, 48px), control radii, font sizes, shadows and semantic
`--bulud-color-*` variables. `--bulud-body-bg` is `#F3F6F9` in light and
`#000000` in dark; component surfaces are `#FFFFFF` and `#1E1E26`. Primary
is `#0C2340` in light and `#FDB515` in dark.

The optional base stylesheet supplies these scoped, opt-in classes:

| Class                                    | Purpose                                                          |
| ---------------------------------------- | ---------------------------------------------------------------- |
| `.bulud-app`                             | Application surface, language-aware font, box sizing and padding |
| `.bulud-panel`                           | Bordered surface with Angour radius and shadow                   |
| `.bulud-stack`, `.bulud-row`             | Logical, wrapping layout with shared spacing                     |
| `.bulud-muted`                           | Secondary text                                                   |
| `.bulud-input`                           | Native input surface, focus, invalid and disabled presentation   |
| `.bulud-table-container`, `.bulud-table` | Scrollable table with logical alignment                          |

Font stacks reference Montserrat, Peyda and Ravi with system fallbacks. Font
files are not redistributed or loaded remotely; supply licensed font files in
your application or override `--bulud-font-sans`, `--bulud-font-persian`, and
`--bulud-font-arabic`. The preset never sets CSS direction or loads Bootstrap.

These classes supply presentation only. Associate every input with a label;
set `aria-invalid` and provide error descriptions when validation fails. Use
native table headers/captions. Existing Bulud keyboard, form and focus contracts
remain applicable. Native buttons use Enter/Space; tabs, dropdowns, accordions,
and dialogs keep their documented navigation/focus behavior. Provide names
for dialog, dropdown, pagination and tabs when visible content is insufficient.

## Preview and maintenance

`npm run demo` → `/#angour` previews all component surfaces, both modes, RTL/LTR,
disabled/loading buttons, application inputs/tables and instance overrides.

The CSS is generated from the typed presets. After changing tokens, run:

```bash
node tools/generate-angour-theme.mjs
npm run e2e -- e2e/angour.spec.ts
```

The generator uses the esbuild already installed by Angular's build toolchain;
no runtime dependency is added. Commit the generated stylesheet alongside the
typed source. Default Bulud styling remains available by omitting the Angour import.
