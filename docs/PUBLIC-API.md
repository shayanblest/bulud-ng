# Public API contract

This inventory is based on the built declarations in `dist/bulud-ng` and the
secondary `public-api.ts` files. The consumer guide in
[`projects/bulud-ng/README.md`](../projects/bulud-ng/README.md) contains the
examples and behavioral details referenced below. Implementation files and
protected/private members are not public API.

## Root entry point: `bulud-ng`

### Theme exports

| Export                      | Kind     | Purpose                                                                              |
| --------------------------- | -------- | ------------------------------------------------------------------------------------ |
| `BuludColorTheme`           | type     | Shared primary, surface, danger, border, and focus colors                            |
| `BuludShapeTheme`           | type     | Shared control shape tokens                                                          |
| `BuludButtonSizeTheme`      | type     | Button height, font size, and inline padding                                         |
| `BuludButtonTheme`          | type     | Button geometry, typography, state, and size tokens                                  |
| `BuludDropdownTheme`        | type     | Dropdown surface, option, search, state, and geometry tokens                         |
| `BuludBadgeVariantTheme`    | type     | One Badge variant's colors                                                           |
| `BuludBadgeTheme`           | type     | Badge variant, size, dismiss, focus, and geometry tokens                             |
| `BuludTabsTheme`            | type     | Tabs surface, selection, focus, and geometry tokens                                  |
| `BuludAccordionTheme`       | type     | Accordion surface, expansion, focus, and geometry tokens                             |
| `BuludCheckboxTheme`        | type     | Checkbox state, focus, label, and geometry tokens                                    |
| `BuludSwitchTheme`          | type     | Switch state, focus, thumb, label, and geometry tokens                               |
| `BuludDialogTheme`          | type     | Dialog surface, backdrop, focus, stacking, and geometry tokens                       |
| `BuludPaginationTheme`      | type     | Pagination surface, state, focus, and geometry tokens                                |
| `BuludTheme`                | type     | Consumer theme shape; compatibility-optional feature sections                        |
| `ResolvedBuludTheme`        | type     | Fully resolved theme returned by `resolveBuludTheme()` and provided by `BULUD_THEME` |
| `BuludThemeConfig`          | type     | Partial consumer overrides accepted by the provider and resolver                     |
| `BuludThemeCssVariable`     | type     | `--bulud-${string}` CSS variable key                                                 |
| `BULUD_DEFAULT_THEME`       | const    | Legacy-shaped default theme object                                                   |
| `BULUD_THEME`               | token    | Injection token for the resolved theme                                               |
| `defineBuludTheme`          | function | Preserves literal/type inference for consumer config                                 |
| `resolveBuludTheme`         | function | Resolves partial config against library defaults                                     |
| `createBuludThemeVariables` | function | Converts config to readonly `--bulud-*` variables                                    |
| `provideBuludTheme`         | function | Registers the theme and applies variables during Angular initialization              |

Theme precedence is instance CSS property, component/scoped token, global typed
provider configuration, then library fallback. Import `bulud-ng/theme.css`
explicitly for light and dark defaults; an ancestor `.dark` or
`[data-theme="dark"]` selects dark values.

### Locale exports

| Export                  | Kind     | Purpose                                                                          |
| ----------------------- | -------- | -------------------------------------------------------------------------------- |
| `BuludLanguage`         | type     | `'en'`, `'fa'`, or a custom language tag                                         |
| `BuludDirection`        | type     | `'ltr'` or `'rtl'` locale metadata                                               |
| `BuludDropdownLocale`   | type     | Dropdown placeholder, search, state, selection, and action strings               |
| `BuludButtonLocale`     | type     | Button loading status string                                                     |
| `BuludBadgeLocale`      | type     | Badge dismiss label                                                              |
| `BuludPaginationLocale` | type     | Navigation, page, current-page, and ellipsis labels                              |
| `BuludLocale`           | type     | Complete locale object, including language and direction metadata                |
| `BuludLocaleConfig`     | type     | Partial locale override accepted by the provider/resolver                        |
| `BULUD_DEFAULT_LOCALE`  | const    | English fallback locale                                                          |
| `BULUD_PERSIAN_LOCALE`  | const    | Persian locale and localized strings                                             |
| `BULUD_LOCALE`          | token    | Injected locale object                                                           |
| `resolveBuludLocale`    | function | Resolves `fa` against Persian defaults and other values against English defaults |
| `provideBuludLocale`    | function | Registers locale strings and sets document `lang`                                |

