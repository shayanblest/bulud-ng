# bulud-ng Theme

## 1. Strategy

The theme uses:

- Tailwind CSS v4 static utility classes
- CSS Custom Properties for runtime values
- typed TypeScript configuration
- light and dark modes
- RTL and LTR support

Dynamic Tailwind class construction is not allowed.

---

## 2. Token Categories

The initial token categories are:

- colors
- typography
- spacing
- sizing
- border radius
- shadows
- focus ring
- z-index
- motion

Only tokens required by implemented components should be added.

---

## 3. Naming Convention

CSS variables use the following format:

--bulud-{category}-{name}

Examples:

css
--bulud-color-primary
--bulud-color-surface
--bulud-space-md
--bulud-radius-md
--bulud-shadow-sm

Component-specific tokens use:

text
--bulud-{component}-{name}

Example:

css
--bulud-button-height
--bulud-button-radius

---

## 4. CSS Custom Properties

Runtime theme values must be represented by CSS Custom Properties.

Example:

css
:root {
  --bulud-color-primary: #2563eb;
  --bulud-color-surface: #ffffff;
  --bulud-color-text: #111827;
  --bulud-radius-md: 0.375rem;
}

Components should consume tokens through static styles or static Tailwind-compatible mappings.

Components must not generate arbitrary Tailwind class names at runtime.

---

## 5. Color Modes

The library supports light and dark modes.

The mode may be controlled by:

- a host class
- a data attribute
- an application-level configuration

The implementation must use one documented strategy consistently.

Example:

css
:root {
  --bulud-color-surface: #ffffff;
  --bulud-color-text: #111827;
}

.dark {
  --bulud-color-surface: #111827;
  --bulud-color-text: #f9fafb;
}

---

## 6. Direction

The library supports:

- `ltr`
- `rtl`

Direction-sensitive styling should prefer CSS logical properties:

- `margin-inline`
- `padding-inline`
- `inset-inline`
- `border-start-start-radius`
- `border-end-end-radius`

Components must not assume left-to-right layout.

---

## 7. Global and Instance Overrides

Global theme configuration is provided through the library provider API:

ts
provideBuludNg({
  theme: {
// global theme configuration
  }
})

Component-level overrides must be local and must not mutate the global configuration.

Precedence:

text
instance override
> component default
> global theme
> library default

---

## 8. Component Tokens

Components may define private tokens for internal layout and state.

Example:

css
.bulud-button {
  --bulud-button-height: var(--bulud-size-md);
  --bulud-button-radius: var(--bulud-radius-md);
}

Component tokens should be exposed publicly only when consumers have a documented use case.

---

## 9. Tailwind Rules

- Use static utility classes.
- Keep class names visible to Tailwind source scanning.
- Use static maps for variants and sizes.
- Do not concatenate arbitrary class names.
- Do not use runtime CSS-in-JS.
- Avoid duplicated utility combinations when a shared component style is more appropriate.

---

## 10. Scope

The theme contract should evolve with implemented components.

Do not define a large token system before a real component requires it.
