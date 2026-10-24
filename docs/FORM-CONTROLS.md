# Angour checkbox, radio and datepicker

The Angour preset now uses the source design's 16px checkbox with 4px corners
and 16px native radio with an 8px inner dot. Primary selection is navy in light
mode and gold in dark mode. Bulud's existing button variants inherit the same
palette. Existing generic Bulud defaults remain available without this preset.

```css
@import "bulud-ng/theme.css";
@import "bulud-ng/angour.css";
@import "bulud-ng/angour-base.css"; /* optional application layout */
```

```html
<section class="bulud-app" data-bulud-preset="angour" data-theme="dark" lang="fa" dir="rtl">
  <!-- your controls -->
</section>
```

## Radio entry point

Import `BuludRadioGroup`, `BuludRadio` and `BuludRadioValue` from
`bulud-ng/radio`. Import Angular's `ReactiveFormsModule` or `FormsModule` in your
standalone component when using forms. Project options into a group; project
text into each radio as its native label.

```ts
import { FormControl } from "@angular/forms";
import { BuludRadio, BuludRadioGroup, type BuludRadioValue } from "bulud-ng/radio";

const plan = new FormControl<BuludRadioValue | null>(null);
```

```html
<p id="plan-label">انتخاب طرح</p>
<bulud-radio-group [formControl]="plan" required aria-labelledby="plan-label">
  <bulud-radio value="basic">پایه</bulud-radio>
  <bulud-radio value="pro">حرفه‌ای</bulud-radio>
  <bulud-radio value="unavailable" disabled>غیرفعال</bulud-radio>
</bulud-radio-group>
```

| Surface | Inputs / model                                      | Behavior                                                                        |
| ------- | --------------------------------------------------- | ------------------------------------------------------------------------------- |
| Group   | `value: string \| number \| null` model             | `[(value)]`, `valueChange` or Angular Forms; numeric zero is supported          |
| Group   | `required`, `disabled`, `invalid`: boolean          | Required validation, combined input/Form disabled state, explicit invalid state |
| Group   | `theme: Partial<BuludRadioTheme>`                   | Instance token values                                                           |
| Group   | `aria-label`, `aria-labelledby`, `aria-describedby` | Accessible group name and description                                           |
| Radio   | `value: string \| number` (required)                | Option value; use unique values in each group                                   |
| Radio   | `disabled`, `id`, `aria-label`, `aria-describedby`  | Native input state, label association and naming                                |

The group implements ControlValueAccessor and Validator. Native same-name radio
inputs own keyboard navigation, Space, focus and mutual exclusion. Disabled
options are skipped. Tab visits the selected radio (or the browser's initial
radio in an unselected group). Give the group an accessible name and every radio
a visible label or `aria-label`. Native names are generated per group to avoid
interference between independent controls. Resetting a nullable form clears
selection. Programmatic writes do not call the registered form change callback.

## Datepicker entry point

Import the standalone `BuludDatepicker` from `bulud-ng/datepicker`.
The calendar opens as a nonmodal dropdown anchored to the field, using the browser's
Popover API to escape ancestor clipping. It flips above when space below is limited
and follows scrolling/resizing. No additional dependency is needed. The compact
Angour layout keeps its descending, scrollable year rail physically on the right in
both directions. It renders at most 80 years around the current/viewed year, bounded
by `min`/`max`; month and Shift+Page navigation can reach dates outside that window.
The visible date uses unpadded Latin `year/month/day`, as in Angour. Stored values
remain Gregorian ISO strings. Single selection uses Angour's translucent gray;
range endpoints retain the primary color.

```ts
import { FormControl } from "@angular/forms";
import { BuludDatepicker, type BuludDatepickerValue } from "bulud-ng/datepicker";

const birthday = new FormControl<BuludDatepickerValue>(null);
```

```html
<label for="birthday">تاریخ تولد</label> <bulud-datepicker id="birthday" aria-label="تاریخ تولد" [formControl]="birthday" language="fa" calendar="persian" required min="1920-01-01" max="2030-12-31" />
```

