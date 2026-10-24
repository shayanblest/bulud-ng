import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChild,
  contentChildren,
  Directive,
  inject,
  input,
  model,
  output,
  TemplateRef,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import {
  BULUD_SHARED_UI_CONFIG,
  buludSharedUiStyles,
  BuludSharedUiTheme,
} from 'bulud-ng';
import {
  BuludTableFilters,
  BuludTableFilterDefinition,
  BuludTableFilterValues,
  filterBuludTableRows,
} from './filters';
import { BuludPagination } from 'bulud-ng/pagination';
export interface BuludTableColumn<T> {
  readonly key: string;
  readonly heading: string;
  readonly value: (row: T) => string | number | null | undefined;
  readonly sortable?: boolean;
  readonly compare?: (a: T, b: T) => number;
}
export interface BuludTableSort {
  readonly key: string;
  readonly direction: 'asc' | 'desc';
}
export interface BuludTableLabels {
  readonly loading: string;
  readonly empty: string;
  readonly error: string;
  readonly expand: string;
  readonly collapse: string;
  readonly detailsHeading: string;
  readonly previousPage: string;
  readonly nextPage: string;
  readonly page: string;
  readonly currentPage: string;
}
let nextId = 0;
const LABELS: BuludTableLabels = {
  loading: 'Loading…',
  empty: 'No records',
  error: 'Unable to load records',
  expand: 'Show details',
  collapse: 'Hide details',
  detailsHeading: 'Details',
  previousPage: 'Previous page',
  nextPage: 'Next page',
  page: 'Page',
  currentPage: 'Current page',
};
export interface BuludTableCellContext<T> {
  readonly $implicit: T;
  readonly column: BuludTableColumn<T>;
}
@Directive({ selector: 'ng-template[buludTableCell]' })
export class BuludTableCell<T> {
  readonly buludTableCell = input.required<string>();
  readonly template =
    inject<TemplateRef<BuludTableCellContext<T>>>(TemplateRef);
  static ngTemplateContextGuard<T>(
    _dir: BuludTableCell<T>,
    _ctx: unknown,
  ): _ctx is BuludTableCellContext<T> {
    void _ctx;
    return true;
  }
}
@Directive({ selector: 'ng-template[buludTableDetail]' })
export class BuludTableDetail<T> {
  readonly template = inject<TemplateRef<{ $implicit: T }>>(TemplateRef);
  static ngTemplateContextGuard<T>(
    _dir: BuludTableDetail<T>,
    _ctx: unknown,
  ): _ctx is { $implicit: T } {
    void _ctx;
    return true;
  }
}
/** Semantic table. Server mode emits sorting/page changes without reordering/slicing the received page. */
@Component({
  selector: 'bulud-table',
  imports: [NgTemplateOutlet, BuludPagination, BuludTableFilters],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './table.scss',
  host: { '[style]': 'styles()' },
  template: `
    @if (filterDefinitions().length) {
      <bulud-table-filters
        [definitions]="filterDefinitions()"
        [value]="filters()"
        (valueChange)="changeFilters($event)"
        [disabled]="disabled() || loading()"
        [label]="filterLabel()"
        [clearLabel]="clearFilterLabel()"
        [language]="language()"
        [theme]="theme()"
      />
    }
    <div
      class="table-scroll surface"
      role="region"
      [attr.aria-label]="caption()"
      tabindex="0"
      [attr.aria-busy]="loading()"
    >
      <table>
        <caption>
          {{
            caption()
          }}
        </caption>
        <thead>
          <tr>
            @for (column of columns(); track column.key) {
              <th
                scope="col"
                [attr.aria-sort]="
                  sort()?.key === column.key
                    ? sort()?.direction === 'asc'
                      ? 'ascending'
                      : 'descending'
                    : null
                "
              >
                @if (column.sortable) {
                  <button
                    type="button"
                    [disabled]="disabled() || loading()"
                    (click)="toggleSort(column)"
                  >
                    {{ column.heading }}
                    <span aria-hidden="true">{{
                      sort()?.key === column.key
                        ? sort()?.direction === 'asc'
                          ? '↑'
                          : '↓'
                        : '↕'
                    }}</span>
                  </button>
                } @else {
                  {{ column.heading }}
                }
              </th>
            }
            @if (detail()) {
              <th scope="col">{{ text().detailsHeading }}</th>
            }
          </tr>
        </thead>
        <tbody>
          @if (loading() || error() || !visibleRows().length) {
            <tr>
              <td [attr.colspan]="columns().length + (detail() ? 1 : 0)">
                <span role="status">{{
                  loading()
                    ? text().loading
                    : error()
                      ? text().error
                      : text().empty
                }}</span>
              </td>
            </tr>
          } @else {
            @for (row of visibleRows(); track rowKey()(row)) {
              <tr [attr.data-expanded]="expanded() === rowKey()(row)">
                @for (column of columns(); track column.key) {
                  <td>
                    @if (cellTemplates().get(column.key); as template) {
                      <ng-container
                        [ngTemplateOutlet]="template"
                        [ngTemplateOutletContext]="{
                          $implicit: row,
                          column: column,
                        }"
                      />
                    } @else {
                      {{ column.value(row) }}
                    }
                  </td>
                }
                @if (detail()) {
                  <td>
                    <button
                      type="button"
                      class="detail-toggle"
                      [attr.aria-label]="
                        expanded() === rowKey()(row)
                          ? text().collapse
                          : text().expand
                      "
                      [disabled]="disabled()"
                      [attr.aria-expanded]="expanded() === rowKey()(row)"
                      [attr.aria-controls]="
                        expanded() === rowKey()(row) ? detailId(row) : null
                      "
                      (click)="
                        expanded.set(
                          expanded() === rowKey()(row) ? null : rowKey()(row)
                        )
                      "
                    >
                      <svg
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                        focusable="false"
                        [class.expanded]="expanded() === rowKey()(row)"
                      >
                        <path d="m5 9 7 7 7-7" />
                      </svg>
                    </button>
                  </td>
                }
              </tr>
              @if (detail(); as d) {
                @if (expanded() === rowKey()(row)) {
                  <tr class="details" [id]="detailId(row)">
                    <td [attr.colspan]="columns().length + 1">
                      <ng-container
                        [ngTemplateOutlet]="d.template"
                        [ngTemplateOutletContext]="{ $implicit: row }"
                      />
                    </td>
                  </tr>
                }
              }
            }
          }
        </tbody>
      </table>
    </div>
    @if (pageCount() > 1) {
      <div class="pagination">
        <bulud-pagination
          [pageCount]="pageCount()"
          [currentPage]="safePage()"
          (pageChange)="changePage($event)"
          [disabled]="disabled() || loading()"
          [previousPageLabel]="text().previousPage"
          [nextPageLabel]="text().nextPage"
          [pageLabel]="pageLabel"
          [currentPageLabel]="currentPageLabel"
        />
      </div>
    }
  `,
})
export class BuludTable<T> {
  private readonly config = inject(BULUD_SHARED_UI_CONFIG);
  private readonly id = `bulud-table-${nextId++}`;
  protected detailId(row: T): string {
    const key = this.rowKey()(row);
    return `${this.id}-${typeof key}-${encodeURIComponent(String(key))}`;
  }
  readonly filterDefinitions = input<readonly BuludTableFilterDefinition[]>([]);
  readonly filters = model<BuludTableFilterValues>({});
  readonly filterLabel = input('Filters');
  readonly clearFilterLabel = input('Clear filters');
  readonly language = input<'fa' | 'en'>('en');
  private readonly filteredRows = computed(() =>
    filterBuludTableRows(
      this.rows(),
      this.columns(),
      this.filterDefinitions(),
      this.filters(),
    ),
  );
  readonly rows = input.required<readonly T[]>();
  readonly columns = input.required<readonly BuludTableColumn<T>[]>();
  readonly rowKey = input.required<(row: T) => string | number>();
  readonly caption = input.required<string>();
  readonly labels = input<Partial<BuludTableLabels>>({});
  readonly theme = input<Partial<BuludSharedUiTheme>>();
  readonly loading = input(false, { transform: booleanAttribute });
  readonly error = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly server = input(false, { transform: booleanAttribute });
  readonly total = input(0);
  readonly pageSize = input(10);
  readonly page = model(1);
  readonly sort = model<BuludTableSort | null>(null);
  readonly expanded = model<string | number | null>(null);
  readonly stateChange = output<{
    page: number;
    sort: BuludTableSort | null;
    filters?: BuludTableFilterValues;
  }>();
  protected readonly cells = contentChildren<BuludTableCell<T>>(BuludTableCell);
  protected readonly detail =
    contentChild<BuludTableDetail<T>>(BuludTableDetail);
  protected readonly cellTemplates = computed(
    () => new Map(this.cells().map((c) => [c.buludTableCell(), c.template])),
  );
  protected readonly text = computed(() => ({ ...LABELS, ...this.labels() }));
  protected readonly styles = computed(() =>
    buludSharedUiStyles('table', this.config, this.theme()),
  );
  private readonly size = computed(() =>
    Number.isSafeInteger(this.pageSize()) && this.pageSize() > 0
      ? this.pageSize()
      : 10,
  );
  protected readonly pageCount = computed(() =>
    Math.max(
      1,
      Math.ceil(
        (this.server()
          ? Number.isSafeInteger(this.total()) && this.total() >= 0
            ? this.total()
            : 0
          : this.filteredRows().length) / this.size(),
      ),
    ),
  );
  protected readonly safePage = computed(() =>
    Math.min(
      this.pageCount(),
      Number.isSafeInteger(this.page()) && this.page() > 0 ? this.page() : 1,
    ),
  );
  protected readonly pageLabel = (page: number) =>
    `${this.text().page} ${page}`;
  protected readonly currentPageLabel = (page: number) =>
    `${this.text().currentPage} ${page}`;
  private readonly collator = new Intl.Collator(undefined, {
    numeric: true,
    sensitivity: 'base',
  });
  protected readonly visibleRows = computed(() => {
    if (this.server()) return this.rows();
    const sort = this.sort();
    const column = this.columns().find(
      (c) => c.key === sort?.key && c.sortable,
    );
    const rows =
      sort && column
        ? [...this.filteredRows()].sort(
            (a, b) =>
              (column.compare
                ? column.compare(a, b)
                : this.collator.compare(
                    String(column.value(a) ?? ''),
                    String(column.value(b) ?? ''),
                  )) * (sort.direction === 'asc' ? 1 : -1),
          )
        : this.filteredRows();
    return rows.slice(
      (this.safePage() - 1) * this.size(),
      this.safePage() * this.size(),
    );
  });
  protected changeFilters(filters: BuludTableFilterValues): void {
    if (this.disabled() || this.loading()) return;
    this.filters.set(filters);
    this.page.set(1);
    this.stateChange.emit({ page: 1, sort: this.sort(), filters });
  }
  protected toggleSort(column: BuludTableColumn<T>): void {
    if (this.disabled() || this.loading() || !column.sortable) return;
    this.sort.set({
      key: column.key,
      direction:
        this.sort()?.key === column.key && this.sort()?.direction === 'asc'
          ? 'desc'
          : 'asc',
    });
    this.page.set(1);
    this.stateChange.emit({ page: 1, sort: this.sort() });
  }
  protected changePage(page: number): void {
    if (this.disabled() || this.loading()) return;
    this.page.set(page);
    this.stateChange.emit({ page, sort: this.sort() });
  }
}
