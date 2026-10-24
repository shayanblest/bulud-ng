import { Component, provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { BuludStepper, BuludStep } from './stepper';
@Component({
  imports: [BuludStepper, BuludStep],
  template: `<bulud-stepper label="Setup" [active]="999"
    ><ng-template buludStep="First">First body</ng-template
    ><ng-template buludStep="Second">Second body</ng-template
    ><ng-template buludStep="Locked" disabled
      >Locked body</ng-template
    ></bulud-stepper
  >`,
})
class Host {}
describe('BuludStepper', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    }),
  );
  it('selects the first enabled step for stale indexes and projects only selected content', async () => {
    const f = TestBed.createComponent(Host);
    await f.whenStable();
    expect(
      f.nativeElement.querySelector('[aria-current=step]').textContent,
    ).toContain('First');
    expect(f.nativeElement.querySelector('section').textContent).toContain(
      'First body',
    );
    const buttons = f.nativeElement.querySelectorAll(
      'button',
    ) as NodeListOf<HTMLButtonElement>;
    expect(buttons[2].disabled).toBeTrue();
    buttons[1].click();
    await f.whenStable();
    expect(f.nativeElement.querySelector('section').textContent).toContain(
      'Second body',
    );
    expect(f.nativeElement.querySelector('section').textContent).not.toContain(
      'First body',
    );
  });
  it('supports empty projection and disables all controls', async () => {
    const f = TestBed.createComponent(BuludStepper);
    f.componentRef.setInput('label', 'Empty');
    f.componentRef.setInput('disabled', true);
    await f.whenStable();
    expect(f.nativeElement.querySelector('section')).toBeNull();
  });
});
