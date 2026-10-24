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
