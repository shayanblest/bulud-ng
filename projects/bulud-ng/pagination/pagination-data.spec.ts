import {
  ChangeDetectionStrategy,
  Component,
  Injectable,
  inject,
  provideZonelessChangeDetection,
  signal,
  viewChild,
} from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { BuludRuntime } from 'bulud-ng/runtime';
import {BuludPagination} from './bulud-pagination/bulud-pagination';
import { BuludPaginationData } from './pagination-data';

@Injectable()
class Translations {
  readonly language = signal('en');
  private readonly dictionaries: Record<
    string,
    Record<string, Record<string, string>>
  > = {};
  setTranslation(
    language: string,
    value: Record<string, Record<string, string>>,
  ): void {
    this.dictionaries[language] = value;
  }
  use(language: string): void {
    this.language.set(language);
  }
  text(
    key: string,
    fallback: string,
    params?: Readonly<Record<string, unknown>>,
  ): string {
    const [group, name] = key.split('.');
    let value = this.dictionaries[this.language()]?.[group]?.[name] ?? fallback;
    for (const [key, param] of Object.entries(params ?? {}))
      value = value.replace('{{' + key + '}}', String(param));
    return value;
  }
}

@Component({
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [BuludPagination, BuludPaginationData],
  template: `<bulud-pagination
    buludPaginationData
    #pages="buludPaginationData"
    [itemsCount]="count()"
    [activePage]="page()"
    [pageLength]="length()"
    [pageCount]="pages.pageCount()"
    [currentPage]="pages.currentPage()"
    [aria-label]="pages.labels().navigation"
    [previousPageLabel]="pages.labels().previous"
    [nextPageLabel]="pages.labels().next"
    [pageLabel]="pages.pageLabel"
    [currentPageLabel]="pages.currentPageLabel"
    (pageChange)="pages.select($event); requests.push($event)"
  />`,
})
class Host {
  readonly count = signal<number | undefined>(101);
  readonly page = signal<number | string | undefined>(1);
  readonly length = signal<number | undefined>(10);
  readonly adapter = viewChild.required(BuludPaginationData);
  readonly requests: number[] = [];
}

