import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  BuludQueryService,
  buildFilterString,
  convertToRequestParams,
  parseFilters,
  readBuludQuery,
  updateBuludQuery,
} from './query';
describe('Angour reusable query contract', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    }),
  );
  it('maps URL and Router params to take/skip without mutating input', () => {
    const source = {
      page: '3',
      search: ' فارسی ',
      include: ['profile', 'tags'],
    };
    expect(convertToRequestParams(source)).toEqual({
      take: 10,
      skip: 20,
      search: ' فارسی ',
      include: ['profile', 'tags'],
    });
    expect(source.page).toBe('3');
    expect(
      convertToRequestParams('https://example.com/list?page=2&take=25#section')
        .skip,
    ).toBe(25);
  });
  it('bounds bad/oversized page sizes and offsets', () => {
    for (const page of [
      '-1',
      '0',
      '1.5',
      'Infinity',
      'bad',
      '9007199254740991',
    ])
      expect(convertToRequestParams({ page }).skip).toBe(0);
    expect(convertToRequestParams({ take: 100000 }).take).toBe(1000);
    expect(convertToRequestParams({}, -10).take).toBe(10);
    expect(convertToRequestParams({ page: 2, take: 5 }).skip).toBe(5);
  });
  it('retains repeated include values, Unicode, empty search and reserved characters', () => {
    const p = readBuludQuery({
      include: ['a', 'b', 'a'],
      search: 'a&b=فارسی',
      filter: '',
    });
    expect(p.get('search')).toBe('a&b=فارسی');
    expect(convertToRequestParams(p).include).toEqual(['a', 'b']);
    expect(convertToRequestParams(p).filter).toBe('');
    expect(readBuludQuery('https://example.com/path').toString()).toBe('');
  });
  it('merges URL patches, removes null values and preserves unrelated parameters and hash', () => {
    expect(
      updateBuludQuery('/list?lang=fa&page=2#table', {
        page: null,
        include: ['a', 'b'],
        search: 'a b',
      }),
    ).toBe('/list?lang=fa&include=a&include=b&search=a+b#table');
    expect(updateBuludQuery('/list?page=2', { page: null })).toBe('/list');
  });
  it('round trips quoted commas, parentheses, slashes, quotes and Unicode', () => {
    const filters = {
      title: [{ operator: 'eq', values: ['فارسی, (x) "quoted" \\ end'] }],
      status: [{ operator: 'in', values: ['active', 'draft'] }],
    };
    const expression = buildFilterString(filters)!;
    expect(parseFilters(expression)['title']).toEqual(filters.title);
    expect(buildFilterString(parseFilters(expression))).toBe(expression);
  });
  it('round trips dotted field and operator identifiers without weakening unsafe-name checks', () => {
    const filters = {
      'profile.date': [
        { operator: 'range.gte', values: ['2026-01-01'] },
        { operator: 'range.lte', values: ['2026-12-31'] },
      ],
    };
    const expression = buildFilterString(filters)!;
    expect(parseFilters(expression)['profile.date']).toEqual(
      filters['profile.date'],
    );
    expect(buildFilterString(parseFilters(expression))).toBe(expression);
    for (const operator of [
      '__proto__',
      'range.constructor',
      'prototype.gte',
    ]) {
      expect(() => parseFilters(`date:${operator}("x")`)).toThrowError(
        SyntaxError,
      );
      expect(() =>
        buildFilterString({ date: [{ operator, values: ['x'] }] }),
      ).toThrowError(SyntaxError);
    }
  });
  it('supports legacy bare values, replaces same operator and clears empty filters', () => {
    const p = parseFilters('status:eq(active),status:eq("draft"),title:in()');
    expect(p['status']).toEqual([{ operator: 'eq', values: ['draft'] }]);
    expect(p['title']).toBeUndefined();
    expect(buildFilterString(p, ['status'])).toBeUndefined();
    expect(Object.keys(parseFilters('  '))).toEqual([]);
  });
  it('rejects malformed and prototype-changing identifiers rather than silently changing meaning', () => {
    for (const expression of [
      'x:eq("a",)',
      'x:eq("a"',
      'x:eq("a"),',
      '__proto__:eq("x")',
      'a.constructor:eq("x")',
      'x:eq("a") junk',
      'x:eq("a" "b")',
    ])
      expect(() => parseFilters(expression))
        .withContext(expression)
        .toThrowError(SyntaxError);
    expect(() =>
      buildFilterString({ constructor: [{ operator: 'eq', values: ['x'] }] }),
    ).toThrowError(SyntaxError);
  });
  it('facade serializes HttpParams and performs no navigation or request', () => {
    const service = TestBed.inject(BuludQueryService);
    const params = service.toHttpParams({
      include: ['a', 'b'],
      zero: 0,
      flag: false,
      empty: null,
    });
    expect(params.getAll('include')).toEqual(['a', 'b']);
    expect(params.get('zero')).toBe('0');
    expect(params.get('flag')).toBe('false');
    expect(params.has('empty')).toBeFalse();
  });
});
