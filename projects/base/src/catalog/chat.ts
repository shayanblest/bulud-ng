import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
} from '@angular/core';
import { BuludChat, BuludChatMessage, BuludChatLabels } from 'bulud-ng/chat';
import { BuludCheckbox } from 'bulud-ng/checkbox';
import { FeatureFrame } from './frame';
import { BasePreferences } from '../preferences';
@Component({
  imports: [FeatureFrame, BuludChat, BuludCheckbox],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<feature-frame
    title="Chat · گفت‌وگو"
    [code]="source"
    description="گفت‌وگوی دوطرفه با ظاهر انگور · Two-sided controlled conversation"
    entry="bulud-ng/chat"
    api="messages, [(draft)], maxLength, disabled/loading/sending/error, labels, theme; send/retry/attachmentClick outputs. The consumer owns HTTP/WebSocket transport and delivery status. Ctrl/Command+Enter sends; Enter inserts a newline. Text is escaped, never injected as HTML."
    ><div class="toolbar">
      <bulud-checkbox [(checked)]="loading">Loading</bulud-checkbox
      ><bulud-checkbox [(checked)]="disabled">Disabled</bulud-checkbox
      ><bulud-checkbox [(checked)]="empty">Empty</bulud-checkbox
      ><bulud-checkbox [(checked)]="failed">Fail next message</bulud-checkbox
      ><bulud-checkbox [(checked)]="custom">Custom theme</bulud-checkbox>
    </div>
    <p>
      {{
        p.text(
          'نمونه محلی است؛ برای چت آنلاین سرویس خود را به خروجی ارسال وصل کنید.',
          'Local interaction example; connect the send output to your service for online chat.'
        )
      }}
    </p>
    <bulud-chat
      [messages]="empty() ? [] : messages()"
      [(draft)]="draft"
      [language]="p.language()"
      [labels]="p.language() === 'fa' ? fa : undefined"
      [loading]="loading()"
      [disabled]="disabled()"
      [maxLength]="500"
      [theme]="custom() ? { accent: '#8040c0' } : undefined"
      (send)="send($event)"
      (retry)="retry($event)"
      (attachmentClick)="attachment.set($event.attachment.name)"
    />
    @if (attachment()) {
      <p role="status">Attachment requested: {{ attachment() }}</p>
    }
  </feature-frame>`,
})
export class PageChat {
  readonly p = inject(BasePreferences);
  readonly loading = signal(false);
  readonly disabled = signal(false);
  readonly empty = signal(false);
  readonly failed = signal(false);
  readonly custom = signal(false);
  readonly attachment = signal('');
  readonly draft = signal('');
  private sequence = 3;
  readonly fa: Partial<BuludChatLabels> = {
    latest: 'آخرین پیام‌ها',
    title: 'گفت‌وگو',
    composer: 'پیام',
    placeholder: 'متن پیام خود را بنویسید…',
    send: 'ارسال پیام',
    loading: 'در حال بارگذاری پیام‌ها…',
    empty: 'هنوز پیامی وجود ندارد',
    retry: 'ارسال مجدد',
    sending: 'در حال ارسال',
    sent: 'ارسال شد',
    read: 'خوانده شد',
    failed: 'ارسال ناموفق',
    invalid: 'پیام را در محدوده مجاز وارد کنید',
  };
  readonly messages = signal<readonly BuludChatMessage[]>([
    {
      id: '1',
      author: 'پشتیبانی / Support',
      text: 'سلام، چطور می‌توانیم کمک کنیم؟\nHow can we help you?',
      outgoing: false,
      timestamp: 1792540800,
    },
    {
      id: '2',
      author: 'شما / You',
      text: 'می‌خواهم درباره امکانات کتابخانه بیشتر بدانم.',
      outgoing: true,
      status: 'read',
      timestamp: 1792540860,
    },
    {
      id: '3',
      author: 'پشتیبانی / Support',
      text: 'راهنمای استفاده را اینجا می‌توانید ببینید.',
      outgoing: false,
      attachments: [{ id: 'guide', name: 'guide.pdf' }],
      timestamp: 1792540920,
    },
  ]);
  send(text: string): void {
    this.empty.set(false);
    const fail = this.failed();
    this.messages.update((items) => [
      ...items,
      {
        id: String(++this.sequence),
        author: this.p.text('شما', 'You'),
        text,
        outgoing: true,
        status: fail ? 'failed' : 'sent',
        timestamp: Math.floor(Date.now() / 1000),
      },
    ]);
    this.draft.set('');
    if (!fail)
      this.messages.update((items) => [
        ...items,
        {
          id: String(++this.sequence),
          author: 'Support',
          text: this.p.text(
            'پیام نمونه دریافت شد.',
            'Example message received.',
          ),
          outgoing: false,
          timestamp: Math.floor(Date.now() / 1000),
        },
      ]);
  }
  retry(id: string): void {
    this.messages.update((items) =>
      items.map((item) =>
        item.id === id ? { ...item, status: 'sent' } : item,
      ),
    );
  }
  readonly source = `import {BuludChat,BuludChatMessage} from 'bulud-ng/chat';
// Standalone component imports: [BuludChat]
// messages: readonly BuludChatMessage[]; draft = signal('');
<bulud-chat [messages]="messages" [(draft)]="draft"
  (send)="sendToYourService($event)" (retry)="retryById($event)" />
// In sendToYourService, append/acknowledge messages with a fresh array.
// Clear draft after accepting a message; set sending while awaiting transport.`;
}
