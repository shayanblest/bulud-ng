# Compatibility audit before extension — 2026-11-15

The modern standalone/signals baseline is retained. The report below records the actual public API, theme, accessibility, form and renderer gaps before adding compatibility features. Existing root and feature APIs must retain their default behavior. New behavior is opt-in and every reusable renderer is exported through an independent public entry. No application Auth/JWT, routing, API clients or account models move into this package. No dependencies will be added.

Required verification per changed feature: typed API/documentation, instance/default/global/CSS precedence where configuration exists, keyboard/pointer accessibility, CVA/validation for form controls, reactive states, explicit CSS and static Tailwind utilities, a demo for every exposed state, scoped unit tests and browser tests, library/demo builds and exact old/new Angour fixture comparisons. Public API and dependency contracts will be checked before one final release.

# فهرست جایگزینی و کمبودهای Bulud در انگور

نسخهٔ این مرحله: **bulud-ng@2.1.0**. نسخه و وابستگی‌های npm تغییر نکرده‌اند. این گزارش میان «API در Bulud وجود دارد» و «جایگزین آن دقیقاً رفتار فعلی را نگه می‌دارد» تفاوت می‌گذارد. استایل بومی pagination طبق درخواست کاربر پذیرفته شده است؛ سایر ظاهرها باید یکسان بمانند.

## جایگزینی‌های این مرحله

| مورد | نتیجه |
|---|---|
| pagination | ۳۶ استفاده در ۳۵ قالب مستقیماً از `bulud-ng/pagination` استفاده می‌کنند. هر ۱۷ کنترل رفتن به صفحه، اندازهٔ صفحه، شمارهٔ صفحه و handler درخواست سرور حفظ شده است. دایرکتیو `AngourPaginationDirective` فقط تعداد رکورد را به تعداد صفحه تبدیل و کنترل رفتن به صفحه را هماهنگ می‌کند؛ دکمه‌ها، پنجرهٔ صفحات و ناوبری را Bulud رندر می‌کند. |
| loading-page | هر چهار استفاده در Trader و Corporate از `bulud-ng/empty-state` با عنوان ترجمه‌شونده و تصویر قبلی استفاده می‌کنند. |
| avatar | سه محل رندر آیکن از `bulud-ng/avatar` با projection آیکن قبلی استفاده می‌کنند. منوی حساب و اطلاعات کاربر به `account-menu` و `account-identity` در layout منتقل شده‌اند؛ ورود/خروج، مسیرها، دریافت پروفایل و نمایش موبایل در انگور می‌مانند. |
| حذف | پوشه‌های `avatar`، `loading-page` و `pagination` و exportهای قدیمی آن‌ها از shared UI حذف شده‌اند. Snapshot قدیمی فقط در ابزار تست نگهداری می‌شود. |

## کامپوننت‌های باقی‌مانده، به ترتیب پوشه‌ها

