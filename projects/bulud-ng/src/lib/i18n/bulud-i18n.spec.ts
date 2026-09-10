import { DOCUMENT } from '@angular/common';
import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';

import {
  BULUD_LOCALE,
  BULUD_PERSIAN_LOCALE,
  provideBuludLocale,
  resolveBuludLocale,
} from './bulud-i18n';

describe('Bulud locale', () => {
  it('resolves English defaults and preserves partial overrides', () => {
    const locale = resolveBuludLocale({
      language: 'en',
      dropdown: { emptyText: 'Nothing here' },
    });

    expect(locale.language).toBe('en');
    expect(locale.direction).toBe('ltr');
    expect(locale.dropdown.emptyText).toBe('Nothing here');
    expect(locale.dropdown.loadingText).toBe('Loading options…');
  });

  it('resolves Persian language defaults and nested overrides', () => {
    const locale = resolveBuludLocale({
      language: 'fa',
      dropdown: { clearLabel: 'حذف انتخاب' },
    });

    expect(locale.direction).toBe('rtl');
    expect(locale.dropdown.placeholder).toBe(
      BULUD_PERSIAN_LOCALE.dropdown.placeholder,
    );
    expect(locale.dropdown.clearLabel).toBe('حذف انتخاب');
    expect(locale.dropdown.searchLabel).toBe(
      BULUD_PERSIAN_LOCALE.dropdown.searchLabel,
    );
  });

  it('provides the resolved locale and applies document language direction', () => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideBuludLocale({ language: 'fa' }),
      ],
    });

    const locale = TestBed.inject(BULUD_LOCALE);
    const document = TestBed.inject(DOCUMENT);

    expect(locale.language).toBe('fa');
    expect(locale.direction).toBe('rtl');
    expect(document.documentElement.lang).toBe('fa');
    expect(document.documentElement.dir).toBe('rtl');
    expect(document.documentElement.style.direction).toBe('rtl');
  });
});
