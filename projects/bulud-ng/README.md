# Bulud NG

Reusable, accessible Angular UI building blocks with standalone APIs and
tree-shakable feature entry points.

## Installation

```bash
npm install bulud-ng
```

Angular packages are peer dependencies. Install a compatible Angular 20
version in the consuming application.

Tailwind CSS 4 is optional. Bulud components work without Tailwind.

## Public API and entry points

Import shared theme and locale APIs from `bulud-ng`, and each UI feature from
its documented secondary entry point:

| Package path               | Feature                                              |
| -------------------------- | ---------------------------------------------------- |
| `bulud-ng`                 | Theme and locale providers, types, and token helpers |
| `bulud-ng/button`          | `BuludButton`                                        |
| `bulud-ng/badge`           | `BuludBadge`                                         |
| `bulud-ng/dropdown`        | `BuludDropdown`                                      |
| `bulud-ng/resize-observer` | `BuludResizeObserver` and `BuludElementSize`         |

Do not import from library source paths or component implementation files. See
the repository's [`docs/PUBLIC-API.md`](../../docs/PUBLIC-API.md) for the
complete export contract.

## Application theme configuration

Create a consumer-owned `src/bulud.config.ts`:

```ts
import { defineBuludTheme } from "bulud-ng";

export const buludTheme = defineBuludTheme({
  colors: {
    primary: "#7c3aed",
    primaryHover: "#6d28d9",
    primaryActive: "#5b21b6",
    focus: "#c4b5fd",
  },
  shape: {
    controlRadius: "0.75rem",
  },
  button: {
    fontWeight: "700",
    medium: {
      height: "2.75rem",
      paddingInline: "1.25rem",
    },
  },
});
```

Import the optional default light/dark CSS explicitly in the application's
global stylesheet. Dark mode follows an ancestor `.dark` class or
`data-theme="dark"` attribute:

```css
@import "bulud-ng/theme.css";
```

Register that configuration once in the application configuration:

```ts
import { ApplicationConfig } from "@angular/core";
import { provideBuludTheme } from "bulud-ng";

import { buludTheme } from "./bulud.config";

export const appConfig: ApplicationConfig = {
  providers: [provideBuludTheme(buludTheme)],
};
```

The provider resolves omitted values against `BULUD_DEFAULT_THEME` and writes
the resulting `--bulud-*` custom properties to the document root. Components
therefore inherit one application-wide theme without per-component providers.
Theme configuration supports `colors`, `shape`, `button`, `dropdown`, and
`badge` tokens. The precedence is instance custom property, component token,
global provider configuration, then the library default.

## Tailwind CSS integration

In the consumer application's global CSS, import the Bulud Tailwind bridge
after Tailwind:

```css
@import "tailwindcss";
@import "bulud-ng/tailwind.css";
```

The bridge exposes Bulud tokens as Tailwind utilities:

```html
<section class="rounded-bulud-control border border-bulud-border bg-bulud-surface p-6 text-bulud-on-surface">
  <h2 class="text-bulud-primary">Account</h2>

  <bulud-button class="mt-4 w-full md:w-auto">Save</bulud-button>
</section>
```

Available token-driven utility names include:

- `bg-bulud-primary`, `text-bulud-on-primary`, and primary state colors;
- `bg-bulud-surface`, `text-bulud-on-surface`, and `border-bulud-border`;
- `bg-bulud-danger` and `text-bulud-on-danger`;
- `ring-bulud-focus`;
- `rounded-bulud-control`;
- `font-bulud-button`;
- `h-bulud-control-sm`, `h-bulud-control-md`, and
  `h-bulud-control-lg`.

Tailwind remains a build-time, optional peer. Bulud's Angular runtime does not
import or execute Tailwind, and Bulud component templates do not require the
consumer to scan library files for utility classes.

## Dropdown

Import `BuludDropdown` from its own secondary entry point:

```ts
import { Component } from "@angular/core";
import { BuludDropdown } from "bulud-ng/dropdown";

interface Framework {
  readonly id: string;
  readonly label: string;
}

@Component({
  imports: [BuludDropdown],
  template: `
    <bulud-dropdown aria-label="Choose a framework" [options]="frameworks" [optionLabel]="label" [(value)]="framework">
      <ng-template #optionTemplate let-option let-selected="selected">
        <span>{{ option.label }}</span>
        @if (selected) {
          <span aria-hidden="true">✓</span>
        }
      </ng-template>
    </bulud-dropdown>
  `,
})
export class FrameworkPicker {
  readonly frameworks: readonly Framework[] = [
    { id: "angular", label: "Angular" },
    { id: "react", label: "React" },
  ];
  framework: Framework | null = null;
  readonly label = (option: Framework): string => option.label;
}
```

`BuludDropdown` supports single and multiple selection, searchable filtering,
loading and empty states, clearable values, custom comparison functions, and
projected `#optionTemplate`/`#selectedTemplate` templates. In multiple mode,
bind `[(value)]` to a readonly array:

```html
<bulud-dropdown multiple [options]="teamMembers" [optionLabel]="memberLabel" [(value)]="selectedMembers" />
```

