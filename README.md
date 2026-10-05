# Bulud NG

Bulud NG is a standalone Angular 20 component and utility library with
tree-shakable secondary entry points, typed forms integration, CSS-variable
theming, and accessible native interaction patterns.

## Install and configure

```bash
npm install bulud-ng
```

Angular 20 is a peer dependency. Tailwind CSS 4 is optional; components work
without it.

Register the shared theme and locale providers from the root entry point:

```ts
import { ApplicationConfig } from "@angular/core";
import { provideBuludLocale, provideBuludTheme } from "bulud-ng";

export const appConfig: ApplicationConfig = {
  providers: [provideBuludTheme(), provideBuludLocale({ language: "en" })],
};
```

Import the light/dark theme defaults explicitly in the consumer stylesheet:

```css
@import "bulud-ng/theme.css";
```

Use an ancestor `.dark` class or `[data-theme='dark']` attribute to select the
dark theme. Bulud follows the nearest ancestor `dir`; the locale provider sets
the document `lang`, but does not force document direction.

For typed theme configuration, use `defineBuludTheme()` and pass the result to
`provideBuludTheme()`. Theme precedence is instance CSS custom property,
component/scoped token, global provider configuration, then library fallback.
See [`projects/bulud-ng/README.md`](./projects/bulud-ng/README.md) for the
component-level contracts and [`docs/PUBLIC-API.md`](./docs/PUBLIC-API.md) for
the generated export inventory.

## Public entry points

| Import path                  | Public surface                                           |
| ---------------------------- | -------------------------------------------------------- |
| `bulud-ng`                   | Theme and locale types, tokens, resolvers, and providers |
| `bulud-ng/button`            | `BuludButton`                                            |
| `bulud-ng/badge`             | `BuludBadge`                                             |
| `bulud-ng/dropdown`          | `BuludDropdown` and template contexts                    |
| `bulud-ng/checkbox`          | `BuludCheckbox`                                          |
| `bulud-ng/switch`            | `BuludSwitch`                                            |
| `bulud-ng/dialog`            | `BuludDialog` and close reasons                          |
| `bulud-ng/tabs`              | `BuludTabs`, `BuludTab`, and `BuludTabPanel`             |
| `bulud-ng/accordion`         | `BuludAccordion` and `BuludAccordionItem`                |
| `bulud-ng/pagination`        | `BuludPagination` and `BuludPaginationItem`              |
| `bulud-ng/textarea-autosize` | `BuludTextareaAutosize` and provider/config              |
| `bulud-ng/clickoutside`      | `BuludClickOutside` and event types                      |
| `bulud-ng/resize-observer`   | `BuludResizeObserver` and `BuludElementSize`             |
| `bulud-ng/digits`            | Persian and English digit pipes                          |
| `bulud-ng/initials`          | `BuludInitialsPipe`                                      |
| `bulud-ng/filesize`          | `BuludFileSizePipe` and options                          |
| `bulud-ng/tailwind.css`      | Optional Tailwind CSS 4 token bridge                     |
| `bulud-ng/theme.css`         | Explicit light/dark CSS defaults                         |

Import only from these package paths. Do not import implementation files or
`projects/bulud-ng/lib` internals.

## Forms and accessibility

Checkbox, Switch, and Dropdown implement Angular `ControlValueAccessor` and
`Validator`; use `formControl`, `formControlName`, or `ngModel`. User changes
call the registered change callback and emit the documented model output where
one exists. Programmatic writes and resets update the view without emitting a
user change. Blur marks controls touched, and `required` validation is exposed
through Angular Forms. Dropdown `reset()` passes `null` in both modes; use
`reset([])` when a multiple-select model must remain an array.

Dialog, Tabs, Accordion, Dropdown, and form controls provide roles, state, and
focus behavior for their own rendered primitives. Consumers still provide
meaningful accessible names, unique IDs, labels, descriptions and error
relationships, projected trigger/item content, and a visible dialog close
action where appropriate. Do not rely on color alone, and do not place an
interactive control inside `BuludButton`.

## Documentation map

- [`projects/bulud-ng/README.md`](./projects/bulud-ng/README.md) — complete
  consumer guide with inputs, outputs, examples, states, forms, keyboard,
  ARIA, locale, RTL, and theme behavior for every feature.
- [`docs/PUBLIC-API.md`](./docs/PUBLIC-API.md) — declaration-derived export
  inventory and secondary-entry-point contract.
- [`projects/demo/README.md`](./projects/demo/README.md) — run the interactive
  showcase.

## Beads task tracking

This workspace uses [Beads](https://github.com/gastownhall/beads) for local task
tracking. Install the `bd` CLI, then initialize and sync tasks after cloning:

```bash
bd init
bd dolt pull
bd ready
```

Push task changes before switching devices or ending a session with
`bd dolt push`. Do not merge or compare the special Dolt refs with normal Git
branches.

## Development

```bash
npm install
npm run test:ci
npm run build
npm run demo
```

The demo runs at `http://localhost:4200`; `npm run build:demo` creates its
production build. Tailwind integration can be checked with
`npm run test:tailwind`.

## Project structure

```text
projects/bulud-ng/       library and secondary entry points
projects/demo/           standalone consumer showcase
e2e/                     Playwright coverage against the demo
docs/PUBLIC-API.md       generated-export documentation inventory
```

Repository implementation and contribution rules are in
[`AGENTS.md`](./AGENTS.md).
