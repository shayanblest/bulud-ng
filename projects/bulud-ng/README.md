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

## Application theme configuration

Create a consumer-owned `src/bulud.config.ts`:

```ts
import { defineBuludTheme } from 'bulud-ng';

export const buludTheme = defineBuludTheme({
  colors: {
    primary: '#7c3aed',
    primaryHover: '#6d28d9',
    primaryActive: '#5b21b6',
    focus: '#c4b5fd',
  },
  shape: {
    controlRadius: '0.75rem',
  },
  button: {
    fontWeight: '700',
    medium: {
      height: '2.75rem',
      paddingInline: '1.25rem',
    },
  },
});
```

Register that configuration once in the application configuration:

```ts
import { ApplicationConfig } from '@angular/core';
import { provideBuludTheme } from 'bulud-ng';

import { buludTheme } from './bulud.config';

export const appConfig: ApplicationConfig = {
  providers: [provideBuludTheme(buludTheme)],
};
```

The provider resolves omitted values against `BULUD_DEFAULT_THEME` and writes
the resulting `--bulud-*` custom properties to the document root. Components
therefore inherit one application-wide theme without per-component providers.

## Tailwind CSS integration

In the consumer application's global CSS, import the Bulud Tailwind bridge
after Tailwind:

```css
@import "tailwindcss";
@import "bulud-ng/tailwind.css";
```

The bridge exposes Bulud tokens as Tailwind utilities:

```html
<section
  class="rounded-bulud-control border border-bulud-border bg-bulud-surface p-6 text-bulud-on-surface"
>
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
import { Component } from '@angular/core';
import { BuludDropdown } from 'bulud-ng/dropdown';

interface Framework {
  readonly id: string;
  readonly label: string;
}

@Component({
  imports: [BuludDropdown],
  template: `
    <bulud-dropdown
      aria-label="Choose a framework"
      [options]="frameworks"
      [optionLabel]="label"
      [(value)]="framework"
    >
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
    { id: 'angular', label: 'Angular' },
    { id: 'react', label: 'React' },
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
<bulud-dropdown
  multiple
  [options]="teamMembers"
  [optionLabel]="memberLabel"
  [(value)]="selectedMembers"
/>
```

## Button

Import the standalone component from its public secondary entry point:

```ts
import { Component } from '@angular/core';
import { BuludButton } from 'bulud-ng/button';

@Component({
  selector: 'app-save-action',
  imports: [BuludButton],
  template: `
    <bulud-button
      variant="primary"
      [loading]="saving"
      loadingLabel="Saving changes"
      (click)="save()"
    >
      Save
    </bulud-button>
  `,
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

| Input | Type | Default | Description |
| --- | --- | --- | --- |
| `type` | `'button' \| 'submit' \| 'reset'` | `'button'` | Native button type |
| `variant` | `'primary' \| 'secondary' \| 'danger' \| 'ghost'` | `'primary'` | Visual treatment |
| `size` | `'small' \| 'medium' \| 'large'` | `'medium'` | Control size |
| `disabled` | `boolean` | `false` | Prevents interaction |
| `loading` | `boolean` | `false` | Shows progress and prevents repeated interaction |
| `loadingLabel` | `string` | `'Loading'` | Assistive text for the loading state |
| `fullWidth` | `boolean` | `false` | Fills the available inline size |
| `aria-label` | `string \| null` | `null` | Overrides projected text as the accessible name |

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
