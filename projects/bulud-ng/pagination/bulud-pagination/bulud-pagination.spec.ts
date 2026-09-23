import {
  Component,
  provideZonelessChangeDetection,
  signal,
} from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideBuludLocale } from 'bulud-ng';
import {
  BULUD_DEFAULT_THEME,
  createBuludThemeVariables,
  provideBuludTheme,
  resolveBuludTheme,
} from '../../src/lib/theme/bulud-theme';
import { BuludPagination } from './bulud-pagination';

@Component({
  imports: [BuludPagination],
  template: `
    <bulud-pagination
      [currentPage]="page()"
      [pageCount]="count()"
      [disabled]="disabled()"
      [aria-label]="navigationLabel()"
      [previousPageLabel]="previousLabel()"
      [nextPageLabel]="nextLabel()"
      [pageLabel]="pageLabel()"
      (pageChange)="pageChange.set($event)"
    />
  `,
})
class TestHost {
  readonly page = signal(5);
  readonly count = signal(10);
  readonly disabled = signal(false);
  readonly navigationLabel = signal<string | undefined>(undefined);
  readonly previousLabel = signal<string | undefined>(undefined);
  readonly nextLabel = signal<string | undefined>(undefined);
  readonly pageLabel = signal<((page: number) => string) | undefined>(
    undefined,
  );
  readonly pageChange = signal<number | null>(null);
}

