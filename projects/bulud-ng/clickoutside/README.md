# ClickOutside directive

`BuludClickOutside` is an opt-in standalone directive that emits a typed
notification when pointer or focus interaction occurs outside its host.
Import its public API from `bulud-ng/clickoutside`.

## Import and usage

```ts
import { BuludClickOutside, type BuludClickOutsideEvent, type BuludClickOutsideTrigger } from "bulud-ng/clickoutside";
```

Add `BuludClickOutside` to your standalone component's `imports` array. The
selector is `[buludClickOutside]`; place it on an element containing the trigger
and panel so both count as inside:

```html
<div buludClickOutside [enabled]="panelOpen()" (outside)="panelOpen.set(false)">
  <button type="button" [attr.aria-expanded]="panelOpen()" (click)="panelOpen.set(!panelOpen())">Details</button>
  @if (panelOpen()) {
  <p>Panel content.</p>
  }
</div>
```

Here `panelOpen` is a consumer-owned boolean signal, for example
`readonly panelOpen = signal(false)` with `signal` imported from `@angular/core`.
The consumer's `outside` handler closes the panel; the directive only notifies.

## Inputs

| Input      | Type                                  | Default                      | Description                                                |
| ---------- | ------------------------------------- | ---------------------------- | ---------------------------------------------------------- |
| `enabled`  | `boolean`                             | `true`                       | Enables outside detection; uses boolean attribute coercion |
| `triggers` | `readonly BuludClickOutsideTrigger[]` | `['pointerdown', 'focusin']` | Selects the document events that cause notifications       |

Use `[triggers]="['pointerdown']"` or `[triggers]="['focusin']"` when only one
interaction kind is appropriate. An empty array listens to neither event.
There is no global configuration token or provider for this directive; the
inputs configure each instance directly.

## Output and types

`outside` is created with `output<BuludClickOutsideEvent>()`. Its payload contains
only the readonly trigger, rather than the original DOM event or target:

```ts
export type BuludClickOutsideTrigger = "pointerdown" | "focusin";

export interface BuludClickOutsideEvent {
  readonly trigger: BuludClickOutsideTrigger;
}
```

Bind `(outside)="onOutside($event)"` to receive this payload in a handler with
the signature `onOutside(event: BuludClickOutsideEvent): void`.

## Default behavior and cleanup

Detection is enabled by default for both `pointerdown` and `focusin`. Interactions
on the host or its descendants do not emit. Duplicate configured triggers are
deduplicated.

With both triggers enabled, pointerdown followed by focusin on the same outside
target is coalesced into one event with `trigger: 'pointerdown'`. A focusin on a
different outside target still emits `trigger: 'focusin'`.

Setting `[enabled]="false"` removes the outside document listeners. Re-enabling
installs listeners for the configured triggers; changing `triggers` updates
the listeners. Destroying the directive removes its listeners.

## Accessibility

The directive adds no semantics, focus management, or keyboard behavior.
Consumers own accessible names, roles, ARIA relationships/state, and
keyboard/focus behavior for the UI using it. Use semantic native elements and
implement the keyboard pattern required by your UI, including Escape handling,
focus placement, and focus restoration where appropriate. A `focusin`
notification reports focus movement; it does not move or trap focus.

## Theming

Theming is not applicable: the directive has no visual styling, CSS custom
properties, theme input, or theme contract. Consumers style the host and its
content.

## Forms

Forms integration is not applicable: the directive has no form value or
validation state and implements neither `ControlValueAccessor` nor `Validator`.
It adds no Forms contract to its host.

## Server rendering

The directive runs only in the browser. During SSR it installs no document
listeners and emits no fake outside events.

See the [public API contract](../../../docs/PUBLIC-API.md#bulud-ngclickoutside)
for the entry point's export inventory.