The locale provider does not set `document.dir` or CSS direction. Components
inherit the nearest ancestor direction, so language and layout direction can be
chosen independently.

## Secondary entry points

### `bulud-ng/button`

Exports `BuludButton`, `BuludButtonVariant` (`primary`, `secondary`, `danger`,
`ghost`), `BuludButtonSize` (`small`, `medium`, `large`), and
`BuludButtonType` (`button`, `submit`, `reset`). Inputs are `type`, `variant`,
`size`, `disabled`, `loading`, `fullWidth`, `aria-label`, and `loadingLabel`.
It has no custom output; native `click` is used. It renders a native button,
defaults to `type="button"`, exposes `aria-busy` and localized live status while
loading, and uses native Enter/Space activation. Consumers provide an
accessible name for icon-only or empty content.

### `bulud-ng/badge`

Exports `BuludBadge`, `BuludBadgeVariant` (`neutral`, `primary`, `success`,
`warning`, `danger`), and `BuludBadgeSize` (`small`, `medium`, `large`). Inputs
are `variant`, `size`, `dot`, `dismissible`, and `dismissLabel`; `dismissed`
emits `void` once per user activation. The Badge is passive text unless
dismissible, has no Forms contract, and consumers own removal and focus
placement after dismissal.

### `bulud-ng/dropdown`

Exports generic `BuludDropdown<T>`,
`BuludDropdownOptionTemplateContext<T>`, and
`BuludDropdownSelectedTemplateContext<T>`. Inputs are `options`, model `value`,
`multiple`, `searchable`, `clearable`, `disabled`, `required`, `loading`, five
display-text inputs (`placeholder`, `searchPlaceholder`, `noResultsText`,
`loadingText`, `emptyText`), two action labels (`clearLabel`, `searchLabel`),
`aria-label`, `optionLabel`, `compareWith`, and `optionDisabled`. The model
output is `valueChange`; the component also implements ControlValueAccessor and
Validator.

The trigger is a combobox controlling a listbox. Arrow keys, Home/End, Enter,
Space, Escape, search navigation, focus-out, and pointer-outside behavior are
documented in the Dropdown section of the consumer guide. Disabled options stay
discoverable with `aria-disabled="true"` but cannot be selected. Required
validation, loading, empty, single, multiple, templates, locale, RTL, and
Forms reset semantics are covered there. `reset()` passes `null` in both modes;
use `reset([])` to keep a multiple model array-shaped.

### `bulud-ng/checkbox`

Exports `BuludCheckbox`. Inputs are model `checked` and `indeterminate`, plus
`disabled`, `required`, `invalid`, `id`, `aria-label`, `aria-describedby`, and
`aria-errormessage`. Model outputs are `checkedChange` and
`indeterminateChange`. It implements ControlValueAccessor and Validator:
`null`/non-true writes render unchecked, user changes call Forms change
callbacks, blur marks touched, required returns `{ required: true }`, and Forms
disabled state combines with the instance input.

### `bulud-ng/switch`

Exports `BuludSwitch`. Inputs are `checked`, `disabled`, `required`, `invalid`,
`id`, `aria-label`, `aria-describedby`, and `aria-errormessage`; `checkedChange`
emits user changes. It implements ControlValueAccessor and Validator, renders
switch semantics, uses native Space/label activation, and treats required as
the on-state validation requirement.

### `bulud-ng/dialog`

Exports `BuludDialog` and `BuludDialogCloseReason` (`escape` or `backdrop`).
Inputs are model `open`, `aria-label`, `aria-labelledby`, `aria-describedby`,
`closeOnEscape`, `closeOnBackdrop`, `initialFocus`, and partial instance
`theme`. Outputs are `openChange` and `closeRequest`; `close()` is the public
programmatic method. The modal supplies dialog semantics, focus placement,
dynamic Tab/Shift+Tab trapping, Escape/backdrop policy, and focus restoration.
Consumers provide a unique accessible name/description relationship and should
project a visible close action.

### `bulud-ng/tabs`

