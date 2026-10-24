import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  BuludTableFilters,
  BuludTableFilterDefinition,
  buildBuludTableFilterQuery,
  filterBuludTableRows,
} from './filters';
const definitions: readonly BuludTableFilterDefinition[] = [
  { key: 'name', label: 'Name', kind: 'text' },
  { key: 'id', label: 'Minimum ID', kind: 'number', operator: 'gte' },
  { key: 'date', label: 'Date', kind: 'date' },
  { key: 'status', label: 'Status', kind: 'select', options: ['active'] },
];
const rows = [
  { id: 1, name: 'ALPHA', date: '2026-10-01', status: 'active' },
  { id: 2, name: 'Beta', date: '2026-10-02', status: 'draft' },
];
const columns = ['id', 'name', 'date', 'status'].map((key) => ({
  key,
  value: (r: (typeof rows)[number]) => r[key as keyof typeof r],
}));
describe('Table filters', () => {
  it('combines normalized text and typed comparisons without mutating rows', () => {
    expect(
      filterBuludTableRows(rows, columns, definitions, { name: 'alpha' }),
    ).toEqual([rows[0]]);
    expect(
      filterBuludTableRows(rows, columns, definitions, { id: '2' }),
    ).toEqual([rows[1]]);
    expect(
      filterBuludTableRows(rows, columns, definitions, { date: '2026-02-30' }),
    ).toEqual([]);
    expect(
      filterBuludTableRows(rows, columns, definitions, { status: 'unknown' }),
    ).toEqual([]);
    expect(rows.length).toBe(2);
  });
  it('serializes escaped values and rejects invalid typed URL filters', () => {
    expect(buildBuludTableFilterQuery(definitions, { id: '2' })).toBe(
      'id:gte("2")',
    );
    expect(buildBuludTableFilterQuery(definitions, {})).toBeUndefined();
    for (const values of [
      { date: '2026-02-30' },
      { id: 'Infinity' },
      { status: 'unknown' },
    ])
      expect(() =>
        buildBuludTableFilterQuery(definitions, values),
      ).toThrowError(RangeError);
  });
  it('updates native fields, resets, and guards disabled changes', async () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    const f = TestBed.createComponent(BuludTableFilters);
    f.componentRef.setInput('definitions', definitions);
    await f.whenStable();
    const input = f.nativeElement.querySelector('input') as HTMLInputElement;
    input.value = 'Alpha';
    input.dispatchEvent(new Event('input'));
    await f.whenStable();
    expect(f.componentInstance.value()['name']).toBe('Alpha');
    f.componentRef.setInput('disabled', true);
    await f.whenStable();
    input.value = 'changed';
    input.dispatchEvent(new Event('input'));
    expect(f.componentInstance.value()['name']).toBe('Alpha');
    f.componentRef.setInput('disabled', false);
    await f.whenStable();
    f.nativeElement.querySelector('.filter-panel > button').click();
    await f.whenStable();
    expect(f.componentInstance.value()).toEqual({});
  });
});