A date is always a Gregorian ISO `YYYY-MM-DD` string. For example Persian
1404/01/01 produces `2025-03-21`. It is date-only: it is not a timestamp or a
local-midnight Date object. Display language and calendar never alter the stored
date. Calendar calculations use UTC noon and Intl's Persian calendar rules;
there is no copied Jalaali conversion library or timezone-dependent day shift.

For a range, use `mode="range"` and bind a value of
`readonly [string, string | null] | null`. First activation emits `[start, null]`
and keeps the calendar open; second activation orders the endpoints, emits
`[start, end]`, and closes. Reversed click order is supported, including equal
endpoints. An incomplete range remains invalid until completed or cleared.

| Input                             | Type / default                                                           | Purpose                                                                                        |
| --------------------------------- | ------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------- |
| `value`                           | `BuludDatepickerValue`, `null`                                           | `[(value)]` / `valueChange`, or Forms value                                                    |
| `calendar`                        | `'gregory' \| 'persian'`, optional                                       | Input, then component config; otherwise Persian for `fa`, Gregorian for other locales          |
| `language`                        | string, injected Bulud locale language                                   | Intl formatting; explicit `fa`/`en` chooses matching built-in accessible labels                |
| `mode`                            | `'single' \| 'range'`, optional                                          | Input, then component config, then `single`                                                    |
| `firstDayOfWeek`                  | 0–6, optional                                                            | Input, then config, then Saturday for Persian / Sunday for Gregorian; invalid values fall back |
| `min`, `max`                      | ISO string or `null`                                                     | Inclusive bounds; malformed or reversed bounds produce `dateBounds` and prevent opening        |
| `required`, `disabled`, `invalid` | boolean, `false`                                                         | Native trigger state, Forms validation and explicit invalid presentation                       |
| `placeholder`                     | string, locale default                                                   | Empty trigger text                                                                             |
| `theme`                           | `Partial<BuludDatepickerTheme>`, `{}`                                    | Instance token overrides, merged over component defaults                                       |
| `id`                              | string or `null`                                                         | ID on the trigger, for external labels                                                         |
| ARIA inputs                       | `aria-label`, `aria-labelledby`, `aria-describedby`, `aria-errormessage` | Forwarded to trigger; label also names the popup                                               |

Supported Gregorian dates are years 0001–9999. Persian display supports year 1
onward (default lower bound `0622-03-22`); it uses Gregorian ISO bounds as well.
The default upper bound is `9999-12-31`. Invalid, out-of-range values are retained
for Forms validation; opening the calendar clamps its view, without changing
the bound value. Errors are `required`, `date`, `dateRange`, `dateBounds`,
`minDate` and `maxDate`. Malformed `min`/`max` strings or reversed bounds
produce `{ dateBounds: true }`, even for an empty optional control; the calendar
refuses to open until the bounds are valid. Runtime bound/required changes notify Angular validators.
A disabled Angular control and the input `disabled` combine; disabling closes
an open calendar. Reset to `null` to clear. `writeValue` does not invoke the
registered Forms change callback.

### Component defaults and precedence

```ts
import { provideBuludDatepicker } from "bulud-ng/datepicker";
import { provideBuludTheme, provideBuludLocale } from "bulud-ng";

const providers = [
  provideBuludLocale({ language: "fa" }),
  provideBuludDatepicker({
    calendar: "persian",
    firstDayOfWeek: 6,
    mode: "single",
    theme: { daySize: "40px" },
  }),
  provideBuludTheme({
    radio: { checked: "#15375b" },
    datepicker: { selectedBackground: "#15375b" },
  }),
];
```

`BULUD_DATEPICKER_CONFIG` is the typed component-default token. Explicit inputs
precede it. Theme precedence is instance styles/`theme` inputs, component config,
global theme configuration, then library fallbacks. An explicit Angular style
property binding can override the same token supplied through `theme`:

