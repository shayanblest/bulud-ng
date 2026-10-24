import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  signal,
} from '@angular/core';
import { BasePreferences } from '../preferences';
@Component({
  selector: 'feature-frame',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<header class="page-heading">
      <p class="eyebrow">
        {{ p.text('بلود / کامپوننت‌ها', 'BULUD NG / COMPONENTS') }}
      </p>
      <h1>{{ title() }}</h1>
      <p class="lead">{{ description() }}</p>
    </header>
    <section id="example" class="surface example">
      <h2>{{ p.text('دموی کامپوننت', 'Live example') }}</h2>
      <ng-content />
    </section>
    <section id="code" class="surface">
      <div class="code-heading">
        <h2>{{ p.text('نمونه‌کد', 'Sample code') }}</h2>
        <button type="button" (click)="copy()">
          {{
            copied()
              ? p.text('کپی شد', 'Copied')
              : p.text('کپی کد', 'Copy code')
          }}
        </button>
      </div>
      <pre dir="ltr"><code>{{code()}}</code></pre>
      @if (copyError()) {
        <p role="status">
          {{
            p.text(
              'کد را انتخاب و کپی کنید.',
              'Select and copy the code manually.'
            )
          }}
        </p>
      }
    </section>
    <section id="api" class="surface">
      <h2>{{ p.text('API و نکات استفاده', 'API & usage') }}</h2>
      <p>{{ api() }}</p>
      <p>
        {{
          p.text(
            'تم، جهت صفحه و زبان را از نوار بالا تغییر دهید. مقادیر فرم و آرایه‌ها را به‌صورت تغییرناپذیر به‌روز کنید.',
            'Use the header to change theme, direction and language. Update form values and arrays immutably.'
          )
        }}
      </p>
      <code dir="ltr">{{ entry() }}</code>
    </section>`,
  styles: `
    :host {
      display: block;
      min-inline-size: 0;
    }
    section {
      margin-block: 24px;
      scroll-margin-top: 24px;
    }
    h2 {
      font-size: 1.1rem;
      margin-block: 0 20px;
    }
    .code-heading {
      display: flex;
      justify-content: space-between;
      gap: 16px;
    }
    pre {
      overflow: auto;
      max-inline-size: 100%;
      padding: 20px;
      background: var(--bulud-body-bg);
      border-radius: var(--bulud-radius-control);
      font-size: 13px;
      line-height: 1.7;
      white-space: pre;
    }
    .example {
      overflow: visible;
    }
    button {
      font: inherit;
      color: var(--bulud-color-primary);
      background: var(--bulud-color-surface);
      border: 1px solid var(--bulud-color-border);
      border-radius: var(--bulud-radius-control);
      padding: 8px 16px;
      cursor: pointer;
    }
    button:focus-visible {
      outline: 2px solid var(--bulud-color-focus);
    }
  `,
})
export class FeatureFrame {
  readonly p = inject(BasePreferences);
  readonly title = input.required<string>();
  readonly code = input.required<string>();
  readonly entry = input.required<string>();
  readonly description = input('');
  readonly api = input('');
  readonly copied = signal(false);
  readonly copyError = signal(false);
  async copy(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.code());
      this.copied.set(true);
      this.copyError.set(false);
    } catch {
      this.copyError.set(true);
    }
  }
}
