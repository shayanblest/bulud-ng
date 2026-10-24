import {
  Component,
  ChangeDetectionStrategy,
  computed,
  inject,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { CATALOG } from './catalog';
import { BasePreferences } from '../preferences';
@Component({
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<header class="page-heading">
      <p class="eyebrow">BULUD NG</p>
      <h1>{{ p.text('کامپوننت‌ها', 'Components') }}</h1>
      <p class="lead">
        {{
          p.text(
            'هر کامپوننت یک صفحه مستقل با نمونه‌کد، دموی زنده و راهنمای API دارد.',
            'Each component has a dedicated page with sample code, live example and API guidance.'
          )
        }}
      </p>
    </header>
    <section class="surface">
      <label for="component-search">{{
        p.text('جست‌وجوی کامپوننت', 'Search components')
      }}</label
      ><input
        class="bulud-input"
        id="component-search"
        type="search"
        [value]="search()"
        (input)="edit($event)"
      />
      <div class="cards">
        @for (item of filtered(); track item.id) {
          <a [routerLink]="'/components/' + item.id"
            ><strong>{{ p.language() === 'fa' ? item.fa : item.id }}</strong
            ><code>{{ item.id }}</code></a
          >
        } @empty {
          <p role="status">
            {{ p.text('نتیجه‌ای پیدا نشد', 'No components found') }}
          </p>
        }
      </div>
    </section>`,
  styles: `
    input {
      display: block;
      width: 100%;
      box-sizing: border-box;
      margin-block: 12px 24px;
      padding: 12px;
      background: var(--bulud-body-bg);
      color: var(--bulud-color-on-surface);
      border: 1px solid var(--bulud-color-border);
      border-radius: var(--bulud-radius-control);
    }
    .cards {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(min(100%, 190px), 1fr));
      gap: 16px;
    }
    .cards a {
      display: grid;
      gap: 12px;
      text-decoration: none;
      color: var(--bulud-color-on-surface);
      background: var(--bulud-body-bg);
      padding: 20px;
      border-radius: var(--bulud-radius-control);
    }
    code {
      font-size: 0.8rem;
      color: var(--bulud-color-muted);
    }
  `,
})
export class CatalogIndex {
  readonly p = inject(BasePreferences);
  readonly search = signal('');
  readonly filtered = computed(() =>
    CATALOG.filter((x) =>
      (x.id + ' ' + x.fa)
        .toLowerCase()
        .includes(this.search().trim().toLowerCase()),
    ),
  );
  edit(e: Event): void {
    this.search.set((e.target as HTMLInputElement).value);
  }
}
