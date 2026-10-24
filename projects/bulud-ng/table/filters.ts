import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  model,
} from '@angular/core';
import {
  BULUD_SHARED_UI_CONFIG,
  buludSharedUiStyles,
  BuludSharedUiTheme,
} from 'bulud-ng';
import { BuludDropdown } from 'bulud-ng/dropdown';
import { buildFilterString } from 'bulud-ng/query';
export interface BuludTableFilterDefinition {
  readonly key: string;
  readonly label: string;
  readonly kind: 'text' | 'select' | 'number' | 'date';
  readonly options?: readonly string[];
  readonly operator?: 'eq' | 'gte' | 'lte';
}
export type BuludTableFilterValues = Readonly<
  Record<string, string | undefined>
>;
function valid(value: string, filter: BuludTableFilterDefinition): boolean {
  if (!value) return true;
  if (filter.kind === 'number') return Number.isFinite(Number(value));
  if (filter.kind === 'date')
    return (
      /^\d{4}-\d{2}-\d{2}$/.test(value) &&
      Number.isFinite(Date.parse(value + 'T00:00:00Z')) &&
      new Date(value + 'T00:00:00Z').toISOString().slice(0, 10) === value
    );
  if (filter.kind === 'select') return filter.options?.includes(value) ?? false;
  return true;
}
export function filterBuludTableRows<T>(
  rows: readonly T[],
  columns: readonly {
    key: string;
    value: (row: T) => string | number | null | undefined;
  }[],
  definitions: readonly BuludTableFilterDefinition[],
  values: BuludTableFilterValues,
): readonly T[] {
  const active = definitions.filter((f) => values[f.key]?.trim());
  if (!active.length) return rows;
  const columnMap = new Map(columns.map((c) => [c.key, c]));
  return rows.filter((row) =>
    active.every((f) => {
      const query = (values[f.key] ?? '').trim(),
        raw = columnMap.get(f.key)?.value(row);
      if (raw == null || !valid(query, f)) return false;
      if (f.kind === 'text')
        return String(raw)
          .normalize('NFKC')
          .toLocaleLowerCase()
          .includes(query.normalize('NFKC').toLocaleLowerCase());
      const left = f.kind === 'number' ? Number(raw) : String(raw),
        right = f.kind === 'number' ? Number(query) : query;
      if (typeof left === 'number' && !Number.isFinite(left)) return false;
      return f.operator === 'gte'
        ? left >= right
        : f.operator === 'lte'
          ? left <= right
          : left === right;
    }),
  );
}
/** Explicit bridge to Angour dataset grammar; consumers decide backend-supported operators. */
export function buildBuludTableFilterQuery(
  definitions: readonly BuludTableFilterDefinition[],
  values: BuludTableFilterValues,
): string | undefined {
  const entries = definitions
    .filter((f) => values[f.key]?.trim())
    .map((f) => {
      const value = (values[f.key] ?? '').trim();
      if (!valid(value, f)) throw new RangeError(`Invalid filter: ${f.key}`);
      return [
        f.key,
        [
          {
            operator: f.kind === 'text' ? 'contains' : (f.operator ?? 'eq'),
            values: [value],
          },
        ],
      ];
    });
  return buildFilterString(Object.fromEntries(entries));
}
@Component({
  selector: 'bulud-table-filters',
  imports: [BuludDropdown],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './filters.scss',
  host: { '[style]': 'styles()' },
  template: `<details class="filter-panel">
    <summary>
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M3 4h18l-7 8v7l-4 2v-9Z" /></svg
      >{{ label() }}
      @if (count()) {
        <span class="count">{{ count() }}</span>
      }
    </summary>
    <div class="fields">
      @for (filter of definitions(); track filter.key) {
        <div class="field">
          <span>{{ filter.label }}</span>
          @if (filter.kind === 'select') {
            <bulud-dropdown
              [options]="filter.options ?? []"
              [value]="value()[filter.key] || null"
              [aria-label]="filter.label"
              [language]="language()"
              [disabled]="disabled()"
              (valueChange)="set(filter.key, $event)"
            />
          } @else {
            <input
              [attr.aria-label]="filter.label"
              [type]="
                filter.kind === 'number'
                  ? 'number'
                  : filter.kind === 'date'
                    ? 'date'
                    : 'search'
              "
              [value]="value()[filter.key] ?? ''"
              [disabled]="disabled()"
              [attr.aria-invalid]="invalid(filter) || null"
              (input)="inputChanged(filter.key, $event)"
            />
          }
        </div>
      }
    </div>
    <button
      type="button"
      [disabled]="disabled() || !count()"
      (click)="value.set({})"
    >
      {{ clearLabel() }}
    </button>
  </details>`,
})
export class BuludTableFilters {
  private readonly config = inject(BULUD_SHARED_UI_CONFIG);
  readonly definitions =
    input.required<readonly BuludTableFilterDefinition[]>();
  readonly value = model<BuludTableFilterValues>({});
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly label = input('Filters');
  readonly clearLabel = input('Clear filters');
  readonly language = input<'fa' | 'en'>('en');
  readonly theme = input<Partial<BuludSharedUiTheme>>();
  protected readonly count = computed(
    () => this.definitions().filter((f) => this.value()[f.key]?.trim()).length,
  );
  protected readonly styles = computed(() =>
    buludSharedUiStyles('table-filters', this.config, this.theme()),
  );
  protected invalid(filter: BuludTableFilterDefinition): boolean {
    return !valid(this.value()[filter.key] ?? '', filter);
  }
  protected inputChanged(key: string, event: Event): void {
    this.set(key, (event.target as HTMLInputElement).value);
  }
  protected set(key: string, value: unknown): void {
    if (this.disabled()) return;
    this.value.update((old) => {
      const next = { ...old };
      if (typeof value === 'string' && value.trim()) next[key] = value;
      else delete next[key];
      return next;
    });
  }
}
