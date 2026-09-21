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
| `bulud-ng/clickoutside`    | `BuludClickOutside` and related trigger types        |
| `bulud-ng/tabs`            | `BuludTabs`, `BuludTab`, and `BuludTabPanel`         |
| `bulud-ng/accordion`       | `BuludAccordion` and `BuludAccordionItem`            |
| `bulud-ng/checkbox`        | `BuludCheckbox`                                      |
| `bulud-ng/switch`          | `BuludSwitch`                                        |
| `bulud-ng/dialog`          | `BuludDialog`, `BuludDialogCloseReason`              |

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
Theme configuration supports `colors`, `shape`, `button`, `dropdown`, `badge`,
`tabs`, `accordion`, `checkbox`, `switch`, and `dialog` tokens. The precedence is instance custom property,
component token, global provider configuration, then the library default.

## Accordion

Import the standalone accordion pieces from the accordion secondary entry
point:

```ts
import { BuludAccordion, BuludAccordionItem } from "bulud-ng/accordion";
```

Project item content with a stable identifier, a trigger marker, and a panel
marker. The item supplies a semantic heading and native button, and the panel
receives the matching `role="region"` relationship automatically:

```html
<bulud-accordion [(expanded)]="expandedSection">
  <section [buludAccordionItem]="'overview'">
    <span buludAccordionTrigger>Overview</span>
    <p buludAccordionPanel>Workspace overview content.</p>
  </section>
  <section [buludAccordionItem]="'details'">
    <span buludAccordionTrigger>Details</span>
    <p buludAccordionPanel>Account details content.</p>
  </section>
</bulud-accordion>
```

Single mode is the default and binds `expanded` to a string or `null`. Set
`multiple` to bind a readonly string array and keep several panels open:

```html
<bulud-accordion multiple [(expanded)]="expandedSections">
  <!-- projected accordion items -->
</bulud-accordion>
```

Items can be disabled with `[disabled]`. Enter and Space use native button
activation; Up/Down move between enabled headings, while Home/End move to the
first or last enabled heading. Collapsed panels are hidden from the focus order
and focus returns to the trigger if a user collapses a panel containing focus.
Consumers must provide unique item identifiers and meaningful projected
trigger content. The accordion follows ancestor `dir` and supports light/dark
theme selectors through the shared CSS variables. Instance custom properties
override the global `provideBuludTheme` values.

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

## Checkbox

Import `BuludCheckbox` from the checkbox secondary entry point:

```ts
import { BuludCheckbox } from "bulud-ng/checkbox";
```

Use projected content as the label and bind the boolean value with Angular
Forms or `[(checked)]`:

```html
<bulud-checkbox [(checked)]="accepted" required> Accept the terms </bulud-checkbox>
```

`BuludCheckbox` keeps a native checkbox as the focusable and interactive
element. Space or projected-label activation toggles it once. `indeterminate`,
`disabled`, `required`, `invalid`, `id`, and `aria-label` are typed inputs;
`aria-describedby`, and `aria-errormessage` are also typed inputs and are
forwarded to the native checkbox. `checkedChange` and `indeterminateChange` are
generated by the public models for `checked` and `indeterminate`, respectively,
and support Angular's two-way binding contract. Native activation clears the
current mixed state; set `indeterminate` again when the parent needs to reassert
it. The native label supplies
the accessible name when projected text is present. Provide `aria-label` (or
an external label associated with `id`) when the projected content is not a
meaningful name.

The control implements `ControlValueAccessor` and `Validator`: user changes
update the form value, blur marks it touched, `required` returns the standard
`required` error, and a disabled Angular control disables the native input.
Checkbox theme values use the shared CSS variables and follow the normal
instance, component token, global provider, and library-default precedence.

### Checkbox inputs

| Input               | Type             | Default | Description                                        |
| ------------------- | ---------------- | ------- | -------------------------------------------------- |
| `checked`           | `boolean`        | `false` | Current checked value; supports `[(checked)]`      |
| `indeterminate`     | `boolean`        | `false` | Displays the native mixed state                    |
| `disabled`          | `boolean`        | `false` | Prevents interaction                               |
| `required`          | `boolean`        | `false` | Enables native and Forms required validation       |
| `invalid`           | `boolean`        | `false` | Explicit invalid presentation                      |
| `id`                | `string \| null` | `null`  | Native input id for external labels                |
| `aria-label`        | `string \| null` | `null`  | Accessible name override                           |
| `aria-describedby`  | `string \| null` | `null`  | IDs forwarded to the native input for description  |
| `aria-errormessage` | `string \| null` | `null`  | ID forwarded to the native input for error message |

