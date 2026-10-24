import { ValidationErrors } from '@angular/forms';
export interface BuludFileConstraints {
  readonly accept?: string;
  readonly multiple?: boolean;
  readonly required?: boolean;
  readonly maxSize?: number | null;
  readonly maxFiles?: number | null;
  readonly maxTotalSize?: number | null;
  readonly allowEmptyFiles?: boolean;
}
/** Metadata validation only. Server-side authorization and content checks remain mandatory. */
export function validateBuludFiles(
  value: unknown,
  config: BuludFileConstraints = {},
): ValidationErrors | null {
  const { maxSize = null, maxFiles = null, maxTotalSize = null } = config;
  if (
    [maxSize, maxFiles, maxTotalSize].some(
      (n) => n !== null && (!Number.isSafeInteger(n) || n < 0),
    )
  )
    return { fileConstraints: true };
  if (
    !Array.isArray(value) ||
    value.some((v) => typeof File === 'undefined' || !(v instanceof File))
  )
    return { fileValue: true };
  const files = value as File[],
    errors: ValidationErrors = {};
  if (config.required && !files.length) errors['required'] = true;
  const count = config.multiple
    ? (maxFiles ?? Infinity)
    : Math.min(1, maxFiles ?? 1);
  if (files.length > count)
    errors['fileCount'] = { max: count, actual: files.length };
  if (maxSize !== null && files.some((f) => f.size > maxSize))
    errors['fileSize'] = { max: maxSize };
  const total = files.reduce((sum, f) => sum + f.size, 0);
  if (maxTotalSize !== null && total > maxTotalSize)
    errors['fileTotalSize'] = { max: maxTotalSize, actual: total };
  if (!config.allowEmptyFiles && files.some((f) => f.size === 0))
    errors['fileEmpty'] = true;
  const accept = config.accept ?? '',
    rules = accept
      .split(',')
      .map((r) => r.trim().toLowerCase())
      .filter(Boolean);
  if (
    rules.some(
      (r) => !/^\.[a-z0-9]+$/.test(r) && !/^[-\w.+]+\/(?:[-\w.+]+|\*)$/.test(r),
    )
  )
    errors['fileAcceptConfig'] = true;
  else if (
    rules.length &&
    files.some(
      (f) =>
        !rules.some((r) =>
          r.startsWith('.')
            ? f.name.toLowerCase().endsWith(r)
            : r.endsWith('/*')
              ? f.type.toLowerCase().startsWith(r.slice(0, -1))
              : f.type.toLowerCase() === r,
        ),
    )
  )
    errors['fileType'] = { accept };
  return Object.keys(errors).length ? errors : null;
}