| کامپوننت انگور | API موجود در ۲٫۱٫۰ | دلیل حفظ و قابلیت لازم برای جایگزینی کامل |
|---|---|---|
| carousel | `bulud-ng/carousel` | Bulud یک اسلاید فعال را رندر می‌کند؛ تعداد هم‌زمان ریسپانسیو، step و drag فعلی باید پشتیبانی شوند. |
| carousel-wrapper | `bulud-ng/carousel` | باید viewport اسکرولی، default index، نقاط، آستانهٔ swipe و رفتار drag فعلی حفظ شوند. |
| donut2-chart | `BuludDonutChart` در `bulud-ng/charts` | رنگ مجزای هر segment، tooltip قالب‌دار و رفتار مرکز/hover فعلی معادل دقیق ندارند. |
| file-upload | `bulud-ng/file-upload` | تبدیل تصویر به حداکثر ۱۰۰۰×۱۰۰۰، paste از clipboard، preview سفارشی و stateهای imperative فعلی نیاز به hook سازگار دارند. |
| language-switch | **از قبل از BuludDropdown استفاده می‌کند** | این پوشه زبان‌های مجاز هر اپ، LanguageService و پارامتر URL را مدیریت می‌کند؛ renderer پایهٔ dropdown در Bulud است. حذف منطق پروژه مجاز نیست. |
| month-picker | `bulud-ng/period-picker` | فلش فعلی ماه را عوض می‌کند؛ Bulud انتخاب سال/ماه دارد و فلش‌هایش سال را تغییر می‌دهند. قرارداد timestamp هم باید حفظ شود. |
| month-year-picker | `bulud-ng/period-picker` | محدودیت تک‌تک ماه‌ها همراه با مرور آزاد سال و عنوان سال غیرقابل‌ویرایش فعلی نیاز به API سازگار دارد. |
| not-found | `bulud-ng/empty-state` | layout تمام‌صفحهٔ دو ستونهٔ ۴۰۴، تصویر متفاوت موبایل و مسیر `/dashboard` ترکیب مخصوص انگور هستند؛ empty-state فعلی جایگزین مستقیم این صفحه نیست. |
| otp | `bulud-ng/otp` | Bulud یک input دارد؛ انگور inputهای جدا با focus/backspace/paste و validation هر رقم دارد. |
| platform-card | معادل یک‌به‌یک ندارد | کارت حساب/کیف پول شامل مدل حساب، مبلغ، اعتبار، وضعیت غیرفعال و route مخصوص پروژه است. بخش عمومی قابل استخراج است؛ قواعد حساب و مسیرها باید در انگور بمانند. |
| stepper | `bulud-ng/stepper` | stateهای محتوایی current/previous/next، تغییر مرحلهٔ imperative و scroll فعلی باید حفظ شوند. |
| stock-chart | `BuludChart` در `bulud-ng/charts` | axis domain/tick، دقت مالی و tooltip کندلی فعلی API معادل دقیق ندارند. |
| tab-set | `bulud-ng/tabs` | Bulud انتخاب نامعتبر را به تب فعال تبدیل می‌کند؛ انگور تب مخفی به‌علت permission/نبود انتخاب را حفظ می‌کند، panel را بدون حساسیت به حروف تطبیق می‌دهد و کلیک تکراری را emit می‌کند. |
| timer-contdown | `bulud-ng/countdown` | Bulud متن `HH:mm:ss` و deadline میلی‌ثانیه دارد؛ انگور `mm:ss` با spanهای مجزا و `start/stop` بر اساس Unix seconds دارد. |
| tooltip | `bulud-ng/tooltip` | Bulud tooltip متنی با hover/focus است؛ انگور محتوای rich، بازوبسته‌شدن با کلیک و anchor/visibility imperative دارد. |

## دایرکتیوها

هشت دایرکتیو عمومی باقی‌مانده، در نسخهٔ نصب‌شده export معادل یک‌به‌یک ندارند. `BuludEnglishDigitsPipe` فقط رقم‌ها را تبدیل می‌کند و جایگزین keyboard directive نیست؛ `BuludNumberPipe` هم formatter نمایشی است و numeric CVA ورودی نیست.

| دایرکتیو | قابلیت لازم در Bulud / علت حفظ |
|---|---|
| input-mask | mask، placeholder، caret و حذف رقم با کلیدهای Backspace/Delete روی همان input |
| button-loader | افزودن loader به button فعلی؛ `BuludButton.loading` رفتار و markup متفاوتی دارد. |
| only-numbers | محدودیت رقم/اعشار و هماهنگی با NgControl روی همان input |
| number-separator | CVA عددی با grouping، اعشار، caret و حذف از کنار separator |
| max-length | محدودیت keypress با پشتیبانی selection در input فعلی |
| has-access | منطق scope/JWT مخصوص انگور؛ بخش قابل‌استفادهٔ عمومی می‌تواند callback بگیرد، اما Auth/JWT پروژه نباید به کتابخانه منتقل شود. |
| input-filter | قرارداد regex روی input/keypress و رفتار propagation فعلی |
| english-keyboard | تبدیل چیدمان حروف فارسی/عربی و رقم‌ها، uppercase، caret و event خروجی فعلی |

دایرکتیوهای `bulud-*` موجود در انگور adapter اتصال به Bulud هستند و renderer پایهٔ تکراری نیستند: dropdown، filter، modal، theme، datepicker و pagination. حذفشان بدون انتقال قراردادهای اسکالر، API و state پروژه رفتار را عوض می‌کند.

## پایپ‌ها

پایپ‌های mask-email و PascalCase در مراحل قبل به Bulud منتقل و حذف شده‌اند. برای شش پایپ زیر، نام مشابه در `bulud-ng/utilities` وجود دارد، ولی خروجی/قرارداد کاملاً یکسان نیست. شش تست executable در `bulud-remaining-compatibility.spec.ts` نمونهٔ تفاوت‌ها را ثبت می‌کنند.