### Checkbox model outputs

| Output                | Type      | Description                                                    |
| --------------------- | --------- | -------------------------------------------------------------- |
| `checkedChange`       | `boolean` | Generated by the `checked` model for `[(checked)]`             |
| `indeterminateChange` | `boolean` | Generated by the `indeterminate` model for `[(indeterminate)]` |

The native checkbox handles Space and label activation. Consumers should keep
the projected label meaningful and provide `aria-label` when it is not.

## Switch

Import `BuludSwitch` from the switch secondary entry point:

```ts
import { BuludSwitch } from "bulud-ng/switch";
```

Use projected content as the accessible name and bind the boolean value with
Angular Forms or `[(checked)]`:

```html
<bulud-switch [(checked)]="notificationsEnabled"> Enable notifications </bulud-switch>
```

`BuludSwitch` uses a native checkbox with `role="switch"`, so Space and label
activation use browser-native keyboard and pointer behavior while exposing the
APG switch role and checked state. Consumers should provide meaningful
projected content or `aria-label`, and can use `id` with an external label.
`disabled`, `required`, `invalid`, `aria-describedby`, and
`aria-errormessage` are typed inputs. The component implements
`ControlValueAccessor` and `Validator`; user changes update Forms, blur marks
the control touched, required returns `{ required: true }`, and Angular Forms
disabled state disables the native control. Switch transitions are disabled
when the user requests reduced motion.

Switch theme values use CSS custom properties and follow instance override,
global `provideBuludTheme` configuration, and library-default precedence. The
explicitly imported `theme.css` provides light and dark defaults.

### Switch inputs

| Input               | Type             | Default | Description                                    |
| ------------------- | ---------------- | ------- | ---------------------------------------------- |
| `checked`           | `boolean`        | `false` | Current switch state; supports two-way binding |
| `disabled`          | `boolean`        | `false` | Prevents interaction                           |
| `required`          | `boolean`        | `false` | Enables required validation                    |
| `invalid`           | `boolean`        | `false` | Explicit invalid presentation                  |
| `id`                | `string \| null` | `null`  | Native input id                                |
| `aria-label`        | `string \| null` | `null`  | Accessible name override                       |
| `aria-describedby`  | `string \| null` | `null`  | Description relationship                       |
| `aria-errormessage` | `string \| null` | `null`  | Error relationship                             |

`checkedChange` emits once for each user change; programmatic Angular Forms
writes do not emit it. The native switch handles
Space and projected-label activation; Enter is not required by the switch APG
pattern.

## Dialog

Import the standalone modal from `bulud-ng/dialog` and project its content.
The dialog requires an accessible name through `aria-label` or
`aria-labelledby`; use `aria-describedby` for supporting text:

```ts
import { BuludDialog, type BuludDialogCloseReason } from "bulud-ng/dialog";

@Component({
  imports: [BuludDialog],
  template: `
    <button type="button" (click)="open.set(true)">Edit profile</button>
    <bulud-dialog [(open)]="open" aria-labelledby="profile-title" aria-describedby="profile-description" [initialFocus]="'#profile-name'" (closeRequest)="lastCloseReason.set($event)">
      <h2 id="profile-title">Edit profile</h2>
      <p id="profile-description">Update your public profile.</p>
      <input id="profile-name" />
      <button type="button" (click)="open.set(false)">Cancel</button>
    </bulud-dialog>
  `,
})
export class ProfileEditor {
  readonly open = signal(false);
  readonly lastCloseReason = signal<BuludDialogCloseReason | null>(null);
}
```

`open` is a controlled signal model and supports `[(open)]`. `close()` is a
programmatic close method; `closeRequest` is emitted only for enabled user
Escape or backdrop requests and reports `"escape"` or `"backdrop"`. Set
`closeOnEscape` or `closeOnBackdrop` to `false` to disable either policy.
`initialFocus` is an optional CSS selector scoped to the projected dialog
surface. Without it, focus moves to the first enabled, visible focusable child,
or to the dialog surface itself. Tab and Shift+Tab wrap dynamically, and focus
returns to the opening element when it remains connected and focusable.

The dialog uses `role="dialog"`, `aria-modal="true"`, a viewport backdrop, and
reference-counted body scroll locking. Consumer-provided labels and IDs must be
unique and must identify visible projected content. Consumers should provide a
visible close action inside the projected footer; Escape/backdrop behavior is
optional and policy-controlled. The component follows ancestor `dir` and dark
theme selectors, respects `prefers-reduced-motion`, and supports `dialog`
theme tokens—including focus color/width/offset—plus per-instance `[theme]`
overrides.

## Tabs

