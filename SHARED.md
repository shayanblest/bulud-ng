# Reusable Angour shared features

The transferable parts of Angour are standalone secondary entry points in `bulud-ng`. They contain no account models, environments, API URLs, cookies, auth, Bootstrap, translation framework, or chart dependencies. Existing Dropdown, Dialog, Pagination, Tabs, Switch, Datepicker and form controls remain their original Bulud APIs.

Preview: `npm run ng -- serve base --host 127.0.0.1 --port 4310`, then `/shared`. This lazy page demonstrates every transferred UI family in English/Persian, LTR/RTL and both Angour themes. Server pagination is simulated locally, not connected to an API. Files are never uploaded by the library.

Explicitly import `bulud-ng/angour.css` in your application's stylesheet and set `data-bulud-preset="angour"` on an ancestor. `data-theme="dark"`/`.dark` and `dir="rtl"` are app-owned. See ANGOUR.md for existing theme and locale providers.

## URL → list request and filters (`bulud-ng/query`)

Angour's implementation is in `libs/shared/utilities/src/lib/dataset.ts`, not a service. Its reusable functions now have a `BuludQueryService` facade. Router and HttpClient are never injected. All methods are stateless.

```ts
import { BuludQueryService, convertToRequestParams, parseFilters, buildFilterString } from "bulud-ng/query";
const request = convertToRequestParams("/items?page=3&take=20&search=hello");
// { take: 20, skip: 40, search: 'hello' }
const expression = buildFilterString({ status: [{ operator: "in", values: ["active", "draft"] }] });
const filters = parseFilters(expression ?? "");
```

`BuludQuerySource` accepts a URL/query string, `URLSearchParams`, or a readonly record compatible with Router Params. Repeated `include` and comma-separated include values become a deduplicated readonly array. Search/filter/sort text is preserved; the library does not impose a server sort grammar or execute filters. `take` is 1–1000 (default 10), page is a positive safe integer. Invalid pages default to 1; unsafe offsets default to 0. The optional second `defaultTake` argument replaces 10. Unknown URL keys are intentionally excluded from `BuludListRequest`.

`parseFilters(expression): BuludFilters` returns a new record with a null prototype. It accepts Angour `field:operator("value",...)` grammar, legacy bare values, repeated operators (last wins), and empty lists (remove the operator). Quoted values use JSON escapes, so commas, parentheses, quotes and backslashes round-trip. Malformed expressions and unsafe identifiers throw `SyntaxError`; callers should display/recover from invalid URLs. `buildFilterString(filters, ignoreKeys?)` returns `string | undefined`, skips whitespace-only values and validates identifiers. Neither function mutates caller objects. Existing legacy Angular code that expected `parseFilters` to mutate a supplied second argument must assign its returned value instead.

```ts
const query = inject(BuludQueryService);
// Angular Router integration belongs to your application:
const state = query.toRequest(route.snapshot.queryParams);
router.navigateByUrl(query.updateUrl(router.url, { page: 2, search: "فارسی" }));
// HttpParams with repeated values; no request is sent here:
const params = query.toHttpParams({ take: state.take, skip: state.skip, search: state.search });
```

Facade methods: `read`, `toRequest`, `parseFilters`, `buildFilters`, `updateUrl`, `toHttpParams`. `updateBuludQuery(url, patch)` preserves unrelated parameters and fragments, replaces supplied keys, supports repeated array values and removes null/undefined values. Values are encoded by URLSearchParams. Grammar validation is not authorization; server APIs still own permitted fields/operators and limits.

## Table (`bulud-ng/table`)

Exports `BuludTable<T>`, `BuludTableColumn<T>`, `BuludTableSort`, `BuludTableLabels`, `BuludTableCell<T>`, `BuludTableCellContext<T>`, `BuludTableDetail<T>`.

```html
<bulud-table caption="Projects" [rows]="rows" [columns]="columns" [rowKey]="rowKey" [pageSize]="10" [(page)]="page" [(sort)]="sort">
  <ng-template buludTableCell="status" let-row>{{ row.status }}</ng-template>
  <ng-template buludTableDetail let-row><app-project-summary [project]="row" /></ng-template>
</bulud-table>
```

Required inputs: `rows: readonly T[]`, `columns: readonly BuludTableColumn<T>[]`, `rowKey: (row:T)=>string|number`, `caption: string`. Row keys and column keys must be unique and stable. Columns have `key`, `heading`, `value(row): string|number|null|undefined`, optional `sortable` and optional `compare(a,b):number`. Fallback comparison is stable numeric text sorting using one cached Intl.Collator. Cell values render as text, never HTML.

Inputs: `loading/error/disabled/server: boolean` (false), `pageSize:number` (10), `total:number` (0), `labels:Partial<BuludTableLabels>`, `theme`. Models: `page:number` (1), `sort:BuludTableSort|null`, `expanded:string|number|null`. Output `stateChange: { page:number; sort:BuludTableSort|null }` is emitted for user sort/page requests. Sorting resets the page to 1. Caller array is never mutated. Invalid page sizes fall back to 10; stale page values are clamped for display without silently rewriting caller state.

Local mode sorts/slices the rows. Server mode renders the received page unchanged and uses `total` for page count. The consumer sends requests and updates rows/loading/error; the component never loads data or applies local server filters. The caller must correct a server URL whose page exceeds the returned total. Filters and custom cells remain app-owned.

