import {
  DOCUMENT,
  EnvironmentProviders,
  InjectionToken,
  RendererFactory2,
  RendererStyleFlags2,
  inject,
  makeEnvironmentProviders,
  provideEnvironmentInitializer,
} from '@angular/core';

export type BuludLanguage = 'en' | 'fa' | (string & {});
export type BuludDirection = 'ltr' | 'rtl';

export interface BuludDropdownLocale {
  readonly placeholder: string;
  readonly searchPlaceholder: string;
  readonly noResultsText: string;
  readonly loadingText: string;
  readonly emptyText: string;
  readonly selectedText: (count: number) => string;
  readonly clearLabel: string;
  readonly searchLabel: string;
}

export interface BuludLocale {
  readonly language: BuludLanguage;
  readonly direction: BuludDirection;
  readonly dropdown: BuludDropdownLocale;
}

export type BuludLocaleConfig = Partial<Omit<BuludLocale, 'dropdown'>> & {
  readonly dropdown?: Partial<BuludDropdownLocale>;
};

export const BULUD_DEFAULT_LOCALE: BuludLocale = {
  language: 'en',
  direction: 'ltr',
  dropdown: {
    placeholder: 'Select an option',
    searchPlaceholder: 'Search options',
    noResultsText: 'No options found',
    loadingText: 'Loading options…',
    emptyText: 'No options available',
    selectedText: (count) => `${count} selected`,
    clearLabel: 'Clear selection',
    searchLabel: 'Search options',
  },
};

export const BULUD_PERSIAN_LOCALE: BuludLocale = {
  language: 'fa',
  direction: 'rtl',
  dropdown: {
    placeholder: 'یک گزینه انتخاب کنید',
    searchPlaceholder: 'جست‌وجوی گزینه‌ها',
    noResultsText: 'گزینه‌ای پیدا نشد',
    loadingText: 'در حال بارگذاری…',
    emptyText: 'گزینه‌ای موجود نیست',
    selectedText: (count) => `${count} مورد انتخاب شد`,
    clearLabel: 'پاک کردن انتخاب',
    searchLabel: 'جست‌وجوی گزینه‌ها',
  },
};

export const BULUD_LOCALE = new InjectionToken<BuludLocale>('BULUD_LOCALE', {
  factory: () => BULUD_DEFAULT_LOCALE,
});

export function resolveBuludLocale(config: BuludLocaleConfig = {}): BuludLocale {
  const base = config.language === 'fa' ? BULUD_PERSIAN_LOCALE : BULUD_DEFAULT_LOCALE;

  return {
    ...base,
    ...config,
    dropdown: {
      ...base.dropdown,
      ...config.dropdown,
    },
  };
}

export function provideBuludLocale(
  config: BuludLocaleConfig = {},
): EnvironmentProviders {
  const locale = resolveBuludLocale(config);

  return makeEnvironmentProviders([
    { provide: BULUD_LOCALE, useValue: locale },
    provideEnvironmentInitializer(() => {
      const document = inject(DOCUMENT);
      const renderer = inject(RendererFactory2).createRenderer(null, null);
      renderer.setAttribute(document.documentElement, 'lang', locale.language);
      renderer.setAttribute(document.documentElement, 'dir', locale.direction);
      renderer.setStyle(
        document.documentElement,
        'direction',
        locale.direction,
        RendererStyleFlags2.DashCase,
      );
    }),
  ]);
}
