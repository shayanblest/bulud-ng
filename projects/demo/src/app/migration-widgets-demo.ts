import { BuludCheckbox } from 'bulud-ng/checkbox';
import { BuludSwitch } from 'bulud-ng/switch';
import { migrationDemoText } from './migration-demo-translations';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  Injectable,
  signal,
  viewChild,
} from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import {
  BuludRuntime,
  BULUD_RUNTIME_CONFIG,
  BuludLanguageOption,
} from 'bulud-ng/runtime';
import { BuludAppearance, BULUD_APPEARANCE_CONFIG } from 'bulud-ng/appearance';
import { BuludPeriodPicker } from 'bulud-ng/period-picker';

import { BuludLanguageSwitch } from 'bulud-ng/language-switch';
import { BuludFileUpload } from 'bulud-ng/file-upload';
import {
  BuludAccountCard,
  BULUD_ACCOUNT_CARD_CONFIG,
} from 'bulud-ng/account-card';
import {
  BuludEmptyState,
  BULUD_EMPTY_STATE_CONFIG,
} from 'bulud-ng/empty-state';
import { BuludTooltip, BuludTooltipContent } from 'bulud-ng/tooltip';
import { BuludDropdown, BuludDropdownData } from 'bulud-ng/dropdown';

import { BuludDatepicker, BuludDatepickerData } from 'bulud-ng/datepicker';