Import the standalone tabs pieces from the tabs secondary entry point:

```ts
import { BuludTab, BuludTabPanel, BuludTabs } from "bulud-ng/tabs";
```

Pair a native button carrying `buludTab` with a projected panel carrying the
same `buludTabPanel` identifier. The first enabled tab is selected by default;
use `[(activeId)]` for a controlled, typed selection model:

```html
<bulud-tabs [(activeId)]="activeTab">
  <button type="button" [buludTab]="'overview'">Overview</button>
  <button type="button" [buludTab]="'details'">Details</button>

  <section [buludTabPanel]="'overview'">Overview content</section>
  <section [buludTabPanel]="'details'">Details content</section>
</bulud-tabs>
```

Set `[orientation]="'vertical'"` for a vertical tablist. Horizontal tabs use
Left/Right, Home, and End; vertical tabs use Up/Down, Home, and End. Arrow
navigation skips disabled tabs, moves focus, and activates the destination.
The component supplies stable tab/panel IDs, `aria-selected`, `aria-controls`,
`aria-labelledby`, and `tabpanel` visibility. Each tab identifier must be
unique within its tabs instance. Consumers should provide an accessible name
for the tablist with `aria-label` when the visible page context does not name
it.

### Tabs inputs and outputs

| Input/output                  | Type                         | Default           | Description                                                              |
| ----------------------------- | ---------------------------- | ----------------- | ------------------------------------------------------------------------ |
| `activeId` / `activeIdChange` | `BuludTabId \| null`         | First enabled tab | Controlled selection model; use `[(activeId)]` for two-way binding       |
| `orientation`                 | `'horizontal' \| 'vertical'` | `'horizontal'`    | Layout and arrow-key axis                                                |
| `aria-label`                  | `string \| null`             | `null`            | Accessible name for the tablist when surrounding context is insufficient |
| `buludTab`                    | `BuludTabId`                 | Required          | Identifier on a native tab button                                        |
| `disabled`                    | `boolean`                    | `false`           | Removes a tab from selection and arrow-key navigation                    |
| `buludTabPanel`               | `BuludTabId`                 | Required          | Identifier matching the panel's tab                                      |

Horizontal tabs use Left/Right, Home, and End; vertical tabs use Up/Down,
Home, and End. Consumers must provide unique tab identifiers and an accessible
tablist name where the surrounding page context does not provide one.

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

The badge is passive text, with no implicit live region, button role, or tab
stop. Variants communicate appearance; include meaningful text rather than
relying on color. The dot and dismiss icon are decorative. For dot-only content,
project visually hidden text (an empty decorative badge conveys no status).
Badge is not a form control and has no disabled, loading, or invalid state.

The native dismiss button supports Tab, Enter, Space, and pointer activation.
It never submits a surrounding form and its click does not bubble. Supply a
localized, contextual `dismissLabel`; blank labels fall back to `Remove badge`.
`dismissed` emits once per activation without removing the badge. The consumer
owns removal and must move focus to a meaningful remaining control:

```html
<button #restore type="button" (click)="visible.set(true)">Restore badge</button>
@if (visible()) {
<bulud-badge variant="success" dot dismissible dismissLabel="Remove published status" (dismissed)="visible.set(false); restore.focus()">Published</bulud-badge>
}
```

Import `bulud-ng/theme.css` explicitly for light/dark defaults. Ancestor `.dark`
or `[data-theme="dark"]` and `dir` control theme and direction. Configure typed
colors with `provideBuludTheme({ badge: { success: { background: '#14532d' } } })`.
`BuludBadgeTheme` also configures each variant's border/foreground, radius,
fontWeight, dismissHoverBackground, and focus. Precedence is instance CSS custom
property → scoped component token → typed global theme → library fallback;
behavioral inputs have instance and library defaults only.

For example, `[style.--bulud-badge-success-background]="background()"` overrides
the global success color. CSS hooks also include `--bulud-badge-height-{size}`,
`--bulud-badge-font-size-{size}`, `--bulud-badge-padding-inline-{size}`,
`--bulud-badge-border-width`, `--bulud-badge-line-height`, `--bulud-badge-dot-size`,
`--bulud-badge-dot-gap`, `--bulud-badge-dismiss-size`, `--bulud-badge-dismiss-gap`,
`--bulud-badge-dismiss-margin`, `--bulud-badge-dismiss-padding`,
`--bulud-badge-dismiss-icon-size`, `--bulud-badge-focus-width`, and
`--bulud-badge-focus-offset`. The dismiss target defaults to at least 24 × 24px.

