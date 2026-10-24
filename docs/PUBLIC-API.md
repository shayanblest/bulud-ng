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

### Angour, forms and shared configuration

Additional root exports are `BULUD_ANGOUR_TOKENS`, `BULUD_ANGOUR_LIGHT_THEME`,
`BULUD_ANGOUR_DARK_THEME`, `BuludRadioTheme`, `BuludDatepickerTheme`, and
`BuludDatepickerLocale`. Import the Angour CSS explicitly; the application owns
ancestor light/dark and direction attributes.

`BULUD_SHARED_UI_CONFIG`, `BuludSharedUiConfig`, `BuludSharedUiFeature`,
`BuludSharedUiTheme`, and `buludSharedUiStyles` configure the shared feature
surfaces. The style helper resolves instance theme, component theme, global
shared theme, then inherited CSS defaults. No stylesheet is automatically
injected. See [shared configuration](../projects/bulud-ng/SHARED.md#shared-typed-theme-configuration)
for a typed provider example. Theme and datepicker locale additions retain
partial consumer configuration support.

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
Nullable/default Angular Forms controls may pass `null` to `writeValue` when
`reset()` has no explicit value; `nonNullable` controls reset to their initial
value instead. Only `true` renders as checked, so `null` and other non-true
writes render unchecked. A changed `writeValue` is reflected through the
generated `checkedChange` model output because it uses the checked model setter.
This output is distinct from the registered Forms `onChange` callback, which
`writeValue` does not call. User changes call Forms change callbacks, blur marks
touched, required returns `{ required: true }`, and Forms disabled state combines
with the instance input.

### `bulud-ng/switch`

Exports `BuludSwitch`. Inputs include `appearance` (`default` or icon-based
`theme`), `checked`, `disabled`, `required`, `invalid`,
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
(`'pointerdown' | 'focusin'`), and `BuludClickOutsideEvent` with readonly
`trigger: BuludClickOutsideTrigger`. The standalone directive's selector is
`[buludClickOutside]`. Inputs are `enabled: boolean` (default `true`) and
`triggers: readonly BuludClickOutsideTrigger[]` (default
`['pointerdown', 'focusin']`); `outside` emits `BuludClickOutsideEvent` after
an outside interaction.

Interactions on the host or its descendants do not emit. With both triggers
enabled, pointerdown followed by focusin on the same outside target is coalesced
into one event with `trigger: 'pointerdown'`. Duplicate configured triggers are
deduplicated. Disabling or destroying the directive removes its document
listeners. It runs only in the browser; during SSR it installs no listeners and
emits no fake outside events.

The directive adds no semantics, focus management, keyboard behavior, theme
contract, or Forms contract. Consumers own accessible names, roles, ARIA
relationships/state, and keyboard/focus behavior for the UI using it. The
[ClickOutside section of the consumer guide](../projects/bulud-ng/README.md#clickoutside)
contains import and usage examples and the complete input/output contract.

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

## Angour preset exports (root entry point)

| Export                     | Kind  | Purpose                                                          |
| -------------------------- | ----- | ---------------------------------------------------------------- |
| `BULUD_ANGOUR_TOKENS`      | const | Readonly Angour palettes, spacing, typography, radii and shadows |
| `BULUD_ANGOUR_LIGHT_THEME` | const | Light theme configuration for the existing theme helpers         |
| `BULUD_ANGOUR_DARK_THEME`  | const | Dark theme configuration for the existing theme helpers          |

Explicit style exports: `bulud-ng/angour.css` and `bulud-ng/angour-base.css`.
See [Angour application foundations](ANGOUR.md) for API behavior, examples,
precedence, switching and accessibility responsibilities. No existing public
export or dependency is removed.

## Radio and Datepicker

- `bulud-ng/radio`: `BuludRadioGroup`, `BuludRadio`, `BuludRadioValue`.
- `bulud-ng/datepicker`: `BuludDatepicker`, `BuludCalendar`, `BuludDatepickerMode`,
  `BuludDatepickerValue`, `BuludDatepickerConfig`, `BULUD_DATEPICKER_CONFIG`,
  `provideBuludDatepicker`.
- Root theme types: `BuludRadioTheme`, `BuludDatepickerTheme`; optional `radio`
  and `datepicker` sections in theme configuration and resolved defaults.
- Root locale type: `BuludDatepickerLocale`; optional `BuludLocale.datepicker`
  and partial locale configuration, with English/Persian strings.

See [Angour form controls](FORM-CONTROLS.md) for typed inputs, outputs, Forms,
configuration precedence, all theme hooks, accessibility, and usage examples.

### `bulud-ng/validators`

Exports `buludRequiredText`, `buludFiniteNumber`, `buludHttpUrl`, `buludIsoDate`,
and `buludMatchFields(first, second)`. These compose with Angular validators;
see [BASE.md](BASE.md) for error keys, examples and the updated Dropdown/Radio
validation and error-relationship inputs.

## Reusable Angour shared transfer

See [SHARED.md](../projects/bulud-ng/SHARED.md) for the complete typed public surface and usage examples.

Secondary entries added: `bulud-ng/query`, `bulud-ng/table`, `bulud-ng/otp`, `bulud-ng/file-upload`, `bulud-ng/tooltip`, `bulud-ng/feedback`, `bulud-ng/rating`, `bulud-ng/stepper`, `bulud-ng/carousel`, `bulud-ng/countdown`, `bulud-ng/utilities`.

Root adds only `BULUD_SHARED_UI_CONFIG`, `BuludSharedUiConfig`, `BuludSharedUiTheme`, `BuludSharedUiFeature`, `buludSharedUiStyles`. Feature implementation stays tree-shakable in secondary entry points. No dependency changes.

### `bulud-ng/table`

Exports `BuludTable`, `BuludTableColumn`, `BuludTableSort`, `BuludTableLabels`,
`BuludTableCellContext`, `BuludTableCell`, `BuludTableDetail`, `BuludTableFilters`,
`BuludTableFilterDefinition`, `BuludTableFilterValues`, `filterBuludTableRows`,
and `buildBuludTableFilterQuery`. Filters are opt-in, composed with local
sorting/paging or emitted in server mode; invalid active typed filters match no
local rows. The explicit query bridge validates/escapes values. Icon-only detail
buttons preserve localized labels, expansion state and controls relationship.
See [SHARED.md](../projects/bulud-ng/SHARED.md) for input defaults, examples and keyboard behavior.

### `bulud-ng/textarea`

Exports `BuludTextarea`, a native textarea styling directive. Inputs are `theme`
and `buludTextareaInvalid` (false). Import the optional Angour base skin. Native
Angular forms, validators, editing and resize continue to work. The consumer
supplies a visible label, validation rules and error description.
See [SHARED.md](../projects/bulud-ng/SHARED.md) for usage and precedence.

### `bulud-ng/loading-bar`

Exports `BuludLoadingBar` and `BuludLoadingService`. The bar follows concurrent
service tasks, or explicit `active`/`value` inputs, and exposes named determinate
or indeterminate progress. Other inputs are `label` and `theme`. Service methods
are `start`, `update`, `finish`, `during`; reactive state is `active`/`progress`.
See [SHARED.md](../projects/bulud-ng/SHARED.md) for cleanup, router composition and defaults.

### `bulud-ng/charts`

Exports `BuludChart`, `BuludLinePoint`, `BuludCandlePoint`, `BuludChartType`,
`BuludChartLabels`, `buludChartDomain`, `BuludDonutChart`,
`BuludDonutSegment`, and `BuludProgress`. The responsive SVG has line/candlestick
modes, typed data validation, localized labels, empty/loading/error/disabled
states, theme precedence, and an accessible data table. It has no chart-package
dependency. See [SHARED.md](../projects/bulud-ng/SHARED.md) for inputs, limits and usage.

### `bulud-ng/file-upload`

Exports `BuludFileUpload`, `BuludFileConstraints`, `validateBuludFiles`,
`BuludUploadOptions`, `BuludUploadEvent`, `BuludUploadError`,
`BuludUploadService` and `BULUD_UPLOAD_REQUEST_FACTORY`. Native selection, Forms
validation, drag/drop, bounded raster previews and object-URL cleanup are
independent of optional multipart transport. Explicit Upload starts a request;
progress, cancel, retry and error states are supported. No business endpoint or
auth configuration is embedded. See [SHARED.md](../projects/bulud-ng/SHARED.md) for all typed
inputs, constraints, events, adapter responsibilities and usage examples.

### `bulud-ng/skeleton`

Exports `BuludSkeleton` and `BuludSkeletonShape`. Bounded CSS-only line, circle,
thumbnail and card loading placeholders; animation, reduced motion, opt-in
announcement and shared theme configuration. See the packaged shared guide.

### `bulud-ng/confirm`

Exports `BuludConfirm` and `BuludConfirmKind`. Controlled create/confirm/reject
composition of the accessible dialog and button; async processing guards,
localized action labels, safe content projection and focus restoration.

### `bulud-ng/feedback`

Exports `BuludAlert`, `BuludNotifications`, `BuludNotificationService`,
`BuludNotice`, `BuludNoticeKind`. Nine alert kinds, title/icon, projected actions,
controlled dismissal and a shared immutable notification outlet. See
[SHARED.md](../projects/bulud-ng/SHARED.md) for usage and defaults.

### `bulud-ng/avatar`

Exports `BuludAvatar`. Inputs are `name`, optional image `src`, accessible
`label`, and partial `theme`. A failed image falls back to up to two initials;
the host has image semantics and the visible name or explicit label supplies
its accessible name. It has no Forms contract or outputs.

```html
<bulud-avatar name="Example User" label="Account owner" />
```

### `bulud-ng/empty-state`

Exports `BuludEmptyState`. Required `title`, optional `description` and `theme`
render an empty result with projected actions and an optional `[buludEmptyIcon]`.
Use a meaningful heading and native, named buttons for any recovery action.
There are no custom outputs or Forms behavior.

```html
<bulud-empty-state title="No results" description="Try another search">
  <button type="button" (click)="clearSearch()">Clear search</button>
</bulud-empty-state>
```

### `bulud-ng/field-label`

Exports `BuludFieldLabel`, applied to a native label, legend or span. Inputs are
`control` (an Angular control or null), optional `required` override, and `theme`.
It reacts to required-validator metadata and control events; it does not probe
validators with fake values. The star is decorative; consumers retain native
label association and the actual control's required/error semantics.

```html
<label for="email" buludFieldLabel [control]="email">Email</label> <input id="email" [formControl]="email" />
```

### `bulud-ng/radio`

Exports `BuludRadioGroup`, `BuludRadio`, and `BuludRadioValue` (`string | number`).
The group supports a `value` model, required/disabled/invalid state, accessible
name/description/error relationships and partial theme. Each projected radio
requires a `value` and accepts disabled state and an accessible name.
The group implements ControlValueAccessor and Validator; native radio controls
supply keyboard selection. Provide visible option labels and a group name.
See [form controls](FORM-CONTROLS.md) for all inputs and configuration.

```html
<bulud-radio-group aria-label="Plan" [(value)]="plan">
  <bulud-radio value="basic">Basic</bulud-radio>
  <bulud-radio value="pro">Pro</bulud-radio>
</bulud-radio-group>
```

### `bulud-ng/datepicker`

Exports `BuludDatepicker`, `BuludCalendar`, `BuludDatepickerMode`,
`BuludDatepickerValue`, `BuludDatepickerConfig`, `BULUD_DATEPICKER_CONFIG`,
`provideBuludDatepicker`, `BuludCalendarDate`, `buludCalendarDate`,
`buludCalendarParts`, and `buludParseIsoDate`. The Forms control supports
single/range dates, Gregorian/Persian calendars, min/max bounds, required and
disabled states. Configuration precedence and full typed inputs are in
[form controls](FORM-CONTROLS.md). Supply a visible label. Keyboard calendar
navigation, focus restoration and localized announcements are built in.

A non-null date or range exposes a localized pointer-accessible clear action;
clearing restores trigger focus and preserves required validation semantics.

The pure helpers convert calendar parts to a UTC-noon Date or null, read
calendar-qualified parts, and strictly parse real four-digit ISO dates.

```html
<bulud-datepicker label="Start date" [formControl]="startDate" />
```

### `bulud-ng/period-picker`

Exports `BuludPeriodPicker`, `BuludPeriodValue`, `BuludPeriodRange`, and
`buludPeriodRange`. The value is `{calendar, year, month?}`; `mode` selects
month or year, with `label`, `calendar`, `language`, `min`, `max`, `required`,
`disabled`, `invalid`, description/action labels and `theme` inputs. The value
model emits changes and supports ControlValueAccessor/Validator. The helper
returns inclusive four-digit ISO `{from,to}` boundaries or null. Gregorian year
9999 and its December end at `9999-12-31`.

Native year/month controls support keyboard activation; supply a label and
an error description. Malformed/reversed bounds return `periodBounds`; invalid
values/configuration and out-of-bounds values have distinct validation errors.
See [period contracts](../projects/bulud-ng/SHARED.md#added-apis).

```html
<bulud-period-picker label="Reporting month" [formControl]="period" required />
```

### `bulud-ng/query`

Exports `BuludQueryValue`, `BuludQueryParams`, `BuludQuerySource`,
`BuludListRequest`, `BuludListFilter`, `BuludFilters`, `readBuludQuery`,
`convertToRequestParams`, `parseFilters`, `buildFilterString`,
`updateBuludQuery`, and `BuludQueryService`. Pure helpers accept a query string,
URL, parameters or parameter record, map paging to bounded take/skip, parse and
serialize filters, and immutably patch a URL. The injectable facade adds
`toHttpParams` and performs no navigation or network request. No UI or ARIA
behavior is introduced; consumers validate backend field/operator permissions.
See [query grammar and examples](../projects/bulud-ng/SHARED.md#url--list-request-and-filters-bulud-ngquery).

```ts
import { convertToRequestParams } from "bulud-ng/query";
const request = convertToRequestParams("?page=2&take=10");
// {take: 10, skip: 10}
```

### `bulud-ng/otp`

Exports `BuludOtp` and `normalizeBuludOtp`. Inputs include required accessible
`label`, `length`, required/disabled/invalid states, `describedBy` and `theme`. The Forms
value is a string; `completed` emits the normalized complete code.
The native text input supports normalized Latin/Persian/Arabic digits, paste
and one-time-code autofill; Forms callbacks and validation operate on the
normalized string. The helper normalizes digit text independently. Consumers
provide a meaningful label and an associated validation message.

```html
<bulud-otp label="Verification code" [formControl]="code" [length]="6" required />
```

### `bulud-ng/rating`

Exports `BuludRating`, a labeled native radio rating group with five fixed values (1–5),
required/disabled/invalid states, `describedBy` and `theme`. The Forms value is
a number; there is no configurable maximum or public value model. It implements Forms change,
touched, disabled and required/range validation. Native radio keyboard behavior
is retained; callers supply the required group label. Stars use the active theme.

```html
<bulud-rating label="Rating" [formControl]="rating" />
```

### `bulud-ng/tooltip`

Exports `BuludTooltip`, a component with required `text` and optional
`theme`. Project one focusable trigger inside it. It displays plain text on hover/focus, associates its generated
accessible description with the trigger and closes on Escape or focus exit.
Provide a keyboard-focusable, named trigger; the tooltip is supplemental and
must not be the only source of an action's name.

```html
<bulud-tooltip text="Refresh the list">
  <button type="button">Refresh</button>
</bulud-tooltip>
```

### `bulud-ng/stepper`

Exports `BuludStepper` and `BuludStep`. The container requires `label` and accepts
an `active` index model, `disabled` and `theme`. Named projected templates use
`buludStep` and may be disabled. Native step buttons support Enter/Space and
expose the current step; callers provide unique, meaningful names and form
validation before advancing. See [steps and slides](../projects/bulud-ng/SHARED.md#steps-and-slides).

```html
<bulud-stepper label="Setup" [(active)]="step">
  <ng-template buludStep="Account">Account form</ng-template>
  <ng-template buludStep="Review">Review details</ng-template>
</bulud-stepper>
```

### `bulud-ng/carousel`

Exports `BuludCarousel` and `BuludSlide`. Inputs are required `label`, an `active`
index model, `disabled`, previous/next action labels and `theme`. Projected
`buludSlide` templates provide slide names; `[buludCarouselEmpty]` supplies the
empty state. Manual native controls announce position and stop at boundaries;
there is no autoplay. Provide meaningful region and slide names.

```html
<bulud-carousel label="Highlights">
  <ng-template buludSlide="First highlight">First</ng-template>
  <ng-template buludSlide="Second highlight">Second</ng-template>
</bulud-carousel>
```

### `bulud-ng/countdown`

Exports `BuludCountdown`. Inputs are required accessible `label`, an epoch-
millisecond `deadline` or null, and `theme`; `expired` emits once per deadline.
The timer uses elapsed wall-clock time, cleans up on destruction, and schedules
nothing for invalid/null deadlines or on the server. Its timer has live
announcements off; consumers may announce expiration once.

```html
<bulud-countdown label="Time remaining" [deadline]="deadlineMs" (expired)="onExpiry()" />
```

### `bulud-ng/chat`

Exports `BuludChat`, `BuludChatMessage`, `BuludChatAttachment`, and
`BuludChatLabels`. Controlled inputs include `messages`, a `draft` model,
`disabled`, `loading`, `sending`, `error`, `maxLength`, `language`, `timeZone`,
partial `labels` and `theme`. Send/retry/attachment intents are emitted; the
component owns no backend or message persistence. The application updates the
immutable transcript and upload/transport state. Incoming/outgoing bubbles
inherit RTL/LTR and theme. The transcript has log semantics, composer has a
visible label, and scrolling follows new messages only when already near the
bottom. See [chat contract and complete example](../projects/bulud-ng/SHARED.md#controlled-chat-bulud-ngchat).

```html
<bulud-chat [messages]="messages" [(draft)]="draft" language="en" (send)="sendMessage($event)" />
```

### `bulud-ng/utilities`

Exports pure display pipes `BuludFileExtensionPipe`, `BuludIsImagePipe`,
`BuludMaskEmailPipe`, `BuludPascalCasePipe`, `BuludCardNumberPipe`,
`BuludTimestampPipe`, `BuludDateTimePipe`, `BuludUnixTimeConverterPipe`,
`BuludNumberPipe`, `BuludRelativeTimePipe`, `BuludDurationPipe`,
`BuludTruncatePipe`, and `BuludFallbackPipe`. Helpers are `buludFileExtension`,
`buludUnixTimestamp`, `buludDateRange`, `buludRemoveEmptyFields`,
`buludShiftYears`, `buludSecondsUntil`, and `buludTimeSlots`, with
`BuludDatePeriod` and `BuludTimeSlot` types. Injectable facades are
`BuludDateService`, `BuludConnectionService`, and `BuludPasswordService`.

Dates have explicit units and bounded Intl caches; malformed display values
use documented fallbacks. Relative time accepts an explicit current time and
creates no interval. Connectivity is browser connectivity with null on SSR;
password generation uses cryptographic randomness. These APIs add no ARIA
semantics or network requests. Supply context/labels around rendered values.
See [utilities](../projects/bulud-ng/SHARED.md#utilities-bulud-ngutilities) and
[pure display pipes](../projects/bulud-ng/SHARED.md#pure-general-pipes-bulud-ngutilities)
for signatures, defaults and usage.

```html
{{ 1735689600 | buludDateTime:false:'fa':'UTC' }} {{ 'user@example.com' | buludMaskEmail }}
```
