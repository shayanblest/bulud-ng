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

### Configuration without eager component imports

Global providers may import `BULUD_ACCOUNT_CARD_CONFIG`, `BULUD_FILE_UPLOAD_CONFIG`, `BULUD_DROPDOWN_DATA_CONFIG` and `BULUD_CHART_ENGINE_CONFIG` from `bulud-ng`. These are the same tokens re-exported by their individual features. Root imports avoid loading renderers in the application shell. Associated types are `BuludAccountCardConfig`, `BuludUploadIssue`, `BuludFileUploadConfig`, `BuludDropdownDataConfig` and `BuludChartEngineConfig`; their fields and callbacks retain the feature contracts documented below.

```ts
import { BULUD_ACCOUNT_CARD_CONFIG } from 'bulud-ng';
// In the application's providers:
{ provide: BULUD_ACCOUNT_CARD_CONFIG, useValue: { navigate: (kind, id) => openAccount(kind, id) } }
```

These tokens add no markup or keyboard behavior; accessibility remains the responsibility of the corresponding component and the application's navigation callback.

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

### `bulud-ng/access`

Structural permission checks with project-supplied scopes and explicit any/all/not rules. The consuming project decides whether permission enforcement applies.

Public exports: `BULUD_ACCESS_CONFIG`, `BuludAccess`, `BuludAccessConfig`, `BuludAccessRule`, `BuludAccess`, `buludMatchesAccess`.

```ts
<span *buludHasAccess="'documents:L'">Documents</span>
```

Permission changes react to supplied signals; no token decoding or project authentication dependency is included.

Public exports: `BuludAccess`, `BULUD_ACCESS_CONFIG`, `buludMatchesAccess`, `BuludAccessRule`, `BuludAccessConfig`.

### `bulud-ng/accordion`

Exports `BuludAccordion`, `BuludAccordionItem`, `BuludAccordionId`, and
`BuludAccordionMode` (`single` or `multiple`). Accordion inputs are `multiple`,
`collapsible`, and model `expanded`; `expandedChange` is the output. Item inputs
are required `buludAccordionItem` and `disabled`; projection markers are
`buludAccordionTrigger` and `buludAccordionPanel`. Consumers provide unique
item IDs and meaningful trigger content. Enter/Space activate; Up/Down and
Home/End move among enabled items; panels expose the generated region
relationship and focus returns to a trigger when needed.

Public exports: `BuludAccordionId`, `BuludAccordionMode`, `BuludAccordionItem`, `BuludAccordion`.

### `bulud-ng/account-card`

Presentational account/wallet card with numeric balance, credit and disabled state.

Public exports: `BULUD_ACCOUNT_CARD_CONFIG`, `BuludAccountCard`, `BuludAccountCardConfig`, `BuludAccountCardState`.

```ts
<bulud-account-card accountId="42" accountType="MT" cardType="real" [balance]="100" />
```

Navigation is disabled unless showDetails is enabled. Interactive cards support Enter and Space; route/API policies belong to the project navigation callback. Labels follow the runtime translation provider with portable English fallbacks.

Public exports: `BuludAccountCard`, `BULUD_ACCOUNT_CARD_CONFIG`, `BuludAccountCardState`, `BuludAccountCardConfig`.

### `bulud-ng/appearance`

Named theme and sidebar state with optional storage and API callbacks.

Public exports: `BULUD_APPEARANCE_CONFIG`, `BuludAppearance`, `BuludAppearanceConfig`, `BuludSidebarState`, `BuludThemeName`.

```ts
const appearance = inject(BuludAppearance);
appearance.setTheme("dark");
```

The configured theme attribute belongs to the consuming document. Arbitrary theme names are supported; cookie domains and user APIs stay in project callbacks.

Public exports: `BuludThemeName`, `BuludSidebarState`, `BuludAppearanceConfig`, `BULUD_APPEARANCE_CONFIG`, `BuludAppearance`.

### `bulud-ng/avatar`

Exports `BuludAvatar`. Inputs are `name`, optional image `src`, accessible
`label`, and partial `theme`. A failed image falls back to up to two initials;
the host has image semantics and the visible name or explicit label supplies
its accessible name. It has no Forms contract or outputs.

```html
<bulud-avatar name="Example User" label="Account owner" />
```

Public exports: `BuludAvatar`.

### `bulud-ng/badge`

Exports `BuludBadge`, `BuludBadgeVariant` (`neutral`, `primary`, `success`,
`warning`, `danger`), and `BuludBadgeSize` (`small`, `medium`, `large`). Inputs
are `variant`, `size`, `dot`, `dismissible`, and `dismissLabel`; `dismissed`
emits `void` once per user activation. The Badge is passive text unless
dismissible, has no Forms contract, and consumers own removal and focus
placement after dismissal.

Public exports: `BuludBadgeVariant`, `BuludBadgeSize`, `BuludBadge`.

### `bulud-ng/button`

Exports `BuludButton`, `BuludButtonVariant` (`primary`, `secondary`, `danger`,
`ghost`), `BuludButtonSize` (`small`, `medium`, `large`), and
`BuludButtonType` (`button`, `submit`, `reset`). Inputs are `type`, `variant`,
`size`, `disabled`, `loading`, `fullWidth`, `aria-label`, and `loadingLabel`.
It has no custom output; native `click` is used. It renders a native button,
defaults to `type="button"`, exposes `aria-busy` and localized live status while
loading, and uses native Enter/Space activation. Consumers provide an
accessible name for icon-only or empty content.

Public exports: `BuludButtonVariant`, `BuludButtonSize`, `BuludButtonType`, `BuludButton`.

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

Responsive projected multi-card carousel with breakpoints, steps, default index and drag gestures.

Public exports: `BULUD_CAROUSEL_CONFIG`, `BuludCarouselLayout`, `BuludCarousel`, `BuludCarouselConfig`.