```html
<bulud-datepicker [theme]="{ selectedBackground: '#7c3aed' }" [style.--bulud-datepicker-selected-background]="'#15375b'" />
```

Root `BuludThemeConfig` accepts `radio` and `datepicker`, with corresponding
`BuludRadioTheme` and `BuludDatepickerTheme` types. Both map to `--bulud-radio-*`
and `--bulud-datepicker-*` custom properties. Unspecified optional feature tokens
are not pinned by the provider. Explicit feature colors apply in both root
light/dark modes; geometry remains available in both. The Angour CSS supplies
all presets, including datepicker surfaces, range shading and selection states.
`yearBackground` and `yearSelectedBackground` style the year rail;
`rangeEndpointBackground` and `rangeEndpointForeground` keep range endpoints
independent of single-day `selectedBackground` / `selectedForeground`. Each maps
to the corresponding kebab-case CSS property, e.g. `--bulud-datepicker-year-background`.

The optional locale section `BuludLocale.datepicker` is resolved by
`resolveBuludLocale` / `provideBuludLocale`, including partial overrides. Its
`BuludDatepickerLocale` fields are `chooseDate`, `placeholder`, `previousMonth`,
`nextMonth`, `month`, `year`, `today`, `clear`, `close`, `rangeStart`, `rangeEnd`
and `keyboardHelp`. Existing locale objects need no changes. Explicit
`language` selects built-in formatting/labels; omit it to use injected custom
locale strings. The library never sets document direction or persists choices.

### Keyboard and accessibility

Give each trigger an accessible name. Associate any errors with
`aria-describedby` or `aria-errormessage`. The trigger is a button-based read-only
date field; Enter, Space or Arrow Down opens the calendar. Delete/Backspace on
the trigger clears the date. The active day is the grid's only tab stop. Arrow
keys move days/weeks, with horizontal direction following RTL/LTR. Home/End move
to week edges; Ctrl+Home moves to today. Page Up/Down move months, Shift adds year
movement, and shorter months clamp the day. Enter/Space select. The year rail has
one tab stop; Up/Down and Home/End navigate years without committing a date.
Escape and selection close the panel and restore trigger focus. Clicking outside
or tabbing beyond the control closes it while preserving the destination focus.
The heading announces view changes; dates retain full localized accessible names.
The panel has `role="dialog"` without modal semantics or a focus trap.

## Preview and validation

`npm run demo` → `/#angour-controls` previews both themes and directions, native
checkbox/radio states, Forms reset/disable/validation, Persian/Gregorian single
and range selection, empty/invalid/disabled fields, and instance color overrides.
The demo section loads separately to keep the initial bundle within its budget.
See `e2e/radio.spec.ts`, `e2e/datepicker.spec.ts` and the accompanying unit specs.

## Foundation validation additions

Radio `requireOption` is opt-in and validates projected membership;
`aria-errormessage` names its consumer-provided error element. Datepicker rejects
malformed/reversed ISO bounds with `dateBounds`, including empty optional fields.
See [BASE.md](BASE.md) for the complete validation matrix, Dropdown enhancements
and `bulud-ng/validators` usage.

### Local today across midnight

The datepicker refreshes its local calendar date when opened, during day-keyboard
navigation (including Ctrl+Home), and before its today action. An empty control
anchors to the refreshed day; explicit selections remain unchanged and min/max
bounds still clamp navigation. The grid moves `aria-current="date"` to the refreshed
day. There is no background midnight timer; an idle open panel refreshes on its
next relevant interaction. This applies to both Gregorian and Persian display.

### Pointer clearing

A non-null single date or complete/partial range exposes a localized clear button
in the calendar. Mouse, touch and native button keyboard activation reset the
value to null, notify Forms change/touched callbacks, close the panel and restore
focus to the trigger. Required controls may also be cleared and then correctly
report the required validation error. The button is absent for an empty value;
disabled controls cannot open or clear. Delete/Backspace on the trigger remains
available. Popup positioning also observes page-size changes while open so
earlier content expanding or collapsing does not leave it at a stale position.
