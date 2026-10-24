import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  inject,
  input,
  Renderer2,
  signal,
} from '@angular/core';
import {
  BULUD_SHARED_UI_CONFIG,
  buludSharedUiStyles,
  BuludSharedUiTheme,
} from 'bulud-ng';
let nextId = 0;
/** Project one focusable trigger. Tooltip content is descriptive text, never interactive controls. */
@Component({
  selector: 'bulud-tooltip',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './tooltip.scss',
  host: {
    '[style]': 'styles()',
    '(pointerenter)': 'enter()',
    '(pointerleave)': 'leave()',
    '(focusin)': 'focus($event)',
    '(focusout)': 'blur($event)',
    '(keydown.escape)': 'dismiss()',
  },
  template: `<ng-content />
    @if (open()) {
      <span class="surface tip" role="tooltip" [id]="id">{{ text() }}</span>
    }`,
})
export class BuludTooltip {
  private readonly config = inject(BULUD_SHARED_UI_CONFIG);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly renderer = inject(Renderer2);
  readonly text = input.required<string>();
  readonly theme = input<Partial<BuludSharedUiTheme>>();
  protected readonly id = `bulud-tooltip-${nextId++}`;
  protected readonly open = signal(false);
  private hovered = false;
  private trigger: HTMLElement | null = null;
  protected readonly styles = computed(() =>
    buludSharedUiStyles('tooltip', this.config, this.theme()),
  );
  constructor() {
    inject(DestroyRef).onDestroy(() => this.removeDescription());
  }
  protected enter(): void {
    this.hovered = true;
    this.open.set(true);
  }
  protected leave(): void {
    this.hovered = false;
    if (
      !this.host.nativeElement.contains(
        this.host.nativeElement.ownerDocument.activeElement,
      )
    )
      this.dismiss();
  }
  protected focus(event: FocusEvent): void {
    this.removeDescription();
    const target = event.target;
    if (target instanceof HTMLElement) {
      this.trigger = target;
      const ids = new Set(
        (target.getAttribute('aria-describedby') ?? '')
          .split(/\s+/)
          .filter(Boolean),
      );
      ids.add(this.id);
      this.renderer.setAttribute(
        target,
        'aria-describedby',
        [...ids].join(' '),
      );
    }
    this.open.set(true);
  }
  protected blur(event: FocusEvent): void {
    if (
      event.relatedTarget instanceof Node &&
      this.host.nativeElement.contains(event.relatedTarget)
    )
      return;
    this.removeDescription();
    if (!this.hovered) this.open.set(false);
  }
  protected dismiss(): void {
    this.open.set(false);
    this.removeDescription();
  }
  private removeDescription(): void {
    if (!this.trigger) return;
    const ids = (this.trigger.getAttribute('aria-describedby') ?? '')
      .split(/\s+/)
      .filter((id) => id && id !== this.id);
    if (ids.length)
      this.renderer.setAttribute(
        this.trigger,
        'aria-describedby',
        ids.join(' '),
      );
    else this.renderer.removeAttribute(this.trigger, 'aria-describedby');
    this.trigger = null;
  }
}