```ts
<bulud-carousel presentation="multi" label="Accounts"><article>Card one</article><article>Card two</article></bulud-carousel>
```

Provide meaningful labels for projected cards. Controls retain keyboard focus and react to viewport and direction changes.

Native scroll carousel with projected slides, default index, dots, drag and swipe.

Public exports: `BuludCarousel`.

```ts
<bulud-carousel presentation="scroll" label="Promotions"><article>First slide</article><article>Second slide</article></bulud-carousel>
```

Initialization and resize use instant positioning to avoid interaction with a document-level smooth-scroll rule.

Public exports: `BuludCarouselLayout`, `BuludCarouselConfig`, `BULUD_CAROUSEL_CONFIG`, `BuludSlide`, `BuludCarousel`.

### `bulud-ng/chart-engine`

Lazy external chart-engine loading, shared cache and reactive option forwarding.

Public exports: `BULUD_CHART_ENGINE_CONFIG`, `BuludChartEngine`, `BuludChartEngineConfig`, `BuludChartHost`.

```ts
{ provide: BULUD_CHART_ENGINE_CONFIG, useValue: { load: () => import('project-chart-engine').then(module => module.ChartComponent) } }
```

The library does not depend on an external chart package. The consuming project chooses a component with typed inputs matching its options. The host announces loading and errors and destroys cleared chart instances.

Public exports: `BuludChartHost`, `BuludChartEngine`, `BULUD_CHART_ENGINE_CONFIG`, `BuludChartEngineConfig`.

### `bulud-ng/charts`

Exports `BuludChart`, `BuludLinePoint`, `BuludCandlePoint`, `BuludChartType`,
`BuludChartLabels`, `buludChartDomain`, `BuludDonutChart`,
`BuludDonutSegment`, and `BuludProgress`. The responsive SVG has line/candlestick
modes, typed data validation, localized labels, empty/loading/error/disabled
states, theme precedence, and an accessible data table. It has no chart-package
dependency. See [SHARED.md](../projects/bulud-ng/SHARED.md) for inputs, limits and usage.

Segmented donut with per-item colors, projected rich-tooltip callback and translated center label.

Public exports: `BuludDonutChart`.

```ts
<bulud-donut-chart [data]="assets" valueKey="rank" labelField="symbol" />
```

The consuming project supplies a lazy chart engine. Theme changes recompute the inherited palette. Plain item labels and explicit rich HTML callbacks are separate inputs.

Candle chart options preserving four-percent axis margins, precision and rich tooltip behavior.

Public exports: `BuludChart`.

```ts
<bulud-chart [series]="candles" [digits]="2" />
```

Provide the lazy external engine in the consuming project. Empty, malformed and non-finite candle series do not load an engine. Financial data and business rules stay in the project.

Public exports: `buludChartDomain`, `BuludLinePoint`, `BuludCandlePoint`, `BuludChartType`, `BuludChartLabels`, `BuludChart`, `BuludDonutSegment`, `BuludDonutChart`, `BuludProgress`.

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

Public exports: `BuludChatAttachment`, `BuludChatMessage`, `BuludChatLabels`, `BuludChat`.

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

Public exports: `BuludCheckbox`.

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

Public exports: `BuludClickOutsideTrigger`, `BuludClickOutsideEvent`, `BuludClickOutside`.

### `bulud-ng/confirm`

Exports `BuludConfirm` and `BuludConfirmKind`. Controlled create/confirm/reject
composition of the accessible dialog and button; async processing guards,
localized action labels, safe content projection and focus restoration.

Public exports: `BuludConfirmKind`, `BuludConfirm`.

### `bulud-ng/countdown`

Exports `BuludCountdown`. Inputs are required accessible `label`, an epoch-
millisecond `deadline` or null, and `theme`; `expired` emits once per deadline.
The timer uses elapsed wall-clock time, cleans up on destruction, and schedules
nothing for invalid/null deadlines or on the server. Its timer has live
announcements off; consumers may announce expiration once.

```html
<bulud-countdown label="Time remaining" [deadline]="deadlineMs" (expired)="onExpiry()" />
```

Unix-seconds countdown with start/stop and completion output.

Public exports: `BuludCountdown`.

```ts
<bulud-countdown label="Countdown" format="mm:ss" #timer (timeUp)="finished()" />
```

The timer releases its interval on stop or destruction. Icon content can be projected; repeated countdown updates do not steal focus.

Public exports: `BuludCountdown`.

### `bulud-ng/date-range`

Local calendar range calculations for shared preset date filters.

Public exports: `BuludDateRangeService`, `BuludUnixDateRange`.

```ts
const ranges = inject(BuludDateRangeService);
```

Native Date rollover behavior is retained; callers choose the calendar range and presentation.

Public exports: `BuludUnixDateRange`, `BuludDateRangeService`.

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

Public exports: `BuludDatepicker`, `BULUD_DATEPICKER_CONFIG`, `provideBuludDatepicker`, `BuludCalendar`, `BuludDatepickerMode`, `BuludDatepickerValue`, `BuludDatepickerConfig`, `buludCalendarDate`, `buludCalendarParts`, `buludParseIsoDate`, `BuludCalendarDate`, `BuludDatepickerData`, `localDateIso`, `timestampIso`, `isoTimestamp`, `isoLocalDate`, `displayDate`.

### `bulud-ng/default-404-image`

Default missing-page artwork embedded in an independent, deferred import.

Public exports: `BuludDefault404Image`.

```ts
<bulud-default-404-image alt="Page not found" />
```

This entry contains the original Angour image and no project asset dependency. It is loaded only by the illustrated empty-state fallback when no usable custom image is available.

Public exports: `BuludDefault404Image`.

### `bulud-ng/dialog`