When text inputs are omitted, the dropdown uses the injected locale. Configure
English or Persian defaults with `provideBuludLocale`; explicit instance inputs
such as `placeholder`, `loadingText`, `clearLabel`, and `searchLabel` take
precedence. The provider also applies `lang` and `dir` to the document; the
component follows the ancestor direction and does not switch it.

```ts
import { provideBuludLocale } from "bulud-ng";

export const appConfig = {
  providers: [provideBuludLocale({ language: "fa" })],
};
```

The trigger needs a consumer-provided `aria-label` when its visible content is
not an adequate accessible name. Search and clear actions receive localized
accessible labels automatically, with `searchLabel` and `clearLabel` available
for one-off overrides.

The trigger follows the combobox/listbox keyboard pattern: `ArrowDown` and
`ArrowUp` open and move the active option, `Home` and `End` jump to the first
and last option, `Enter` or `Space` selects, and `Escape` closes and restores
focus to the trigger. Pointer interaction outside the dropdown also closes an
open panel. Consumers should provide an accurate `aria-label` when the
projected trigger content is not sufficient.

For Angular Forms, bind the dropdown with `formControl`/`formControlName` or
`[(ngModel)]`. Single-select controls use the selected option value and
multiple-select controls use a readonly array. The `required` input adds the
standard `required` validation error, propagates disabled state from the form,
emits changes after user selection/clearing, and marks the control touched when
focus leaves the dropdown.

### Dropdown inputs

| Input               | Type                             | Default          | Description                                      |
| ------------------- | -------------------------------- | ---------------- | ------------------------------------------------ |
| `options`           | `readonly T[]`                   | `[]`             | Options rendered in the listbox                  |
| `value`             | `T \| readonly T[] \| null`      | `null`           | Selected value; use an array with `multiple`     |
| `multiple`          | `boolean`                        | `false`          | Keeps the panel open and toggles multiple values |
| `searchable`        | `boolean`                        | `true`           | Shows the search field                           |
| `clearable`         | `boolean`                        | `true`           | Shows the clear action for a selected value      |
| `disabled`          | `boolean`                        | `false`          | Prevents opening and interaction                 |
| `loading`           | `boolean`                        | `false`          | Shows a loading status instead of options        |
| `required`          | `boolean`                        | `false`          | Enables the standard Forms `required` validator  |
| `placeholder`       | `string \| undefined`            | locale default   | Empty-selection trigger text                     |
| `searchPlaceholder` | `string \| undefined`            | locale default   | Search input placeholder                         |
| `noResultsText`     | `string \| undefined`            | locale default   | Message for a filtered empty result              |
| `loadingText`       | `string \| undefined`            | locale default   | Loading-state message                            |
| `emptyText`         | `string \| undefined`            | locale default   | Message for an empty option collection           |
| `aria-label`        | `string \| null`                 | `null`           | Accessible name for the combobox trigger         |
| `optionLabel`       | `(option: T) => string`          | `String(option)` | Visible and searchable option text               |
| `compareWith`       | `(left: T, right: T) => boolean` | `Object.is`      | Equality function for selected values            |

`clearLabel` and `searchLabel` override the localized accessible names for the
clear action and search field. The component exposes `valueChange` through its
model binding; Angular Forms users should prefer `formControl`, `formControlName`,
or `ngModel` when participating in form state.

## Resize observer

Import `BuludResizeObserver` from its secondary entry point to observe an
element's content-box size:

```ts
import { Component } from "@angular/core";
import { BuludResizeObserver, BuludElementSize } from "bulud-ng/resize-observer";

@Component({
  imports: [BuludResizeObserver],
  template: ` <section buludResizeObserver (sizeChange)="size = $event">{{ size.width }} × {{ size.height }}px</section> `,
})
export class ResizablePanel {
  size: BuludElementSize = { width: 0, height: 0 };
}
```

The `sizeChange` output emits typed CSS-pixel `width` and `height` values,
including the browser's initial asynchronous notification. Identical
dimensions are suppressed. Set `[enabled]="false"` to pause observation; the
default is `true`. There is no global configuration or theme state for this
directive, so its `enabled` input is the only configuration and takes direct
instance precedence. The directive does not add semantics or ARIA; consumers
must provide the appropriate native element, accessible name, and keyboard
behavior when observing an interactive element.

### Dropdown accessibility

The trigger is a `role="combobox"` controlling a `role="listbox"`. Its active
option is exposed through `aria-activedescendant`; the component supplies stable
IDs and `aria-selected` state. Consumers must provide `aria-label` when the
visible trigger content is not an adequate accessible name. Keyboard behavior
is `ArrowUp`/`ArrowDown` to open and move, `Home`/`End` to jump, `Enter` or
`Space` to select, and `Escape` to close and restore focus.

## Badge

Import the standalone component from its secondary entry point:

```ts
import { BuludBadge } from "bulud-ng/badge";
```

`BuludBadge` renders projected content with optional status dot and dismiss
action. Its `dismissed` output emits after the dismiss button is activated.

