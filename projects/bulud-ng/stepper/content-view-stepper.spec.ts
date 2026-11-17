import {
  Component,
  provideZonelessChangeDetection,
  signal,
  viewChild,
  ChangeDetectionStrategy,
} from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { BuludStep, BuludStepper } from './stepper';
@Component({
  imports: [BuludStep, BuludStepper],
  // eslint-disable-next-line @angular-eslint/prefer-on-push-component-change-detection -- Mutable consumer fixture retained by the official Angular 22 migration.
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `<bulud-stepper presentation="content"
    [activeStepName]="name()"
    [activeStepIndex]="index()"
    [scrollCurrent]="false"
    ><section buludStep="identity">Identity</section>
    <section buludStep="address">Address</section>
    <section buludStep="confirm">Confirm</section></bulud-stepper
  >`,
})
class Host {
  readonly name = signal<string | undefined>(undefined);
  readonly index = signal(0);
  readonly stepper = viewChild.required(BuludStepper);
}
describe('BuludStepper projected workflow', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    }),
  );
  function states(element: HTMLElement) {
    return Array.from(element.querySelectorAll('section')).map(
      (el) => [...el.classList].find(name => ['previous','current','next'].includes(name)),
    );
  }
  it('initializes and transitions projected current/previous/next classes with bounded imperative navigation', async () => {
    const f = TestBed.createComponent(Host);
    await f.whenStable();
    expect(states(f.nativeElement)).toEqual(['current', 'next', 'next']);
    f.componentInstance.stepper().nextStep();
    await f.whenStable();
    expect(states(f.nativeElement)).toEqual(['previous', 'current', 'next']);
    f.componentInstance.stepper().nextStep();
    f.componentInstance.stepper().nextStep();
    await f.whenStable();
    expect(states(f.nativeElement)).toEqual([
      'previous',
      'previous',
      'current',
    ]);
    f.componentInstance.stepper().prevStep();
    f.componentInstance.stepper().prevStep();
    f.componentInstance.stepper().prevStep();
    await f.whenStable();
    expect(states(f.nativeElement)).toEqual(['current', 'next', 'next']);
  });
  it('reacts to external step name/index, keeps imperative navigation after a named selection and ignores unknown names', async () => {
    const f = TestBed.createComponent(Host);
    f.componentInstance.name.set('address');
    await f.whenStable();
    expect(states(f.nativeElement)).toEqual(['previous', 'current', 'next']);
    f.componentInstance.stepper().nextStep();
    await f.whenStable();
    expect(states(f.nativeElement)).toEqual([
      'previous',
      'previous',
      'current',
    ]);
    f.componentInstance.name.set('missing');
    await f.whenStable();
    expect(states(f.nativeElement)).toEqual([
      'previous',
      'previous',
      'current',
    ]);
    f.componentInstance.name.set(undefined);
    f.componentInstance.index.set(1);
    await f.whenStable();
    expect(states(f.nativeElement)).toEqual(['previous', 'current', 'next']);
  });
});
