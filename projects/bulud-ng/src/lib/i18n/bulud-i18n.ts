import {
  DOCUMENT,
  EnvironmentProviders,
  InjectionToken,
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

/** Accessible and visible status text used by the Button component. */
export interface BuludButtonLocale {
  readonly loadingLabel: string;
}

/** Accessible text used by the dismissible Badge component. */
export interface BuludBadgeLocale {
  readonly dismissLabel: string;
}

/** Accessible strings used by the Pagination component. */
export interface BuludPaginationLocale {
  readonly navigationLabel: string;
  readonly previousPageLabel: string;
  readonly nextPageLabel: string;
  readonly pageLabel: (page: number) => string;
  readonly currentPageLabel: (page: number) => string;
  readonly ellipsisLabel: string;
}

export interface BuludLocale {
  readonly language: BuludLanguage;
  readonly direction: BuludDirection;
  readonly dropdown: BuludDropdownLocale;
  /** Optional for compatibility with locale objects created before Button. */
  readonly button?: BuludButtonLocale;
  /** Optional for compatibility with locale objects created before Badge. */
  readonly badge?: BuludBadgeLocale;
  /** Optional for compatibility with locale objects created before Pagination. */
  readonly pagination?: BuludPaginationLocale;
}

export type BuludLocaleConfig = Partial<
  Omit<BuludLocale, 'dropdown' | 'button' | 'badge' | 'pagination'>
> & {
  readonly dropdown?: Partial<BuludDropdownLocale>;
  readonly button?: Partial<BuludButtonLocale>;
  readonly badge?: Partial<BuludBadgeLocale>;
  readonly pagination?: Partial<BuludPaginationLocale>;
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
  button: {
    loadingLabel: 'Loading',
  },
  badge: {
    dismissLabel: 'Remove badge',
  },
  pagination: {
    navigationLabel: 'Pagination',
    previousPageLabel: 'Previous page',
    nextPageLabel: 'Next page',
    pageLabel: (page) => `Page ${page}`,
    currentPageLabel: (page) => `Current page, ${page}`,
    ellipsisLabel: 'More pages',
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
  button: {
    loadingLabel: 'در حال بارگذاری',
  },
  badge: {
    dismissLabel: 'حذف نشان',
  },
  pagination: {
    navigationLabel: 'صفحه‌بندی',
    previousPageLabel: 'صفحه قبلی',
    nextPageLabel: 'صفحه بعدی',
    pageLabel: (page) => `صفحه ${page}`,
    currentPageLabel: (page) => `صفحه فعلی، ${page}`,
    ellipsisLabel: 'صفحه‌های بیشتر',
  },
};

export const BULUD_LOCALE = new InjectionToken<BuludLocale>('BULUD_LOCALE', {
  factory: () => BULUD_DEFAULT_LOCALE,
});

export function resolveBuludLocale(
  config: BuludLocaleConfig = {},
): BuludLocale {
  const base =
    config.language === 'fa' ? BULUD_PERSIAN_LOCALE : BULUD_DEFAULT_LOCALE;
  const pagination = base.pagination ?? BULUD_DEFAULT_LOCALE.pagination!;
  const button: BuludButtonLocale = {
    loadingLabel:
      config.button?.loadingLabel ??
      base.button?.loadingLabel ??
      BULUD_DEFAULT_LOCALE.button!.loadingLabel,
  };
  const badge: BuludBadgeLocale = {
    dismissLabel:
      config.badge?.dismissLabel ??
      base.badge?.dismissLabel ??
      BULUD_DEFAULT_LOCALE.badge!.dismissLabel,
  };

  return {
    ...base,
    ...config,
    dropdown: {
      ...base.dropdown,
      ...config.dropdown,
    },
    button,
    badge,
    pagination: {
      ...pagination,
      ...config.pagination,
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
      document.documentElement.setAttribute('lang', locale.language);
    }),
  ]);
}