Exports `BuludDialog` and `BuludDialogCloseReason` (`escape` or `backdrop`).
Inputs are model `open`, `aria-label`, `aria-labelledby`, `aria-describedby`,
`closeOnEscape`, `closeOnBackdrop`, `initialFocus`, and partial instance
`theme`. Outputs are `openChange` and `closeRequest`; `close()` is the public
programmatic method. The modal supplies dialog semantics, focus placement,
dynamic Tab/Shift+Tab trapping, Escape/backdrop policy, and focus restoration.
Consumers provide a unique accessible name/description relationship and should
project a visible close action.

Imperative open/close, closability and mobile swipe lifecycle for native dialogs.

Public exports: `BuludModalControl`.

```ts
<bulud-dialog buludModalControl #modal="buludModalControl" [open]="modal.isOpen()" aria-label="Confirmation">Content</bulud-dialog>
```

Use closable.set(false) while a project request must block closing. The native dialog manages focus; destruction does not emit a user-close callback.

Public exports: `BuludModalControl`, `BuludDialogCloseReason`, `BuludDialog`.

### `bulud-ng/digits`

Exports `BuludPersianDigitsPipe`, `BuludEnglishDigitsPipe`, and
`BuludDigitPipeValue` (`string | number | null | undefined`). The Persian pipe
converts ASCII digits to Persian digits; the English pipe converts Persian
digits to ASCII. Other text is preserved and nullish values render as `''`.

Public exports: `BuludDigitPipeValue`, `BuludPersianDigitsPipe`, `BuludEnglishDigitsPipe`.

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

Scalar-ID forms bridge, multiple selection, remote-search projection and externally defined child validation.

Public exports: `BULUD_DROPDOWN_DATA_CONFIG`, `BuludDropdownData`, `BuludDropdownDataConfig`.

```ts
<bulud-dropdown buludDropdownData #data="buludDropdownData" valueField="id" [options]="options" [compareWith]="data.compare" [formControl]="selectedId" />
```

The forms bridge keeps scalar API values and projected option objects separate. Dynamic child-control lookup is a project callback; native option focus and panel behavior are retained.

Public exports: `BuludDropdownData`, `BULUD_DROPDOWN_DATA_CONFIG`, `BuludDropdownDataConfig`, `BuludDropdownOptionTemplateContext`, `BuludDropdownSelectedTemplateContext`, `BuludDropdown`.

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

Responsive illustrated empty/not-found page with configurable image, title, action label and project navigation callback.

Public exports: `BULUD_EMPTY_STATE_CONFIG`, `BuludEmptyState`, `BuludEmptyStateConfig`.

```ts
<bulud-empty-state image="/project/missing.webp" title="Page missing" actionLabel="Home" (action)="home()" />
```

Content precedence is instance, component defaults, global config, then library defaults. Missing or broken images use the deferred default artwork. Supply a suitable imageAlt for informative artwork; decorative artwork may keep it empty. No router or project asset path is required.

Public exports: `BuludEmptyState`, `BULUD_EMPTY_STATE_CONFIG`, `BuludEmptyStateConfig`.

### `bulud-ng/feedback`

Exports `BuludAlert`, `BuludNotifications`, `BuludNotificationService`,
`BuludNotice`, `BuludNoticeKind`. Nine alert kinds, title/icon, projected actions,
controlled dismissal and a shared immutable notification outlet. See
[SHARED.md](../projects/bulud-ng/SHARED.md) for usage and defaults.

Public exports: `BuludNoticeKind`, `BuludNotice`, `BuludNotificationService`, `BuludAlert`, `BuludNotifications`.

### `bulud-ng/field-label`

Exports `BuludFieldLabel`, applied to a native label, legend or span. Inputs are
`control` (an Angular control or null), optional `required` override, and `theme`.
It reacts to required-validator metadata and control events; it does not probe
validators with fake values. The star is decorative; consumers retain native
label association and the actual control's required/error semantics.

```html
<label for="email" buludFieldLabel [control]="email">Email</label> <input id="email" [formControl]="email" />
```

Public exports: `BuludFieldLabel`.

### `bulud-ng/file-upload`

Exports `BuludFileUpload`, `BuludFileConstraints`, `validateBuludFiles`,
`BuludUploadOptions`, `BuludUploadEvent`, `BuludUploadError`,
`BuludUploadService` and `BULUD_UPLOAD_REQUEST_FACTORY`. Native selection, Forms
validation, drag/drop, bounded raster previews and object-URL cleanup are
independent of optional multipart transport. Explicit Upload starts a request;
progress, cancel, retry and error states are supported. No business endpoint or
auth configuration is embedded. See [SHARED.md](../projects/bulud-ng/SHARED.md) for all typed
inputs, constraints, events, adapter responsibilities and usage examples.

Image/CSV upload, constrained image resizing, preview, progress and optional clipboard paste.

Public exports: `BULUD_FILE_UPLOAD_CONFIG`, `BuludUploadIssue`, `BuludFileUpload`, `BuludFileUploadConfig`.

```ts
<bulud-file-upload uploadType="image" (fileChange)="upload($event)" />
```

Label the native file input and configure project issue handling through the typed token. Image previews release owned object URLs; clear/destruction cancels stale image work. Project toasts and upload APIs are callbacks, not library dependencies.

Public exports: `BuludUploadIssue`, `BuludFileUploadConfig`, `BULUD_FILE_UPLOAD_CONFIG`, `BuludFileUpload`, `validateBuludFiles`, `BuludFileConstraints`, `BuludUploadOptions`, `BuludUploadEvent`, `BuludUploadError`, `BULUD_UPLOAD_REQUEST_FACTORY`, `BuludUploadService`.

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

Public exports: `BuludFileSizePipeValue`, `BuludFileSizeBase`, `BuludFileSizeOptions`, `BuludFileSizePipe`.

