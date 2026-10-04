import {
  Component,
  provideZonelessChangeDetection,
  signal,
} from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideBuludLocale } from './bulud-i18n';
import { BuludBadge } from '../../../badge/bulud-badge/bulud-badge';
import { BuludButton } from '../../../button/bulud-button/bulud-button';
import { BuludDropdown } from '../../../dropdown/bulud-dropdown/bulud-dropdown';
import { BuludPagination } from '../../../pagination/bulud-pagination/bulud-pagination';

@Component({
  imports: [BuludBadge, BuludButton, BuludDropdown, BuludPagination],
  template: `
    <div id="ancestor" [attr.dir]="ancestorDirection">
      <bulud-button loading [loadingLabel]="buttonLoadingLabel()">
        Save
      </bulud-button>
      <bulud-badge dismissible [dismissLabel]="badgeDismissLabel()">
        Published
      </bulud-badge>
      <bulud-dropdown [options]="options" />
      <bulud-pagination [pageCount]="2" />
    </div>
  `,
})
class LocaleHost {
  ancestorDirection: 'ltr' | 'rtl' = 'ltr';
  readonly buttonLoadingLabel = signal<string | undefined>(undefined);
  readonly badgeDismissLabel = signal<string | undefined>(undefined);
  readonly options: readonly string[] = [];
}

describe('Bulud locale integration', () => {
  let fixture: ComponentFixture<LocaleHost>;
  let originalLang: string | null;
  let originalDir: string | null;
  let originalInlineDirection: string;

  const button = (): HTMLButtonElement =>
    fixture.nativeElement.querySelector('bulud-button button');
  const badgeDismiss = (): HTMLButtonElement =>
    fixture.nativeElement.querySelector('bulud-badge button');
  const dropdownTrigger = (): HTMLButtonElement =>
    fixture.nativeElement.querySelector('bulud-dropdown [role="combobox"]');
  const pagination = (): HTMLElement =>
    fixture.nativeElement.querySelector('bulud-pagination nav');

  beforeEach(() => {
    originalLang = document.documentElement.getAttribute('lang');
    originalDir = document.documentElement.getAttribute('dir');
    originalInlineDirection = document.documentElement.style.direction;
  });

  afterEach(() => {
    restoreAttribute('lang', originalLang);
    restoreAttribute('dir', originalDir);
    document.documentElement.style.direction = originalInlineDirection;
  });

  async function create(providers: readonly object[] = []): Promise<void> {
    await TestBed.configureTestingModule({
      imports: [LocaleHost],
      providers: [provideZonelessChangeDetection(), ...providers],
    }).compileComponents();
    fixture = TestBed.createComponent(LocaleHost);
    await fixture.whenStable();
  }

  it('uses deterministic English defaults without a locale provider', async () => {
    await create();

    expect(button().parentElement?.textContent).toContain('Loading');
    expect(badgeDismiss().getAttribute('aria-label')).toBe('Remove badge');
    expect(dropdownTrigger().textContent).toContain('Select an option');
    expect(pagination().getAttribute('aria-label')).toBe('Pagination');
    expect(
      pagination().querySelector('[aria-label="Previous page"]'),
    ).not.toBeNull();
  });

  it('uses Persian defaults for labels, placeholders, messages, and text', async () => {
    await create([provideBuludLocale({ language: 'fa' })]);

    expect(button().parentElement?.textContent).toContain('در حال بارگذاری');
    expect(badgeDismiss().getAttribute('aria-label')).toBe('حذف نشان');
    expect(dropdownTrigger().textContent).toContain('یک گزینه انتخاب کنید');
    expect(pagination().getAttribute('aria-label')).toBe('صفحه‌بندی');

    dropdownTrigger().click();
    await fixture.whenStable();
    const search = fixture.nativeElement.querySelector(
      'bulud-dropdown input[type="search"]',
    ) as HTMLInputElement;
    expect(search.placeholder).toBe('جست‌وجوی گزینه‌ها');
    expect(search.getAttribute('aria-label')).toBe('جست‌وجوی گزینه‌ها');
    expect(
      fixture.nativeElement.querySelector('.bulud-dropdown__message')
        ?.textContent,
    ).toContain('گزینه‌ای موجود نیست');
  });

  it('keeps explicit instance text above English and Persian locale defaults', async () => {
    await create([
      provideBuludLocale({
        language: 'fa',
        button: { loadingLabel: 'متن سراسری' },
        badge: { dismissLabel: 'نشان سراسری' },
        dropdown: { placeholder: 'گزینه سراسری' },
      }),
    ]);

    fixture.componentInstance.buttonLoadingLabel.set('Saving now');
    fixture.componentInstance.badgeDismissLabel.set('Remove published badge');
    await fixture.whenStable();

    expect(button().parentElement?.textContent).toContain('Saving now');
    expect(button().parentElement?.textContent).not.toContain('متن سراسری');
    expect(badgeDismiss().getAttribute('aria-label')).toBe(
      'Remove published badge',
    );
    expect(dropdownTrigger().textContent).toContain('گزینه سراسری');
  });

  it('keeps explicit instance text above the English defaults', async () => {
    await create();

    fixture.componentInstance.buttonLoadingLabel.set('Saving now');
    fixture.componentInstance.badgeDismissLabel.set('Remove published badge');
    await fixture.whenStable();

    expect(button().parentElement?.textContent).toContain('Saving now');
    expect(badgeDismiss().getAttribute('aria-label')).toBe(
      'Remove published badge',
    );
  });

  it('inherits the nearest ancestor direction and follows changes without locale forcing', async () => {
    document.documentElement.setAttribute('dir', 'ltr');
    await create([provideBuludLocale({ language: 'fa' })]);

    const ancestor = fixture.nativeElement.querySelector(
      '#ancestor',
    ) as HTMLElement;
    expect(getComputedStyle(button()).direction).toBe('ltr');

    ancestor.setAttribute('dir', 'rtl');
    await fixture.whenStable();
    expect(getComputedStyle(button()).direction).toBe('rtl');
    expect(getComputedStyle(dropdownTrigger()).direction).toBe('rtl');

    ancestor.setAttribute('dir', 'ltr');
    await fixture.whenStable();
    expect(getComputedStyle(button()).direction).toBe('ltr');
  });
});

function restoreAttribute(name: string, value: string | null): void {
  if (value === null) {
    document.documentElement.removeAttribute(name);
  } else {
    document.documentElement.setAttribute(name, value);
  }
}