@Injectable()
class ProjectSettings {
  readonly language = signal('en');
  readonly languages = signal<readonly BuludLanguageOption[]>([
    { code: 'en', label: 'English' },
    { code: 'fa', label: 'فارسی' },
    { code: 'ar', label: 'العربية' },
    { code: 'tr', label: 'Türkçe' },
  ]);
  readonly direction = computed(() =>
    'fa ar'.split(' ').includes(this.language())
      ? ('rtl' as const)
      : ('ltr' as const),
  );
  readonly missing = signal(false);
  readonly route = signal('');
}
@Component({
  selector: 'app-migration-widgets-demo',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    BuludCheckbox,
    BuludSwitch,
    ReactiveFormsModule,
    BuludPeriodPicker,
    BuludLanguageSwitch,
    BuludFileUpload,
    BuludAccountCard,
    BuludEmptyState,
    BuludTooltip,
    BuludDropdown,
    BuludDropdownData,
    BuludDatepicker,
    BuludDatepickerData,
    BuludTooltipContent,
  ],
  providers: [
    ProjectSettings,
    BuludRuntime,
    BuludAppearance,
    {
      provide: BULUD_RUNTIME_CONFIG,
      useFactory: () => {
        const p = inject(ProjectSettings);
        return {
          language: p.language,
          direction: p.direction,
          languages: p.languages,
          setLanguage: (code: string) => p.language.set(code),
          translate: (key: string) => migrationDemoText(p.language(), key),
        };
      },
    },
    {
      provide: BULUD_APPEARANCE_CONFIG,
      useValue: {
        themes: ['light', 'dark'],
        themeAttribute: 'data-demo-theme',
      },
    },
    {
      provide: BULUD_ACCOUNT_CARD_CONFIG,
      useFactory: () => {
        const p = inject(ProjectSettings);
        return {
          navigate: (kind: string, id: string) => p.route.set(kind + '/' + id),
        };
      },
    },
    {
      provide: BULUD_EMPTY_STATE_CONFIG,
      useFactory: () => {
        const p = inject(ProjectSettings);
        return { onAction: () => p.missing.set(false) };
      },
    },
  ],
  template: ` <section
    id="migration-widgets-demo"
    class="bulud-app bulud-migration-demo"
    data-bulud-preset="angour"
    [attr.data-theme]="appearance.theme()"
    [attr.lang]="settings.language()"
    [style.--demo-accent]="accent()"
    [style.--bulud-color-primary]="accent()"
    [style.--demo-card-background]="cardBackground()"
    [dir]="settings.direction()"
  >
    <h2 class="text-xl font-semibold">
      {{ t('Portable shared widgets without Bootstrap or an icon font') }}
    </h2>
    <div class="demo-toolbar">
      <label
        >{{ t('Project accent') }}
        <input
          aria-label="Project accent"
          type="color"
          [value]="accent() ?? '#0c2340'"
          (input)="accent.set($any($event.target).value)" /></label
      ><label
        >{{ t('Card background') }}
        <input
          aria-label="Card background"
          type="color"
          [value]="cardBackground() ?? '#0c2340'"
          (input)="cardBackground.set($any($event.target).value)"
      /></label>
    </div>
    <div class="demo-toolbar">
      <bulud-language-switch /><button
        class="demo-action"
        type="button"
        (click)="addLanguage()"
        aria-label="Add widget language"
      >
        {{ t('Add widget language') }}</button
      ><bulud-switch
        appearance="theme"
        [checked]="appearance.theme() === 'dark'"
        (checkedChange)="appearance.setTheme($event ? 'dark' : 'light')"
        aria-label="Cycle widget theme"
        >{{ t('Cycle widget theme') }}</bulud-switch
      ><output data-testid="widget-theme">{{ appearance.theme() }}</output>
    </div>
    <div class="grid gap-5 lg:grid-cols-2">
      <div class="demo-widget-panel">
        <bulud-period-picker
          presentation="grid"
          [label]="t('Report month')"
          [referenceDate]="date"
          [min]="minimum"
          [max]="maximum"
          (monthSelected)="selectedMonth.set($event)"
          [theme]="
            override()
              ? {
                  background: accent() ?? 'var(--bulud-color-primary)',
                  foreground: 'var(--bulud-color-on-primary)',
                }
              : undefined
          "
        /><output data-testid="widget-month">{{ selectedMonth() }}</output
        ><bulud-checkbox
          aria-label="Override month theme"
          [checked]="override()"
          (checkedChange)="override.set(!override())"
          >{{ t('Override month theme') }}</bulud-checkbox
        ><bulud-period-picker
          presentation="navigation"
          [referenceDate]="date"
          (dateChange)="timestamp.set($event)"
        /><output data-testid="widget-timestamp">{{ timestamp() }}</output>
        <label for="widget-id">{{ t('Scalar selection') }}</label
        ><bulud-dropdown
          id="widget-id"
          buludDropdownData
          #data="buludDropdownData"
          [options]="options"
          valueField="id"
          [compareWith]="data.compare"
          [formControl]="selection"
          [searchable]="false"
          ><ng-template #optionTemplate let-option>{{
            t(option.label)
          }}</ng-template
          ><ng-template #selectedTemplate let-option>{{
            t(option?.label ?? '')
          }}</ng-template></bulud-dropdown
        ><output data-testid="widget-scalar">{{ selection.value }}</output>
        <label for="widget-date">{{ t('Date of birth') }}</label
        ><bulud-datepicker
          id="widget-date"
          buludDatepickerData
          #dates="buludDatepickerData"
          [formControl]="dateValue"
          [language]="dates.language()"
          [calendar]="dates.calendar()"
          [placeholder]="t('Select date')"
        /><output data-testid="widget-date-value">{{ dateValue.value }}</output>
      </div>
      <div class="demo-widget-panel">
        <bulud-account-card
          accountId="42"
          accountType="Real"
          accountName="Standard"
          cardType="MT"
          [balance]="1234.5"
          [credit]="10"
          [showDetails]="true"
        /><output data-testid="widget-route">{{ settings.route() }}</output
        ><bulud-checkbox
          aria-label="Disable wallet"
          [checked]="disabledCard()"
          (checkedChange)="disabledCard.set(!disabledCard())"
          >{{ t('Disable wallet') }}</bulud-checkbox
        ><bulud-account-card
          accountId="77"
          [account]="disabledCard() ? { disabled_at: 1 } : undefined"
          [balance]="50"
        />
        <div class="demo-toolbar">
          <label
            >{{ t('Upload help text')
            }}<input
              aria-label="Upload help text"
              [value]="uploadHint()"
              (input)="uploadHint.set($any($event.target).value)"
          /></label>
          <div class="demo-field">
            {{ t('Upload box height')
            }}<bulud-dropdown
              class="demo-control"
              aria-label="Upload box height"
              [options]="[120, 180, 240, 320]"
              [value]="uploadHeight()"
              (valueChange)="
                uploadHeight.set(numberValue($event, uploadHeight()))
              "
              [searchable]="false"
              [clearable]="false"
            />
          </div>
        </div>
        <bulud-file-upload
          presentation="preview"
          #upload
          uploadType="csv"
          [hint]="uploadHint() || undefined"
          [theme]="{ minHeight: uploadHeight() + 'px' }"
          (filesChange)="uploads.set(upload.files.length)"
        /><output data-testid="widget-files">{{ uploads() }}</output
        ><button
          class="demo-action"
          #anchor
          type="button"
          (click)="tooltip.isVisible = !tooltip.isVisible"
          aria-label="Rich details"
        >
          {{ t('Rich details') }}</button
        ><bulud-tooltip presentation="manual" #tooltip [anchor]="anchor"
          ><ng-template buludTooltipContent
            ><strong>{{ t('Project content') }}</strong
            ><a href="#migration-widgets-demo">{{
              t('Details link')
            }}</a></ng-template
          ></bulud-tooltip
        >
      </div>
    </div>
    <button
      class="demo-action"
      type="button"
      (click)="settings.missing.set(true)"
      aria-label="Show default missing page"
    >
      {{ t('Show default missing page') }}
    </button>
    @if (settings.missing()) {
      <bulud-empty-state
        variant="illustrated"
        [title]="t('Project missing page')"
        [actionLabel]="t('Return to widgets')"
        imageAlt="Missing page illustration"
      />
    }
  </section>`,
})
export class MigrationWidgetsDemo {
  protected readonly numberValue = (
    value: unknown,
    fallback: number,
  ): number =>
    typeof value === 'number' && Number.isFinite(value) ? value : fallback;
  protected readonly stringValue = (
    value: unknown,
    fallback: string,
  ): string => (typeof value === 'string' ? value : fallback);
  readonly accent = signal<string | null>(null);
  readonly cardBackground = signal<string | null>(null);
  protected readonly t = (key: string) =>
    migrationDemoText(this.settings.language(), key);
  protected readonly settings = inject(ProjectSettings);
  protected readonly appearance = inject(BuludAppearance);
  protected readonly date = new Date(2025, 5, 15);
  protected readonly minimum = new Date(2025, 4, 1);
  protected readonly maximum = new Date(2025, 6, 31);
  protected readonly selectedMonth = signal('');
  protected readonly timestamp = signal(0);
  protected readonly override = signal(false);
  protected readonly disabledCard = signal(false);
  protected readonly uploads = signal(0);
  protected readonly uploadHint = signal('');
  protected readonly uploadHeight = signal(180);
  protected readonly selection = new FormControl<number | null>(1);
  protected readonly dateValue = new FormControl<number | null>(null);
  protected readonly options = [
    { id: 1, label: 'First' },
    { id: 2, label: 'Second' },
  ];
  readonly upload = viewChild.required(BuludFileUpload);
  protected addLanguage() {
    this.settings.languages.update((list) =>
      list.some((x) => x.code === 'de')
        ? list
        : [...list, { code: 'de', label: 'Deutsch' }],
    );
    this.settings.language.set('de');
  }
}