Labels: `loading`, `empty`, `error`, `expand`, `collapse`, `detailsHeading`, `previousPage`, `nextPage`, `page`, `currentPage` (English defaults). Supply localized labels reactively as shown in the base demo. Native column buttons and detail buttons work with Enter/Space; `aria-sort`, expansion state, caption, named scroll region and live status are included. The table stays a semantic table rather than a keyboard grid. Offscreen cells can be reached through its focusable horizontal scroll region. In details templates, callers own names/focus for their custom controls.

## Form controls

All controls support CVA, Validator, `theme`, `disabled:boolean` and `required:boolean` (both false). Import the control plus ReactiveFormsModule and use `[formControl]` or `formControlName`. Labels are required. Each control also accepts `invalid:boolean` (false) and `describedBy?:string` to connect consumer error UI to the actual native control. Bind invalid to your form's touched/submitted state; the library does not decide when an application should reveal errors. Angular control `.disable()` affects actual native inputs. No control registers a global keyboard listener.

```html
<bulud-otp label="Verification code" [formControl]="code" required [invalid]="code.touched && code.invalid" describedBy="code-error" />
<p id="code-error">{{ code.touched && code.invalid ? 'Enter six digits' : '' }}</p>
<bulud-file-upload label="Attachments" [formControl]="files" multiple accept="image/*,.csv" [maxFiles]="2" [maxSize]="1048576" />
<bulud-rating label="Rating" [formControl]="rating" required />
```

- `BuludOtp` (`bulud-ng/otp`): value string; `length:number` (6, integer 1–32), `completed:Output<string>`. Native single input supports paste/autofill (`autocomplete=one-time-code`), numeric inputmode and continuous editing without forced focus movement. User-entered Persian/Arabic digits normalize to ASCII. `normalizeBuludOtp` is also exported. Programmatic values are validated as supplied. Errors: `required`, `otp:{length}`, `otpLengthConfig`. Empty optional values pass; complete codes require exactly the specified ASCII digit count.
- `BuludFileUpload` (`bulud-ng/file-upload`): value `readonly File[]` (empty array); `accept:string` (empty accepts all), `multiple:boolean` (false), `maxSize:number|null` (bytes per file), `maxFiles:number|null` (both null = no extra limit), `loading:boolean`, `progress:number|null` (0–100 display clamp), `clearLabel` (Clear files), `loadingLabel` (Uploading…). `filesChange` emits the selected readonly array. Invalid selections remain in the model so validation is honest. Errors: `required`, `fileValue`, `fileCount:{max,actual}`, `fileSize:{max}`, `fileType:{accept}`, `fileAcceptConfig`, `fileConstraints`. Limits are nonnegative safe integers. Accept supports extensions, MIME types and MIME wildcards. File metadata cannot establish file safety; applications own server content validation. No network, clipboard permissions, image resizing, implicit blob URLs or base64 allocation. `clear()` and Angular reset clear the actual file input so the same file can be selected again. Browsers cannot populate a file input from programmatic form writes; the filename list reflects the model instead.
- `BuludRating` (`bulud-ng/rating`): numeric value 0 (empty) or integers 1–5. Required rejects zero; errors `required`, `rating`. Native radio inputs have instance-unique names, legend, and standard browser Tab/arrow/Space interactions. Screen readers get numeric names; star icons are decorative. `.reset()` clears the choice.

## Tooltip (`bulud-ng/tooltip`)

```html
<bulud-tooltip text="The record is saved locally"><button type="button">Help</button></bulud-tooltip>
```

`BuludTooltip`: required `text:string`, optional `theme`. Project exactly one focusable trigger; the tooltip content is descriptive text. It opens on hover/focus, remains while the pointer/focus is inside, closes with Escape or when both leave, preserves existing aria-describedby tokens, and removes its own token on blur/destruction. Focus stays on the trigger. It does not contain interactive controls. Layout is anchored within the containing block; use Dialog/Dropdown for interactive or viewport-constrained overlays.

## Feedback (`bulud-ng/feedback`)

```html
<bulud-alert kind="warning" [dismissible]="true" (dismissed)="showAlert=false">Review your changes.</bulud-alert> <bulud-notifications dismissLabel="Dismiss notification" />
```

`BuludAlert` projects content; inputs `kind:BuludNoticeKind` (info), `dismissible:boolean` (false), `dismissLabel:string` (Dismiss), `theme`, `announce:boolean` (true; false when hosted in an existing live region); output `dismissed:void` leaves actual removal to the consumer. Kind is info/success/warning/danger. Errors use role alert, other messages status. Consumer owns focus after removing the currently focused dismissal button.

`BuludNotificationService`: `notices:Signal<readonly BuludNotice[]>`, `show(message,kind?):number`, `dismiss(id):void`, `clear():void`. Notices have monotonic ID, message and kind; strings render through interpolation. Default root store can be overridden with a scoped provider (as in the demo). No arbitrary HTML, direct body DOM insertion, timeouts or third-party toast plugin. Notifications persist until dismissed. `BuludNotifications` inputs `label` (Notifications), `dismissLabel` and `theme`; place one outlet per store. It exposes one polite live region (child alerts do not duplicate it). Dismissing a focused notice moves focus to the named outlet group; avoid simultaneously announcing the same event elsewhere.

## Steps and slides

```html
<bulud-stepper label="Setup" [(active)]="step">
  <ng-template buludStep="Information">Your content</ng-template>
  <ng-template buludStep="Review">Review content</ng-template>
  <ng-template buludStep="Locked" disabled>Unavailable content</ng-template>
</bulud-stepper>
<bulud-carousel label="Features" [(active)]="slide">
  <ng-template buludSlide="First feature">Your content</ng-template>
  <ng-template buludSlide="Second feature">More content</ng-template>
  <p buludCarouselEmpty>No slides</p>
</bulud-carousel>
```

