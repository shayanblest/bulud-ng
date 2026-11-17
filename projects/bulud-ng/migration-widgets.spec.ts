import {
  ChangeDetectionStrategy,
  Component,
  provideZonelessChangeDetection,
  signal,
  viewChild,
} from '@angular/core';
import { TestBed, DeferBlockState } from '@angular/core/testing';
import { BuludPeriodPicker } from "bulud-ng/period-picker";

import { BuludTooltip} from 'bulud-ng/tooltip';
import {
  BuludFileUpload,
  BULUD_FILE_UPLOAD_CONFIG,
  BuludUploadIssue,
} from 'bulud-ng/file-upload';
import {
  BuludAccountCard,
  BULUD_ACCOUNT_CARD_CONFIG,
} from 'bulud-ng/account-card';
import {
  BuludEmptyState,
  BULUD_EMPTY_STATE_CONFIG,
} from 'bulud-ng/empty-state';
import { BuludLanguageSwitch } from 'bulud-ng/language-switch';
import { BULUD_RUNTIME_CONFIG, BuludLanguageOption } from 'bulud-ng/runtime';
import { BULUD_SHARED_UI_CONFIG } from 'bulud-ng';
import {
  BULUD_UTILITIES_CONFIG,
  BuludCardNumberPipe,
  BuludFileExtensionPipe,
  BuludIsImagePipe,
  BuludDateTimePipe,
  BuludTimestampPipe,
  BuludUnixTimeConverterPipe,
} from 'bulud-ng/utilities';
import {
  buludMatchesAccess,
  BuludAccess,
  BULUD_ACCESS_CONFIG,
  BuludAccessRule,
} from 'bulud-ng/access';
import { BuludDialog, BuludModalControl } from "bulud-ng/dialog";


@Component({
  imports: [BuludAccess],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<span *buludAccess="rule()">Allowed</span>',
})
class AccessHost {
  readonly rule = signal<BuludAccessRule>('documents:L');
}
@Component({
  imports: [BuludDialog, BuludModalControl],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template:
    '<bulud-dialog buludModalControl #modal="buludModalControl" [open]="modal.isOpen()" aria-label="Confirmation" (modalClose)="closed=closed+1"><button>Accept</button></bulud-dialog>',
})
class ModalHost {
  readonly modal = viewChild.required(BuludModalControl);
  closed = 0;
}