### `bulud-ng/initials`

Exports `BuludInitialsPipe` and `BuludInitialsPipeValue`
(`string | null | undefined`). It trims/collapses Unicode whitespace, takes the
first Unicode grapheme of each word, and joins the graphemes without a
separator. Nullish and blank values render as `''`; emoji and combining/script
clusters are preserved.

Public exports: `BuludInitialsPipeValue`, `BuludInitialsPipe`.

### `bulud-ng/input-behaviors`

Native input and button behaviors: numeric limits, grouping, length, digit mask, input filtering, keyboard conversion, and busy content.

Public exports: `BULUD_INPUT_BEHAVIORS_CONFIG`, `BuludButtonLoader`, `BuludButtonLoaderTheme`, `BuludEnglishKeyboard`, `BuludInputBehaviorsConfig`, `BuludInputFilter`, `BuludInputMask`, `BuludMaxLength`, `BuludNumberSeparator`, `BuludOnlyNumbers`, `buludEnglishKeyboardValue`.

```ts
<input buludNumberSeparator [formControl]="amount" />
```

Native labels, focus, selection and form validation remain owned by the input. Import the independent stylesheet explicitly when the loader indicator is used.

Public exports: `BuludOnlyNumbers`, `BuludNumberSeparator`, `BuludMaxLength`, `BuludInputFilter`, `BuludInputMask`, `buludEnglishKeyboardValue`, `BuludEnglishKeyboard`, `BuludButtonLoaderTheme`, `BuludInputBehaviorsConfig`, `BULUD_INPUT_BEHAVIORS_CONFIG`, `BuludButtonLoader`.

### `bulud-ng/language-switch`

Language dropdown driven by any project-supplied locale list.

Public exports: `BuludLanguageSwitch`.

```ts
<bulud-language-switch [languages]="projectLanguages" (languageChange)="select($event)" />
```

Each locale supplies a code and label; numeric IDs are optional. SVG symbols are built in. Empty lists disable the switch; adding or removing a locale is reactive.

Public exports: `BuludLanguageSwitch`.

### `bulud-ng/line-chart`

Exports `BuludLineChart`, `BULUD_LINE_CHART_CONFIG`, `buludLineScale`,
`BuludLineValue`, `BuludLineSeries`, `BuludLineXAxis`, `BuludLineYAxis`,
`BuludLineAxisLabelStyle`, `BuludLineChartTheme`, `BuludLineChartConfig`, and
`BuludLineSelection`. Dependency-free native SVG rendering with standalone,
signals and OnPush. Its feature-only Tailwind utilities have no preflight or
palette reset and are attached only when the component is used.

Required input: `caption` (accessible chart name). Inputs: `series`, `xaxis`,
`yaxis`, `height`, `strokeWidth`, `dashArray`, `digits`, `locale`, `theme`, `loading`,
`error`, `disabled`, `loadingLabel`, `errorLabel`, `keyboardLabel`.
`pointChange` emits the selected series/point, name, category and exact numeric
value, or null on dismissal. Multiple series, explicit axis bounds/ticks,
formatter callbacks, null gaps, negative/constant/zero/empty data, hidden axes,
custom colors and dashed lines are supported. `buludLineScale` returns null for
nonfinite data, inverted bounds or invalid tick counts; it never drops values.

`BULUD_LINE_CHART_CONFIG` resolves instance override → `defaults` component
settings → global `theme` → CSS palette. `BuludLineChartTheme` maps to
`--bulud-line-chart-*` custom properties; scoped CSS and per-instance host styles
remain usable. Directions and light/dark colors follow ancestors/CSS variables.
Optional `bulud-ng/line-chart.css` exports the generated feature utilities for
non-Angular composition. Existing `bulud-ng/charts` API is unchanged.

```ts
import { BuludLineChart } from "bulud-ng/line-chart";
// imports: [BuludLineChart]
// series = [{name: 'Current Year', data: [12, 18]},
//           {name: 'Previous Year', data: [9, 14]}];
```

```html
<bulud-line-chart caption="Yearly commission" [series]="series" [xaxis]="{categories: ['Jan', 'Feb']}" [dashArray]="[0, 6]" />
```

Keyboard: focus the named SVG; Left/Right explore points, Up/Down change series,
Home/End jump to endpoints, Escape dismisses. Pointer/touch chooses the nearest
point. Null values are skipped during keyboard exploration without connecting
across missing data. Selection is announced through a polite live description;
tooltip text is escaped. Consumers translate the caption and state/instruction
labels. Disabled charts have no tab stop or point interactions. ResizeObserver
is disconnected on destruction; SSR performs no layout reads. Demo states and
browser coverage are in `LineChartDemo` and `e2e/line-chart.spec.ts`.

Line chart internationalization: `[locale]` accepts any BCP 47 locale (including languages not used in the demo) and reacts without recreating the chart. Precedence is input → `BULUD_LINE_CHART_CONFIG.defaults.locale` → `BULUD_LINE_CHART_CONFIG.locale` → `en-US`. Invalid locale syntax falls back to `en-US`. Pass translated series names, categories, caption, `keyboardLabel`, `loadingLabel`, and `errorLabel` from your application's translation service; no language list is bundled. Direction inherits the ancestor `dir`. Axis formatters override numeric formatting. For compatibility Angour keeps the existing English numeric notation while translating its text.

Public exports: `BuludLineChart`, `BULUD_LINE_CHART_CONFIG`, `buludLineScale`, `BuludLineValue`, `BuludLineSeries`, `BuludLineXAxis`, `BuludLineYAxis`, `BuludLineAxisLabelStyle`, `BuludLineChartTheme`, `BuludLineChartConfig`, `BuludLineSelection`.

### `bulud-ng/loading-bar`

