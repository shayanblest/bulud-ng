import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
} from '@angular/core';
import { BULUD_DEFAULT_LOCALE, BULUD_LOCALE } from 'bulud-ng';

export type BuludPaginationItem = number | 'ellipsis-start' | 'ellipsis-end';

const DEFAULT_NAVIGATION_LABEL = 'Pagination';

@Component({
  selector: 'bulud-pagination',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'bulud-pagination-host',
  },
  templateUrl: './bulud-pagination.html',
  styleUrl: './bulud-pagination.scss',
})
export class BuludPagination {
  private readonly locale = inject(BULUD_LOCALE);

  /** Consumer-owned selected page. The component never changes this input. */
  readonly currentPage = input(1);

  /** Total number of pages. Only positive safe integers render page controls. */
  readonly pageCount = input(1);

  /** Disables every pagination control. */
  readonly disabled = input(false, { transform: booleanAttribute });

  /** Accessible name for the navigation landmark. */
  readonly ariaLabel = input<string | undefined>(undefined, {
    alias: 'aria-label',
  });

  /** Instance override for the previous-page accessible name. */
  readonly previousPageLabel = input<string | undefined>(undefined);

  /** Instance override for the next-page accessible name. */
  readonly nextPageLabel = input<string | undefined>(undefined);

  /** Instance override for page accessible names. */
  readonly pageLabel = input<((page: number) => string) | undefined>(undefined);

  /** Instance override for the selected-page accessible names. */
  readonly currentPageLabel = input<((page: number) => string) | undefined>(
    undefined,
  );

  /** Instance override for the non-interactive ellipsis accessible name. */
  readonly ellipsisLabel = input<string | undefined>(undefined);

  /** Requests that the consumer update `currentPage` to this page. */
  readonly pageChange = output<number>();

  protected readonly safePageCount = computed(() => {
    const count = this.pageCount();
    return Number.isSafeInteger(count) && count > 0 ? count : 0;
  });

  protected readonly renderedPage = computed(() => {
    const count = this.safePageCount();
    const page = this.currentPage();
    if (!count) {
      return 0;
    }
    if (page === Infinity) {
      return count;
    }
    if (!Number.isFinite(page) || page <= 0) {
      return 1;
    }
    if (page >= count) {
      return count;
    }
    return Math.max(Math.floor(page), 1);
  });

  protected readonly pageItems = computed<readonly BuludPaginationItem[]>(() =>
    createPaginationWindow(this.safePageCount(), this.renderedPage()),
  );

  private readonly paginationLocale = computed(
    () => this.locale.pagination ?? BULUD_DEFAULT_LOCALE.pagination!,
  );

  protected readonly navigationLabel = computed(
    () =>
      this.ariaLabel() ??
      this.paginationLocale().navigationLabel ??
      DEFAULT_NAVIGATION_LABEL,
  );

  protected readonly previousLabel = computed(
    () => this.previousPageLabel() ?? this.paginationLocale().previousPageLabel,
  );

  protected readonly nextLabel = computed(
    () => this.nextPageLabel() ?? this.paginationLocale().nextPageLabel,
  );

  protected readonly morePagesLabel = computed(
    () => this.ellipsisLabel() ?? this.paginationLocale().ellipsisLabel,
  );

  protected requestPage(page: number): void {
    const count = this.safePageCount();
    const current = this.renderedPage();
    if (
      this.disabled() ||
      !count ||
      !Number.isSafeInteger(page) ||
      page < 1 ||
      page > count ||
      page === current
    ) {
      return;
    }
    this.pageChange.emit(page);
  }

  protected requestPreviousPage(): void {
    const current = this.renderedPage();
    if (current > 1) {
      this.requestPage(current - 1);
    }
  }

  protected requestNextPage(): void {
    const count = this.safePageCount();
    const current = this.renderedPage();
    if (current < count) {
      this.requestPage(current + 1);
    }
  }

  protected pageAccessibleLabel(page: number): string {
    return (
      (page === this.renderedPage()
        ? this.currentPageLabel()
        : this.pageLabel())?.(page) ??
      (page === this.renderedPage()
        ? this.paginationLocale().currentPageLabel
        : this.paginationLocale().pageLabel)(page)
    );
  }
}

function createPaginationWindow(
  pageCount: number,
  currentPage: number,
): readonly BuludPaginationItem[] {
  if (
    !Number.isSafeInteger(pageCount) ||
    pageCount < 1 ||
    !Number.isSafeInteger(currentPage) ||
    currentPage < 1 ||
    currentPage > pageCount
  ) {
    return [];
  }
  if (pageCount <= 7) {
    return Array.from({ length: pageCount }, (_, index) => index + 1);
  }
  if (currentPage <= 4) {
    return [1, 2, 3, 4, 5, 'ellipsis-end', pageCount];
  }
  if (currentPage >= pageCount - 3) {
    return [
      1,
      'ellipsis-start',
      pageCount - 4,
      pageCount - 3,
      pageCount - 2,
      pageCount - 1,
      pageCount,
    ];
  }
  return [
    1,
    'ellipsis-start',
    currentPage - 1,
    currentPage,
    currentPage + 1,
    'ellipsis-end',
    pageCount,
  ];
}
