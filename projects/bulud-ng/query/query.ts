import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';

export type BuludQueryValue =
  | string
  | number
  | boolean
  | readonly (string | number | boolean)[]
  | null
  | undefined;
export type BuludQueryParams = Readonly<Record<string, BuludQueryValue>>;
export type BuludQuerySource = BuludQueryParams | URLSearchParams | string;
export interface BuludListRequest {
  readonly take: number;
  readonly skip: number;
  readonly filter?: string;
  readonly sort?: string;
  readonly include?: readonly string[];
  readonly search?: string;
}
export interface BuludListFilter {
  readonly operator: string;
  readonly values: readonly string[];
}
export type BuludFilters = Readonly<Record<string, readonly BuludListFilter[]>>;

/** A URL, a query string, URLSearchParams, or Angular Router's Params can be supplied. */
export function readBuludQuery(source: BuludQuerySource): URLSearchParams {
  if (typeof source === 'string') {
    const withoutHash = source.split('#')[0];
    if (
      !withoutHash.includes('?') &&
      (/^[a-z][a-z0-9+.-]*:\/\//i.test(withoutHash) ||
        withoutHash.startsWith('/'))
    )
      return new URLSearchParams();
    const query = withoutHash.includes('?')
      ? withoutHash.slice(withoutHash.indexOf('?') + 1)
      : withoutHash;
    return new URLSearchParams(query);
  }
  if (source instanceof URLSearchParams) return new URLSearchParams(source);
  const result = new URLSearchParams();
  for (const [key, value] of Object.entries(source)) {
    if (value == null) continue;
    for (const item of Array.isArray(value) ? value : [value])
      result.append(key, String(item));
  }
  return result;
}
function positiveInteger(value: string | null, fallback: number): number {
  if (!value || !/^\d+$/.test(value)) return fallback;
  const n = Number(value);
  return Number.isSafeInteger(n) && n > 0 ? n : fallback;
}
/** Angour's page → take/skip mapping, with bounded page sizes and safe offsets. */
export function convertToRequestParams(
  source: BuludQuerySource,
  defaultTake = 10,
): BuludListRequest {
  const p = readBuludQuery(source);
  const fallback =
    Number.isSafeInteger(defaultTake) && defaultTake > 0
      ? Math.min(defaultTake, 1000)
      : 10;
  const take = Math.min(positiveInteger(p.get('take'), fallback), 1000);
  const page = positiveInteger(p.get('page'), 1);
  const skip = (page - 1) * take;
  const include = p
    .getAll('include')
    .flatMap((value) => value.split(','))
    .map((value) => value.trim())
    .filter(Boolean);
  return {
    take,
    skip: Number.isSafeInteger(skip) ? skip : 0,
    ...(p.has('filter') ? { filter: p.get('filter')! } : {}),
    ...(p.has('sort') ? { sort: p.get('sort')! } : {}),
    ...(p.has('search') ? { search: p.get('search')! } : {}),
    ...(include.length ? { include: [...new Set(include)] } : {}),
  };
}
function identifier(value: string): boolean {
  return (
    /^[A-Za-z_][\w.]*$/.test(value) &&
    !value
      .split('.')
      .some((part) => ['__proto__', 'prototype', 'constructor'].includes(part))
  );
}
/** Parses key:operator("value",...) expressions. Invalid or unsafe grammar throws SyntaxError. */
export function parseFilters(expression: string): BuludFilters {
  const result: Record<string, BuludListFilter[]> = Object.create(null);
  expression = expression.trim();
  let position = 0;
  while (position < expression.length) {
    const head = /^\s*([\w.]+):([\w.]+)\(/.exec(expression.slice(position));
    if (!head || !identifier(head[1]) || !identifier(head[2]))
      throw new SyntaxError('Invalid filter identifier');
    const [, key, operator] = head;
    position += head[0].length;
    const values: string[] = [];
    let expectValue = true;
    while (true) {
      while (
        /\s/.test(expression[position] ?? '') &&
        position < expression.length
      )
        position++;
      if (expression[position] === ')') {
        if (expectValue && values.length)
          throw new SyntaxError('Missing filter value');
        position++;
        break;
      }
      if (!expectValue) throw new SyntaxError('Missing filter delimiter');
      const quoted = /^"(?:[^"\\]|\\.)*"/.exec(expression.slice(position));
      const bare = /^[^,()"\s][^,()"]*/.exec(expression.slice(position));
      const token = quoted?.[0] ?? bare?.[0];
      if (token === undefined) throw new SyntaxError('Invalid filter value');
      let value: unknown;
      try {
        value = quoted ? JSON.parse(token) : token.trim();
      } catch {
        throw new SyntaxError('Invalid quoted filter value');
      }
      if (typeof value !== 'string')
        throw new SyntaxError('Invalid filter value');
      values.push(value);
      position += token.length;
      while (position < expression.length && /\s/.test(expression[position]))
        position++;
      expectValue = expression[position] === ',';
      if (expectValue) position++;
    }
    const list = result[key] ?? [];
    result[key] = [
      ...list.filter((f) => f.operator !== operator),
      ...(values.length ? [{ operator, values }] : []),
    ];
    if (!result[key].length) delete result[key];
    while (position < expression.length && /\s/.test(expression[position]))
      position++;
    if (position < expression.length) {
      if (expression[position++] !== ',' || position === expression.length)
        throw new SyntaxError('Invalid filter separator');
    }
  }
  return result;
}
export function buildFilterString(
  filters: BuludFilters,
  ignoreKeys: readonly string[] = [],
): string | undefined {
  const parts: string[] = [];
  for (const [key, list] of Object.entries(filters)) {
    if (ignoreKeys.includes(key)) continue;
    if (!identifier(key)) throw new SyntaxError('Invalid filter identifier');
    for (const filter of list) {
      if (!identifier(filter.operator))
        throw new SyntaxError('Invalid filter operator');
      const values = filter.values.filter((v) => v.trim().length);
      if (values.length)
        parts.push(
          `${key}:${filter.operator}(${values.map((v) => JSON.stringify(v)).join(',')})`,
        );
    }
  }
  return parts.length ? parts.join(',') : undefined;
}
/** Replaces only supplied keys. null/undefined deletes a key; unrelated keys and fragment survive. */
export function updateBuludQuery(url: string, patch: BuludQueryParams): string {
  const hashAt = url.indexOf('#');
  const hash = hashAt < 0 ? '' : url.slice(hashAt);
  const base = hashAt < 0 ? url : url.slice(0, hashAt);
  const queryAt = base.indexOf('?');
  const pathname = queryAt < 0 ? base : base.slice(0, queryAt);
  const params = new URLSearchParams(
    queryAt < 0 ? '' : base.slice(queryAt + 1),
  );
  for (const [key, value] of Object.entries(patch)) {
    params.delete(key);
    if (value != null)
      for (const item of Array.isArray(value) ? value : [value])
        params.append(key, String(item));
  }
  const query = params.toString();
  return `${pathname}${query ? '?' + query : ''}${hash}`;
}
/** Stateless facade; performs no navigation or network requests. */
@Injectable({ providedIn: 'root' })
export class BuludQueryService {
  read = readBuludQuery;
  toRequest = convertToRequestParams;
  parseFilters = parseFilters;
  buildFilters = buildFilterString;
  updateUrl = updateBuludQuery;
  toHttpParams(source: BuludQuerySource): HttpParams {
    return new HttpParams({ fromString: readBuludQuery(source).toString() });
  }
}