describe('Angour API paging with published Bulud controls', () => {
  async function setup() {
    await TestBed.configureTestingModule({
      imports: [Host],
      providers: [
        provideZonelessChangeDetection(),
        Translations,
        { provide: BuludRuntime, useFactory: () => inject(Translations) },
      ],
    }).compileComponents();
    const translate = TestBed.inject(Translations);
    for (const language of ['en', 'fa', 'ar', 'tr', 'de']) {
      translate.setTranslation(language, {
        PAGINATION: {
          Navigation: language + ' pages',
          Previous: language + ' previous',
          Next: language + ' next',
          Page: language + ' {{page}}',
          CurrentPage: language + ' current {{page}}',
          More: language + ' more',
        },
      });
    }
    translate.use('en');
    const fixture = TestBed.createComponent(Host);
    fixture.autoDetectChanges();
    await fixture.whenStable();
    return { fixture, host: fixture.componentInstance, translate };
  }

  it('converts item totals into page counts without generating a per-item array', async () => {
    const { fixture, host } = await setup();
    expect(host.adapter().pageCount()).toBe(11);
    host.count.set(1_000_000);
    host.length.set(25);
    await fixture.whenStable();
    expect(host.adapter().pageCount()).toBe(40_000);
    expect(
      fixture.nativeElement.querySelectorAll('.bulud-pagination__page').length,
    ).toBeLessThanOrEqual(5);
  });

  it('preserves default and custom page lengths, partial final pages and string page inputs', async () => {
    const { fixture, host } = await setup();
    host.count.set(21);
    host.length.set(undefined);
    host.page.set('2');
    await fixture.whenStable();
    expect(host.adapter().pageCount()).toBe(3);
    expect(host.adapter().currentPage()).toBe(2);
    host.length.set(20);
    await fixture.whenStable();
    expect(host.adapter().pageCount()).toBe(2);
  });

  it('emits one existing API request per click and tracks rapid navigation before a response', async () => {
    const { fixture, host } = await setup();
    const next = fixture.nativeElement.querySelector(
      '.bulud-pagination__control--next',
    ) as HTMLButtonElement;
    next.click();
    await fixture.whenStable();
    next.click();
    await fixture.whenStable();
    expect(host.requests).toEqual([2, 3]);
    expect(host.adapter().jumpPage()).toBe('3');
    expect(host.page()).toBe(1);
  });

  it('responds to browser/API page changes and clears optimistic state', async () => {
    const { fixture, host } = await setup();
    host.adapter().select(5);
    host.page.set(2);
    await fixture.whenStable();
    expect(host.adapter().currentPage()).toBe(2);
    expect(host.adapter().jumpPage()).toBe('2');
    expect(host.requests).toEqual([]);
  });

  it('resets a jump draft on API total/page-size changes while preserving a requested page', async () => {
    const { fixture, host } = await setup();
    host.adapter().select(3);
    host.adapter().jumpPage.set('7');
    host.count.set(150);
    await fixture.whenStable();
    expect(host.adapter().currentPage()).toBe(3);
    expect(host.adapter().jumpPage()).toBe('3');
    host.adapter().jumpPage.set('8');
    host.length.set(20);
    await fixture.whenStable();
    expect(host.adapter().jumpPage()).toBe('3');
    expect(host.requests).toEqual([]);
  });

  it('keeps explicit go-to-page refreshes, including the current page', async () => {
    const { fixture, host } = await setup();
    host.adapter().jumpPage.set('1');
    host.adapter().jump();
    await fixture.whenStable();
    host.adapter().jumpPage.set('7');
    host.adapter().jump();
    await fixture.whenStable();
    expect(host.requests).toEqual([1, 7]);
    expect(host.adapter().currentPage()).toBe(7);
  });

  for (const value of ['', '0', '-1', '12', 'NaN', '2abc', 'Infinity'])
    it(
      'rejects invalid jump ' + value + ' without querying the API',
      async () => {
        const { host } = await setup();
        host.adapter().jumpPage.set(value);
        expect(host.adapter().jumpInvalid()).toBe(true);
        host.adapter().jump();
        expect(host.requests).toEqual([]);
      },
    );

  it('keeps the legacy integer conversion for a valid decimal jump', async () => {
    const { host } = await setup();
    host.adapter().jumpPage.set('2.9');
    host.adapter().jump();
    expect(host.requests).toEqual([2]);
  });

  it('disables boundary navigation and empty/invalid totals without emitting on initialization', async () => {
    const { fixture, host } = await setup();
    expect(
      fixture.nativeElement.querySelector(
        '.bulud-pagination__control--previous',
      ).disabled,
    ).toBe(true);
    host.page.set(11);
    await fixture.whenStable();
    expect(
      fixture.nativeElement.querySelector('.bulud-pagination__control--next')
        .disabled,
    ).toBe(true);
    for (const count of [0, undefined, NaN, -10]) {
      host.count.set(count);
      await fixture.whenStable();
      expect(host.adapter().pageCount()).toBe(0);
      expect(
        fixture.nativeElement.querySelectorAll('.bulud-pagination__page')
          .length,
      ).toBe(0);
    }
    expect(host.requests).toEqual([]);
  });

  it('updates translated accessible labels without restricting the project language list', async () => {
    const { fixture, host, translate } = await setup();
    for (const language of ['fa', 'ar', 'tr', 'de', 'en']) {
      translate.use(language);
      await fixture.whenStable();
      expect(
        fixture.nativeElement.querySelector('nav').getAttribute('aria-label'),
      ).toBe(language + ' pages');
      expect(
        fixture.nativeElement
          .querySelector('[aria-current=page]')
          .getAttribute('aria-label'),
      ).toBe(language + ' current 1');
    }
    expect(host.requests).toEqual([]);
  });
});