All geometry/focus hooks above have optional string fields in `BuludBadgeTheme`:
`heightSmall`, `heightMedium`, `heightLarge`, `fontSizeSmall`, `fontSizeMedium`,
`fontSizeLarge`, `paddingInlineSmall`, `paddingInlineMedium`, `paddingInlineLarge`,
`borderWidth`, `lineHeight`, `dotSize`, `dotGap`, `dismissSize`, `dismissGap`,
`dismissMargin`, `dismissPadding`, `dismissIconSize`, `focusWidth`, and `focusOffset`.
Each maps to the corresponding kebab-case `--bulud-badge-*` variable.

```ts
provideBuludTheme({ badge: { heightMedium: "2.5rem", focusWidth: "3px" } });
```

Existing Badge theme objects remain valid. Public defaults omit these optional
fields; the provider only emits them when explicitly supplied, preserving consumer
`:root` and scoped CSS. `resolveBuludTheme()` and `BULUD_THEME` expose concrete
string defaults for every Badge field. `createBuludThemeVariables()` includes all
resolved variables. The provider retains its existing dark-mode scoping, and
spacing continues to use logical CSS properties for RTL.

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
`BuludTabsTheme`, `BuludAccordionTheme`, `BuludDialogTheme`, and
`BuludThemeConfig`) are exported
from the root entry point.

`ResolvedBuludTheme` is also exported for values returned by `resolveBuludTheme()`
and injected through `BULUD_THEME`. Its button and badge fields are all required strings,
including optional consumer tokens. `BuludTheme`, `BuludButtonTheme`,
and `typeof BULUD_DEFAULT_THEME` continue to accept legacy consumer objects
without those tokens. This type has no keyboard or ARIA requirements.

```ts
import { resolveBuludTheme, type ResolvedBuludTheme } from "bulud-ng";

export const theme: ResolvedBuludTheme = resolveBuludTheme({
  button: { focusWidth: "4px" },
});
```

To check downstream declaration emission against the built package, run
`npm run build` followed by
`npx tsc -p projects/declaration-tests/tsconfig.json`. The fixture deliberately
exports inferred resolver and injection results to catch inaccessible public types.

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

Enter and Space activate the focused native button. Disabled and loading buttons
are skipped in the tab order and cannot submit a form. When loading ends, the
button becomes available again unless `disabled` remains true; focus is not
moved automatically. Keep projected text stable while loading and supply a
localized `loadingLabel` for the polite status announcement.

When the button contains only an icon or has empty projected content, provide an
`aria-label`. Do not project interactive controls inside a button. Attributes
such as `aria-describedby` placed on the component host are not forwarded to the
inner button. Button has no value or invalid state and does not implement a form
value accessor. Use `type="submit"` or `type="reset"` inside a native form.

The demo's Button interactions section exposes loading, disabled, dark theme,
empty content with an accessible name, instance styling, and form actions. The
language switch changes the ancestor direction; hover and keyboard focus can be
exercised on each enabled variant.

Additional CSS hooks are `--bulud-button-border-width`,
`--bulud-button-focus-width`, `--bulud-button-focus-offset`, and
`--bulud-button-ghost-background`. These inherit from a scope and can be
overridden per instance with `[style.--bulud-button-focus-width]`.

The `BuludButtonTheme` fields `borderWidth`, `focusWidth`, `focusOffset`, and
`ghostBackground` are optional, so existing button and complete `BuludTheme`
objects remain valid. The resolver and `BULUD_THEME` supply concrete values from
`BULUD_DEFAULT_THEME` for omitted options. The provider emits these four CSS
variables only when explicitly configured; omitted or `undefined` options leave
consumer `:root` CSS free to override the component's library fallback. Explicit
typed values take precedence over ordinary `:root` rules, while closer scoped
and per-instance CSS overrides still take precedence over typed values.

`provideBuludTheme` configuration controls shared colors, shape, and button size,
weight, gap, disabled opacity, and these four hooks; visual variant and behavioral defaults remain
component inputs. Component color properties override shared color tokens, and
instance properties override inherited values.

Configure these hooks with string values (CSS lengths for widths/offset and a CSS
color for the ghost background). Defaults are `1px`, `3px`, `2px`, and
`transparent`, respectively:

```ts
provideBuludTheme({
  button: {
    borderWidth: "2px",
    focusWidth: "4px",
    focusOffset: "3px",
    ghostBackground: "#f5f3ff",
  },
});
```

Precedence is instance CSS property → component/scoped CSS property → global
typed theme → library default. Existing CSS overrides continue to work.

### Performance and rendering

The component uses `OnPush` change detection, signal inputs, no subscriptions,
and no browser-global APIs. It is compatible with server rendering and
zoneless Angular applications.