`BuludStepper`, `BuludStep` (`bulud-ng/stepper`): required `label`, `active:number` model (0), `disabled:boolean` (false), `theme`. Step directive's `buludStep:string` is its required label; optional disabled false. Nonlinear navigation with native buttons and `aria-current=step`. Invalid/disabled selection displays first enabled step. Only active template is instantiated. Validation/progression is app-owned; disable a later step until prerequisites pass.

`BuludCarousel`, `BuludSlide` (`bulud-ng/carousel`): required `label`, `active:number` model (0), `previousLabel` (Previous), `nextLabel` (Next), `disabled:boolean` (false), `theme`. Slide directive's `buludSlide:string` is its required accessible name. Only current content is instantiated; invalid indexes clamp to the range. No autoplay, cloned slides or animation timers. Previous/next are native buttons with stable text, so RTL does not rely on flipped glyphs. Position is announced politely; consumer templates own heading hierarchy and focusable content. Empty projection is shown only with no slides. Standard Tab/Enter/Space controls suffice; this is not a tablist.

## Countdown (`bulud-ng/countdown`)

```html
<bulud-countdown label="Time remaining" [deadline]="expiresAtMs" (expired)="onExpired()" />
```

`BuludCountdown`: required label, `deadline:number|null` (epoch milliseconds), `theme`, `expired:void`. Displays HH:MM:SS using elapsed wall-clock time; a restarted deadline cancels the previous timer. Emits once per deadline when it reaches zero, clears timers on destruction and never sets timers for null/invalid deadlines or on the server. `role=timer`, `aria-live=off` prevents announcements every second; consumers can announce expiry once. No IDs or hardcoded document lookups.

## Utilities (`bulud-ng/utilities`)

Pure standalone pipes: `BuludFileExtensionPipe` (`buludFileExtension`), `BuludIsImagePipe` (`buludIsImage`, detects common raster filename/data-URL formats, not security validation), `BuludMaskEmailPipe` (`buludMaskEmail:visibleStart=3:visibleEnd=3`, text masking only), `BuludPascalCasePipe` (`buludPascalCase`), `BuludCardNumberPipe` (`buludCardNumber`, groups every four characters; does not validate card data), `BuludTimestampPipe` (`buludTimestamp`, string/Date → Unix seconds or null), `BuludDateTimePipe` (`buludDateTime:showTime=true:language='en':timeZone?:unit='seconds'`). DateTime language is fa/en; Persian uses built-in Intl calendar, no jalaali dependency. Timestamp 0 is valid, units are explicit; date strings should be ISO 8601 with a timezone. Formatters have a small bounded cache. Invalid values/zones render '-'.

```html
{{ unixSeconds | buludDateTime:false:'fa':'UTC' }} {{ 'user@example.com' | buludMaskEmail }} {{ '/files/report.CSV?download=1' | buludFileExtension }}
```

Pure helpers: `buludFileExtension`, `buludUnixTimestamp`, `buludDateRange(period, now?)`. Periods (`BuludDatePeriod`): daily, weekly, monthly, yearly, all. Ranges return Unix seconds `{from,to}` using local rolling calendar boundaries; monthly/yearly clamp month-end/leap days. Optional now makes tests deterministic and never mutates caller dates. Invalid date throws RangeError.

`BuludDateService`: `toUnix`, `range`, `fromUnix(seconds):Date|null`. `BuludConnectionService.online:Signal<boolean|null>` initializes lazily, null on SSR, removes browser listeners on injector destruction. Online is browser connectivity, not backend health. `BuludPasswordService.generate(length=16):string` requires integer 12–128 and cryptographic getRandomValues; ensures lowercase/uppercase/digit/symbol groups, rejection sampling and unbiased shuffle. Throws if crypto unavailable. No Math.random fallback, no storage or network.

## Shared typed theme configuration

All new UI features accept `theme:Partial<BuludSharedUiTheme>`. Root exports `BULUD_SHARED_UI_CONFIG`, `BuludSharedUiConfig`, `BuludSharedUiTheme`, `BuludSharedUiFeature`, and `buludSharedUiStyles`. Fields: background, foreground, border, accent, muted, radius, padding, gap, focus, disabledOpacity. Theme config only; behavior stays in explicit inputs. Precedence is instance theme → `components[feature]` defaults → global theme → inherited CSS/library fallbacks. Undefined fields do not erase lower layers.

```ts
{ provide: BULUD_SHARED_UI_CONFIG, useValue: {
  theme: { radius: '12px' },
  components: { table: { border: '#888' }, otp: { gap: '16px' } }
} satisfies BuludSharedUiConfig }
```

CSS uses `--bulud-{feature}-{field-in-kebab-case}` (feature names: table, otp, file-upload, tooltip, feedback, rating, stepper, carousel, countdown). Per-scope CSS and per-instance `[style.--bulud-table-border]` work when no typed override owns the same property; direct CSS declarations have normal cascade behavior. Omitted colors inherit the imported Angour light/dark palette. Geometry tokens (e.g. rating-size or tooltip-z-index) can also be overridden in CSS. Each feature's meaningful fields affect its own rendered surface; e.g. countdown has foreground and typography but no background panel.

## Transfer boundaries

Full inventory, source paths and reasons are in SHARED-TRANSFER-AUDIT.md. Domain services, trading integrations, auth/profile UI and third-party analytics/chat integration remain in Angour. Standalone month-only/year-only controls and interactive trading charts are not part of this transfer; date navigation is already provided by BuludDatepicker. There are no package/dependency upgrades.

