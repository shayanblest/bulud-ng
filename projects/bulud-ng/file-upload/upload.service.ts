import { inject, Injectable, InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import { BuludFileConstraints, validateBuludFiles } from './file-validation';
import { ValidationErrors } from '@angular/forms';
export interface BuludUploadOptions {
  readonly url: string;
  readonly method?: 'POST' | 'PUT';
  readonly fieldName?: string;
  readonly headers?: Readonly<Record<string, string>>;
  readonly withCredentials?: boolean;
  readonly timeoutMs?: number;
  readonly constraints?: BuludFileConstraints;
}
export type BuludUploadEvent<T = unknown> =
  | {
      readonly kind: 'progress';
      readonly loaded: number;
      readonly total: number | null;
      readonly percent: number | null;
    }
  | { readonly kind: 'complete'; readonly body: T; readonly status: number };
export class BuludUploadError extends Error {
  override readonly name = 'BuludUploadError';
  constructor(
    readonly code:
      | 'validation'
      | 'configuration'
      | 'network'
      | 'http'
      | 'timeout'
      | 'abort'
      | 'unsupported',
    readonly status = 0,
    readonly errors?: ValidationErrors,
  ) {
    super(`Upload ${code}`);
  }
}
/** Lazy browser adapter, replaceable for tests/SSR. No request or global listener during injection. */
export const BULUD_UPLOAD_REQUEST_FACTORY = new InjectionToken<
  () => XMLHttpRequest
>('BULUD_UPLOAD_REQUEST_FACTORY', {
  providedIn: 'root',
  factory: () => () => {
    if (typeof XMLHttpRequest === 'undefined')
      throw new BuludUploadError('unsupported');
    return new XMLHttpRequest();
  },
});
@Injectable({ providedIn: 'root' })
export class BuludUploadService {
  private readonly create = inject(BULUD_UPLOAD_REQUEST_FACTORY);
  upload<T = unknown>(
    files: readonly File[],
    options: BuludUploadOptions,
  ): Observable<BuludUploadEvent<T>> {
    return new Observable((observer) => {
      const errors = validateBuludFiles(files, {
        ...options.constraints,
        multiple: options.constraints?.multiple ?? true,
        required: true,
      });
      if (errors) {
        observer.error(new BuludUploadError('validation', 0, errors));
        return;
      }
      const url = options.url?.trim(),
        timeout = options.timeoutMs ?? 0;
      if (
        !url ||
        (/^[a-z][a-z\d+.-]*:/i.test(url) && !/^https?:\/\//i.test(url)) ||
        url.startsWith('//') ||
        !Number.isSafeInteger(timeout) ||
        timeout < 0 ||
        timeout > 2147483647 ||
        !['POST', 'PUT'].includes(options.method ?? 'POST') ||
        !(options.fieldName ?? 'files').trim() ||
        Object.keys(options.headers ?? {}).some(
          (key) => key.toLowerCase() === 'content-type',
        )
      ) {
        observer.error(new BuludUploadError('configuration'));
        return;
      }
      let xhr: XMLHttpRequest | undefined,
        settled = false;
      try {
        xhr = this.create();
        const request = xhr;
        request.open(options.method ?? 'POST', url, true);
        request.responseType = 'json';
        request.timeout = timeout;
        request.withCredentials = options.withCredentials ?? false;
        for (const [key, value] of Object.entries(options.headers ?? {}))
          request.setRequestHeader(key, value);
        request.upload.onprogress = (event) => {
          if (!settled) {
            const total =
              event.lengthComputable && event.total > 0 ? event.total : null;
            observer.next({
              kind: 'progress',
              loaded: event.loaded,
              total,
              percent:
                total === null
                  ? null
                  : Math.max(0, Math.min(100, (event.loaded / total) * 100)),
            });
          }
        };
        request.onload = () => {
          settled = true;
          if (request.status >= 200 && request.status < 300) {
            observer.next({
              kind: 'complete',
              body: request.response as T,
              status: request.status,
            });
            observer.complete();
          } else observer.error(new BuludUploadError('http', request.status));
        };
        request.onerror = () => {
          settled = true;
          observer.error(new BuludUploadError('network'));
        };
        request.ontimeout = () => {
          settled = true;
          observer.error(new BuludUploadError('timeout'));
        };
        request.onabort = () => {
          settled = true;
          observer.error(new BuludUploadError('abort'));
        };
        const body = new FormData();
        for (const file of files)
          body.append(options.fieldName ?? 'files', file, file.name);
        request.send(body);
      } catch (error) {
        settled = true;
        observer.error(
          error instanceof BuludUploadError
            ? error
            : new BuludUploadError('configuration'),
        );
      }
      return () => {
        if (!xhr) return;
        xhr.upload.onprogress = null;
        xhr.onload = null;
        xhr.onerror = null;
        xhr.ontimeout = null;
        xhr.onabort = null;
        if (!settled) xhr.abort();
      };
    });
  }
}