describe('Extracted reusable widget contracts', () => {
  const language = signal('en'),
    revision = signal(0);
  const dictionary: Record<string, string> = {};
  beforeEach(() => {
    language.set('en');
    revision.set(0);
    for (const key of Object.keys(dictionary)) delete dictionary[key];
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        {
          provide: BULUD_RUNTIME_CONFIG,
          useValue: {
            language,
            translationRevision: revision,
            translate: (key: string) => dictionary[key] ?? key,
          },
        },
      ],
    });
  });
  it('retains month bounds, unrestricted year browsing, initial emission and YYYY-MM selection', async () => {
    const f = TestBed.createComponent(BuludPeriodPicker),
      events: string[] = [];f.componentRef.setInput('presentation','grid');
    f.componentRef.setInput('label', 'Month');
    f.componentRef.setInput('referenceDate', new Date(2025, 5, 15));
    f.componentRef.setInput('min', new Date(2025, 4, 1));
    f.componentRef.setInput('max', new Date(2025, 6, 31));
    f.componentRef.setInput('language', 'en');
    f.componentInstance.monthSelected.subscribe((value) => events.push(value));
    await f.whenStable();
    expect(events).toEqual(['2025-06']);
    expect(f.nativeElement.textContent).toContain('Jun - 2025');
    expect(f.componentInstance.isMonthDisabled(3)).toBeTrue();
    expect(f.componentInstance.isMonthDisabled(4)).toBeFalse();
    f.componentInstance.nextYear();
    await f.whenStable();
    expect(f.componentInstance.year()).toBe(2026);
    expect(f.componentInstance.isMonthDisabled(5)).toBeTrue();
    f.componentInstance.prevYear();
    f.componentInstance.selectMonth(6);
    await f.whenStable();
    expect(events).toEqual(['2025-06', '2025-07']);
    expect(f.componentInstance.isOpen()).toBeFalse();
  });
  it('supports project-supplied month labels and instance theme over component/global defaults', async () => {
    TestBed.overrideProvider(BULUD_SHARED_UI_CONFIG, {
      useValue: {
        theme: { background: 'red' },
        components: { 'period-picker': { background: 'green' } },
      },
    });
    const f = TestBed.createComponent(BuludPeriodPicker);f.componentRef.setInput('presentation','grid');
    f.componentRef.setInput('label', 'Month');
    f.componentRef.setInput('referenceDate', new Date(2025, 0, 1));
    f.componentRef.setInput('monthLabels', ['Project month']);
    f.componentRef.setInput('theme', { background: 'blue' });
    await f.whenStable();
    expect(f.nativeElement.textContent).toContain('Project month - 2025');
    expect(
      getComputedStyle(f.nativeElement.querySelector('.display'))
        .backgroundColor,
    ).toBe('rgb(0, 0, 255)');
  });
  it('retains the existing Gregorian month-navigation Unix rollover only when explicitly requested', async () => {
    const f = TestBed.createComponent(BuludPeriodPicker),
      events: number[] = [];f.componentRef.setInput('presentation','navigation');
    f.componentRef.setInput('referenceDate', new Date(2025, 5, 15));
    f.componentRef.setInput('legacyTimestamp', true);
    f.componentInstance.dateChange.subscribe((value) => events.push(value));
    await f.whenStable();
    f.componentInstance.nextMonth();
    await f.whenStable();
    expect(events).toEqual([new Date(2025, 7, 16).getTime() / 1000 - 86400]);
    f.componentInstance.prevMonth();
    await f.whenStable();
    expect(events[1]).toBe(new Date(2025, 6, 16).getTime() / 1000 - 86400);
  });
  it('handles Nowruz and dynamically changing language without a fixed language list', async () => {
    language.set('fa');
    const f = TestBed.createComponent(BuludPeriodPicker);f.componentRef.setInput('presentation','navigation');
    f.componentRef.setInput('referenceDate', new Date(2024, 2, 20));
    const events: number[] = [];
    f.componentInstance.dateChange.subscribe((value) => events.push(value));
    await f.whenStable();
    expect(f.nativeElement.textContent).toContain('1403');
    f.componentInstance.nextMonth();
    await f.whenStable();
    expect(events[0]).toBe(new Date(2024, 3, 20).getTime() / 1000);
    language.set('de');
    await f.whenStable();
    expect(f.nativeElement.textContent).toContain('2024');
  });
  it('renders rich tooltip content, imperative visibility and outside-click cleanup', async () => {
    const f = TestBed.createComponent(BuludTooltip);f.componentRef.setInput('presentation','manual');
    await f.whenStable();
    expect(f.nativeElement.querySelector('[role=tooltip]')).toBeNull();
    f.componentInstance.isVisible = true;
    await f.whenStable();
    expect(f.nativeElement.querySelector('[role=tooltip]')).not.toBeNull();
    const wrapper = document.createElement('section');
    document.body.append(wrapper);
    wrapper.append(f.nativeElement);
    const outside = document.createElement('button');
    document.body.append(outside);
    outside.click();
    await f.whenStable();
    expect(f.componentInstance.isVisible).toBeFalse();
    outside.remove();
    f.destroy();
    wrapper.remove();
  });
  it('keeps account navigation in a project callback and activates it once by keyboard', async () => {
    const navigate = jasmine.createSpy('navigate');
    TestBed.overrideProvider(BULUD_ACCOUNT_CARD_CONFIG, {
      useValue: { navigate },
    });
    const f = TestBed.createComponent(BuludAccountCard);
    f.componentRef.setInput('cardType', 'real');
    f.componentRef.setInput('accountType', 'MT');
    f.componentRef.setInput('accountId', '42');
    f.componentRef.setInput('balance', 1234.5);
    f.componentRef.setInput('showDetails', true);
    await f.whenStable();
    const card = f.nativeElement.querySelector('.platform-card');
    expect(card.tabIndex).toBe(0);
    card.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }),
    );
    expect(navigate).toHaveBeenCalledOnceWith('real', '42');
    expect(card.textContent).toContain('1,234.5');
  });
  it('restores disabled/wallet card state without navigating passive cards', async () => {
    const navigate = jasmine.createSpy('navigate');
    TestBed.overrideProvider(BULUD_ACCOUNT_CARD_CONFIG, {
      useValue: { navigate },
    });
    const f = TestBed.createComponent(BuludAccountCard);
    f.componentRef.setInput('account', { disabled_at: 1 });
    await f.whenStable();
    const card = f.nativeElement.querySelector('.platform-card');
    expect(card.classList.contains('wallet-card')).toBeTrue();
    expect(card.tabIndex).toBe(-1);
    card.click();
    expect(navigate).not.toHaveBeenCalled();
  });
  it('reacts to asynchronous translations of illustrated states and preserves project navigation', async () => {
    const action = jasmine.createSpy('home');
    TestBed.overrideProvider(BULUD_EMPTY_STATE_CONFIG, {
      useValue: {
        image: '/project/404.webp',
        title: () => dictionary['title'] ?? '404',
        actionLabel: () => dictionary['action'] ?? 'Home',
        onAction: action,
      },
    });
    const f = TestBed.createComponent(BuludEmptyState);f.componentRef.setInput('variant','illustrated');
    await f.whenStable();
    dictionary['title'] = 'Page missing';
    dictionary['action'] = 'Return';
    revision.update((v) => v + 1);
    await f.whenStable();
    expect(f.nativeElement.querySelector('h1').textContent).toContain(
      'Page missing',
    );
    f.nativeElement.querySelector('button').click();
    expect(action).toHaveBeenCalledTimes(1);
    expect(f.nativeElement.querySelector('img').getAttribute('src')).toBe(
      '/project/404.webp',
    );
  });
  it('bundles the exact default image only through the deferred fallback and keeps custom image/text overridable', async () => {
    const f = TestBed.createComponent(BuludEmptyState);f.componentRef.setInput('variant','illustrated');
    await f.whenStable();
    const blocks = await f.getDeferBlocks();
    expect(blocks.length).toBe(2);
    for (const block of blocks) await block.render(DeferBlockState.Complete);
    await f.whenStable();
    const image = f.nativeElement.querySelector('bulud-default-404-image img');
    expect(image.getAttribute('src')).toMatch(/^data:image\/webp;base64,UklG/);
    f.componentRef.setInput(
      'image',
      'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
    );
    f.componentRef.setInput('title', 'Project missing page');
    f.componentRef.setInput('actionLabel', 'Project home');
    await f.whenStable();
    expect(f.nativeElement.querySelector('bulud-default-404-image')).toBeNull();
    expect(f.nativeElement.querySelector('h1').textContent).toBe(
      'Project missing page',
    );
    expect(f.nativeElement.querySelector('button').textContent.trim()).toBe(
      'Project home',
    );
  });
  it('honors instance, component and global illustrated-state content defaults in order', async () => {
    TestBed.overrideProvider(BULUD_EMPTY_STATE_CONFIG, {
      useValue: {
        image: 'global',
        title: 'Global',
        defaults: { image: 'component', title: 'Component' },
      },
    });
    const f = TestBed.createComponent(BuludEmptyState);f.componentRef.setInput('variant','illustrated');
    await f.whenStable();
    expect(f.nativeElement.querySelector('img').getAttribute('src')).toBe(
      'component',
    );
    expect(f.nativeElement.querySelector('h1').textContent).toBe('Component');
    f.componentRef.setInput('image', 'instance');
    f.componentRef.setInput('title', 'Instance');
    await f.whenStable();
    expect(f.nativeElement.querySelector('img').getAttribute('src')).toBe(
      'instance',
    );
    expect(f.nativeElement.querySelector('h1').textContent).toBe('Instance');
  });
  it('renders any project language list and accepts a new locale reactively', async () => {
    const available = signal<readonly BuludLanguageOption[]>([
      { id: 3, code: 'en', label: 'English' },
      { id: 1, code: 'fa', label: 'فارسی' },
    ]);
    const change = jasmine.createSpy('language');
    TestBed.overrideProvider(BULUD_RUNTIME_CONFIG, {
      useValue: { language, languages: available, setLanguage: change },
    });
    const f = TestBed.createComponent(BuludLanguageSwitch);
    await f.whenStable();
    expect(f.nativeElement.textContent).toContain('English');
    available.update((items) => [...items, { code: 'de', label: 'Deutsch' }]);
    language.set('de');
    await f.whenStable();
    expect(f.nativeElement.textContent).toContain('Deutsch');
    f.nativeElement.querySelector('button').click();
    await f.whenStable();
    const options = f.nativeElement.querySelectorAll('[role=option]');
    expect(options.length).toBe(3);
    options[1].click();
    await f.whenStable();
    expect(change).toHaveBeenCalledOnceWith('fa');
  });
  it('validates CSV and clears invalid native selection exactly once', async () => {
    const issues: BuludUploadIssue[] = [];
    TestBed.overrideProvider(BULUD_FILE_UPLOAD_CONFIG, {
      useValue: { onIssue: (issue: BuludUploadIssue) => issues.push(issue) },
    });
    const f = TestBed.createComponent(BuludFileUpload),
      changes = jasmine.createSpy('files');
    f.componentRef.setInput('presentation','preview');f.componentRef.setInput('uploadType', 'csv');
    f.componentInstance.filesChange.subscribe(changes);
    await f.whenStable();
    const input = f.nativeElement.querySelector('input[type=file]');
    const data = new DataTransfer();
    data.items.add(
      new File(['invalid'], 'document.txt', { type: 'text/plain' }),
    );
    input.files = data.files;
    input.dispatchEvent(new Event('change', { bubbles: true }));
    await f.whenStable();
    expect(issues.length).toBe(1);
    expect(issues[0].kind).toBe('csv');
    expect(f.componentInstance.files).toEqual([]);
    expect(input.value).toBe('');
    expect(changes).toHaveBeenCalledTimes(1);
  });
  it('accepts extension or MIME CSV and keeps progress, loading and clear state reactive', async () => {
    const f = TestBed.createComponent(BuludFileUpload),
      changes = jasmine.createSpy('files');
    f.componentRef.setInput('presentation','preview');f.componentRef.setInput('uploadType', 'csv');
    f.componentInstance.filesChange.subscribe(changes);
    await f.whenStable();
    const input = f.nativeElement.querySelector('input[type=file]'),
      data = new DataTransfer();
    data.items.add(new File(['a,b'], 'REPORT.CSV'));
    input.files = data.files;
    input.dispatchEvent(new Event('change', { bubbles: true }));
    await f.whenStable();
    expect(f.componentInstance.files[0].name).toBe('REPORT.CSV');
    expect(changes).toHaveBeenCalledTimes(1);
    f.componentRef.setInput('progress', 101);
    await f.whenStable();
    expect(f.nativeElement.querySelector('.preview-upload-state')).not.toBeNull();
    f.componentInstance.clear();
    await f.whenStable();
    expect(f.componentInstance.files).toEqual([]);
    expect(f.componentInstance.progress()).toBeNull();
    expect(changes).toHaveBeenCalledTimes(2);
  });
  it('resizes image uploads within 1000 by 1000 while preserving proportions and file name', async () => {
    const f = TestBed.createComponent(BuludFileUpload),
      canvas = document.createElement('canvas');
    canvas.width = 2000;
    canvas.height = 500;
    const blob = await new Promise<Blob>((resolve) =>
      canvas.toBlob((value) => resolve(value!), 'image/png'),
    );
    const file = await f.componentInstance.resizeImage(
      new File([blob], 'image.png', { type: 'image/png' }),
      1000,
      1000,
    );
    const bitmap = await createImageBitmap(file);
    expect([bitmap.width, bitmap.height]).toEqual([1000, 250]);
    expect(file.name).toBe('image.png');
    bitmap.close();
    f.destroy();
  });
  it('preserves imperative modal closability while suppressing destruction callbacks', async () => {
    const f = TestBed.createComponent(ModalHost);
    await f.whenStable();
    const modal = f.componentInstance.modal();
    modal.open();
    await f.whenStable();
    modal.closable.set(false);
    modal.close();
    expect(modal.isOpen()).toBeTrue();
    modal.closable.set(true);
    modal.close(false);
    await f.whenStable();
    expect(modal.isOpen()).toBeFalse();
    expect(f.componentInstance.closed).toBe(0);
    modal.open();
    await f.whenStable();
    f.destroy();
    expect(f.componentInstance.closed).toBe(0);
  });
  it('matches any/all/not/wildcards without coupling policy to JWT decoding', () => {
    const scopes = ['documents:RL', 'account:CU'];
    expect(buludMatchesAccess('documents:L', scopes)).toBeTrue();
    expect(buludMatchesAccess('documents:D', scopes)).toBeFalse();
    expect(
      buludMatchesAccess(
        {
          any: ['documents:D', 'account:C'],
          all: ['documents:R'],
          not: ['account:D'],
        },
        scopes,
      ),
    ).toBeTrue();
    expect(buludMatchesAccess('*', [])).toBeTrue();
    expect(buludMatchesAccess('anything:L', ['*:L'])).toBeTrue();
    expect(buludMatchesAccess({ any: [] }, scopes)).toBeFalse();
    expect(buludMatchesAccess({ all: [] }, scopes)).toBeTrue();
    expect(
      buludMatchesAccess('Documents:R', ['Documents:R'], true),
    ).toBeFalse();
  });
  it('reactively rechecks externally supplied scopes and bypasses policy for the configured project', async () => {
    const scopes = signal<readonly string[]>(['documents:L']),
      enforce = signal(true);
    TestBed.overrideProvider(BULUD_ACCESS_CONFIG, {
      useValue: { scopes: () => scopes(), enforce: () => enforce() },
    });
    const f = TestBed.createComponent(AccessHost);
    await f.whenStable();
    expect(f.nativeElement.textContent).toContain('Allowed');
    scopes.set([]);
    await f.whenStable();
    expect(f.nativeElement.textContent).not.toContain('Allowed');
    enforce.set(false);
    await f.whenStable();
    expect(f.nativeElement.textContent).toContain('Allowed');
  });
  it('uses global legacy utility formatting with component defaults and explicit overrides', () => {
    TestBed.overrideProvider(BULUD_UTILITIES_CONFIG, {
      useValue: {
        format: 'legacy',
        components: {
          dateTime: { unit: 'auto' },
          fileExtension: { format: 'standard' },
        },
      },
    });
    TestBed.configureTestingModule({
      providers: [
        BuludCardNumberPipe,
        BuludFileExtensionPipe,
        BuludIsImagePipe,
        BuludDateTimePipe,
        BuludTimestampPipe,
        BuludUnixTimeConverterPipe,
      ],
    });
    expect(
      TestBed.inject(BuludCardNumberPipe).transform('************1234'),
    ).toBe('************1234');
    expect(TestBed.inject(BuludFileExtensionPipe).transform('REPORT.PDF')).toBe(
      'pdf',
    );
    expect(
      TestBed.inject(BuludFileExtensionPipe).transform('REPORT.PDF', 'legacy'),
    ).toBe('PDF');
    expect(
      TestBed.inject(BuludIsImagePipe).transform('image.avif'),
    ).toBeFalse();
    expect(
      TestBed.inject(BuludDateTimePipe).transform(
        new Date(2025, 5, 15).getTime(),
        false,
      ),
    ).toBe('2025-06-15');
    expect(() =>
      TestBed.inject(BuludTimestampPipe).transform('invalid'),
    ).toThrowError('Invalid date format');
    expect(
      TestBed.inject(BuludUnixTimeConverterPipe).transform(1700000000),
    ).toBe(new Date(1700000000000).toString());
  });
});