| پایپ انگور | معادل Bulud | اختلاف قابل مشاهده / قرارداد لازم |
|---|---|---|
| cardNumber | BuludCardNumberPipe | شمارهٔ ۱۶ رقمی ساده یکسان است؛ متن ماسک‌شده و طول‌های غیرمضرب چهار متفاوت گروه‌بندی می‌شوند. |
| fileExtension | BuludFileExtensionPipe | Bulud حروف را lowercase و query/fragment را حذف می‌کند؛ `invoice.PDF` در UI قبلی `PDF` بود و در Bulud `pdf` می‌شود. |
| isImage | BuludIsImagePipe | تشخیص AVIF، URL امضاشده و syntax قدیمی `bmp+xml` متفاوت است؛ می‌تواند نوع preview را تغییر دهد. |
| datetime | BuludDateTimePipe | ترتیب و جداکنندهٔ تاریخ میلادی و padding/جداکنندهٔ تاریخ فارسی با خروجی قبلی متفاوت است. |
| toTimeStamp | BuludTimestampPipe | تاریخ معتبر یکسان است؛ تاریخ نامعتبر در قبلی exception و در Bulud null می‌دهد. گزینهٔ سازگار باید این قرارداد را روشن نگه دارد. |
| unixTimeConverter | BuludUnixTimeConverterPipe | برچسب‌های محور/tooltip دوره‌های daily/weekly/monthly/yearly، notation زمان و suffix قبلی `(Local)` متفاوت‌اند. |

## مرحلهٔ تکمیل Bulud

پس از این فهرست، کمبودهای عمومی می‌توانند در خود Bulud با API typed، signals، OnPush، Tailwind و تست حالت‌ها تکمیل شوند و در یک نسخهٔ جدید منتشر شوند. entry هر feature باید مستقل بماند. مدل حساب، permission/JWT، LanguageService، API درخواست‌ها و routeهای انگور به کتابخانه منتقل نمی‌شوند. تا آماده‌شدن و تست تطابق آن نسخه، موارد ناسازگار بالا عمداً حذف نشده‌اند.

## شواهد و حدود تست

- `compatible-parity.mjs`: ۹۶ مقایسهٔ دقیق تصویر avatar/identity/menu/loading در FA/EN/AR/TR، دو تم و عرض‌های ۳۷۵/۱۲۸۰. همچنین ۱۶ سناریوی مرورگری pagination با next، رفتن به صفحه، refresh تکراری، جلوگیری از پرش نامعتبر، keyboard focus و جلوگیری از overflow صفحه.
- تست‌های account-menu دریافت پروفایل، supporter identity، مسیر امنیت/پروفایل، popup، خروج و unsubscribe را با سرویس‌های mock بررسی می‌کنند.
- این‌ها تست renderer/کامپوننت با assets و فونت واقعی انگور هستند؛ تست end-to-end احراز هویت‌شدهٔ همهٔ workflowهای سرور نیستند.
- استایل pagination استثنای صریح تأییدشده است. تغییرات انگور روی همان برنچ محلی می‌مانند و کامیت/پوش نمی‌شوند.

کنترل نهایی: بیلد هر پنج اپ و guard ورودی‌های مستقل Bulud موفق‌اند. ۱۳۱ تست Jest پاس شده‌اند (شامل شش تست مستندکنندهٔ اختلاف پایپ‌ها). ۹۶ مقایسهٔ تصویری صفر پیکسل اختلاف دارند و ۱۶ سناریوی مرورگری pagination موفق‌اند. خروجی کامل اندازهٔ bundle و شواهد در `compatible-results.json` و `audit.json` نگهداری می‌شوند.


## Expanded shared scope and Angular upgrade (2026-11-15)

The user explicitly requests that all reusable components, directives (including
existing app-side Bulud adapters), pipes and both date-range/theme services move
to independently importable Bulud entries. Runtime language lists and themes
are project-supplied and may contain any number of values. Auth/JWT decoding,
API persistence, cookie domains, URL routing and account-specific decisions must
remain supplied as typed application configuration, not library dependencies.

- Registry-verified latest stable Angular core/compiler/common/forms/router: 22.2.6.
- CLI/build: 22.2.7, ng-packagr: 22.2.6, TypeScript: 6.0.3. User explicitly authorizes this dependency update.
- Official change-detection-eager migration affects legacy spec hosts only.
  All production renderers remain explicit OnPush. Full suite passes 776 tests.
- New input behaviors, access, otp-digits, projected-tabs, view-stepper, timer,
  appearance, date-range, runtime, multi-carousel and scroll-carousel entries
  have been implemented incrementally; new carousel scoped tests pass 3 + 2.
- Six real-browser E2E scenarios cover current migration primitives. Exact
  Angour frozen-template parity and release validation remain required.
- `BuludDateRangeService` intentionally preserves native Date month/year rollover;
  existing `buludDateRange` continues to clamp month ends for existing consumers.
- `BuludAppearance` provides arbitrary theme cycling and callbacks for persistence;
  it never imports account/auth/cookie/router implementations.
- Publication and Angour deletion are pending. Source version remains 2.2.0
  as an unreleased candidate; Angular peer compatibility/versioning must be
  finalized before publication.
