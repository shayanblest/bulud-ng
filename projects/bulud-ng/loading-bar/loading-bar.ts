import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  Injectable,
  input,
  signal,
} from '@angular/core';
import {
  BULUD_SHARED_UI_CONFIG,
  buludSharedUiStyles,
  BuludSharedUiTheme,
} from 'bulud-ng';
@Injectable({ providedIn: 'root' })
export class BuludLoadingService {
  private nextId = 0;
  private readonly tasks = signal<ReadonlyMap<number, number | null>>(
    new Map(),
  );
  readonly active = computed(() => this.tasks().size > 0);
  readonly progress = computed(() => {
    const values = [...this.tasks().values()];
    return values.length && values.every((n): n is number => n !== null)
      ? values.reduce((a, b) => a + b, 0) / values.length
      : null;
  });
  start(progress: number | null = null): number {
    const id = ++this.nextId;
    this.tasks.update((tasks) =>
      new Map(tasks).set(id, this.normalize(progress)),
    );
    return id;
  }
  update(id: number, progress: number | null): void {
    this.tasks.update((tasks) =>
      tasks.has(id) ? new Map(tasks).set(id, this.normalize(progress)) : tasks,
    );
  }
  finish(id: number): void {
    this.tasks.update((tasks) => {
      if (!tasks.has(id)) return tasks;
      const next = new Map(tasks);
      next.delete(id);
      return next;
    });
  }
  async during<T>(operation: () => Promise<T>): Promise<T> {
    const id = this.start();
    try {
      return await operation();
    } finally {
      this.finish(id);
    }
  }
  private normalize(value: number | null): number | null {
    return typeof value === 'number' && Number.isFinite(value)
      ? Math.min(100, Math.max(0, value))
      : null;
  }
}
@Component({
  selector: 'bulud-loading-bar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './loading-bar.scss',
  host: {
    '[style]': 'styles()',
    '[attr.role]': 'visible()?"progressbar":null',
    '[attr.aria-hidden]': 'visible()?null:"true"',
    '[attr.aria-label]': 'label()',
    '[attr.aria-valuemin]': '0',
    '[attr.aria-valuemax]': '100',
    '[attr.aria-valuenow]': 'percentage()',
    '[class.active]': 'visible()',
    '[class.indeterminate]': 'percentage()===null',
  },
  template: `<div class="line" [style.width.%]="percentage() ?? 30"></div>`,
})
export class BuludLoadingBar {
  private readonly service = inject(BuludLoadingService);
  private readonly config = inject(BULUD_SHARED_UI_CONFIG);
  readonly active = input<boolean | undefined>();
  readonly value = input<number | null | undefined>();
  readonly label = input('Page loading');
  readonly theme = input<Partial<BuludSharedUiTheme>>();
  protected readonly visible = computed(
    () => this.active() ?? this.service.active(),
  );
  protected readonly percentage = computed(() => {
    const v =
      this.value() === undefined ? this.service.progress() : this.value();
    return typeof v === 'number' && Number.isFinite(v)
      ? Math.max(0, Math.min(100, v))
      : null;
  });
  protected readonly styles = computed(() =>
    buludSharedUiStyles('loading-bar', this.config, this.theme()),
  );
}