| Input/output   | Type                                                           | Default          | Description                                |
| -------------- | -------------------------------------------------------------- | ---------------- | ------------------------------------------ |
| `variant`      | `'neutral' \| 'primary' \| 'success' \| 'warning' \| 'danger'` | `'neutral'`      | Visual treatment                           |
| `size`         | `'small' \| 'medium' \| 'large'`                               | `'medium'`       | Badge size                                 |
| `dot`          | `boolean`                                                      | `false`          | Shows a decorative status dot              |
| `dismissible`  | `boolean`                                                      | `false`          | Shows a keyboard-accessible dismiss button |
| `dismissLabel` | `string`                                                       | `'Remove badge'` | Accessible name for dismiss                |
| `dismissed`    | `Output<void>`                                                 | —                | Emits when dismissal is activated          |

When `dismissible` is enabled, provide a specific `dismissLabel` if the badge
context requires a more descriptive action name. The dot is decorative and is
hidden from assistive technology.

## Locale API

`provideBuludLocale` supplies typed English or Persian Dropdown defaults through
`BULUD_LOCALE`. Instance text inputs override provider values. The provider also
sets the document `lang` and `dir`; components follow ancestor direction and do
not own the application language switcher.

```ts
import { provideBuludLocale } from "bulud-ng";

export const appConfig = {
  providers: [
    provideBuludLocale({
      language: "fa",
      dropdown: { clearLabel: "حذف انتخاب" },
    }),
  ],
};
```

## Theme API

`defineBuludTheme` provides type inference for consumer configuration and
`provideBuludTheme` registers the resolved theme. `BULUD_THEME` exposes the
fully resolved typed value for advanced integrations. Theme values resolve in
this order: per-instance CSS custom property, component token, global provider
configuration, then library default. Import `bulud-ng/theme.css` explicitly to
ship the default light and dark variable sets.

All public theme interfaces (`BuludColorTheme`, `BuludShapeTheme`,
`BuludButtonTheme`, `BuludDropdownTheme`, `BuludBadgeTheme`, `BuludTheme`, and
`BuludThemeConfig`) are exported from the root entry point.

## Button

Import the standalone component from its public secondary entry point:

```ts
import { Component } from "@angular/core";
import { BuludButton } from "bulud-ng/button";

@Component({
  selector: "app-save-action",
  imports: [BuludButton],
  template: ` <bulud-button variant="primary" [loading]="saving" loadingLabel="Saving changes" (click)="save()"> Save </bulud-button> `,
})
export class SaveAction {
  saving = false;

  save(): void {
    // Persist changes.
  }
}
```

`BuludButton` renders a native `<button>`, so standard keyboard activation and
click behavior are preserved.

### Inputs

| Input          | Type                                              | Default     | Description                                      |
| -------------- | ------------------------------------------------- | ----------- | ------------------------------------------------ |
| `type`         | `'button' \| 'submit' \| 'reset'`                 | `'button'`  | Native button type                               |
| `variant`      | `'primary' \| 'secondary' \| 'danger' \| 'ghost'` | `'primary'` | Visual treatment                                 |
| `size`         | `'small' \| 'medium' \| 'large'`                  | `'medium'`  | Control size                                     |
| `disabled`     | `boolean`                                         | `false`     | Prevents interaction                             |
| `loading`      | `boolean`                                         | `false`     | Shows progress and prevents repeated interaction |
| `loadingLabel` | `string`                                          | `'Loading'` | Assistive text for the loading state             |
| `fullWidth`    | `boolean`                                         | `false`     | Fills the available inline size                  |
| `aria-label`   | `string \| null`                                  | `null`      | Overrides projected text as the accessible name  |

The component uses the native bubbling `click` event rather than a duplicate
custom output.

### Local button overrides

Application theme configuration is the preferred way to customize all
components. For a one-off button, override its component-level properties:

```css
bulud-button {
  --bulud-button-background: #4f46e5;
  --bulud-button-background-hover: #4338ca;
  --bulud-button-background-active: #3730a3;
  --bulud-button-foreground: #ffffff;
  --bulud-button-radius: 0.625rem;
  --bulud-button-focus-ring: #c7d2fe;
}
```

Variant-specific hooks are also available:

- `--bulud-button-secondary-*`
- `--bulud-button-danger-*`
- `--bulud-button-ghost-*`
- `--bulud-button-disabled-opacity`

Local `--bulud-button-*` values take precedence over application-wide
`--bulud-color-*`, `--bulud-radius-*`, and `--bulud-button-*` theme tokens.

### Accessibility

- Uses a native button for keyboard and form behavior.
- Defaults to `type="button"` to prevent accidental form submission.
- Applies native `disabled` behavior while disabled or loading.
- Exposes loading state through `aria-busy` and a polite live region.
- Includes visible `:focus-visible`, forced-colors, reduced-motion, and RTL-safe
  styling.

When the button contains only an icon, provide an `aria-label`.

### Performance and rendering

The component uses `OnPush` change detection, signal inputs, no subscriptions,
and no browser-global APIs. It is compatible with server rendering and
zoneless Angular applications.