Exports `BuludLoadingBar` and `BuludLoadingService`. The bar follows concurrent
service tasks, or explicit `active`/`value` inputs, and exposes named determinate
or indeterminate progress. Other inputs are `label` and `theme`. Service methods
are `start`, `update`, `finish`, `during`; reactive state is `active`/`progress`.
See [SHARED.md](../projects/bulud-ng/SHARED.md) for cleanup, router composition and defaults.

Public exports: `BuludLoadingService`, `BuludLoadingBar`.

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

Separate digit inputs with keyboard navigation, paste, form validation and explicit unstyled hooks.

Public exports: `BULUD_OTP_CONFIG`, `BuludOtp`, `BuludOtpConfig`, `BuludOtpTheme`.

```ts
<bulud-otp layout="separate" [length]="6" [formControl]="otp" label="Verification code" />
```

Tab and arrow keys navigate digits; backspace and paste update the form. Supply the translated label and select digit policy per project.

Public exports: `normalizeBuludOtp`, `BuludOtpTheme`, `BuludOtpConfig`, `BULUD_OTP_CONFIG`, `BuludOtp`.

### `bulud-ng/pagination`

Exports `BuludPagination` and `BuludPaginationItem` (`number`,
`ellipsis-start`, or `ellipsis-end`). Inputs are `currentPage`, `pageCount`,
`disabled`, `aria-label`, `previousPageLabel`, `nextPageLabel`, `pageLabel`,
`currentPageLabel`, and `ellipsisLabel`; `pageChange` requests a new page and
does not mutate the input. It renders a navigation landmark, native buttons,
`aria-current="page"`, disabled bounds, and non-focusable localized ellipses.

Record-count and page-length bridge for native pagination and page-jump state.

Public exports: `BuludPaginationData`.

```ts
<bulud-pagination buludPaginationData #pages="buludPaginationData" [itemsCount]="total" [pageLength]="10" [pageCount]="pages.pageCount()" [currentPage]="pages.currentPage()" (pageChange)="pages.select($event)" />
```

The bridge translates record counts into pages and exposes localized navigation labels; API requests remain consuming-project handlers.

Public exports: `BuludPagination`, `BuludPaginationItem`, `BuludPaginationData`.

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

Localized month grid with individual month limits, independent year navigation and YYYY-MM output.

Public exports: `BuludPeriodPicker`.

```ts
<bulud-period-picker presentation="grid" label="Report month" [defaultDate]="date" (monthSelected)="select($event)" />
```

The trigger supports Enter and Space. The closed popup is inert; disabled months cannot be selected. monthLabels overrides locale-generated abbreviations.

Previous/next month navigation with dynamic Gregorian/Persian labels and Unix output.

Public exports: `BuludPeriodPicker`.

```ts
<bulud-period-picker presentation="navigation" [currentDate]="date" (dateChange)="select($event)" />
```

Native buttons provide keyboard activation. legacyTimestamp is an explicit migration option for historical consuming-project timestamps; it is off by default.

Public exports: `buludPeriodRange`, `BuludPeriodValue`, `BuludPeriodRange`, `BuludPeriodPicker`.

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

Public exports: `readBuludQuery`, `convertToRequestParams`, `parseFilters`, `buildFilterString`, `updateBuludQuery`, `BuludQueryValue`, `BuludQueryParams`, `BuludQuerySource`, `BuludListRequest`, `BuludListFilter`, `BuludFilters`, `BuludQueryService`.

### `bulud-ng/radial-chart`

Exports `BuludRadialChart`, `BULUD_RADIAL_CHART_CONFIG`, `BuludRadialChartTheme`
and `BuludRadialChartConfig`. A scalar percentage ring preserves the percentage
itself; it never normalizes a single value to a full distribution. The native
SVG has no chart engine or shared-root configuration dependency. Static
Tailwind utilities are attached only when the component is used, without
preflight or an automatically imported palette. Optional `bulud-ng/radial-chart.css`
exports the same feature utilities. Existing progress/donut APIs remain unchanged.

Required `label` names the SVG group and appears below the centered percentage.
`value` accepts a finite number from 0 through 100 (default 0), or null for empty.
`loading`, `error`, `disabled`, `loadingLabel`, `errorLabel`, and `emptyLabel`
control named states. `selected` is a boolean model with `selectedChange`;
pointer click/tap or Enter/Space toggles the visual selection without changing
`value`. Mouse hover lightens the ring; selection darkens it and persists after
pointer leave. Disabled rings have no tab stop or selection interaction. The
visible center text and accessible name expose the exact formatted percentage,
so no information depends on hover. Zero remains a valid zero-percent ring.

`locale` accepts any reactive BCP 47 tag. Precedence: instance → component
`defaults.locale` → global `locale` → exact JavaScript numeric text plus `%`.
Invalid locale syntax uses that exact-text fallback. Locale formatting uses
percent units directly on the original value, avoiding division/multiplication
rounding artifacts. Supply translated labels/status text from the consuming
application; there is no language enumeration. The chart keeps clockwise
geometry in RTL layouts. Resize observation is disconnected on destruction.

`theme` resolves instance → component `defaults.theme` → global `theme` →
scoped/imported CSS palette. It maps accent, track, foreground, focus,
fontFamily, labelSize, valueSize and fontWeight to `--bulud-radial-*` properties.
Scoped CSS and per-instance host style bindings remain usable. Ancestor theme
variables update the SVG without reloading. The radius, rounded caps and
name/value placement scale with available width. Loading/empty/error replace
the SVG with a status; invalid numbers are never drawn as valid percentages.

```ts
import { BuludRadialChart } from "bulud-ng/radial-chart";
// imports: [BuludRadialChart]
```

```html
<bulud-radial-chart [label]="translatedWinRate" [value]="winRate" [locale]="locale" [(selected)]="selected" />
```

