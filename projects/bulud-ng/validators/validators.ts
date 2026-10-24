import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
const empty = (value: unknown) =>
  value === null || value === undefined || value === '';
/** Required text rejecting whitespace; accepts no non-string values. */
export const buludRequiredText: ValidatorFn = (control) =>
  typeof control.value === 'string' && control.value.trim().length > 0
    ? null
    : { required: true };
/** Optional numeric value; rejects NaN, infinities and numeric strings. */
export const buludFiniteNumber: ValidatorFn = (control) =>
  empty(control.value) ||
  (typeof control.value === 'number' && Number.isFinite(control.value))
    ? null
    : { finiteNumber: true };
/** Optional absolute HTTP(S) URL. Combine with Validators.required when needed. */
export const buludHttpUrl: ValidatorFn = (control) => {
  if (empty(control.value)) return null;
  if (typeof control.value !== 'string') return { url: true };
  try {
    const url = new URL(control.value);
    return ['http:', 'https:'].includes(url.protocol) && !!url.hostname
      ? null
      : { url: true };
  } catch {
    return { url: true };
  }
};
/** Optional Gregorian ISO date-only string, years 0001–9999. */
export const buludIsoDate: ValidatorFn = (control) => {
  const value: unknown = control.value;
  if (empty(value)) return null;
  if (
    typeof value !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}$/.test(value) ||
    value < '0001-01-01'
  )
    return { date: true };
  const date = new Date(value + 'T12:00:00.000Z');
  return Number.isFinite(date.getTime()) &&
    date.toISOString().slice(0, 10) === value
    ? null
    : { date: true };
};
/** Pure group-level equality validation; does not mutate child errors. */
export function buludMatchFields(first: string, second: string): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const left = control.get(first),
      right = control.get(second);
    return !left || !right
      ? { matchFields: { first, second, missing: true } }
      : Object.is(left.value, right.value)
        ? null
        : { matchFields: { first, second } };
  };
}
