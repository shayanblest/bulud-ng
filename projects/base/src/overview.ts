import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BasePreferences } from './preferences';
@Component({
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<header class="page-heading">
      <p class="eyebrow">BULUD NG / ANGOUR</p>
      <h1>
        {{
          p.text(
            'یک پایه مشترک برای پروژه‌های شما',
            'A shared foundation for your projects'
          )
        }}
      </h1>
      <p class="lead">
        {{
          p.text(
            'کتابخانه مستقل Angular برای فرم، جدول، نمودار و ارتباط؛ با دیزاین سیستم انگور، تم روشن و تاریک و پشتیبانی فارسی و انگلیسی.',
            'Standalone Angular components for forms, tables, charts and conversation, with Angour themes and Persian/English support.'
          )
        }}
      </p>
      <a class="primary-link" routerLink="/components">{{
        p.text('مشاهده کامپوننت‌ها', 'Explore components')
      }}</a>
    </header>
    <div class="metrics">
      <article class="surface">
        <h2>{{ p.text('کامپوننت‌ها و صفحه‌ها', 'Components & pages') }}</h2>
        <p>
          {{
            p.text(
              'از منوی کامپوننت‌ها، صفحه مستقل هر قابلیت را باز کنید. زیرمنوی هر صفحه شامل نمایش، نمونه‌کد و API است.',
              'Open each feature from the Components menu. Its submenu links to the live example, source sample and API.'
            )
          }}
        </p>
      </article>
      <article class="surface">
        <h2>{{ p.text('حالت‌های رابط کاربری', 'UI states') }}</h2>
        <p>
          {{
            p.text(
              'بارگذاری، خالی، خطا، غیرفعال و اعتبارسنجی بخشی از قرارداد کامپوننت‌ها هستند. با سوییچ بالای صفحه تم را تغییر دهید.',
              'Loading, empty, error, disabled and validation states are explicit. Change the theme with the header switch.'
            )
          }}
        </p>
        <a routerLink="/components/loading-bar">{{
          p.text('لودینگ صفحه', 'Page loading')
        }}</a>
      </article>
      <article class="surface">
        <h2>Tree-shaking</h2>
        <p>
          {{
            p.text(
              'فقط قابلیت مورد نیاز را از مسیر مستقل آن وارد کنید. صفحه‌های مثال هم تنبل بارگذاری می‌شوند.',
              'Import only the secondary entry points you need. Example pages are lazy-loaded too.'
            )
          }}
        </p>
        <code dir="ltr"
          >import {{ '{' }} BuludButton {{ '}' }} from 'bulud-ng/button';</code
        >
      </article>
    </div>
    <section class="surface">
      <h2>{{ p.text('شروع و نصب', 'Run & install') }}</h2>
      <pre dir="ltr">
npm start
npm run package:local
npm install /path/to/dist/packages/bulud-ng-0.0.1.tgz</pre>
      <p>
        {{
          p.text(
            'انتشار عمومی npm پس از انتخاب حساب و مجوز انجام می‌شود. در پروژه مصرف‌کننده، CSS تم را صریح وارد کنید.',
            'Public npm publication awaits the owner’s account/license decision. Import theme CSS explicitly in the consuming application.'
          )
        }}
      </p>
      <pre dir="ltr">
@import 'bulud-ng/angour.css';
@import 'bulud-ng/angour-base.css';</pre>
    </section>`,
  styles: `
    article h2 {
      font-size: 1.1rem;
    }
    pre {
      white-space: pre-wrap;
      overflow-wrap: anywhere;
    }
    section {
      margin-block: 24px;
    }
  `,
})
export class BaseOverview {
  readonly p = inject(BasePreferences);
}
