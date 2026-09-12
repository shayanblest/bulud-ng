import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DOCUMENT,
  effect,
  inject,
  signal,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import {
  BuludButton,
  BuludButtonSize,
  BuludButtonVariant,
} from 'bulud-ng/button';
import { BuludDropdown } from 'bulud-ng/dropdown';
import { BuludBadge, BuludBadgeVariant } from 'bulud-ng/badge';
import {
  BuludElementSize,
  BuludResizeObserver,
} from 'bulud-ng/resize-observer';
import { BuludClickOutside } from 'bulud-ng/clickoutside';
import { BuludTab, BuludTabPanel, BuludTabs } from 'bulud-ng/tabs';

interface VariantPreview {
  readonly name: BuludButtonVariant;
  readonly label: string;
  readonly description: string;
}

interface SizePreview {
  readonly name: BuludButtonSize;
  readonly label: string;
}

interface DemoOption {
  readonly id: string;
  readonly label: string;
  readonly meta: string;
}

@Component({
  selector: 'app-root',
  imports: [
    BuludButton,
    BuludDropdown,
    BuludBadge,
    BuludResizeObserver,
    BuludClickOutside,
    BuludTabs,
    BuludTab,
    BuludTabPanel,
    NgTemplateOutlet,
  ],
  templateUrl: './app.html',
  styleUrl: './app.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  private readonly document = inject(DOCUMENT);
  protected readonly language = signal<'en' | 'fa'>('fa');
  protected readonly buttonTab = signal<'preview' | 'code'>('preview');
  protected readonly dropdownTab = signal<'preview' | 'code'>('preview');
  protected readonly badgeVariants: readonly BuludBadgeVariant[] = [
    'neutral',
    'primary',
    'success',
    'warning',
    'danger',
  ];
  protected readonly copy = {
    en: {
      preview: 'Component preview',
      navVariants: 'Variants',
      navStates: 'States',
      navDropdown: 'Dropdown',
      navTheme: 'Theme',
      switch: 'English',
      badge: 'Local library source · live preview',
      hero: 'Build consistent Angular interfaces',
      heroAccent: 'without locking down creativity.',
      intro:
        'Bulud components share one typed consumer configuration with your Tailwind utilities. Change a token once and the entire application follows.',
      primary: 'Try the primary action',
      api: 'Read the API',
      clicked: 'Primary action clicked',
      time: 'time',
      times: 'times',
      config: 'Owned by the consumer application',
      active: 'Active',
      catalog: 'Component catalog',
      button: 'Button',
      buttonDesc:
        'A semantic native button wrapped in a typed standalone Angular component. Every visual state inherits the active theme.',
      variants: 'Variants',
      variantsDesc: 'Clear hierarchy for every action level.',
      sizes: 'Sizes',
      sizesDesc: 'Consistent rhythm from compact tools to prominent actions.',
      states: 'States',
      statesDesc: 'Accessible disabled and loading behavior included.',
      ready: 'Ready',
      disabled: 'Disabled',
      publish: 'Publish',
      loading: 'Loading',
      empty: 'Empty options',
      dropdown: 'Dropdown',
      dropdownTitle: 'Search, select, compose',
      single: 'Single selection',
      singleDesc: 'Searchable options with custom metadata.',
      multiple: 'Multiple selection',
      multipleDesc: 'Select several owners without closing the panel.',
      frameworkLabel: 'Choose a framework',
      teamLabel: 'Choose team members',
      interactive: 'Interactive layout',
      interactiveDesc:
        'Tailwind controls the host layout; Bulud controls component behavior.',
      fullWidth: 'Full-width button',
      increment: 'Increment preview counter',
      current: 'Current count:',
      reset: 'Reset',
    },
    fa: {
      preview: 'پیش‌نمایش کامپوننت‌ها',
      navVariants: 'گونه‌ها',
      navStates: 'وضعیت‌ها',
      navDropdown: 'کشویی',
      navTheme: 'تم',
      switch: 'فارسی',
      badge: 'سورس کتابخانه · پیش‌نمایش زنده',
      hero: 'رابط‌های Angular یکپارچه بسازید',
      heroAccent: 'بدون محدود کردن خلاقیت.',
      intro:
        'کامپوننت‌های Bulud با یک پیکربندی تایپ‌شده در کنار ابزارهای Tailwind کار می‌کنند. یک توکن را تغییر دهید تا کل برنامه به‌روزرسانی شود.',
      primary: 'اجرای عملیات اصلی',
      api: 'مشاهده API',
      clicked: 'عملیات اصلی اجرا شد',
      time: 'بار',
      times: 'بار',
      config: 'متعلق به برنامه مصرف‌کننده',
      active: 'فعال',
      catalog: 'فهرست کامپوننت‌ها',
      button: 'دکمه',
      buttonDesc:
        'یک کامپوننت مستقل و تایپ‌شده Angular با رفتار بومی و دسترس‌پذیر.',
      variants: 'گونه‌ها',
      variantsDesc: 'سطح اهمیت روشن برای هر عملیات.',
      sizes: 'اندازه‌ها',
      sizesDesc: 'ریتم یکپارچه از ابزارهای کوچک تا عملیات برجسته.',
      states: 'وضعیت‌ها',
      statesDesc: 'وضعیت‌های غیرفعال و بارگذاری دسترس‌پذیر.',
      ready: 'آماده',
      disabled: 'غیرفعال',
      publish: 'انتشار',
      loading: 'بارگذاری',
      empty: 'گزینه‌های خالی',
      dropdown: 'کشویی',
      dropdownTitle: 'جست‌وجو، انتخاب و ترکیب',
      single: 'انتخاب تکی',
      singleDesc: 'گزینه‌های قابل جست‌وجو با اطلاعات تکمیلی.',
      multiple: 'انتخاب چندتایی',
      multipleDesc: 'چند عضو را بدون بستن پنل انتخاب کنید.',
      frameworkLabel: 'انتخاب فریم‌ورک',
      teamLabel: 'انتخاب اعضای تیم',
      interactive: 'چیدمان تعاملی',
      interactiveDesc:
        'Tailwind چیدمان را کنترل می‌کند و Bulud رفتار کامپوننت را.',
      fullWidth: 'دکمه تمام‌عرض',
      increment: 'افزایش شمارنده',
      current: 'شمارنده فعلی:',
      reset: 'بازنشانی',
    },
  } as const;
  protected readonly text = computed(() => this.copy[this.language()]);
  protected readonly dropdownLocale = computed(() =>
    this.language() === 'fa'
      ? {
          placeholder: 'یک گزینه انتخاب کنید',
          searchPlaceholder: 'جست‌وجوی گزینه‌ها',
          noResultsText: 'گزینه‌ای پیدا نشد',
          loadingText: 'در حال بارگذاری…',
          emptyText: 'گزینه‌ای موجود نیست',
        }
      : {
          placeholder: 'Select an option',
          searchPlaceholder: 'Search options',
          noResultsText: 'No options found',
          loadingText: 'Loading options…',
          emptyText: 'No options available',
        },
  );

  constructor() {
    effect(() => {
      const language = this.language();
      this.document.documentElement.lang = language;
      this.document.documentElement.dir = language === 'fa' ? 'rtl' : 'ltr';
    });
  }

  protected toggleLanguage(): void {
    this.language.update((language) => (language === 'fa' ? 'en' : 'fa'));
  }
  protected readonly clickCount = signal(0);
  protected readonly fullWidth = signal(false);
  protected readonly selectedFramework = signal<
    DemoOption | readonly DemoOption[] | null
  >(null);
  protected readonly selectedTeam = signal<
    DemoOption | readonly DemoOption[] | null
  >([]);
  protected readonly dropdownLoading = signal(false);
  protected readonly dropdownEmpty = signal(false);
  protected readonly resizeObserverEnabled = signal(true);
  protected readonly resizeObserverSize = signal<BuludElementSize | null>(null);
  protected readonly clickOutsideEnabled = signal(true);
  protected readonly clickOutsideCount = signal(0);
  protected readonly activeTab = signal<string | null>(null);

  protected readonly frameworks: readonly DemoOption[] = [
    { id: 'angular', label: 'Angular', meta: 'Framework' },
    { id: 'react', label: 'React', meta: 'Framework' },
    { id: 'vue', label: 'Vue', meta: 'Framework' },
    { id: 'svelte', label: 'Svelte', meta: 'Compiler' },
  ];

  protected readonly teamMembers: readonly DemoOption[] = [
    { id: 'maya', label: 'Maya Chen', meta: 'Design systems' },
    { id: 'noah', label: 'Noah Williams', meta: 'Frontend platform' },
    { id: 'sofia', label: 'Sofia Patel', meta: 'Accessibility' },
    { id: 'liam', label: 'Liam Brooks', meta: 'Developer experience' },
  ];

  protected readonly optionLabel = (option: DemoOption): string => option.label;

  protected readonly variants: readonly VariantPreview[] = [
    {
      name: 'primary',
      label: 'Primary',
      description: 'Main calls to action',
    },
    {
      name: 'secondary',
      label: 'Secondary',
      description: 'Supporting actions',
    },
    {
      name: 'danger',
      label: 'Danger',
      description: 'Destructive actions',
    },
    {
      name: 'ghost',
      label: 'Ghost',
      description: 'Low-emphasis actions',
    },
  ];

  protected readonly sizes: readonly SizePreview[] = [
    { name: 'small', label: 'Small' },
    { name: 'medium', label: 'Medium' },
    { name: 'large', label: 'Large' },
  ];

  protected incrementCount(): void {
    this.clickCount.update((count) => count + 1);
  }

  protected resetCount(): void {
    this.clickCount.set(0);
  }

  protected updateResizeObserverSize(size: BuludElementSize): void {
    this.resizeObserverSize.set(size);
  }

  protected recordClickOutside(): void {
    this.clickOutsideCount.update((count) => count + 1);
  }
}