Public exports: `BuludRadialChart`, `BULUD_RADIAL_CHART_CONFIG`, `BuludRadialChartTheme`, `BuludRadialChartConfig`.

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

Scalar filter selection for native radio groups, including an all-items sentinel.

Public exports: `BuludFilterData`.

```ts
<bulud-radio-group buludFilterData [activeItem]="filter" (itemChange)="select($event)"><bulud-radio value="__bulud_all__">All</bulud-radio></bulud-radio-group>
```

An undefined selected value maps to the configured sentinel. Repeated selection emits; disabled options do not change selection.

Public exports: `BuludRadio`, `BuludRadioGroup`, `BuludRadioValue`, `BuludFilterData`.

### `bulud-ng/rating`

Exports `BuludRating`, a labeled native radio rating group with five fixed values (1–5),
required/disabled/invalid states, `describedBy` and `theme`. The Forms value is
a number; there is no configurable maximum or public value model. It implements Forms change,
touched, disabled and required/range validation. Native radio keyboard behavior
is retained; callers supply the required group label. Stars use the active theme.

```html
<bulud-rating label="Rating" [formControl]="rating" />
```

Public exports: `BuludRating`.

### `bulud-ng/resize-observer`

Exports `BuludResizeObserver` and `BuludElementSize` (`width`, `height`). The
`enabled` input defaults to true and `sizeChange` emits content-box dimensions.
The initial asynchronous measurement is emitted, identical consecutive sizes
are suppressed, and unavailable browser observation APIs produce no fake
measurement. The directive adds no ARIA or interaction semantics.

Public exports: `BuludElementSize`, `BuludResizeObserver`.

### `bulud-ng/runtime`

Dynamic language, direction, translations, language list and viewport state supplied through typed callbacks and signals.

Public exports: `BULUD_RUNTIME_CONFIG`, `BuludLanguageOption`, `BuludRuntime`, `BuludRuntimeConfig`, `BuludRuntimeDirection`.

```ts
{ provide: BULUD_RUNTIME_CONFIG, useValue: { language, direction, languages, translate } }
```

There is no fixed list of supported languages. A project can add or remove locales at runtime; labels and direction update through the supplied signals.

Public exports: `BuludRuntimeDirection`, `BuludLanguageOption`, `BuludRuntimeConfig`, `BULUD_RUNTIME_CONFIG`, `BuludRuntime`.

### `bulud-ng/skeleton`

Exports `BuludSkeleton` and `BuludSkeletonShape`. Bounded CSS-only line, circle,
thumbnail and card loading placeholders; animation, reduced motion, opt-in
announcement and shared theme configuration. See the packaged shared guide.

Public exports: `BuludSkeletonShape`, `BuludSkeleton`.

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

Projected step content with named steps and imperative next/previous navigation.

Public exports: `BuludStep`, `BuludStepState`, `BuludStepper`.

```ts
<bulud-stepper presentation="content"><section buludStep="first">First step</section></bulud-stepper>
```

Step state is exposed to projected content. Scrolling is performed after rendering and respects reduced motion.

Public exports: `BuludStepState`, `BuludStep`, `BuludStepper`.

### `bulud-ng/switch`

Exports `BuludSwitch`. Inputs include `appearance` (`default` or icon-based
`theme`), `checked`, `disabled`, `required`, `invalid`,
`id`, `aria-label`, `aria-describedby`, and `aria-errormessage`; `checkedChange`
emits user changes. It implements ControlValueAccessor and Validator, renders
switch semantics, uses native Space/label activation, and treats required as
the on-state validation requirement.

Two named themes controlled by a native switch.

Public exports: `BuludThemeControl`.

```ts
<bulud-switch buludThemeControl aria-label="Dark theme" />
```

A real switch provides keyboard activation and accessible checked state. Theme state is shared with the configurable appearance service.

Public exports: `BuludSwitch`, `BuludThemeControl`.

### `bulud-ng/symbol`

Small built-in SVG symbols with an optional existing-project icon-font hook.

Public exports: `BuludSymbol`, `BuludSymbolName`.

```ts
<bulud-symbol name="calendar" />
```

Symbols are decorative and aria-hidden. Put the accessible name on the real button or input; no external icon font is required in portable mode.

Public exports: `BuludSymbol`, `BuludSymbolName`.

### `bulud-ng/table`

Exports `BuludTable`, `BuludTableColumn`, `BuludTableSort`, `BuludTableLabels`,
`BuludTableCellContext`, `BuludTableCell`, `BuludTableDetail`, `BuludTableFilters`,
`BuludTableFilterDefinition`, `BuludTableFilterValues`, `filterBuludTableRows`,
and `buildBuludTableFilterQuery`. Filters are opt-in, composed with local
sorting/paging or emitted in server mode; invalid active typed filters match no
local rows. The explicit query bridge validates/escapes values. Icon-only detail
buttons preserve localized labels, expansion state and controls relationship.
See [SHARED.md](../projects/bulud-ng/SHARED.md) for input defaults, examples and keyboard behavior.

Public exports: `BuludTableColumn`, `BuludTableSort`, `BuludTableLabels`, `BuludTableCellContext`, `BuludTableCell`, `BuludTableDetail`, `BuludTable`, `filterBuludTableRows`, `buildBuludTableFilterQuery`, `BuludTableFilterDefinition`, `BuludTableFilterValues`, `BuludTableFilters`.

### `bulud-ng/tabs`

Exports `BuludTabs`, `BuludTab`, `BuludTabPanel`, `BuludTabId`, and
`BuludTabsOrientation` (`horizontal` or `vertical`). `BuludTabs` inputs are
model `activeId`, `orientation`, and `aria-label`; `activeIdChange` is its
output. `BuludTab` requires `buludTab` and accepts `disabled`; `BuludTabPanel`
requires matching `buludTabPanel`. Native projected buttons receive tab
semantics, matching IDs, selection, and panel relationships. Consumers provide
unique IDs and an accessible tablist name when surrounding content is
insufficient.

