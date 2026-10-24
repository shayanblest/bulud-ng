# Angour transfer review

The transfer reuses existing components and APIs; it introduces no library
component, switcher service, routing, dependency or application backend. Source
foundations: Angour's `libs/shared/ui/src/lib/styles/_variables.scss`,
`_variables-dark.scss`, `_root.scss` and associated typography/button/form rules.

## Existing surface evidence

This inventory was checked before adding the preset. Each component already has
an intentional secondary `public-api.ts`, typed theme custom properties and a
unit spec alongside its implementation. Those APIs and interaction models are
retained. This is a focused transfer review, not a claim that all baseline audit
gaps or every existing test pass.

| Component  | Theme/config evidence                               | Accessibility/forms evidence                   | Existing demo/E2E evidence           |
| ---------- | --------------------------------------------------- | ---------------------------------------------- | ------------------------------------ |
| Button     | `button/bulud-button/`, root theme precedence specs | Native button, loading/disabled/name inputs    | `app.html`, `e2e/button.spec.ts`     |
| Badge      | `badge/bulud-badge/`, theme precedence specs        | Passive status, named dismiss button           | `app.html`, `e2e/badge.spec.ts`      |
| Dropdown   | `dropdown/bulud-dropdown/`, theme precedence specs  | Combobox/listbox, keyboard, CVA/validator      | `app.html`, `e2e/dropdown.spec.ts`   |
| Tabs       | `tabs/bulud-tabs/`, root theme specs                | Tab roles, keyboard, projected native triggers | `app.html`, `e2e/demo.spec.ts`       |
| Accordion  | `accordion/bulud-accordion/`, root theme specs      | Heading/region relationships, native triggers  | `app.html`, `e2e/demo.spec.ts`       |
| Checkbox   | `checkbox/bulud-checkbox/`, theme precedence specs  | Native checkbox, CVA/validator                 | `app.html`, `e2e/checkbox.spec.ts`   |
| Switch     | `switch/bulud-switch/`, theme precedence specs      | Native input with switch role, CVA/validator   | `app.html`, `e2e/switch.spec.ts`     |
| Dialog     | `dialog/bulud-dialog/`, theme precedence specs      | Dialog name, focus/restore/stack/Escape        | `app.html`, `e2e/dialog.spec.ts`     |
| Pagination | `pagination/bulud-pagination/`, root theme specs    | Named navigation/current page, native controls | `app.html`, `e2e/pagination.spec.ts` |

Cross-surface configuration precedence is already exercised in
`src/lib/theme/bulud-component-theme-precedence.spec.ts`. New preset tests
exercise the existing provider, caller overrides and dark component mapping;
`e2e/angour.spec.ts` exercises actual rendered colors, scope/instance precedence,
both directions/modes, ancestor selectors and dialog keyboard focus restoration.
Native input/table primitives require consumer-provided labels, validation
messages, headers and captions; they add no interaction model.

## Boundaries

- Retain Bulud defaults; the explicit Angour import and preset attribute opt in.
- Use the original navy/gold and surface colors; adapt warning badge text for
  contrast on white, and reuse accessible Bulud focus/keyboard behavior.
- Do not redistribute Angour's bundled fonts or application-specific icons.
- Do not copy Bootstrap utilities, global resets or Angour auth/profile/cookie code.
- Keep existing multilingual APIs and `lang`/`dir` responsibilities unchanged.
- Baseline focus-dependent unit failures are tracked in `ANGOUR-VALIDATION.md`;
  fixing them is separate from the preset transfer.
