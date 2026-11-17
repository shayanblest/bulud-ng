import {
  ViewEncapsulation,
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';

import {
  Injectable,
  Type,
  ViewContainerRef,
  ComponentRef,
} from '@angular/core';

import { BULUD_CHART_ENGINE_CONFIG } from 'bulud-ng';
export { BULUD_CHART_ENGINE_CONFIG } from 'bulud-ng';
export type { BuludChartEngineConfig } from 'bulud-ng';
@Injectable({ providedIn: 'root' })
export class BuludChartEngine {
  private readonly config = inject(BULUD_CHART_ENGINE_CONFIG, {
    optional: true,
  });
  readonly component = signal<Type<unknown> | null>(null);
  readonly error = signal<unknown>(null);
  private requested = false;
  load(): void {
    if (this.requested) return;
    this.requested = true;
    if (!this.config) {
      this.error.set(new Error('Provide a chart engine loader'));
      return;
    }
    try {
      void this.config.load().then(
        (type) => this.component.set(type),
        (error) => this.error.set(error),
      );
    } catch (error) {
      this.error.set(error);
    }
  }
}
@Component({
  selector: 'bulud-chart-host',
  encapsulation: ViewEncapsulation.None,
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './chart-engine.css',
  template: `@if (options() && !engine.component()) {
      <p role="status">{{ engine.error() ? errorLabel() : loadingLabel() }}</p>
    }
    <ng-container #outlet />`,
})
export class BuludChartHost {
  readonly options = input<Readonly<Record<string, unknown>> | null>();
  protected readonly engine = inject(BuludChartEngine);
  readonly loadingLabel = input('Loading chart');
  readonly errorLabel = input('Chart could not be loaded');
  private readonly outlet = viewChild('outlet', { read: ViewContainerRef });
  private chart?: ComponentRef<unknown>;
  constructor() {
    effect(() => {
      const options = this.options(),
        outlet = this.outlet(),
        type = this.engine.component();
      if (!options) {
        outlet?.clear();
        this.chart = undefined;
        return;
      }
      if (!type) {
        this.engine.load();
        return;
      }
      if (!outlet) return;
      if (!this.chart) this.chart = outlet.createComponent(type);
      for (const [key, value] of Object.entries(options))
        this.chart.setInput(key, value);
    });
  }
}