## Angour table filters, textarea, page progress and charts

Import the optional `bulud-ng/angour.css` and `bulud-ng/angour-base.css` skins. Ancestor `dir`, language and dark theme still belong to the application. The Angour preset uses an attached dropdown panel with borderless search, boxed pagination, and icon-only detail toggles with accessible expand/collapse labels.

`bulud-ng/table` additionally exports `BuludTableFilters`, `BuludTableFilterDefinition`, `BuludTableFilterValues`, `filterBuludTableRows` and `buildBuludTableFilterQuery`. Definitions have a column `key`, accessible `label`, `kind: 'text'|'select'|'number'|'date'`, optional select `options`, and `operator: 'eq'|'gte'|'lte'` (default eq; text uses contains). Values are a readonly key-to-string-or-undefined record. Text uses normalized case-insensitive contains; numbers must be finite, dates real ISO dates, select values members of options. Invalid active filters match no local rows; the URL helper throws RangeError. Column keys must satisfy the query grammar. Backend validation and allowed operators remain consumer responsibilities.

```html
<bulud-table [rows]="rows" [columns]="columns" [rowKey]="rowKey" caption="Records" [filterDefinitions]="filterDefinitions" [(filters)]="filters" filterLabel="Filters" clearFilterLabel="Clear filters" language="en" (stateChange)="requestPage($event)" />
```

Table filters are opt-in. Local mode filters before sorting and paging. Server mode renders the supplied page and emits `{page:1, sort, filters}` on a filter change; the consumer must fetch/filter and update total. Existing page/sort event shapes are unchanged. Standalone filter component: required `definitions`, `value` model {}, `disabled` false, labels `label`/`clearLabel`, `language` fa/en, optional `theme`. Native disclosure and controls support Tab/Enter/Space; keep filter labels meaningful. The sample `/shared` demonstrates combined URL filters and back navigation.

`BuludTextarea` (`bulud-ng/textarea`) is a directive for native `textarea[buludTextarea]`, with `theme` and `buludTextareaInvalid:boolean` false. It deliberately keeps Angular's native forms accessor and validators. Provide a visible label, maxlength/validators and error description in the application. The skin sets the Angour body background, thin border, rounded corners and 126px minimum height. Native resize, disabled/read-only, selection and keyboard editing remain available.

```html
<label for="message">Message</label>
<textarea id="message" buludTextarea [formControl]="message" maxlength="500" [buludTextareaInvalid]="message.touched && message.invalid" aria-describedby="message-error"></textarea>
<p id="message-error">{{message.touched && message.invalid ? 'Enter a message' : ''}}</p>
```

`BuludLoadingBar`, `BuludLoadingService` (`bulud-ng/loading-bar`): mount one bar in the shell. `start(progress:number|null=null):number` returns an independent operation handle; `update(handle, progress)` and `finish(handle)` do not affect other tasks. Finite progress clamps 0–100. Any indeterminate task makes aggregate progress indeterminate; otherwise it averages active task percentages. Unknown/finished handles are ignored. `during<T>(()=>Promise<T>)` always finishes, including errors. There are no fake progress timers or HTTP/router dependencies. The sample bridges router navigation IDs to handles and finishes on end/cancel/error/skipped.

```ts
const handle = loading.start(0);
try {
  await upload((p) => loading.update(handle, p));
} finally {
  loading.finish(handle);
}
```

Bar inputs: `active:boolean|undefined` (service by default), `value:number|null|undefined` (service by default, explicit null indeterminate), accessible `label` (Page loading), `theme`. Visible bar has progressbar role and a real percentage only when known. It is fixed at the page top, primary, 7px high, with reduced-motion support. Override `--bulud-loading-bar-height`/`--bulud-loading-bar-z-index` if needed. Finish task handles on consumer destruction/cancellation.

`BuludChart`, `BuludLinePoint`, `BuludCandlePoint`, `BuludChartType`, `BuludChartLabels`, `buludChartDomain` (`bulud-ng/charts`) provide dependency-free responsive SVG line/candlestick charts. Required `caption`; inputs `line:readonly {x:string,y:number}[]`, `candles:readonly {x:string,open:number,high:number,low:number,close:number}[]`, `type` model line/candlestick (line), `digits` (2, clamped 0–8), partial localized `labels`, `theme`, `disabled`, `loading`, `error` (all false). A data set must have finite values, valid OHLC bounds and at most 2,000 points; invalid sets show an error instead of hiding points. Empty sets show an explicit empty state. Constant domains get padding. Data/locale changes update reactively; dates/x labels are consumer-owned strings. `buludChartDomain` returns a padded finite `[min,max]` or null.

```html
<bulud-chart caption="Trend" [line]="lineData" [candles]="ohlcData" [(type)]="chartType" [labels]="chartLabels" [loading]="loading" />
```

The line inherits primary; candles use Angour blue/orange. Shared typed theme adds optional `positive`, `negative`, `grid` colors; CSS overrides are `--bulud-charts-positive/negative/grid`. All four new features use instance > component > global > inherited CSS fallback precedence (`textarea`, `loading-bar`, `charts`, `table-filters`). Chart SVG has a caption/name and an optional native disclosure exposes the full accessible data table, instantiated only when opened. Type buttons support native keyboard interaction and pressed state; data-table access avoids requiring pointer hover. Both chart types and all states are available at lazy `/charts`. No zoom, trading, real-time feed or third-party chart dependency is included.

## Angour upload and interaction revision

