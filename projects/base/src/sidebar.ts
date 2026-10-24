import {
  Component,
  ChangeDetectionStrategy,
  computed,
  inject,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  NavigationEnd,
  Router,
  RouterLink,
  RouterLinkActive,
} from '@angular/router';
import { filter, map } from 'rxjs';
import { BasePreferences } from './preferences';
import { CATALOG } from './catalog/catalog';
@Component({
  selector: 'base-sidebar',
  imports: [RouterLink, RouterLinkActive],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nav
      class="sidebar"
      [attr.aria-label]="p.text('ناوبری اصلی', 'Main navigation')"
    >
      <a
        class="menu-row"
        routerLink="/"
        routerLinkActive="active"
        [routerLinkActiveOptions]="{ exact: true }"
        ariaCurrentWhenActive="page"
      >
        <svg class="menu-icon" viewBox="0 0 24 24" aria-hidden="true">
          <path d="m3 10 9-7 9 7v10H3Z M9 20v-7h6v7" />
        </svg>
        <span>{{ p.text('نمای کلی', 'Overview') }}</span>
      </a>
      <a
        class="menu-row"
        routerLink="/components"
        routerLinkActive="active"
        [routerLinkActiveOptions]="{ exact: true }"
        ariaCurrentWhenActive="page"
      >
        <svg class="menu-icon" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z" />
        </svg>
        <span>{{ p.text('کامپوننت‌ها', 'Components') }}</span>
      </a>
      @for (group of groups; track group.id) {
        <button
          class="menu-row group-toggle"
          type="button"
          [class.active]="group.items.some(active)"
          [attr.aria-expanded]="isOpen(group.id, group.items.some(active))"
          [attr.aria-controls]="'menu-' + group.id"
          (click)="toggle(group.id, group.items.some(active))"
        >
          <svg class="menu-icon" viewBox="0 0 24 24" aria-hidden="true">
            <path [attr.d]="group.icon" />
          </svg>
          <span>{{ p.text(group.fa, group.en) }}</span>
          <svg class="chevron" viewBox="0 0 24 24" aria-hidden="true">
            <path d="m5 9 7 7 7-7" />
          </svg>
        </button>
        <div
          class="group-items"
          [id]="'menu-' + group.id"
          [hidden]="!isOpen(group.id, group.items.some(active))"
        >
          @for (item of group.items; track item.id) {
            <div class="feature-row">
              <a
                [routerLink]="'/components/' + item.id"
                routerLinkActive="active"
                ariaCurrentWhenActive="page"
                >{{ p.language() === 'fa' ? item.fa : item.id }}</a
              >
              <button
                class="feature-toggle"
                type="button"
                [attr.aria-label]="
                  p.text('بخش‌های ', 'Sections: ') +
                  (p.language() === 'fa' ? item.fa : item.id)
                "
                [attr.aria-expanded]="isOpen(item.id, active(item))"
                [attr.aria-controls]="'sections-' + item.id"
                (click)="toggle(item.id, active(item))"
              >
                <svg class="chevron" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="m5 9 7 7 7-7" />
                </svg>
              </button>
            </div>
            <div
              class="subnav"
              [id]="'sections-' + item.id"
              [hidden]="!isOpen(item.id, active(item))"
            >
              @for (section of sections; track section.id) {
                <a
                  [routerLink]="'/components/' + item.id"
                  [fragment]="section.id"
                  routerLinkActive="active"
                  [routerLinkActiveOptions]="sectionMatch"
                  ariaCurrentWhenActive="location"
                  >{{ p.text(section.fa, section.en) }}</a
                >
              }
            </div>
          }
        </div>
      }
    </nav>
  `,
  styleUrl: './sidebar.css',
})
export class BaseSidebar {
  readonly p = inject(BasePreferences);
  private readonly router = inject(Router);
  private readonly url = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map((event) => event.urlAfterRedirects),
    ),
    { initialValue: this.router.url },
  );
  private readonly path = computed(() => this.url().split(/[?#]/)[0]);
  private readonly expanded = signal<
    Record<string, { path: string; open: boolean }>
  >({});
  readonly active = (item: { id: string }) =>
    this.path() === '/components/' + item.id;
  readonly sectionMatch = {
    paths: 'exact',
    queryParams: 'ignored',
    matrixParams: 'ignored',
    fragment: 'exact',
  } as const;
  readonly sections = [
    { id: 'example', fa: 'نمایش و حالت‌ها', en: 'Example & states' },
    { id: 'code', fa: 'نمونه‌کد', en: 'Sample code' },
    { id: 'api', fa: 'API', en: 'API' },
  ];
  isOpen(id: string, fallback: boolean): boolean {
    const state = this.expanded()[id];
    return state?.path === this.path() ? state.open : fallback;
  }
  toggle(id: string, fallback: boolean): void {
    const open = !this.isOpen(id, fallback);
    this.expanded.update((state) => ({
      ...state,
      [id]: { path: this.path(), open },
    }));
  }
  readonly groups = [
    {
      id: 'controls',
      fa: 'کنترل‌ها و فرم',
      en: 'Controls & forms',
      icon: 'M4 5h16 M4 12h16 M4 19h16 M8 2v6 M16 9v6 M10 16v6',
    },
    {
      id: 'layout',
      fa: 'چیدمان و ناوبری',
      en: 'Layout & navigation',
      icon: 'M3 3h18v18H3z M3 9h18 M9 9v12',
    },
    {
      id: 'display',
      fa: 'نمایش و ارتباط',
      en: 'Display & communication',
      icon: 'M3 4h18v13H9l-6 4Z M7 8h10 M7 12h7',
    },
    {
      id: 'charts',
      fa: 'نمودارها',
      en: 'Charts',
      icon: 'M3 3v18h18 M7 16v-5 M12 16V6 M17 16V9',
    },
    {
      id: 'utilities',
      fa: 'دایرکتیو، پایپ و سرویس',
      en: 'Directives, pipes & services',
      icon: 'm8 5-6 7 6 7 M16 5l6 7-6 7 M14 3l-4 18',
    },
  ].map((group) => ({
    ...group,
    items: CATALOG.filter((item) => item.group === group.id),
  }));
}
