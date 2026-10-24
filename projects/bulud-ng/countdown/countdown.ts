import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DOCUMENT,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import {
  BULUD_SHARED_UI_CONFIG,
  buludSharedUiStyles,
  BuludSharedUiTheme,
} from 'bulud-ng';
@Component({
  selector: 'bulud-countdown',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './countdown.scss',
  host: { '[style]': 'styles()' },
  template: `<span
    role="timer"
    [attr.aria-label]="label()"
    aria-live="off"
    dir="ltr"
    >{{ display() }}</span
  >`,
})
export class BuludCountdown {
  private readonly config = inject(BULUD_SHARED_UI_CONFIG);
  private readonly document = inject(DOCUMENT);
  readonly label = input.required<string>();
  readonly deadline = input<number | null>(null);
  readonly theme = input<Partial<BuludSharedUiTheme>>();
  readonly expired = output<void>();
  private readonly seconds = signal(0);
  protected readonly styles = computed(() =>
    buludSharedUiStyles('countdown', this.config, this.theme()),
  );
  protected readonly display = computed(() => {
    const s = this.seconds();
    return [Math.floor(s / 3600), Math.floor((s % 3600) / 60), s % 60]
      .map((n) => String(n).padStart(2, '0'))
      .join(':');
  });
  constructor() {
    effect((onCleanup) => {
      const deadline = this.deadline(),
        win = this.document.defaultView;
      if (deadline === null || !Number.isFinite(deadline) || !win) {
        this.seconds.set(0);
        return;
      }
      let emitted = false;
      let interval: number | undefined;
      const tick = () => {
        const seconds = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
        this.seconds.set(seconds);
        if (seconds === 0 && !emitted) {
          emitted = true;
          if (interval !== undefined) win.clearInterval(interval);
          this.expired.emit();
        }
      };
      tick();
      if (!emitted) interval = win.setInterval(tick, 1000);
      onCleanup(() => {
        if (interval !== undefined) win.clearInterval(interval);
      });
    });
  }
}
