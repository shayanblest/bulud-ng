import {
  computed,
  Directive,
  effect,
  inject,
  input,
  signal,
  untracked,
} from '@angular/core';
import { BuludRuntime } from 'bulud-ng/runtime';
import {BuludPagination} from './bulud-pagination/bulud-pagination';

/** Converts API item totals and preserves optional explicit page refresh/jump.
 * Bulud owns pagination rendering, page windows, navigation and keyboard focus.
 */
@Directive({
  selector: 'bulud-pagination[buludPaginationData]',
  standalone: true,
  exportAs: 'buludPaginationData',
})
export class BuludPaginationData {
  private readonly pagination = inject(BuludPagination);
  private readonly runtime = inject(BuludRuntime);
  readonly itemsCount = input<number | undefined>(0);
  readonly activePage = input<number | string | undefined>(1);
  readonly pageLength = input<number | undefined>(10);
  readonly advanced = input(false);
  private readonly requestedPage = signal<number | null>(null);
  readonly jumpPage = signal<string>('1');
  readonly pageCount = computed(() => {
    const count = Number(this.itemsCount() ?? 0);
    const length = Number(this.pageLength() ?? 10);
    return Number.isFinite(count) &&
      count > 0 &&
      Number.isFinite(length) &&
      length > 0
      ? Math.ceil(count / length)
      : 0;
  });
  readonly currentPage = computed(
    () => this.requestedPage() ?? this.inputPage(),
  );
  readonly jumpInvalid = computed(() => {
    const value = Number(this.jumpPage());
    return !Number.isFinite(value) || value < 1 || value > this.pageCount();
  });
  readonly labels = computed(() => {
    return {
      navigation: this.runtime.text('PAGINATION.Navigation', 'Pages'),
      previous: this.runtime.text('PAGINATION.Previous', 'Previous page'),
      next: this.runtime.text('PAGINATION.Next', 'Next page'),
      more: this.runtime.text('PAGINATION.More', 'More pages'),
    };
  });
  readonly pageLabel = (page: number): string =>
    this.runtime.text('PAGINATION.Page', 'Page ' + page, { page });
  readonly currentPageLabel = (page: number): string =>
    this.runtime.text(
      'PAGINATION.CurrentPage',
      'Page ' + page + ', current page',
      { page },
    );

  constructor() {
    effect(() => {
      const page = this.inputPage();
      this.requestedPage.set(null);
      this.jumpPage.set(String(page));
    });
    effect(() => {
      this.itemsCount();
      this.pageLength();
      this.advanced();
      this.jumpPage.set(untracked(() => String(this.currentPage())));
    });
  }

  private inputPage(): number {
    const page = Number.parseInt(String(this.activePage() ?? 1), 10);
    return Number.isFinite(page) && page > 0 ? page : 1;
  }

  select(page: number): void {
    this.requestedPage.set(page);
    this.jumpPage.set(String(page));
  }

  jump(): void {
    if (!this.jumpInvalid()) {
      // An explicit jump to the current page still refreshes the existing API.
      this.pagination.pageChange.emit(Number.parseInt(this.jumpPage(), 10));
    }
  }
}
