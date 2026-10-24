import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { BuludConfirm } from './confirm';
describe('BuludConfirm', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    }),
  );
  it('keeps confirmation controlled and emits cancellation only when idle', async () => {
    const f = TestBed.createComponent(BuludConfirm);
    f.componentRef.setInput('title', 'Delete record');
    f.componentRef.setInput('open', true);
    await f.whenStable();
    const confirmed = spyOn(f.componentInstance.confirmed, 'emit'),
      cancelled = spyOn(f.componentInstance.cancelled, 'emit'),
      change = spyOn(f.componentInstance.openChange, 'emit');
    const buttons = f.nativeElement.querySelectorAll(
      'button',
    ) as NodeListOf<HTMLButtonElement>;
    buttons[1].click();
    expect(confirmed).toHaveBeenCalledTimes(1);
    expect(change).not.toHaveBeenCalled();
    buttons[0].click();
    expect(cancelled).toHaveBeenCalledTimes(1);
    expect(change).toHaveBeenCalledWith(false);
  });
  it('blocks both actions during async processing and recovers when finished', async () => {
    const f = TestBed.createComponent(BuludConfirm);
    f.componentRef.setInput('title', 'Save');
    f.componentRef.setInput('open', true);
    f.componentRef.setInput('processing', true);
    await f.whenStable();
    const confirmed = spyOn(f.componentInstance.confirmed, 'emit'),
      cancelled = spyOn(f.componentInstance.cancelled, 'emit');
    const buttons = f.nativeElement.querySelectorAll(
      'button',
    ) as NodeListOf<HTMLButtonElement>;
    buttons.forEach((b) => {
      expect(b.disabled).toBeTrue();
      b.click();
    });
    expect(confirmed).not.toHaveBeenCalled();
    expect(cancelled).not.toHaveBeenCalled();
    f.componentRef.setInput('processing', false);
    await f.whenStable();
    buttons[1].click();
    expect(confirmed).toHaveBeenCalledTimes(1);
  });
});
