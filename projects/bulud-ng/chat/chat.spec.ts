import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { BuludChat } from './chat';
describe('BuludChat', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    }),
  );
  it('renders safe text, two sides, timestamps, delivery status and attachment/retry actions', async () => {
    const f = TestBed.createComponent(BuludChat);
    f.componentRef.setInput('messages', [
      {
        id: '1',
        author: 'Support',
        text: '<script>bad()</script>',
        outgoing: false,
      },
      {
        id: '2',
        author: 'Me',
        text: 'Hello',
        outgoing: true,
        status: 'failed',
        timestamp: 0,
        attachments: [{ id: 'a', name: 'guide.pdf' }],
      },
    ]);
    await f.whenStable();
    expect(f.nativeElement.querySelector('script')).toBeNull();
    expect(f.nativeElement.textContent).toContain('<script>');
    expect(f.nativeElement.querySelectorAll('.outgoing').length).toBe(1);
    let retry = '',
      attachment = '';
    f.componentInstance.retry.subscribe((id) => (retry = id));
    f.componentInstance.attachmentClick.subscribe(
      (event) => (attachment = event.attachment.id),
    );
    f.nativeElement.querySelector('footer button').click();
    f.nativeElement.querySelector('.attachments button').click();
    expect(retry).toBe('2');
    expect(attachment).toBe('a');
    expect(
      f.nativeElement.querySelector('time').getAttribute('datetime'),
    ).toContain('1970');
    f.destroy();
  });
  it('rejects blank/too-long drafts, emits trimmed text, preserves draft and blocks busy/disabled', async () => {
    const f = TestBed.createComponent(BuludChat);
    await f.whenStable();
    const sent: string[] = [];
    f.componentInstance.send.subscribe((value) => sent.push(value));
    const form = f.nativeElement.querySelector('form');
    form.dispatchEvent(new Event('submit', { cancelable: true }));
    expect(sent).toEqual([]);
    f.componentRef.setInput('maxLength', 5);
    f.componentRef.setInput('draft', '123456');
    await f.whenStable();
    form.dispatchEvent(new Event('submit', { cancelable: true }));
    expect(sent).toEqual([]);
    f.componentRef.setInput('draft', ' Hi ');
    await f.whenStable();
    form.dispatchEvent(new Event('submit', { cancelable: true }));
    expect(sent).toEqual(['Hi']);
    expect(f.componentInstance.draft()).toBe(' Hi ');
    for (const key of ['sending', 'disabled', 'loading']) {
      f.componentRef.setInput(key, true);
      await f.whenStable();
      form.dispatchEvent(new Event('submit', { cancelable: true }));
      expect(sent.length).toBe(1);
      f.componentRef.setInput(key, false);
    }
    f.destroy();
  });
  it('supports loading empty error labels and keyboard composition rules', async () => {
    const f = TestBed.createComponent(BuludChat);
    await f.whenStable();
    expect(f.nativeElement.textContent).toContain('No messages');
    f.componentRef.setInput('loading', true);
    await f.whenStable();
    expect(
      f.nativeElement.querySelector('[role=log]').getAttribute('aria-busy'),
    ).toBe('true');
    f.componentRef.setInput('loading', false);
    f.componentRef.setInput('error', 'Offline');
    await f.whenStable();
    expect(f.nativeElement.querySelector('[role=alert]').textContent).toContain(
      'Offline',
    );
    f.componentRef.setInput('error', '');
    f.componentRef.setInput('draft', 'Hello');
    await f.whenStable();
    let count = 0;
    f.componentInstance.send.subscribe(() => count++);
    const textarea = f.nativeElement.querySelector('textarea');
    textarea.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'Enter',
        ctrlKey: true,
        isComposing: true,
      }),
    );
    expect(count).toBe(0);
    textarea.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Enter', ctrlKey: true }),
    );
    expect(count).toBe(1);
    f.destroy();
  });
  it('pins new messages only while the reader is at the bottom', async () => {
    const f = TestBed.createComponent(BuludChat);
    const messages = Array.from({ length: 30 }, (_, i) => ({
      id: String(i),
      author: 'Support',
      text: 'A message',
      outgoing: false,
    }));
    f.componentRef.setInput('messages', messages);
    await f.whenStable();
    const log = f.nativeElement.querySelector('.transcript') as HTMLElement;
    expect(log.scrollTop).toBeGreaterThan(0);
    log.scrollTop = 0;
    log.dispatchEvent(new Event('scroll'));
    f.componentRef.setInput('messages', [
      ...messages,
      { id: '31', author: 'Support', text: 'New message', outgoing: false },
    ]);
    await f.whenStable();
    expect(log.scrollTop).toBe(0);
    expect(f.nativeElement.textContent).toContain('Latest messages');
    f.destroy();
  });
});
