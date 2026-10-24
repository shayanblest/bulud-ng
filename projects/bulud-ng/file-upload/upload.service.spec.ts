import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  BULUD_UPLOAD_REQUEST_FACTORY,
  BuludUploadService,
  BuludUploadError,
  BuludUploadEvent,
} from './upload.service';
import { validateBuludFiles } from './file-validation';
describe('Reusable file constraints and upload transport', () => {
  let xhr: XMLHttpRequest, service: BuludUploadService;
  const files = () => [new File(['abc'], 'data.csv', { type: 'text/csv' })];
  beforeEach(() => {
    xhr = new XMLHttpRequest();
    spyOn(xhr, 'open');
    spyOn(xhr, 'send');
    spyOn(xhr, 'abort');
    spyOn(xhr, 'setRequestHeader');
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        { provide: BULUD_UPLOAD_REQUEST_FACTORY, useValue: () => xhr },
      ],
    });
    service = TestBed.inject(BuludUploadService);
  });
  it('validates empty files, total size, malformed values and invalid configuration', () => {
    expect(
      validateBuludFiles([new File([], 'empty.csv')])?.['fileEmpty'],
    ).toBeTrue();
    expect(
      validateBuludFiles([new File([], 'empty.csv')], {
        allowEmptyFiles: true,
      }),
    ).toBeNull();
    expect(
      validateBuludFiles(files(), { maxTotalSize: 2 })?.['fileTotalSize'],
    ).toEqual({ max: 2, actual: 3 });
    expect(validateBuludFiles(files(), { maxTotalSize: NaN })).toEqual({
      fileConstraints: true,
    });
    expect(validateBuludFiles(['fake'])).toEqual({ fileValue: true });
  });
  it('starts only on subscription, sends multipart with explicit options and emits real progress/completion', () => {
    const result: BuludUploadEvent[] = [];
    const stream = service.upload(files(), {
      url: '/upload',
      fieldName: 'attachment',
      headers: { Authorization: 'test-token' },
      withCredentials: true,
      timeoutMs: 500,
    });
    expect(xhr.send).not.toHaveBeenCalled();
    stream.subscribe((event) => result.push(event));
    expect(xhr.open).toHaveBeenCalledWith('POST', '/upload', true);
    expect(xhr.setRequestHeader).toHaveBeenCalledWith(
      'Authorization',
      'test-token',
    );
    expect(xhr.withCredentials).toBeTrue();
    expect(xhr.timeout).toBe(500);
    const body = (xhr.send as jasmine.Spy).calls.mostRecent()
      .args[0] as FormData;
    expect((body.get('attachment') as File).name).toBe('data.csv');
    xhr.upload.onprogress?.call(
      xhr,
      new ProgressEvent('progress', {
        loaded: 1,
        total: 2,
        lengthComputable: true,
      }),
    );
    expect(result[0]).toEqual({
      kind: 'progress',
      loaded: 1,
      total: 2,
      percent: 50,
    });
    spyOnProperty(xhr, 'status').and.returnValue(201);
    spyOnProperty(xhr, 'response').and.returnValue({ id: 1 });
    xhr.onload?.call(xhr, new ProgressEvent('load'));
    expect(result[1]).toEqual({
      kind: 'complete',
      body: { id: 1 },
      status: 201,
    });
    expect(xhr.abort).not.toHaveBeenCalled();
    expect(xhr.upload.onprogress).toBeNull();
  });
  it('aborts on unsubscribe and removes callbacks without completing other operations', () => {
    const sub = service.upload(files(), { url: '/upload' }).subscribe();
    sub.unsubscribe();
    expect(xhr.abort).toHaveBeenCalledTimes(1);
    expect(xhr.onload).toBeNull();
    expect(xhr.upload.onprogress).toBeNull();
  });
  it('fails validation and unsafe/malformed configuration before opening a request', () => {
    for (const options of [
      { url: 'javascript:bad' },
      { url: '//example.com/upload' },
      { url: '/upload', headers: { 'Content-Type': 'multipart/form-data' } },
      { url: '/upload', timeoutMs: -1 },
    ]) {
      const error = jasmine.createSpy();
      service.upload(files(), options).subscribe({ error });
      expect(error.calls.mostRecent().args[0].code).toBe('configuration');
    }
    service.upload([], { url: '/upload' }).subscribe({
      error: (error: BuludUploadError) => expect(error.code).toBe('validation'),
    });
    expect(xhr.open).not.toHaveBeenCalled();
  });
  for (const kind of ['network', 'timeout', 'http'] as const)
    it(`reports ${kind} and does not invent progress when total is unknown`, () => {
      const next = jasmine.createSpy(),
        error = jasmine.createSpy();
      service.upload(files(), { url: '/upload' }).subscribe({ next, error });
      xhr.upload.onprogress?.call(
        xhr,
        new ProgressEvent('progress', { loaded: 1 }),
      );
      expect(next.calls.mostRecent().args[0].percent).toBeNull();
      if (kind === 'http') {
        spyOnProperty(xhr, 'status').and.returnValue(500);
        xhr.onload?.call(xhr, new ProgressEvent('load'));
      } else if (kind === 'network')
        xhr.onerror?.call(xhr, new ProgressEvent('error'));
      else xhr.ontimeout?.call(xhr, new ProgressEvent('timeout'));
      expect((error.calls.mostRecent().args[0] as BuludUploadError).code).toBe(
        kind,
      );
    });
});