Projected headings and panels preserving explicit selection, including hidden or invalid selection.

Public exports: `BuludTabHeading`, `BuludTabs`, `BuludTabHeading`.

```ts
<bulud-tabs presentation="projected" label="Details" activeTabName="details"><ng-template buludTabHeading="details">Details</ng-template></bulud-tabs>
```

Headers use tab roles and keyboard navigation. Panels match names without case sensitivity; heading selection remains case sensitive. Repeated selection emits.

Public exports: `BuludTabId`, `BuludTabsOrientation`, `BuludTabHeading`, `BuludTab`, `BuludTabPanel`, `BuludTabs`.

### `bulud-ng/textarea`

Exports `BuludTextarea`, a native textarea styling directive. Inputs are `theme`
and `buludTextareaInvalid` (false). Import the optional Angour base skin. Native
Angular forms, validators, editing and resize continue to work. The consumer
supplies a visible label, validation rules and error description.
See [SHARED.md](../projects/bulud-ng/SHARED.md) for usage and precedence.

Public exports: `BuludTextarea`.

### `bulud-ng/textarea-autosize`

Exports `BuludTextareaAutosize`, `BuludTextareaAutosizeConfig`,
`BULUD_TEXTAREA_AUTOSIZE_CONFIG`, and `provideBuludTextareaAutosize`. Directive
inputs are `enabled`, `minRows`, and `maxRows`; the directive has no output.
It preserves native textarea behavior and accessibility, owns height/overflow
only while enabled, restores inline styles when disabled/destroyed, and uses
instance input, directive default, global config, then library default
precedence. Consumers provide the native textarea label/description/ARIA.

Public exports: `BuludTextareaAutosize`, `provideBuludTextareaAutosize`, `BuludTextareaAutosizeConfig`, `BULUD_TEXTAREA_AUTOSIZE_CONFIG`.

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

Projected rich tooltip with imperative visibility, optional anchor positioning and cleanup.

Public exports: `BuludTooltip`.

```ts
<bulud-tooltip mode="manual" [anchor]="trigger">Details</bulud-tooltip>
```

Escape dismisses and returns focus to the anchor; outside clicks close the tooltip. Connect the triggering control to the tooltip with an accessible description.

Public exports: `BuludTooltipContent`, `BuludTooltip`.

### `bulud-ng/tour`

Generic, standalone `BuludTour`, `BuludTourOverlay`, `BuludTourTooltip` and `BuludTourTarget`.
`BuludTourStep` accepts a stable unique `id`, `targetId`, translated keys or plain
text for title/description/actions, placement and optional backdrop. Targets use
`buludTourTarget` (default ID prefix `tour-`, optionally customized). `BuludTour`
provides reactive signals and equivalent observable state, `start`, `next`,
`previous`, `end`, and `tourEnded$`; delayed or replaced starts are cancelled.
`BULUD_TOUR_CONFIG` / `BuludTourConfig` configure startup/target timeouts, a
project-owned async `prepareTarget(element,step)` callback, global theme and
component theme defaults. `BuludTourTheme` controls all surfaces, border,
geometry, width, z-index, spacing and motion; instance theme wins over component
defaults, then global theme, then imported CSS defaults.

```ts
import { BuludTour, BuludTourOverlay, BuludTourTarget } from "bulud-ng/tour";
// imports: [BuludTourOverlay, BuludTourTarget]
const tour = inject(BuludTour);
tour.start([{ id: "create", targetId: "tour-create", title: "Create a project", description: "Choose a name to continue.", nextLabel: "Next", closeLabel: "Close" }]);
```

```html
<button buludTourTarget="create">Create</button> <bulud-tour-overlay />
```

The overlay waits for delayed targets and stable layout, scrolls the nested
container, follows resize/scroll, clamps translated content to the viewport and
ends safely for missing/removed targets. It traps focus, blocks page interaction,
closes with Escape and restores the initiating focus. Dynamic language/direction
come from the runtime adapter; theme is inherited or overridden per instance.
Navigation, step lists, auth, storage and menu-opening policies remain app-owned.

Public exports: `BuludTour`, `BuludTourOverlay`, `BuludTourTooltip`, `BuludTourTarget`, `BULUD_TOUR_CONFIG`, `BuludTourConfig`, `BuludTourStep`, `BuludTourTheme`.

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

Additional public configuration and helpers: `BULUD_UTILITIES_CONFIG`, `BuludTimeUnit`, `BuludUtilitiesConfig`, `BuludUtilityFeature`, `BuludUtilityFormat`, `BuludUtilityOptions`.

## Portable shared entries

Shared UI designs use compiled static Tailwind v4 utilities and CSS custom properties. Each entry is independently importable; storage, translation, API, authentication and navigation policies are consuming-project providers. Native semantic controls supply keyboard behavior. Import a feature stylesheet only when using its standalone CSS hooks; component styles are bundled with that component.

Public exports: `buludFileExtension`, `buludUnixTimestamp`, `buludDateRange`, `buludRemoveEmptyFields`, `buludShiftYears`, `buludSecondsUntil`, `buludTimeSlots`, `BuludUtilityFormat`, `BuludTimeUnit`, `BuludUtilityFeature`, `BuludUtilityOptions`, `BuludUtilitiesConfig`, `BULUD_UTILITIES_CONFIG`, `BuludFileExtensionPipe`, `BuludIsImagePipe`, `BuludMaskEmailPipe`, `BuludPascalCasePipe`, `BuludCardNumberPipe`, `BuludTimestampPipe`, `BuludDateTimePipe`, `BuludDatePeriod`, `BuludDateService`, `BuludConnectionService`, `BuludPasswordService`, `BuludTimeSlot`, `BuludUnixTimeConverterPipe`, `BuludNumberPipe`, `BuludRelativeTimePipe`, `BuludDurationPipe`, `BuludTruncatePipe`, `BuludFallbackPipe`.

