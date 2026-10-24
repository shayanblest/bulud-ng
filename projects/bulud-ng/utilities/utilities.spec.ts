import { DOCUMENT, provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  buludDateRange,
  buludUnixTimestamp,
  BuludCardNumberPipe,
  BuludConnectionService,
  BuludDateService,
  BuludDateTimePipe,
  BuludFileExtensionPipe,
  BuludIsImagePipe,
  BuludMaskEmailPipe,
  BuludPascalCasePipe,
  BuludPasswordService,
} from './utilities';
describe('Reusable Angour utilities', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    }),
  );
  it('extracts file extensions from paths/URLs without query/hash and handles empty/hidden names', () => {
    const pipe = new BuludFileExtensionPipe();
    expect(pipe.transform('/files/REPORT.CSV?token=x.pdf#name.png')).toBe(
      'csv',
    );
    expect(pipe.transform('noext')).toBe('');
    expect(pipe.transform('.env')).toBe('');
    expect(pipe.transform(null)).toBe('');
  });
  it('recognizes common raster formats including data URLs without inferring file safety', () => {
    const pipe = new BuludIsImagePipe();
    expect(pipe.transform('/files/a.AVIF?download=1')).toBeTrue();
    expect(pipe.transform('data:image/png;base64,AAAA')).toBeTrue();
    expect(pipe.transform('image.svg')).toBeFalse();
    expect(pipe.transform(null)).toBeFalse();
  });
  it('masks text without zero-end slicing leaks and formats case/card values', () => {
    const mask = new BuludMaskEmailPipe();
    expect(mask.transform('user@example.com', 3, 0)).toBe('use...');
    expect(mask.transform('ab')).toBe('***');
    expect(mask.transform(null)).toBe('-');
    expect(new BuludPascalCasePipe().transform('hello_world example')).toBe(
      'HelloWorldExample',
    );
    expect(new BuludCardNumberPipe().transform('123456789')).toBe(
      '1234 5678 9',
    );
  });
  it('keeps epoch zero valid, rejects invalid dates and separates seconds/milliseconds', () => {
    expect(buludUnixTimestamp('1970-01-01T00:00:00Z')).toBe(0);
    expect(buludUnixTimestamp('invalid')).toBeNull();
    const pipe = new BuludDateTimePipe();
    expect(pipe.transform(0, false, 'en', 'UTC')).toContain('1970');
    expect(pipe.transform(0, false, 'fa', 'UTC')).toContain('1348');
    expect(pipe.transform(1000, false, 'en', 'UTC', 'milliseconds')).toBe(
      pipe.transform(1, false, 'en', 'UTC'),
    );
    expect(pipe.transform(NaN)).toBe('-');
    expect(pipe.transform(0, false, 'en', 'Bad/Zone')).toBe('-');
  });
  it('clamps rolling month/year ranges at leap and month boundaries without mutating input', () => {
    const now = new Date(2024, 2, 31, 12);
    const range = buludDateRange('monthly', now);
    expect(new Date(range.from * 1000).getDate()).toBe(29);
    expect(new Date(range.from * 1000).getMonth()).toBe(1);
    expect(now.getDate()).toBe(31);
    expect(
      new Date(
        buludDateRange('yearly', new Date(2024, 1, 29)).from * 1000,
      ).getDate(),
    ).toBe(28);
    expect(buludDateRange('all', now).from).toBe(0);
    expect(() => buludDateRange('daily', new Date(NaN))).toThrowError(
      RangeError,
    );
  });
  it('provides date helpers without application configuration', () => {
    const service = TestBed.inject(BuludDateService);
    expect(service.fromUnix(0)?.getTime()).toBe(0);
    expect(service.fromUnix(Infinity)).toBeNull();
  });
  it('reacts to browser connectivity and removes both listeners on injector destruction', () => {
    const win = TestBed.inject(DOCUMENT).defaultView!;
    const remove = spyOn(win, 'removeEventListener').and.callThrough();
    const service = TestBed.inject(BuludConnectionService);
    expect(typeof service.online()).toBe('boolean');
    win.dispatchEvent(new Event('offline'));
    expect(service.online()).toBe(win.navigator.onLine);
    TestBed.resetTestingModule();
    expect(
      remove.calls.allArgs().some((args) => args[0] === 'online'),
    ).toBeTrue();
    expect(
      remove.calls.allArgs().some((args) => args[0] === 'offline'),
    ).toBeTrue();
  });
  it('does not access navigator or install listeners on the server', () => {
    TestBed.configureTestingModule({
      providers: [{ provide: DOCUMENT, useValue: { defaultView: null } }],
    });
    expect(TestBed.inject(BuludConnectionService).online()).toBeNull();
  });
  it('generates bounded cryptographic passwords with all character groups and no Math.random', () => {
    const random = spyOn(Math, 'random').and.throwError(
      'Do not use Math.random',
    );
    const service = TestBed.inject(BuludPasswordService);
    for (let i = 0; i < 5; i++) {
      const result = service.generate(20);
      expect(result.length).toBe(20);
      for (const pattern of [/[a-z]/, /[A-Z]/, /[0-9]/, /[!@#$%&*]/])
        expect(pattern.test(result)).toBeTrue();
    }
    expect(random).not.toHaveBeenCalled();
    for (const length of [0, 4, NaN, 129, 12.5])
      expect(() => service.generate(length)).toThrowError(RangeError);
  });
});