The Angour pagination preset has returned to its previous boxed pages/arrows and table alignment, preserving centered SVGs and RTL directions. Dropdown panels retain rounded top corners; search is borderless with an inset, rounded body-colored row and visible focus background. The Angour stepper has 40px circular markers, dotted connectors and a primary completed marker/check. It preserves the existing controlled active step, projected content, disabled controls, current-step ARIA and keyboard behavior.

`bulud-ng/file-upload` now also exports `BuludFileConstraints`, `validateBuludFiles`, `BuludUploadOptions`, `BuludUploadEvent`, `BuludUploadError`, `BuludUploadService`, and `BULUD_UPLOAD_REQUEST_FACTORY`. Existing selection-only Forms usage continues to work. Files are **never uploaded automatically**.

The picker matches Angour's body-colored rounded area and image icon. It supports native keyboard file selection and drag/drop, raster image previews (at most eight object URLs), individual removal and clear. Generated URLs are revoked on replacement/destruction; previews are disabled in SSR. SVGs and other files display a generic file icon. Preview decode failure falls back to that icon. Metadata validation does not certify file contents: the receiving server must verify authorization, actual content/type, and size.

Constraints: `accept:string` (''), `multiple:boolean` (false on the control, true by default on the transport), `required:boolean` (false on control; uploads always require nonempty selection), `maxSize:number|null`, `maxFiles:number|null`, new `maxTotalSize:number|null` (all null) and `allowEmptyFiles:boolean` (false). Limits must be nonnegative safe integers. Empty files produce `fileEmpty`; total overflow produces `fileTotalSize:{max,actual}`. Existing `required`, `fileValue`, `fileConstraints`, `fileCount`, `fileSize`, `fileType`, `fileAcceptConfig` remain. `validateBuludFiles(value:unknown, constraints?)` is the same pure metadata validator used by the control and service. Invalid selections remain visible/removable, and cannot be uploaded. The standalone control also shows a localized generic validation hint after interaction.

New control inputs: optional `uploadOptions:BuludUploadOptions`; labels `hint`, `selectedLabel`, `removeLabel`, `uploadLabel`, `cancelLabel`, `retryLabel`, `successLabel`, `errorLabel`, `validationLabel`; constraints above. Defaults are English; pass translated strings like the base example. Existing external `loading`/`progress` inputs still work alongside internal upload status; nonfinite/unknown progress is indeterminate. Observable public `uploadState` signal is idle/uploading/success/error. Actions: `startUpload()`, `cancelUpload()`, `remove(index)`, existing `clear()`. Outputs: `uploadCompleted:unknown`, `uploadFailed:BuludUploadError`, existing `filesChange:readonly File[]`. Inputs `disabled` and Forms disabled guard selection/upload/removal. Cancellation always permits aborting an ongoing request. Reset/replacement/destruction cancels owned subscriptions. Clear/reset returns the state to idle.

```ts
import { BuludFileUpload, BuludUploadOptions } from 'bulud-ng/file-upload';
readonly uploadOptions: BuludUploadOptions = {
  url: '/api/attachments', fieldName: 'files', timeoutMs: 30_000,
};
```

```html
<bulud-file-upload label="Choose images" accept="image/*" multiple [maxSize]="1048576" [maxFiles]="2" [maxTotalSize]="2097152" [formControl]="files" [uploadOptions]="uploadOptions" (uploadCompleted)="onUploaded($event)" />
```

`BuludUploadService.upload<T=unknown>(files, options):Observable<BuludUploadEvent<T>>` is cold and opens no request until subscription. The browser XHR adapter supports actual upload progress without adding Angular HTTP or a new dependency to the initial bundle. Options: required `url`; `method:'POST'|'PUT'` (POST), `fieldName` (files), optional `headers`, `withCredentials` (false), `timeoutMs` (0, no deadline), and optional metadata `constraints`. The control checks both its own and transport constraints. Relative or explicit HTTP(S) URLs are supported; protocol-relative/other schemes are rejected. A manual Content-Type header is rejected so the browser supplies the multipart boundary. Caller-owned headers/credentials are applied only to the explicit destination. No application environment, auth token or business endpoint is embedded.

Progress events are `{kind:'progress',loaded,total:number|null,percent:number|null}`. Completion is `{kind:'complete',body:T,status:number}`; JSON response is parsed by XHR (empty/non-JSON may be null). `T` is a caller assertion, not runtime response validation. Errors expose `code: 'validation'|'configuration'|'network'|'http'|'timeout'|'abort'|'unsupported'`, HTTP `status` (0 if unavailable), and optional metadata `errors`. Unsubscribing aborts only that request and removes its callbacks; retry means subscribing/starting again, with no automatic resend. Servers and non-browser consumers must supply an adapter or handle unsupported. `BULUD_UPLOAD_REQUEST_FACTORY` takes `() => XMLHttpRequest` for tests/alternative environments; the default creates it lazily, never during injection.

```ts
const subscription = uploads.upload(files, { url: "/api/attachments" }).subscribe({
  next: (event) => {
    if (event.kind === "progress") progress.set(event.percent);
  },
  error: (error) => showUploadError(error),
});
// User cancellation / consumer teardown:
subscription.unsubscribe();
```

The `/shared` example sends only after the user clicks Upload, to `/api/demo-upload`. Start the local static preview with `node tools/serve-base.mjs --port 4314 --demo-uploads`; this optional receiver counts streamed bytes and **discards all uploaded data**, with a 3 MiB request cap. Its absence returns an upload error with retry. Base dev-server proxy forwards only this path to the local preview. Production applications must supply their own URL/authorization/storage server; the library never starts an HTTP server.

# Demo, package installation and reusable additions

## Run once

