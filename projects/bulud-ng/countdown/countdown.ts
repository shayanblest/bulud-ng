import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DOCUMENT,
  effect,
  untracked,
  DestroyRef,
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
  styleUrl: './countdown.css',
  host: { '[style]': 'styles()' },
  template: `@if(format()==='mm:ss') {<div class="bulud-countdown" dir="ltr" [id]="id()" role="timer" aria-live="off" [attr.aria-label]="label()"><ng-content select="[buludCountdownIcon]"/><div class="bulud-countdown-digits"><span>{{minutes()}}</span><span class="bulud-countdown-separator">:</span><span>{{secondDigits()}}</span></div></div>}@else{<span role="timer" [attr.aria-label]="label()" aria-live="off" dir="ltr">{{display()}}</span>}`,

})
export class BuludCountdown {
  private readonly config = inject(BULUD_SHARED_UI_CONFIG);
  private readonly document = inject(DOCUMENT);
  readonly label = input.required<string>();
  /** Declarative deadlines are milliseconds; start() accepts Unix seconds. */
  readonly deadline = input<number | null>(null);
  readonly format=input<'hh:mm:ss'|'mm:ss'>('hh:mm:ss');
  readonly id=input('timer_countdown_container');
  readonly theme = input<Partial<BuludSharedUiTheme>>();
  readonly expired = output<void>();
  private readonly seconds = signal(0);
  private interval:number|undefined;
  protected readonly minutes=computed(()=>String(Math.floor((this.seconds()%3600)/60)).padStart(2,'0'));
  protected readonly secondDigits=computed(()=>String(this.seconds()%60).padStart(2,'0'));
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
    effect(()=>{const deadline=this.deadline();this.stop();if(deadline===null||!Number.isFinite(deadline)){this.seconds.set(0);return;}untracked(()=>this.run(deadline,false));});
    inject(DestroyRef).onDestroy(()=>this.stop());
  }
  /** Imperative API uses Unix seconds, matching consuming-project OTP timers. */
  start(deadline:number):void {this.stop();if(!Number.isFinite(deadline)){this.seconds.set(0);return;}this.run(deadline*1000,true);}
  stop():void {if(this.interval!==undefined)this.document.defaultView?.clearInterval(this.interval);this.interval=undefined;}
  private run(deadline:number,imperative:boolean):void {
    const win=this.document.defaultView;
    const update=()=>this.seconds.set(Math.max(0,imperative?deadline/1000-Math.floor(Date.now()/1000):Math.ceil((deadline-Date.now())/1000)));
    update();
    if(!imperative&&this.seconds()===0){this.expired.emit();return;}
    if(!win)return;
    this.interval=win.setInterval(()=>{update();if(this.seconds()===0){this.stop();this.expired.emit();}},1000);
  }
}
