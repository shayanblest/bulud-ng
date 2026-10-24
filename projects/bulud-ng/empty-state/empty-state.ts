import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
} from '@angular/core';
import {
  BULUD_SHARED_UI_CONFIG,
  buludSharedUiStyles,
  BuludSharedUiTheme,
} from 'bulud-ng';
@Component({
  selector: 'bulud-empty-state',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[style]': 'styles()' },
  template: `<section [attr.aria-label]="title()">
    <div class="icon" aria-hidden="true">
      <svg viewBox="0 0 64 64" focusable="false">
        <path d="M12 9h30l10 10v36H12Zm30 0v12h10M22 33h20M22 42h13" /></svg
      ><ng-content select="[buludEmptyIcon]" />
    </div>
    <h3>{{ title() }}</h3>
    @if (description()) {
      <p>{{ description() }}</p>
    }
    <div class="actions"><ng-content /></div>
  </section>`,
  styles: `
    :host {
      display: block;
      color: var(--bulud-empty-state-foreground, var(--bulud-color-on-surface));
    }
    section {
      text-align: center;
      padding: var(--bulud-empty-state-padding, 32px);
      border-radius: var(
        --bulud-empty-state-radius,
        var(--bulud-radius-control, 8px)
      );
      background: var(
        --bulud-empty-state-background,
        var(--bulud-color-surface)
      );
    }
    .icon {
      color: var(--bulud-empty-state-accent, var(--bulud-color-primary));
    }
    svg {
      inline-size: 64px;
      block-size: 64px;
      stroke: currentColor;
      stroke-width: 1.5;
      fill: none;
    }
    .icon:has([buludEmptyIcon]) > svg {
      display: none;
    }
    h3 {
      font-size: inherit;
      margin-block: 16px 8px;
    }
    p {
      color: var(--bulud-empty-state-muted, var(--bulud-color-muted));
      margin-block: 8px;
    }
    .actions {
      display: flex;
      justify-content: center;
      gap: var(--bulud-empty-state-gap, 12px);
      flex-wrap: wrap;
    }
  `,
})
export class BuludEmptyState {
  private readonly config = inject(BULUD_SHARED_UI_CONFIG);
  readonly title = input.required<string>();
  readonly description = input('');
  readonly theme = input<Partial<BuludSharedUiTheme>>();
  protected readonly styles = computed(() =>
    buludSharedUiStyles('empty-state', this.config, this.theme()),
  );
}
