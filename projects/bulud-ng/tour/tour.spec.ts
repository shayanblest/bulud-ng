import {
  Component,
  signal,
  provideZonelessChangeDetection,
} from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { BuludTour } from './tour.service';
import { BuludTourTooltip } from './tour-tooltip';
import { BuludTourTarget } from './tour-target';
import {
  BULUD_TOUR_CONFIG,
  BuludTourConfig,
  BuludTourStep,
} from './tour.types';
import { BULUD_RUNTIME_CONFIG } from 'bulud-ng/runtime';
const steps: readonly BuludTourStep[] = [
  { id: 'first', targetId: 'tour-first', description: 'First' },
  { id: 'second', targetId: 'tour-second', description: 'Second' },
];
describe('Reusable tour', () => {
  afterEach(() => TestBed.resetTestingModule());
  it('walks forward/back once, mirrors state to observable consumers, ignores input array changes and ends once', () => {
    const tour = new BuludTour({ startDelay: 0 }),
      ended = jasmine.createSpy(),
      seen: (string | undefined)[] = [];
    tour.tourEnded$.subscribe(ended);
    tour.step$.subscribe((step) => seen.push(step?.id));
    const mutable = [...steps];
    tour.start(mutable);
    mutable.length = 0;
    expect(tour.active()).toBeTrue();
    expect(tour.total()).toBe(2);
    expect(tour.step()?.id).toBe('first');
    tour.previous();
    tour.next();
    expect(tour.currentIndex()).toBe(1);
    tour.previous();
    tour.next();
    tour.next();
    tour.next();
    expect(tour.active()).toBeFalse();
    expect(tour.total()).toBe(0);
    expect(ended).toHaveBeenCalledTimes(1);
    expect(seen).toEqual([
      undefined,
      'first',
      'second',
      'first',
      'second',
      undefined,
    ]);
  });
  it('cancels and replaces delayed starts, including on destroy', () => {
    jasmine.clock().install();
    try {
      const tour = new BuludTour({ startDelay: 400 });
      tour.start(steps);
      tour.end();
      jasmine.clock().tick(500);
      expect(tour.active()).toBeFalse();
      tour.start(steps);
      tour.start([steps[1]]);
      jasmine.clock().tick(400);
      expect(tour.total()).toBe(1);
      expect(tour.step()?.id).toBe('second');
      tour.start(steps);
      tour.ngOnDestroy();
      jasmine.clock().tick(500);
      expect(tour.active()).toBeFalse();
    } finally {
      jasmine.clock().uninstall();
    }
  });
  it('validates unique IDs without changing a running tour and handles empty tours', () => {
    const tour = new BuludTour({ startDelay: 0 });
    tour.start(steps);
    expect(() => tour.start([steps[0], steps[0]])).toThrow();
    expect(tour.total()).toBe(2);
    tour.start([]);
    expect(tour.active()).toBeFalse();
  });
  it('uses an optional typed global configuration', () => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        {
          provide: BULUD_TOUR_CONFIG,
          useValue: { startDelay: 0 } satisfies BuludTourConfig,
        },
      ],
    });
    const tour = TestBed.inject(BuludTour);
    tour.start(steps);
    expect(tour.step()?.id).toBe('first');
  });
  it('target IDs react to project keys and prefixes', async () => {
    @Component({
      imports: [BuludTourTarget],
      template: '<div [buludTourTarget]="key()" [prefix]="prefix()"></div>',
    })
    class Host {
      readonly key = signal('one');
      readonly prefix = signal('tour-');
    }
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    const f = TestBed.createComponent(Host);
    await f.whenStable();
    expect(f.nativeElement.querySelector('div').id).toBe('tour-one');
    f.componentInstance.key.set('two');
    f.componentInstance.prefix.set('help-');
    await f.whenStable();
    expect(f.nativeElement.querySelector('div').id).toBe('help-two');
  });
  it('translates reactively, emits one event per action and keeps project theme precedence', async () => {
    const language = signal('en');
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        {
          provide: BULUD_RUNTIME_CONFIG,
          useValue: {
            language,
            translate: (key: string) => language() + ':' + key,
          },
        },
        {
          provide: BULUD_TOUR_CONFIG,
          useValue: {
            theme: { padding: '12px', background: 'red' },
            defaults: { theme: { background: 'green' } },
          },
        },
      ],
    });
    const f = TestBed.createComponent(BuludTourTooltip);
    f.componentRef.setInput('step', {
      ...steps[0],
      titleKey: 'title',
      descriptionKey: 'description',
      nextLabelKey: 'next',
      previousLabel: 'Back',
    });
    f.componentRef.setInput('currentStepIndex', 2);
    f.componentRef.setInput('total', 2);
    f.componentRef.setInput('theme', { background: 'purple' });
    await f.whenStable();
    const host = f.nativeElement as HTMLElement;
    expect(host.textContent).toContain('en:title');
    expect(host.style.getPropertyValue('--bulud-tour-background')).toBe(
      'purple',
    );
    expect(host.style.getPropertyValue('--bulud-tour-padding')).toBe('12px');
    language.set('fa');
    await f.whenStable();
    expect(host.textContent).toContain('fa:title');
    const next = jasmine.createSpy(),
      previous = jasmine.createSpy();
    f.componentInstance.nextClicked.subscribe(next);
    f.componentInstance.previousClicked.subscribe(previous);
    const buttons = host.querySelectorAll('button');
    buttons[0].click();
    buttons[1].click();
    expect(next).toHaveBeenCalledTimes(1);
    expect(previous).toHaveBeenCalledTimes(1);
    f.componentRef.setInput('theme', undefined);
    await f.whenStable();
    expect(host.style.getPropertyValue('--bulud-tour-background')).toBe(
      'green',
    );
  });
});