From the workspace, run `npm ci` on first setup, then `npm start`.
This builds the optimized demo and serves it at **http://127.0.0.1:4314/components**.
The component catalog links to separate lazy feature pages, each with code and a live example. Existing `/`, `/forms`, `/shared`, `/charts` routes remain available. `npm run dev` starts the editable development preview on 4310. Do performance audits against `npm start`, not the development server.

The demo upload endpoint discards received data. It is a bounded local test receiver, not production file storage. Supply your authenticated endpoint with `BuludFileUpload` in a consuming application.

## Install the current build locally

```sh
npm run build
npm run package:local
# In another Angular 20 project, use the actual absolute tarball path:
npm install /path/to/bulud-ng/dist/packages/bulud-ng-0.0.1.tgz
```

```ts
import { BuludButton } from "bulud-ng/button";
import { BuludPeriodPicker } from "bulud-ng/period-picker";
import { BuludDonutChart, BuludProgress } from "bulud-ng/charts";
```

Import CSS explicitly in the consumer's global stylesheet:

```css
@import "bulud-ng/angour.css";
@import "bulud-ng/angour-base.css";
```

Place `data-bulud-preset="angour"`, `data-theme="light"` or `"dark"`, and `dir="rtl"` or `"ltr"` on an ancestor. The application owns language/theme preferences. Peer dependencies are Angular 20 and RxJS; Tailwind is optional. Import specific secondary entries, not a barrel of every component. CSS is marked as a side effect; feature JavaScript has no eager global registrations. The demo is not included in the published library.

`npm run validate:tree-shaking` packs the actual compiled package, resolves it from three isolated Angular AOT consumers without source aliases, builds production bundles and verifies unused components are absent. It uses the existing workspace toolchain and does not download dependencies.

Public npm publication is **deferred by the user**. The package name/version currently remain `bulud-ng@0.0.1`; the account/scope and license must be chosen before publishing. No registry publication or ownership claim has been made. After choosing those details, add the license/metadata, check the tarball, authenticate with npm and publish with public access. Do not publish the private workspace root.

## Added APIs

All components are standalone and OnPush. Shared theme options use `Partial<BuludSharedUiTheme>` and follow instance → component → global → scoped CSS fallbacks. Configure global/component layers with `BULUD_SHARED_UI_CONFIG`; inherited CSS variables and per-host `[style.--bulud-…]` remain usable.

| Entry / API                           | Inputs and defaults                                                                                                                                                                                                                                           | Behavior and accessibility                                                                                                                                                                                                                                                                                              |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `avatar` / `BuludAvatar`              | `name=''`, `src?`, `label?`, `theme?`                                                                                                                                                                                                                         | Accessible image name = label, name, or Avatar. Failed images become initials; a different src retries. Decorative inner image, no authentication behavior. CSS `--bulud-avatar-size` defaults 48px.                                                                                                                    |
| `empty-state` / `BuludEmptyState`     | required `title`, `description=''`, `theme?`                                                                                                                                                                                                                  | Named section, heading and optional text. Project native buttons/links for actions; optional decorative `[buludEmptyIcon]` content. No forced route or external assets.                                                                                                                                                 |
| `period-picker` / `BuludPeriodPicker` | required `label`; `mode='month'` or year, `value=null`, `language='en'`, `calendar?`, ISO date `min/max=null`, `required/disabled/invalid=false`, `describedBy?`, `theme?`; labels previousYearLabel/nextYearLabel/yearLabel/clearLabel have English defaults | CVA, Validator and `[(value)]`. Native buttons/year input support Tab, Enter/Space, numeric arrow keys. Caller translates labels and supplies touched-state invalid/error text. Calendar defaults to value calendar then language (fa Persian, en Gregorian); explicit calendar wins. Selected month uses aria-pressed. |
| `charts` / `BuludDonutChart`          | required `caption`, `segments=[]`, `loading=false`, `emptyLabel='No chart data'`, `loadingLabel='Loading chart…'`, `errorLabel='Invalid chart data'`, `theme?`                                                                                                | Up to 64 nonnegative finite segments; zero sum is empty. SVG has an accessible name and a full text legend. No timers, external chart library or hover-only data.                                                                                                                                                       |
| `charts` / `BuludProgress`            | required `label`, `value=0`, `max=100`, `variant='bar'` or ring, `loading=false`, `errorLabel='Invalid progress value'`, `theme?`                                                                                                                             | Requires positive finite max and value in [0,max]. Progressbar exposes value/min/max; loading omits current value. Invalid values display a status instead of a false percentage.                                                                                                                                       |

```html
<bulud-avatar name="Example User" />
<bulud-empty-state title="No results" description="Try another filter">
  <button type="button" (click)="clearFilters()">Clear filters</button>
</bulud-empty-state>
<bulud-period-picker label="Month" language="fa" [formControl]="month" required />
<bulud-donut-chart caption="Distribution" [segments]="[{label:'One',value:40},{label:'Two',value:60}]" />
<bulud-progress label="Upload" [value]="65" variant="ring" />
```

`BuludPeriodValue` is `{calendar:'gregory'|'persian',year:number,month?:number}`. Year must be an integer 1–9999 and representable as a four-digit ISO range; month is 1–12. Month mode requires month; year mode omits it. `buludPeriodRange(value:unknown)` returns inclusive `{from,to}` ISO dates or null. A selection must fit wholly inside min/max. CVA errors: required, period (bad value/mode/calendar), periodBounds (bad/reversed min/max), periodRange (out of bounds), periodConfig (unsupported runtime mode/calendar). Values remain calendar-qualified; Persian year/month is not misrepresented as Gregorian ISO.