### `bulud-ng/validators`

Exports `buludRequiredText`, `buludFiniteNumber`, `buludHttpUrl`, `buludIsoDate`,
and `buludMatchFields(first, second)`. These compose with Angular validators;
see [BASE.md](BASE.md) for error keys, examples and the updated Dropdown/Radio
validation and error-relationship inputs.

## Reusable Angour shared transfer

See [SHARED.md](../projects/bulud-ng/SHARED.md) for the complete typed public surface and usage examples.

Secondary entries added: `bulud-ng/query`, `bulud-ng/table`, `bulud-ng/otp`, `bulud-ng/file-upload`, `bulud-ng/tooltip`, `bulud-ng/feedback`, `bulud-ng/rating`, `bulud-ng/stepper`, `bulud-ng/carousel`, `bulud-ng/countdown`, `bulud-ng/utilities`.

Shared theme configuration exports include `BULUD_SHARED_UI_CONFIG`, `BuludSharedUiConfig`, `BuludSharedUiTheme`, `BuludSharedUiFeature`, `buludSharedUiStyles`. Feature implementation stays tree-shakable in secondary entry points. No dependency changes.

Public exports: `buludMatchFields`, `buludRequiredText`, `buludFiniteNumber`, `buludHttpUrl`, `buludIsoDate`.

The existing `BuludButton` also accepts `appearance="outline"` or `appearance="link"` with any variant. Its default remains `solid`. Primary outline follows Angour: transparent surface, primary text/border, subtle hover, normal weight, and the existing disabled/loading/native form behavior. Semantic project colors supply defaults; `--bulud-button-outline-background`, `--bulud-button-outline-hover-background`, `--bulud-button-outline-active-background`, `--bulud-button-outline-border`, and `--bulud-button-outline-foreground` allow scoped/instance overrides.

```html
<bulud-button appearance="outline" variant="primary" [id]="section + '_submit'">Submit</bulud-button> <bulud-button appearance="link" (click)="showDetails()">Details</bulud-button>
```

## Project-owned native IDs

IDs are optional, reactive, and preserved verbatim, including underscores and hyphens. Existing project expressions such as `[id]="parentSection + '_phone_otp_submit'"` keep their original value. Use a unique value for each rendered instance; the library does not rewrite a supplied ID or impose a marketing naming convention.

```html
<bulud-button [id]="section + '_submit'">Submit</bulud-button>
<bulud-checkbox [id]="section + '_remember'">Remember me</bulud-checkbox>
<bulud-otp [inputId]="section + '_otp'" />
<bulud-carousel [idPrefix]="section + '_accounts'">...</bulud-carousel>
```

| Control                                     | Input           | Native target                                                                                                              |
| ------------------------------------------- | --------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Button, checkbox, switch, radio, datepicker | `id`            | Native button/input; label references follow the same ID                                                                   |
| Dropdown, language switch                   | `inputId`       | Trigger button                                                                                                             |
| OTP                                         | `inputId`       | Single input, or `_1`…`_N` for separate digits                                                                             |
| File upload                                 | `inputId`       | Native file input in either presentation                                                                                   |
| Rating                                      | `inputIdPrefix` | Native choices `_1`…`_N`                                                                                                   |
| Period picker                               | `inputIdPrefix` | `_trigger`, `_previous_year`, `_year`, `_next_year`, `_month_N`, `_clear`, `_previous_month`, `_next_month`, as applicable |
| Pagination                                  | `idPrefix`      | `_previous`, `_page_N`, `_next`                                                                                            |
| Carousel                                    | `idPrefix`      | `_previous`, `_next`, `_slide_N`, as applicable                                                                            |
| Stepper                                     | `idPrefix`      | `_step_N`                                                                                                                  |
| Tabs                                        | `id`            | Prefix for the tab/panel IDs and matching ARIA references                                                                  |
| Accordion                                   | `idPrefix`      | Prefix for each encoded item/panel ID and matching ARIA references                                                         |
| Dialog                                      | `surfaceId`     | Dialog surface                                                                                                             |

Native textarea and projected HTML retain standard Angular `[id]`/`[attr.id]` behavior. For a wrapper hook on component controls, use `[attr.id]` explicitly; `[id]` on a control with an `id` input targets the native control. Never assign the same value to both wrapper and native control. IDs do not alter focus, keyboard interaction, validation, theme, or responsive layout. Supplying `null` removes optional IDs; controls that need ARIA references retain a generated fallback.

Dropdown geometry follows the Angour form typography: Persian desktop 14px, other current locales 12px, and mobile 12px. Text uses the consuming project's font family, normal weight, and 1.5 line height. The trigger and options grow with their content rather than a fixed height. Configure `dropdown.fontSize`, `lineHeight`, `fontWeight`, `minHeight`, `paddingBlock`, `paddingInline`, `gap`, `optionMinHeight`, `optionPadding`, and `optionGap` globally, or set the corresponding `--bulud-dropdown-*` variables on any scope or instance. `--bulud-font-size-control` supplies the locale-responsive default. Projected Angour controls retain their existing wrapper geometry.

The link appearance is a native button action, matching Angour’s `btn-link-primary`. Use a semantic anchor for navigation. Both text appearances use the semantic subtle hover color and keep the existing keyboard, form, loading and disabled behavior. Link overrides use `--bulud-button-link-foreground`, `--bulud-button-link-background`, `--bulud-button-link-hover-background`, and `--bulud-button-link-active-background`.
