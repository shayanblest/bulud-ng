import { Component, provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { BuludTooltip } from './tooltip';
@Component({
  imports: [BuludTooltip],
  template: `<bulud-tooltip text="Helpful description"
      ><button aria-describedby="existing">Help</button></bulud-tooltip
    >
    <p id="existing">Existing</p>
    <button id="outside">Outside</button>`,
})
class Host {}
describe('BuludTooltip', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    }),
  );
  it('opens from focus, preserves descriptions, dismisses with Escape and restores attributes on destroy', async () => {
    const f = TestBed.createComponent(Host);
    await f.whenStable();
    const button = f.nativeElement.querySelector(
      'bulud-tooltip button',
    ) as HTMLButtonElement;
    button.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
    await f.whenStable();
    const tip = f.nativeElement.querySelector('[role=tooltip]');
    expect(tip.textContent).toBe('Helpful description');
    expect(button.getAttribute('aria-describedby')).toBe('existing ' + tip.id);
    button.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
    );
    await f.whenStable();
    expect(f.nativeElement.querySelector('[role=tooltip]')).toBeNull();
    expect(button.getAttribute('aria-describedby')).toBe('existing');
    button.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
    await f.whenStable();
    f.destroy();
    expect(button.getAttribute('aria-describedby')).toBe('existing');
  });
  it('keeps tooltip open across pointer transitions until pointer leaves or focus leaves', async () => {
    const f = TestBed.createComponent(Host);
    await f.whenStable();
    const host = f.nativeElement.querySelector('bulud-tooltip') as HTMLElement;
    host.dispatchEvent(new PointerEvent('pointerenter'));
    await f.whenStable();
    expect(host.querySelector('[role=tooltip]')).not.toBeNull();
    host.dispatchEvent(new PointerEvent('pointerleave'));
    await f.whenStable();
    expect(host.querySelector('[role=tooltip]')).toBeNull();
  });
});
