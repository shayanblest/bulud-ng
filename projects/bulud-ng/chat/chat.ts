import {
  afterRenderEffect,
  booleanAttribute,
  ElementRef,
  viewChild,
  Component,
  ChangeDetectionStrategy,
  computed,
  inject,
  input,
  model,
  output,
  signal,
} from '@angular/core';
import {
  BULUD_SHARED_UI_CONFIG,
  buludSharedUiStyles,
  BuludSharedUiTheme,
} from 'bulud-ng';
import { BuludAvatar } from 'bulud-ng/avatar';
import { BuludButton } from 'bulud-ng/button';
import { BuludTextarea } from 'bulud-ng/textarea';
import { BuludDateTimePipe } from 'bulud-ng/utilities';
export interface BuludChatAttachment {
  readonly id: string;
  readonly name: string;
}
export interface BuludChatMessage {
  readonly id: string;
  readonly author: string;
  readonly text: string;
  readonly outgoing: boolean;
  readonly timestamp?: number;
  readonly status?: 'sending' | 'sent' | 'read' | 'failed';
  readonly attachments?: readonly BuludChatAttachment[];
}
export interface BuludChatLabels {
  readonly title: string;
  readonly composer: string;
  readonly placeholder: string;
  readonly send: string;
  readonly loading: string;
  readonly empty: string;
  readonly retry: string;
  readonly sending: string;
  readonly sent: string;
  readonly read: string;
  readonly failed: string;
  readonly invalid: string;
  readonly latest: string;
}
const LABELS: BuludChatLabels = {
  title: 'Conversation',
  composer: 'Message',
  placeholder: 'Write your message…',
  send: 'Send message',
  loading: 'Loading messages…',
  empty: 'No messages yet',
  retry: 'Retry message',
  sending: 'Sending',
  sent: 'Sent',
  read: 'Read',
  failed: 'Failed to send',
  latest: 'Latest messages',
  invalid: 'Enter a message within the character limit',
};
/** Controlled transcript: consumer owns transport, messages and delivery acknowledgements. Unix timestamps use seconds. */
@Component({
  selector: 'bulud-chat',
  imports: [BuludAvatar, BuludButton, BuludTextarea, BuludDateTimePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './chat.scss',
  host: { '[style]': 'styles()' },
  template: `<section [attr.aria-label]="text().title">
    <div
      #transcript
      class="transcript"
      (scroll)="scrolled($event)"
      role="log"
      aria-live="polite"
      aria-relevant="additions text"
      [attr.aria-label]="text().title"
      [attr.aria-busy]="loading()"
      tabindex="0"
    >
      @if (loading()) {
        <p role="status">{{ text().loading }}</p>
      } @else if (error()) {
        <p role="alert">{{ error() }}</p>
      } @else {
        @for (message of messages(); track message.id) {
          <article
            class="message"
            [class.outgoing]="message.outgoing"
            [attr.data-message-id]="message.id"
          >
            <bulud-avatar [name]="message.author" />
            <div class="bubble">
              <strong>{{ message.author }}</strong>
              <p class="body" dir="auto">{{ message.text }}</p>
              @if (message.attachments?.length) {
                <ul class="attachments">
                  @for (file of message.attachments; track file.id) {
                    <li>
                      <button
                        type="button"
                        (click)="
                          attachmentClick.emit({
                            messageId: message.id,
                            attachment: file,
                          })
                        "
                      >
                        {{ file.name }}
                      </button>
                    </li>
                  }
                </ul>
              }
              <footer>
                @if (message.timestamp !== undefined) {
                  <time [attr.datetime]="iso(message.timestamp)">{{
                    message.timestamp
                      | buludDateTime: true : language() : timeZone()
                  }}</time>
                }
                @if (message.status) {
                  <span
                    class="status"
                    [class.failed]="message.status === 'failed'"
                    >{{ text()[message.status] }}</span
                  >
                }
                @if (message.status === 'failed') {
                  <button
                    type="button"
                    [disabled]="disabled() || sending()"
                    (click)="retry.emit(message.id)"
                  >
                    {{ text().retry }}
                  </button>
                }
              </footer>
            </div>
          </article>
        } @empty {
          <p role="status">{{ text().empty }}</p>
        }
      }
    </div>
    @if (!pinned()) {
      <button type="button" (click)="pinned.set(true)">
        {{ text().latest }}
      </button>
    }
    <form (submit)="submit($event)" class="composer">
      <label [for]="composerId">{{ text().composer }}</label
      ><textarea
        buludTextarea
        [id]="composerId"
        rows="3"
        [value]="draft()"
        (input)="edit($event)"
        (keydown)="key($event)"
        [placeholder]="text().placeholder"
        [disabled]="disabled() || sending() || loading()"
        [attr.maxlength]="limit()"
        [attr.aria-invalid]="(attempted() && !valid()) || null"
        [attr.aria-describedby]="composerId + '-hint'"
      ></textarea>
      <div class="compose-actions">
        <small [id]="composerId + '-hint'"
          >{{ draft().length }} / {{ limit() }}
          @if (attempted() && !valid()) {
            · {{ text().invalid }}
          }</small
        ><bulud-button
          type="submit"
          [loading]="sending()"
          [disabled]="disabled() || loading() || !valid()"
          >{{ text().send }}</bulud-button
        >
      </div>
    </form>
    <ng-content />
  </section>`,
})
export class BuludChat {
  private readonly transcript =
    viewChild<ElementRef<HTMLElement>>('transcript');
  protected readonly pinned = signal(true);
  constructor() {
    afterRenderEffect(() => {
      this.messages();
      const el = this.transcript()?.nativeElement;
      if (el && this.pinned()) el.scrollTop = el.scrollHeight;
    });
  }
  protected scrolled(event: Event): void {
    const el = event.target as HTMLElement;
    this.pinned.set(el.scrollHeight - el.scrollTop - el.clientHeight <= 48);
  }
  private static nextId = 0;
  protected readonly composerId = `bulud-chat-${BuludChat.nextId++}`;
  private readonly config = inject(BULUD_SHARED_UI_CONFIG);
  readonly messages = input<readonly BuludChatMessage[]>([]);
  readonly draft = model('');
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly loading = input(false, { transform: booleanAttribute });
  readonly sending = input(false, { transform: booleanAttribute });
  readonly error = input('');
  readonly maxLength = input(4000);
  readonly language = input<'fa' | 'en'>('en');
  readonly timeZone = input<string>();
  readonly labels = input<Partial<BuludChatLabels>>();
  readonly theme = input<Partial<BuludSharedUiTheme>>();
  /** Does not clear the draft: consumer clears it only after accepting/acknowledging the send. */
  readonly send = output<string>();
  readonly retry = output<string>();
  readonly attachmentClick = output<{
    messageId: string;
    attachment: BuludChatAttachment;
  }>();
  protected readonly attempted = signal(false);
  protected readonly limit = computed(() =>
    Number.isSafeInteger(this.maxLength()) && this.maxLength() > 0
      ? this.maxLength()
      : 4000,
  );
  protected readonly valid = computed(
    () => this.draft().trim().length > 0 && this.draft().length <= this.limit(),
  );
  protected readonly text = computed(() => ({ ...LABELS, ...this.labels() }));
  protected readonly styles = computed(() =>
    buludSharedUiStyles('chat', this.config, this.theme()),
  );
  protected iso(seconds: number): string | null {
    const date = new Date(seconds * 1000);
    return Number.isFinite(date.getTime()) ? date.toISOString() : null;
  }
  protected edit(event: Event): void {
    this.draft.set((event.target as HTMLTextAreaElement).value);
  }
  protected key(event: KeyboardEvent): void {
    if (
      event.key === 'Enter' &&
      (event.ctrlKey || event.metaKey) &&
      !event.isComposing
    ) {
      event.preventDefault();
      this.submit();
    }
  }
  protected submit(event?: Event): void {
    event?.preventDefault();
    this.attempted.set(true);
    if (!this.valid() || this.disabled() || this.sending() || this.loading())
      return;
    this.pinned.set(true);
    this.send.emit(this.draft().trim());
  }
}
