import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { BuludTextarea } from 'bulud-ng/textarea';
import { BuludLoadingService } from 'bulud-ng/loading-bar';
import { DestroyRef } from '@angular/core';
import { BuludCheckbox } from 'bulud-ng/checkbox';
import { BuludDropdown } from 'bulud-ng/dropdown';
import {
  BuludTable,
  BuludTableColumn,
  BuludTableCell,
  BuludTableDetail,
  BuludTableSort,
  BuludTableFilterDefinition,
  BuludTableFilterValues,
  buildBuludTableFilterQuery,
  filterBuludTableRows,
} from 'bulud-ng/table';
import { BuludQueryService, BuludQueryParams } from 'bulud-ng/query';
import { BuludOtp } from 'bulud-ng/otp';
import { BuludFileUpload } from 'bulud-ng/file-upload';
import { BuludRating } from 'bulud-ng/rating';
import { BuludTooltip } from 'bulud-ng/tooltip';
import {
  BuludAlert,
  BuludNotifications,
  BuludNotificationService,
} from 'bulud-ng/feedback';
import { BuludStepper, BuludStep } from 'bulud-ng/stepper';
import { BuludCarousel, BuludSlide } from 'bulud-ng/carousel';
import { BuludCountdown } from 'bulud-ng/countdown';
import {
  BuludConnectionService,
  BuludPasswordService,
  BuludDateTimePipe,
  BuludMaskEmailPipe,
  BuludFileExtensionPipe,
} from 'bulud-ng/utilities';
import { BasePreferences } from './preferences';
interface RecordRow {
  id: number;
  name: string;
  status: string;
  created: string;
}
@Component({
  selector: 'base-shared',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    BuludTextarea,
    BuludDropdown,
    BuludCheckbox,
    BuludTable,
    BuludTableCell,
    BuludTableDetail,
    BuludOtp,
    BuludFileUpload,
    BuludRating,
    BuludTooltip,
    BuludAlert,
    BuludNotifications,
    BuludStepper,
    BuludStep,
    BuludCarousel,
    BuludSlide,
    BuludCountdown,
    BuludDateTimePipe,
    BuludMaskEmailPipe,
    BuludFileExtensionPipe,
  ],
  providers: [BuludNotificationService],
  templateUrl: './shared.html',
  styleUrl: './shared.scss',
})
export class BaseShared {
  readonly p = inject(BasePreferences);
  readonly pageLoading = inject(BuludLoadingService);
  readonly progressTask = signal<number | null>(null);
  readonly notes = signal<Readonly<Record<number, string | undefined>>>({});
  constructor() {
    inject(DestroyRef).onDestroy(() => this.finishProgress());
  }
  startProgress(): void {
    if (this.progressTask() === null)
      this.progressTask.set(this.pageLoading.start(10));
  }
  finishProgress(): void {
    const task = this.progressTask();
    if (task !== null) this.pageLoading.finish(task);
    this.progressTask.set(null);
  }
  noteChanged(id: number, event: Event): void {
    const value = (event.target as HTMLTextAreaElement).value;
    this.notes.update((old) => ({ ...old, [id]: value }));
  }
  readonly filterDefinitions = computed<readonly BuludTableFilterDefinition[]>(
    () => [
      {
        key: 'name',
        label: this.p.text('نام پروژه', 'Project name'),
        kind: 'text',
      },
      {
        key: 'status',
        label: this.p.text('وضعیت رکورد', 'Record status'),
        kind: 'select',
        options: this.statusOptions,
      },
      {
        key: 'id',
        label: this.p.text('حداقل شناسه', 'Minimum ID'),
        kind: 'number',
        operator: 'gte',
      },
      {
        key: 'created',
        label: this.p.text('از تاریخ', 'Created after'),
        kind: 'date',
        operator: 'gte',
      },
    ],
  );
  readonly tableFilters = computed<BuludTableFilterValues>(() => {
    try {
      const parsed = this.query.parseFilters(this.request().filter ?? '');
      return Object.fromEntries(
        this.filterDefinitions().flatMap((f) => {
          const value = parsed[f.key]?.[0]?.values[0];
          return value === undefined ? [] : [[f.key, String(value)]];
        }),
      );
    } catch {
      return {};
    }
  });
  readonly query = inject(BuludQueryService);
  readonly notices = inject(BuludNotificationService);
  readonly connection = inject(BuludConnectionService);
  private readonly passwords = inject(BuludPasswordService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly params = toSignal(this.route.queryParamMap, {
    initialValue: this.route.snapshot.queryParamMap,
  });
  readonly urlParams = computed(() => {
    const p = new URLSearchParams();
    for (const key of this.params().keys)
      for (const value of this.params().getAll(key)) p.append(key, value);
    return p;
  });
  readonly request = computed(() => this.query.toRequest(this.urlParams(), 5));
  readonly requestText = computed(() =>
    JSON.stringify(this.request(), null, 2),
  );
  readonly search = computed(() => this.request().search ?? '');
  readonly status = computed(() => {
    try {
      return (
        this.query.parseFilters(this.request().filter ?? '')['status']?.[0]
          ?.values[0] ?? ''
      );
    } catch {
      return '';
    }
  });
  readonly sort = computed<BuludTableSort | null>(() => {
    const value = this.request().sort;
    if (!value) return null;
    return {
      key: value.replace(/^-/, ''),
      direction: value.startsWith('-') ? 'desc' : 'asc',
    };
  });
  readonly page = computed(() => this.request().skip / this.request().take + 1);
  readonly rowKey = (row: RecordRow) => row.id;
  readonly data: readonly RecordRow[] = Array.from({ length: 24 }, (_, i) => ({
    id: i + 1,
    name: `Project ${String(i + 1).padStart(2, '0')}`,
    status: i % 2 ? 'active' : 'draft',
    created: `2026-10-${String(i + 1).padStart(2, '0')}`,
  }));
  readonly columns = computed<readonly BuludTableColumn<RecordRow>[]>(() => [
    {
      key: 'id',
      heading: this.p.text('شناسه', 'ID'),
      value: (r) => r.id,
      sortable: true,
      compare: (a, b) => a.id - b.id,
    },
    {
      key: 'name',
      heading: this.p.text('نام', 'Name'),
      value: (r) => r.name,
      sortable: true,
    },
    {
      key: 'status',
      heading: this.p.text('وضعیت', 'Status'),
      value: (r) => r.status,
    },
    {
      key: 'created',
      heading: this.p.text('تاریخ', 'Created'),
      value: (r) => r.created,
    },
  ]);
  readonly filtered = computed(() =>
    this.empty()
      ? []
      : filterBuludTableRows(
          this.data,
          this.columns(),
          this.filterDefinitions(),
          this.tableFilters(),
        ).filter((row) =>
          row.name.toLowerCase().includes(this.search().toLowerCase()),
        ),
  );
  readonly serverRows = computed(() => {
    const sort = this.sort();
    const column = this.columns().find((c) => c.key === sort?.key);
    const rows =
      sort && column
        ? [...this.filtered()].sort(
            (a, b) =>
              (column.compare?.(a, b) ??
                String(column.value(a)).localeCompare(
                  String(column.value(b)),
                )) * (sort.direction === 'asc' ? 1 : -1),
          )
        : this.filtered();
    return rows.slice(
      this.request().skip,
      this.request().skip + this.request().take,
    );
  });
  readonly labels = computed(() => ({
    loading: this.p.text('در حال بارگذاری…', 'Loading…'),
    empty: this.p.text('رکوردی وجود ندارد', 'No records'),
    error: this.p.text('خطا در دریافت رکوردها', 'Unable to load records'),
    expand: this.p.text('نمایش جزئیات', 'Show details'),
    collapse: this.p.text('بستن جزئیات', 'Hide details'),
    detailsHeading: this.p.text('جزئیات', 'Details'),
    previousPage: this.p.text('صفحه قبل', 'Previous page'),
    nextPage: this.p.text('صفحه بعد', 'Next page'),
    page: this.p.text('صفحه', 'Page'),
    currentPage: this.p.text('صفحه کنونی', 'Current page'),
  }));
  readonly uploadOptions = {
    url: '/api/demo-upload',
    timeoutMs: 30000,
  } as const;
  readonly statusOptions = ['active', 'draft'];
  readonly loading = signal(false);
  readonly failed = signal(false);
  readonly empty = signal(false);
  readonly disabled = signal(false);
  readonly server = signal(false);
  readonly override = signal(false);
  readonly theme = computed(() =>
    this.override()
      ? { accent: 'rgb(126, 34, 206)', border: 'rgb(126, 34, 206)' }
      : undefined,
  );
  readonly form = new FormGroup({
    otp: new FormControl('', { nonNullable: true }),
    files: new FormControl<readonly File[]>([], { nonNullable: true }),
    rating: new FormControl(0, { nonNullable: true }),
  });
  readonly activeStep = signal(0);
  readonly activeSlide = signal(0);
  readonly deadline = signal<number | null>(null);
  readonly password = signal('');
  readonly showAlert = signal(true);
  readonly stamp = Date.UTC(2026, 9, 21) / 1000;
  update(patch: BuludQueryParams): void {
    void this.router.navigateByUrl(
      this.query.updateUrl(this.router.url, patch),
    );
  }
  searchChanged(event: Event): void {
    this.update({
      search: (event.target as HTMLInputElement).value || null,
      page: null,
    });
  }
  filterChanged(status: unknown): void {
    const values = { ...this.tableFilters() };
    if (typeof status === 'string' && status) values['status'] = status;
    else delete values['status'];
    this.update({
      filter:
        buildBuludTableFilterQuery(this.filterDefinitions(), values) ?? null,
      page: null,
    });
  }
  tableChanged(event: {
    page: number;
    sort: BuludTableSort | null;
    filters?: BuludTableFilterValues;
  }): void {
    this.update({
      ...(event.filters
        ? {
            filter:
              buildBuludTableFilterQuery(
                this.filterDefinitions(),
                event.filters,
              ) ?? null,
          }
        : {}),
      page: event.page === 1 ? null : event.page,
      sort: event.sort
        ? (event.sort.direction === 'desc' ? '-' : '') + event.sort.key
        : null,
    });
  }
  generate(): void {
    this.password.set(this.passwords.generate());
  }
  start(): void {
    this.deadline.set(Date.now() + 3000);
  }
}