The datepicker entry additionally exposes pure `buludCalendarDate(year,month,day,calendar)` (UTC-noon Date or null), `buludCalendarParts(date,calendar)` and `buludParseIsoDate(value)` plus `BuludCalendarDate`. These have no application state and are shared by the period picker.

Utilities entry additions:

| API                                                         | Contract / example                                                                                                                                                                                                                                                                                      |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `buludRemoveEmptyFields<T>(object):Partial<T>`              | Shallow immutable removal of null/undefined/empty string; preserves false, zero, arrays/objects. `buludRemoveEmptyFields({a:'',b:0})` → `{b:0}`.                                                                                                                                                        |
| `buludShiftYears(date,years):Date                           | null`                                                                                                                                                                                                                                                                                                   | UTC year shift, safe integer years, clamps leap dates, no mutation; invalid/unrepresentable date → null. |
| `buludSecondsUntil(deadlineSeconds,nowMs=Date.now()):number | null`                                                                                                                                                                                                                                                                                                   | Ceiling of seconds remaining; negative = expired; nonfinite inputs → null. No background interval.       |
| `buludTimeSlots(stepMinutes=30):readonly BuludTimeSlot[]`   | Integer step 1–1440, otherwise RangeError. Complete day [00:00,24:00), final slot can be shorter. At most 1440 slots.                                                                                                                                                                                   |
| `BuludUnixTimeConverterPipe` / `buludUnixTimeConverter`     | `timestamp:period:language:timeZone:unit`, period daily/weekly/monthly/yearly (monthly default), en/fa (en default), optional timezone, seconds/milliseconds (seconds default). Daily = time, weekly/monthly = date, yearly = date+time. Invalid input/timezone → '-'; bounded Intl caches. `1735689600 | buludUnixTimeConverter:'yearly':'en':'UTC'`.                                                             |

Pagination is controlled through `[currentPage]` and `(pageChange)`. Counts ≤5 show all pages; larger counts keep first/last/current and nearby pages, with noninteractive ellipses for skipped ranges. At most five numbered buttons are allocated, including for MAX_SAFE_INTEGER page counts. Previous/next and first/last page buttons provide access to every page. Table pagination is centered; native overflow retains accessibility in narrow containers.

# Component catalog, display pipes, required labels and chat

Run `npm start` and open http://127.0.0.1:4314/ for the project overview, or `/components` for the searchable catalog. The Demo menu has been replaced with Components: **41 independently loaded pages**, each with live example, sample code and API notes. Nested navigation exposes Example, Sample code and API per feature. `/demo` is a compatibility redirect to `/components`; earlier workflow routes remain available for integrations/regression tests.

The header theme control is the Angour `BuludSwitch`. Language/theme preferences persist. Overview explains installation, lazy pages and loading/error/empty/form states. UI labels are bilingual; source code and technical API names remain explicit.

## Pure general pipes (`bulud-ng/utilities`)

These use current standalone Angular pipe APIs without adding third-party dependencies. Angular's existing AsyncPipe, DatePipe, JsonPipe, SlicePipe and other built-in pipes should be imported directly from `@angular/common`; the library does not duplicate them. Pure pipes rerun on changed inputs; pass immutable option objects. See https://angular.dev/guide/templates/pipes.

| Pipe / class                                  | Arguments / defaults                                           | Contract                                                                                                                                                                                 |
| --------------------------------------------- | -------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `buludNumber` / `BuludNumberPipe`             | number, locale=`en-US`, options=`{}`                           | Native Intl number/currency/percent/compact formatting; up to 32 cached formatters per instance. Invalid number/locale/options → `-`. Uses browser locale data, no extra locale bundles. |
| `buludRelativeTime` / `BuludRelativeTimePipe` | Unix seconds, explicit nowSeconds, locale=`en`, numeric=`auto` | No hidden timer or clock reads; app supplies time updates when needed. Approximate unit thresholds: month=30 days, year=365 days. Invalid input → `-`; formatter cache bounded at 32.    |
| `buludDuration` / `BuludDurationPipe`         | nonnegative safe integer seconds                               | `HH:mm:ss`, hours may exceed 24. Invalid → `-`.                                                                                                                                          |
| `buludTruncate` / `BuludTruncatePipe`         | string, limit=`80`, suffix=`…`                                 | Unicode code-point prefix, never splits a surrogate pair. Does not guarantee complete grapheme/ZWJ clusters. Invalid limit returns original; limit=0 yields suffix for nonempty input.   |
| `buludFallback` / `BuludFallbackPipe`         | value, fallback=`—`                                            | Null/undefined/blank string use fallback. Zero/false are preserved.                                                                                                                      |

```ts
import {BuludNumberPipe,BuludRelativeTimePipe,BuludDurationPipe,BuludTruncatePipe,BuludFallbackPipe} from 'bulud-ng/utilities';
// Standalone component imports: [BuludNumberPipe, ...]
readonly currency: Intl.NumberFormatOptions = {style:'currency',currency:'USD'};
readonly now = Math.floor(Date.now()/1000); // application owns refresh policy
```

```html
{{ 1234.5 | buludNumber:'fa-IR' }} {{ 1234.5 | buludNumber:'en-US':currency }} {{ timestampSeconds | buludRelativeTime:now:'fa' }} {{ 3661 | buludDuration }} {{ 'Long example' | buludTruncate:5 }} {{ optionalValue | buludFallback:'Empty' }}
```

## Automatic required label (`bulud-ng/field-label`)