describe('BuludPagination', () => {
  let fixture: ComponentFixture<TestHost>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHost],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();
    fixture = TestBed.createComponent(TestHost);
    await fixture.whenStable();
  });

  const nav = (): HTMLElement => fixture.nativeElement.querySelector('nav');
  const buttons = (): HTMLButtonElement[] => [
    ...fixture.nativeElement.querySelectorAll('button'),
  ];

  it('renders a bounded middle window with one current page', () => {
    expect(
      [
        ...fixture.nativeElement.querySelectorAll(
          '.bulud-pagination__pages > li',
        ),
      ].map((button: Element) => button.textContent?.trim()),
    ).toEqual(['1', '…', '4', '5', '6', '…', '10']);
    expect(
      fixture.nativeElement.querySelectorAll('[aria-current="page"]').length,
    ).toBe(1);
    expect(nav().getAttribute('aria-label')).toBe('Pagination');
    const ellipsis = fixture.nativeElement.querySelector(
      '.bulud-pagination__ellipsis',
    );
    expect(ellipsis.getAttribute('aria-label')).toBe('More pages');
    expect(ellipsis.hasAttribute('aria-hidden')).toBeFalse();
    expect(ellipsis.querySelector('button, a, input')).toBeNull();
  });

  it('emits exactly one requested page and stays controlled', async () => {
    const pageButton = buttons().find(
      (button) => button.textContent?.trim() === '6',
    );
    pageButton?.click();
    expect(fixture.componentInstance.pageChange()).toBe(6);
    expect(fixture.componentInstance.page()).toBe(5);
    expect(
      fixture.nativeElement.querySelector('[aria-current="page"]')?.textContent,
    ).toContain('5');

    fixture.componentInstance.page.set(6);
    await fixture.whenStable();
    expect(
      fixture.nativeElement.querySelector('[aria-current="page"]')?.textContent,
    ).toContain('6');
  });

  it('emits previous and next requests, but not boundaries or current page', async () => {
    buttons()[0].click();
    expect(fixture.componentInstance.pageChange()).toBe(4);
    fixture.componentInstance.pageChange.set(null);
    buttons()
      .find((button) => button.textContent?.trim() === '5')
      ?.click();
    expect(fixture.componentInstance.pageChange()).toBeNull();
    buttons().at(-1)?.click();
    expect(fixture.componentInstance.pageChange()).toBe(6);

    fixture.componentInstance.page.set(1);
    await fixture.whenStable();
    fixture.componentInstance.pageChange.set(null);
    expect(buttons()[0].disabled).toBeTrue();
    buttons()[0].click();
    expect(fixture.componentInstance.pageChange()).toBeNull();
    fixture.componentInstance.page.set(10);
    await fixture.whenStable();
    expect(buttons().at(-1)?.disabled).toBeTrue();
  });

  it('does not emit while disabled and exposes native disabled semantics', async () => {
    fixture.componentInstance.disabled.set(true);
    await fixture.whenStable();
    const page = buttons().find((button) => button.textContent?.trim() === '6');
    page?.click();
    expect(page?.disabled).toBeTrue();
    expect(fixture.componentInstance.pageChange()).toBeNull();
  });

  it('keeps the current page background when hovered and excludes disabled controls', async () => {
    fixture.componentInstance.page.set(1);
    await fixture.whenStable();

    const currentPage = fixture.nativeElement.querySelector(
      '.bulud-pagination__page--current',
    ) as HTMLButtonElement;
    const previous = buttons()[0];
    expect(currentPage.matches(':hover')).toBeFalse();
    expect(
      currentPage.classList.contains('bulud-pagination__page--current'),
    ).toBeTrue();
    expect(previous.disabled).toBeTrue();
    expect(previous.matches(':disabled')).toBeTrue();

    const stylesheet = [...document.querySelectorAll('style')]
      .map((style) => style.textContent ?? '')
      .find((text) => text.includes('.bulud-pagination__page--current'));
    expect(stylesheet).toContain(
      ':hover:not(:disabled):not(.bulud-pagination__page--current)',
    );
  });

  it('supports single, invalid and very large page counts without duplicates', async () => {
    fixture.componentInstance.count.set(1);
    await fixture.whenStable();
    expect(
      fixture.nativeElement.querySelectorAll('.bulud-pagination__page').length,
    ).toBe(1);
    expect(
      fixture.nativeElement.querySelectorAll('.bulud-pagination__ellipsis')
        .length,
    ).toBe(0);
    fixture.componentInstance.count.set(0);
    await fixture.whenStable();
    expect(
      fixture.nativeElement.querySelectorAll('.bulud-pagination__page').length,
    ).toBe(0);
    fixture.componentInstance.count.set(1000000);
    fixture.componentInstance.page.set(500000);
    await fixture.whenStable();
    const labels = [
      ...fixture.nativeElement.querySelectorAll('.bulud-pagination__page'),
    ].map((button: Element) => button.textContent?.trim());
    expect(labels).toEqual(['1', '499999', '500000', '500001', '1000000']);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it('grows large page-number controls without clipping or overlap', async () => {
    fixture.componentInstance.count.set(1000000);
    fixture.componentInstance.page.set(500000);
    await fixture.whenStable();

    const page = buttons().find(
      (button) =>
        button.classList.contains('bulud-pagination__page') &&
        button.textContent?.trim() === '500000',
    );
    const previous = buttons()[0];
    const next = buttons().at(-1) as HTMLButtonElement;

    expect(page).toBeDefined();
    expect(page!.clientWidth).toBeGreaterThanOrEqual(page!.scrollWidth);
    expect(page!.clientWidth).toBeGreaterThan(40);
    const pageRect = page!.getBoundingClientRect();
    for (const control of [previous, next]) {
      const controlRect = control.getBoundingClientRect();
      expect(
        pageRect.right <= controlRect.left ||
          pageRect.left >= controlRect.right,
      ).toBeTrue();
    }
  });

  it('normalizes invalid current pages for rendering and stays silent', async () => {
    fixture.componentInstance.page.set(100);
    fixture.componentInstance.count.set(3);
    await fixture.whenStable();
    expect(
      fixture.nativeElement.querySelector('[aria-current="page"]')?.textContent,
    ).toContain('3');
    expect(fixture.componentInstance.pageChange()).toBeNull();
    fixture.componentInstance.page.set(0);
    fixture.componentInstance.count.set(2);
    await fixture.whenStable();
    expect(
      fixture.nativeElement.querySelector('[aria-current="page"]')?.textContent,
    ).toContain('1');
    expect(fixture.componentInstance.pageChange()).toBeNull();
  });

  it('normalizes non-finite current pages to valid boundaries without mutating input', async () => {
    const cases = [
      { value: Number.NaN, expected: 1, request: 2 },
      { value: Number.POSITIVE_INFINITY, expected: 10, request: 9 },
      { value: Number.NEGATIVE_INFINITY, expected: 1, request: 2 },
    ];

    for (const { value, expected, request } of cases) {
      fixture.componentInstance.page.set(value);
      fixture.componentInstance.pageChange.set(null);
      await fixture.whenStable();

      expect(
        fixture.nativeElement.querySelectorAll('[aria-current="page"]').length,
      ).toBe(1);
      expect(
        fixture.nativeElement.querySelector('[aria-current="page"]')
          ?.textContent,
      ).toContain(String(expected));
      if (Number.isNaN(value)) {
        expect(Number.isNaN(fixture.componentInstance.page())).toBeTrue();
      } else {
        expect(fixture.componentInstance.page()).toBe(value);
      }

      const previous = buttons()[0];
      const next = buttons().at(-1) as HTMLButtonElement;
      expect(previous.disabled).toBe(expected === 1);
      expect(next.disabled).toBe(expected === 10);

      (request < expected ? previous : next).click();
      expect(fixture.componentInstance.pageChange()).toBe(request);
      if (Number.isNaN(value)) {
        expect(Number.isNaN(fixture.componentInstance.page())).toBeTrue();
      } else {
        expect(fixture.componentInstance.page()).toBe(value);
      }
    }
  });

  it('uses configured locale labels and dynamic current-page labels', async () => {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [TestHost],
      providers: [
        provideZonelessChangeDetection(),
        provideBuludLocale({
          pagination: {
            navigationLabel: 'صفحه‌بندی نتایج',
            previousPageLabel: 'قبلی',
            nextPageLabel: 'بعدی',
            pageLabel: (page) => `صفحه ${page}`,
            currentPageLabel: (page) => `فعلی ${page}`,
            ellipsisLabel: 'بیشتر',
          },
        }),
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(TestHost);
    await fixture.whenStable();
    expect(nav().getAttribute('aria-label')).toBe('صفحه‌بندی نتایج');
    expect(buttons()[0].getAttribute('aria-label')).toBe('قبلی');
    expect(buttons().at(-1)?.getAttribute('aria-label')).toBe('بعدی');
    expect(
      fixture.nativeElement
        .querySelector('[aria-current="page"]')
        .getAttribute('aria-label'),
    ).toBe('فعلی 5');
    const ellipsis = fixture.nativeElement.querySelector(
      '.bulud-pagination__ellipsis',
    );
    expect(ellipsis.getAttribute('aria-label')).toBe('بیشتر');
    expect(ellipsis.hasAttribute('aria-hidden')).toBeFalse();
    expect(ellipsis.querySelector('button, a, input')).toBeNull();
  });

  it('supports instance label overrides and RTL logical behavior', async () => {
    fixture.componentInstance.navigationLabel.set('Results pages');
    fixture.componentInstance.previousLabel.set('Back');
    fixture.componentInstance.nextLabel.set('Forward');
    fixture.componentInstance.pageLabel.set((page: number) => `Go to ${page}`);
    await fixture.whenStable();
    expect(nav().getAttribute('aria-label')).toBe('Results pages');
    expect(buttons()[0].getAttribute('aria-label')).toBe('Back');
    expect(buttons().at(-1)?.getAttribute('aria-label')).toBe('Forward');
    expect(
      fixture.nativeElement.querySelector('button[aria-label="Go to 4"]'),
    ).not.toBeNull();
    nav().setAttribute('dir', 'rtl');
    buttons()[0].click();
    expect(fixture.componentInstance.pageChange()).toBe(4);
  });

  it('provides theme defaults and provider theme overrides', () => {
    expect(BULUD_DEFAULT_THEME.pagination).toBeUndefined();
    expect(resolveBuludTheme().pagination.size).toBe('2.5rem');
    expect(
      resolveBuludTheme({ pagination: { size: '3rem' } }).pagination.size,
    ).toBe('3rem');
    expect(
      createBuludThemeVariables({
        pagination: { activeBackground: '#14532d' },
      })['--bulud-pagination-active-background'],
    ).toBe('#14532d');
    const vars = provideBuludTheme({ pagination: { size: '3rem' } });
    expect(vars).toBeTruthy();
  });
});
