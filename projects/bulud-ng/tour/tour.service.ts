import {
  Inject,
  Injectable,
  Optional,
  computed,
  signal,
  OnDestroy,
} from '@angular/core';
import { BehaviorSubject, Subject, distinctUntilChanged, map } from 'rxjs';
import {
  BULUD_TOUR_CONFIG,
  BuludTourConfig,
  BuludTourStep,
} from './tour.types';
interface TourState {
  readonly steps: readonly BuludTourStep[];
  readonly index: number;
  readonly active: boolean;
}
const EMPTY: TourState = { steps: [], index: -1, active: false };
/** Generic state only. Step lists, routing, permissions and signup workflows belong to the project. */
@Injectable({ providedIn: 'root' })
export class BuludTour implements OnDestroy {
  private readonly state = signal<TourState>(EMPTY);
  private readonly changes = new BehaviorSubject<TourState>(EMPTY);
  private readonly ended = new Subject<void>();
  private timer?: ReturnType<typeof setTimeout>;
  readonly active = computed(() => this.state().active);
  readonly currentIndex = computed(() => this.state().index);
  readonly total = computed(() => this.state().steps.length);
  readonly step = computed(
    () => this.state().steps[this.state().index] ?? null,
  );
  readonly active$ = this.changes.pipe(
    map((s) => s.active),
    distinctUntilChanged(),
  );
  readonly currentIndex$ = this.changes.pipe(
    map((s) => s.index),
    distinctUntilChanged(),
  );
  readonly total$ = this.changes.pipe(
    map((s) => s.steps.length),
    distinctUntilChanged(),
  );
  readonly step$ = this.changes.pipe(
    map((s) => s.steps[s.index] ?? null),
    distinctUntilChanged(),
  );
  readonly tourEnded$ = this.ended.asObservable();
  readonly config: BuludTourConfig;
  /* eslint-disable @angular-eslint/prefer-inject -- Public construction also supports project-owned Tour subclasses. */
  constructor(
    @Optional()
    @Inject(BULUD_TOUR_CONFIG)
    config: BuludTourConfig | null = null,
  ) {
    this.config = config ?? {};
  }
  /* eslint-enable @angular-eslint/prefer-inject */
  private update(state: TourState): void {
    this.state.set(state);
    this.changes.next(state);
  }
  start(steps: readonly BuludTourStep[]): void {
    const ids = new Set<string>();
    if (
      !Array.isArray(steps) ||
      steps.some(
        (s) =>
          !s ||
          typeof s.id !== 'string' ||
          !s.id ||
          ids.has(s.id) ||
          !ids.add(s.id) ||
          typeof s.targetId !== 'string' ||
          !s.targetId,
      )
    )
      throw new Error(
        'Tour steps require unique non-empty IDs and target IDs.',
      );
    this.clearTimer();
    const snapshot = steps.map((s) => ({ ...s }));
    this.update({ steps: [], index: -1, active: true });
    const delay = this.config.startDelay ?? 400;
    const begin = () => {
      this.timer = undefined;
      if (!snapshot.length) {
        this.end();
        return;
      }
      this.update({ steps: snapshot, index: 0, active: true });
    };
    if (Number.isFinite(delay) && delay > 0)
      this.timer = setTimeout(begin, delay);
    else begin();
  }
  next(): void {
    const state = this.state();
    if (!state.active) return;
    if (state.index + 1 >= state.steps.length) {
      this.end();
      return;
    }
    this.update({ ...state, index: state.index + 1 });
  }
  previous(): void {
    const state = this.state();
    if (state.active && state.index > 0)
      this.update({ ...state, index: state.index - 1 });
  }
  end(): void {
    this.clearTimer();
    const active = this.active();
    this.update(EMPTY);
    if (active) this.ended.next();
  }
  private clearTimer(): void {
    if (this.timer !== undefined) {
      clearTimeout(this.timer);
      this.timer = undefined;
    }
  }
  ngOnDestroy(): void {
    this.end();
    this.changes.complete();
    this.ended.complete();
  }
}