`BuludFieldLabel` attaches to native `label[buludFieldLabel]`, `legend[buludFieldLabel]` or a projected `span[buludFieldLabel]`. Inputs: `control:AbstractControl|null=null`, optional `required:boolean` override, optional `theme:Partial<BuludSharedUiTheme>`.

```html
<label buludFieldLabel [control]="name" for="name">Name</label> <input id="name" [formControl]="name" required />
```

Required metadata is detected by reference for Angular Validators.required, Validators.requiredTrue and buludRequiredText. It listens to control events, so dynamic validator changes work after `updateValueAndValidity()`. A valid filled required control still displays the star. Control replacement unsubscribes from the old control; destruction cleans up automatically. No DOM scanning, fake-control validator probing, polling, or mutation of validation errors.

For wrapped/custom opaque validators or template-driven forms, bind explicit `[required]` to the same application rule. Update validators with events enabled; silent metadata changes need an explicit required binding. The visual star is aria-hidden; retain native required/aria-required on the actual control. Label `for` and fieldset/legend associations remain consumer-owned. The full example form now uses these labels instead of literal stars. OTP, rating, file upload and period-picker built-in labels also render the marker automatically from their required input.

Theme feature key is `field-label`; CSS `--bulud-field-label-accent` controls marker color. Instance theme → component config → global config → inherited CSS variables, as for other shared components.

## Angour badges (`bulud-ng/badge`)

The Angour preset now uses filled semantic colors, control radius 8px and weight 600, visually aligned with buttons. Light/dark foregrounds are selected for readable contrast. Existing variants neutral/primary/success/warning/danger, sizes, dot and dismissal APIs remain unchanged. A badge stays noninteractive status content; dismissal remains a native accessible button. Existing typed/CSS per-instance overrides take precedence.

## Controlled chat (`bulud-ng/chat`)

`BuludChat` extracts the Angour ticket conversation's visual layout without ticket/auth/receipt/API dependencies. Its incoming/outgoing rows mirror with ancestor direction; bubble text uses `dir="auto"`. Messages are interpolated as text, never inserted as HTML.

```ts
import {BuludChat,BuludChatMessage} from 'bulud-ng/chat';
readonly messages = signal<readonly BuludChatMessage[]>([
 {id:'1',author:'Support',text:'How can we help?',outgoing:false,timestamp:1792540800},
 {id:'2',author:'You',text:'Hello',outgoing:true,status:'sent',timestamp:1792540860},
]);
readonly draft=signal('');
// sendToYourService sets sending and handles HTTP/WebSocket acknowledgements.
```

```html
<bulud-chat [messages]="messages()" [(draft)]="draft" [sending]="sending()" [disabled]="disabled()" (send)="sendToYourService($event)" (retry)="retryMessage($event)" (attachmentClick)="openAttachment($event)" />
```

| Input/output                     | Default / behavior                                                                                                                                                                                                  |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `messages`                       | readonly BuludChatMessage[] = []; unique stable ids required. Each has id, author, text, outgoing; optional timestamp (Unix seconds), status and attachments. Consumers page/limit long histories before rendering. |
| `draft` / `draftChange`          | model string=`''`; controlled composition, never silently cleared by library.                                                                                                                                       |
| `disabled`, `loading`, `sending` | false; booleans also support attribute transforms. Sending/loading disable composition and duplicate submits.                                                                                                       |
| `maxLength`                      | 4000; invalid/nonpositive/unsafe config falls back to 4000. Rejects whitespace-only and oversized drafts, emits trimmed text.                                                                                       |
| `error`                          | `''`; explicit transcript error state, does not automatically lock composer (consumer can use disabled).                                                                                                            |
| `language`, `timeZone`           | en, optional timezone. fa/en date formatting uses existing pure date pipe and explicit Unix seconds.                                                                                                                |
| `labels`                         | Partial<BuludChatLabels>; English defaults for title, composer, placeholder, send, loading, empty, retry, sending, sent, read, failed, invalid, latest. Example page supplies Persian labels.                       |
| `theme`                          | Partial<BuludSharedUiTheme>; feature key `chat`, same precedence chain as other components. Bubble/background/border/accent/muted/radius/padding/gap/focus/disabled opacity tokens are inherited/overridable.       |
| `(send)`                         | trimmed string; parent accepts/queues message, updates immutable messages array, manages sending and clears draft when accepted.                                                                                    |
| `(retry)`                        | failed message id; consumer owns retry transport/acknowledgement.                                                                                                                                                   |
| `(attachmentClick)`              | `{messageId,attachment:{id,name}}`; consumer resolves/downloads authorized files. No remote attachment URL is auto-executed.                                                                                        |

Statuses: sending/sent/read/failed. Attachment actions are native buttons. Transcript is a named focusable `role="log"` with polite additions and busy state. Enter inserts newline; Ctrl/Command+Enter submits unless IME composition is active. New messages scroll to the end only while pinned; reading older messages retains position and exposes Latest messages. Submitting intentionally returns to newest messages. The component adds no network requests, background polling, transport dependencies or fake online state. The example clearly identifies its local simulated replies; it is not an actual backend chat service.

Content projection after the composer allows composing an existing file upload/attachment picker. Upload transport/content validation remains with the existing upload component and application server. Delivery authorization, rate limiting, persistence and message pagination belong to the application.

## Package verification

Existing secondary-entry imports and explicit CSS assets remain intact; no dependency or framework version changes. Package verification now builds button-only, donut-only, period-only, chat-only and number-pipe-only production consumers from an actual local tarball and checks unrelated selectors/pipes are absent. Public npm publication still awaits the owner's later account/license decision.
