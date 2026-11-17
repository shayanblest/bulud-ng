import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import {
  BuludTour,
  BuludTourOverlay,
  BuludTourTarget,
  BULUD_TOUR_CONFIG,
  BuludTourStep,
} from 'bulud-ng/tour';
import { BuludRuntime, BULUD_RUNTIME_CONFIG } from 'bulud-ng/runtime';
import { BuludDropdown } from 'bulud-ng/dropdown';
import { BuludSwitch } from 'bulud-ng/switch';
import { Injectable } from '@angular/core';
@Injectable()
class TourDemoLocale {
  readonly language = signal('en');
  readonly direction = computed(() =>
    ['fa', 'ar'].includes(this.language())
      ? ('rtl' as const)
      : ('ltr' as const),
  );
}

const labels: Record<string, Record<string, string>> = {
  en: {
    title: 'Product tour',
    description: 'Explore the selected part of your project.',
    next: 'Next',
    previous: 'Previous',
    close: 'Close',
  },
  fa: {
    title: 'راهنمای محصول',
    description: 'بخش انتخاب‌شدهٔ پروژه را بشناسید.',
    next: 'بعدی',
    previous: 'قبلی',
    close: 'بستن',
  },
  ar: {
    title: 'جولة المنتج',
    description: 'اكتشف الجزء المحدد من مشروعك.',
    next: 'التالي',
    previous: 'السابق',
    close: 'إغلاق',
  },
  tr: {
    title: 'Ürün turu',
    description: 'Projenizin seçilen bölümünü keşfedin.',
    next: 'Sonraki',
    previous: 'Önceki',
    close: 'Kapat',
  },
};
@Component({
  selector: 'app-tour-demo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [BuludTourOverlay, BuludTourTarget, BuludDropdown, BuludSwitch],
  providers: [
    BuludTour,
    BuludRuntime,
    {
      provide: BULUD_TOUR_CONFIG,
      useValue: { startDelay: 0, targetTimeout: 300 },
    },
    {
      provide: BULUD_RUNTIME_CONFIG,
      useFactory: () => {
        const locale = inject(TourDemoLocale);
        return {
          language: locale.language,
          direction: locale.direction,
          translate: (key: string) =>
            labels[locale.language()]?.[key] ?? labels['en'][key] ?? key,
        };
      },
    },
    TourDemoLocale,
  ],
  template: ` <section
    id="tour-demo"
    class="bulud-app bulud-migration-demo"
    data-bulud-preset="angour"
    [attr.data-theme]="dark() ? 'dark' : 'light'"
    [dir]="locale.direction()"
    [attr.lang]="locale.language()"
  >
    <h2>{{ text('title') }}</h2>
    <div class="demo-toolbar">
      <bulud-dropdown
        class="demo-control"
        aria-label="Tour language"
        [options]="languages"
        [value]="locale.language()"
        (valueChange)="setLanguage($event)"
        [searchable]="false"
        [clearable]="false"
      />
      <bulud-switch
        appearance="theme"
        aria-label="Tour dark theme"
        [(checked)]="dark"
        >Theme</bulud-switch
      >
      <button
        class="demo-action"
        type="button"
        aria-label="Start tour"
        (click)="start()"
      >
        {{ text('title') }}
      </button>
      <button
        class="demo-action"
        type="button"
        aria-label="Missing tour target"
        (click)="missing()"
      >
        Missing target
      </button>
    </div>
    <div class="demo-widget-panel" buludTourTarget="demo-first">
      <h3>1</h3>
      <p>{{ text('description') }}</p>
    </div>
    <div class="demo-widget-panel" buludTourTarget="demo-second">
      <h3>2</h3>
      <p>{{ text('description') }}</p>
    </div>
    <output data-testid="tour-active">{{ tour.active() }}</output>
    <bulud-tour-overlay />
  </section>`,
})
export class TourDemo {
  protected readonly locale = inject(TourDemoLocale);
  protected readonly tour = inject(BuludTour);
  protected readonly dark = signal(false);
  protected readonly languages = ['en', 'fa', 'ar', 'tr'];
  protected text(key: string): string {
    return labels[this.locale.language()]?.[key] ?? labels['en'][key] ?? key;
  }
  protected setLanguage(value: unknown): void {
    if (typeof value === 'string') this.locale.language.set(value);
  }
  protected start(): void {
    this.tour.start(
      ['first', 'second'].map((part, index): BuludTourStep => ({
        id: part,
        targetId: 'tour-demo-' + part,
        titleKey: 'title',
        descriptionKey: 'description',
        nextLabelKey: 'next',
        previousLabelKey: index ? 'previous' : undefined,
        closeLabelKey: 'close',
        position: 'bottom',
      })),
    );
  }
  protected missing(): void {
    this.tour.start([
      { id: 'missing', targetId: 'tour-absent', description: 'Missing target' },
    ]);
  }
}
