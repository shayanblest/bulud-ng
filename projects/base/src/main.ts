import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  provideZonelessChangeDetection,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BuludLoadingBar, BuludLoadingService } from 'bulud-ng/loading-bar';
import { bootstrapApplication } from '@angular/platform-browser';
import {
  Router,
  NavigationStart,
  NavigationEnd,
  NavigationCancel,
  NavigationError,
  NavigationSkipped,
  provideRouter,
  RouterOutlet,
  RouterLink,
  withComponentInputBinding,
  withInMemoryScrolling,
} from '@angular/router';
import { BaseSidebar } from './sidebar';
import { BaseToolbar } from './toolbar';
import { BasePreferences } from './preferences';
@Component({
  selector: 'base-root',
  imports: [
    RouterOutlet,
    RouterLink,
    BaseToolbar,
    BaseSidebar,
    BuludLoadingBar,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<bulud-loading-bar
      [label]="p.text('در حال بارگذاری صفحه', 'Page loading')"
    />
    <a class="skip" [href]="'.' + router.url.split('#')[0] + '#main'">{{
      p.text('رفتن به محتوا', 'Skip to content')
    }}</a>
    <header class="topbar">
      <a class="brand" routerLink="/"
        ><span class="brand-mark" aria-hidden="true">B</span
        ><span
          >Bulud<span class="brand-caption">{{
            p.text(
              'بیس مشترک · دیزاین انگور',
              'Shared foundation · Angour design'
            )
          }}</span></span
        ></a
      >
      @defer (on immediate) {
        <base-toolbar />
      } @placeholder {
        <div
          style="min-inline-size:180px;min-block-size:44px"
          aria-hidden="true"
        ></div>
      }
    </header>
    <button
      type="button"
      class="mobile-menu"
      aria-controls="navigation-panel"
      [attr.aria-expanded]="menuOpen()"
      (click)="menuOpen.set(!menuOpen())"
    >
      {{ p.text('منوی کامپوننت‌ها', 'Component menu') }}
      <span aria-hidden="true">☰</span>
    </button>
    <div class="shell">
      <div
        id="navigation-panel"
        class="navigation-panel"
        [class.mobile-open]="menuOpen()"
      >
        @defer (on immediate) {
          <base-sidebar />
        } @placeholder {
          <aside aria-hidden="true"></aside>
        }
      </div>
      <main id="main" tabindex="-1"><router-outlet /></main>
    </div>`,
})
class BaseApp {
  readonly menuOpen = signal(false);
  readonly p = inject(BasePreferences);
  readonly router = inject(Router);
  private readonly loading = inject(BuludLoadingService);
  constructor() {
    const tasks = new Map<number, number>();
    inject(Router)
      .events.pipe(takeUntilDestroyed())
      .subscribe((event) => {
        if (event instanceof NavigationStart)
          tasks.set(event.id, this.loading.start());
        if (
          event instanceof NavigationEnd ||
          event instanceof NavigationCancel ||
          event instanceof NavigationError ||
          event instanceof NavigationSkipped
        ) {
          const task = tasks.get(event.id);
          if (task !== undefined) {
            this.loading.finish(task);
            tasks.delete(event.id);
          }
        }
      });
  }
}
bootstrapApplication(BaseApp, {
  providers: [
    provideZonelessChangeDetection(),
    provideRouter(
      [
        {
          path: '',
          loadComponent: () => import('./overview').then((m) => m.BaseOverview),
        },
        {
          path: 'demo',
          redirectTo: 'components',
          pathMatch: 'full',
        },
        {
          path: 'components',
          loadChildren: () =>
            import('./catalog.routes').then((m) => m.CATALOG_ROUTES),
        },
        {
          path: 'forms',
          loadComponent: () => import('./forms').then((m) => m.BaseForms),
        },
        {
          path: 'shared',
          loadComponent: () => import('./shared').then((m) => m.BaseShared),
        },
        {
          path: 'charts',
          loadComponent: () => import('./charts').then((m) => m.BaseCharts),
        },
        { path: '**', redirectTo: '' },
      ],
      withComponentInputBinding(),
      withInMemoryScrolling({
        anchorScrolling: 'enabled',
        scrollPositionRestoration: 'enabled',
      }),
    ),
  ],
}).catch((error) => console.error(error));