Exports `BuludTabs`, `BuludTab`, `BuludTabPanel`, `BuludTabId`, and
`BuludTabsOrientation` (`horizontal` or `vertical`). `BuludTabs` inputs are
model `activeId`, `orientation`, and `aria-label`; `activeIdChange` is its
output. `BuludTab` requires `buludTab` and accepts `disabled`; `BuludTabPanel`
requires matching `buludTabPanel`. Native projected buttons receive tab
semantics, matching IDs, selection, and panel relationships. Consumers provide
unique IDs and an accessible tablist name when surrounding content is
insufficient.

### `bulud-ng/accordion`

Exports `BuludAccordion`, `BuludAccordionItem`, `BuludAccordionId`, and
`BuludAccordionMode` (`single` or `multiple`). Accordion inputs are `multiple`,
`collapsible`, and model `expanded`; `expandedChange` is the output. Item inputs
are required `buludAccordionItem` and `disabled`; projection markers are
`buludAccordionTrigger` and `buludAccordionPanel`. Consumers provide unique
item IDs and meaningful trigger content. Enter/Space activate; Up/Down and
Home/End move among enabled items; panels expose the generated region
relationship and focus returns to a trigger when needed.

### `bulud-ng/pagination`

Exports `BuludPagination` and `BuludPaginationItem` (`number`,
`ellipsis-start`, or `ellipsis-end`). Inputs are `currentPage`, `pageCount`,
`disabled`, `aria-label`, `previousPageLabel`, `nextPageLabel`, `pageLabel`,
`currentPageLabel`, and `ellipsisLabel`; `pageChange` requests a new page and
does not mutate the input. It renders a navigation landmark, native buttons,
`aria-current="page"`, disabled bounds, and non-focusable localized ellipses.

### `bulud-ng/textarea-autosize`

Exports `BuludTextareaAutosize`, `BuludTextareaAutosizeConfig`,
`BULUD_TEXTAREA_AUTOSIZE_CONFIG`, and `provideBuludTextareaAutosize`. Directive
inputs are `enabled`, `minRows`, and `maxRows`; the directive has no output.
It preserves native textarea behavior and accessibility, owns height/overflow
only while enabled, restores inline styles when disabled/destroyed, and uses
instance input, directive default, global config, then library default
precedence. Consumers provide the native textarea label/description/ARIA.

### `bulud-ng/clickoutside`

Exports `BuludClickOutside`, `BuludClickOutsideTrigger`
(`pointerdown` or `focusin`), and `BuludClickOutsideEvent` (`trigger`). Inputs
are `enabled` and `triggers`; `outside` emits the typed trigger after an
outside interaction. Pointerdown followed by focusin for the same target is
coalesced. The directive adds no semantics, focus management, or keyboard
behavior; consumers supply those for the host content.

### `bulud-ng/resize-observer`

Exports `BuludResizeObserver` and `BuludElementSize` (`width`, `height`). The
`enabled` input defaults to true and `sizeChange` emits content-box dimensions.
The initial asynchronous measurement is emitted, identical consecutive sizes
are suppressed, and unavailable browser observation APIs produce no fake
measurement. The directive adds no ARIA or interaction semantics.

### `bulud-ng/digits`

Exports `BuludPersianDigitsPipe`, `BuludEnglishDigitsPipe`, and
`BuludDigitPipeValue` (`string | number | null | undefined`). The Persian pipe
converts ASCII digits to Persian digits; the English pipe converts Persian
digits to ASCII. Other text is preserved and nullish values render as `''`.

### `bulud-ng/initials`

Exports `BuludInitialsPipe` and `BuludInitialsPipeValue`
(`string | null | undefined`). It trims/collapses Unicode whitespace, takes the
first Unicode grapheme of each word, and joins the graphemes without a
separator. Nullish and blank values render as `''`; emoji and combining/script
clusters are preserved.

### `bulud-ng/filesize`

Exports `BuludFileSizePipe`, `BuludFileSizePipeValue`, `BuludFileSizeBase`
(`decimal` or `binary`), and `BuludFileSizeOptions` (`base`, `precision`).
Decimal uses powers of 1000 and binary uses powers of 1024. Precision accepts
integer values 0–3; invalid precision uses the default two fraction digits.
Units promote when rounded output reaches the next threshold. Non-finite,
nullish, and invalid values render as `''`; negative zero renders without a
negative sign.

## CSS entry points

`bulud-ng/theme.css` contains explicit light/dark CSS custom-property defaults.
`bulud-ng/tailwind.css` maps the shared color, shape, and control-size tokens
to Tailwind CSS 4 utilities. Neither stylesheet is auto-injected.
