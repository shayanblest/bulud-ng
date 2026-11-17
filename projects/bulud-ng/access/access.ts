import {BuludAccessRule,BULUD_ACCESS_CONFIG,buludMatchesAccess} from './access-policy';
import {
  Directive,
  effect,
  inject,
  model,
  signal,
  TemplateRef,
  ViewContainerRef,
} from '@angular/core';
/** Structural rendering only. Authentication and permission policy are supplied
 * by the consuming application, never read from browser storage by the library. */
@Directive({ selector: '[buludAccess]', standalone: true })
export class BuludAccess {
  readonly allowed = model<boolean|BuludAccessRule>(false, { alias: 'buludAccess' });
  private readonly revision = signal(0);
  private readonly config=inject(BULUD_ACCESS_CONFIG);
  private readonly template = inject<TemplateRef<unknown>>(TemplateRef);
  private readonly container = inject(ViewContainerRef);
  constructor() {
    effect(() => {
      const rule=this.allowed();this.config.revision?.();
      const allowed=typeof rule==='boolean'?rule:this.config.enforce?.()===false||buludMatchesAccess(rule,this.config.scopes?.()??[],this.config.caseSensitiveScopes);
      this.revision();
      this.container.clear();
      if (allowed) this.container.createEmbeddedView(this.template);
    });
  }
  /** Re-evaluating application policy may deliberately recreate the content. */
  render(allowed: boolean): void {
    const same = this.allowed() === allowed;
    this.allowed.set(allowed);
    if (same) this.revision.update((value) => value + 1);
  }
}
