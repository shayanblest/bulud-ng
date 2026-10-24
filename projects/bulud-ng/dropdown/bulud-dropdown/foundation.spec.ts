import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { BuludDropdown } from './bulud-dropdown';
describe('Dropdown foundation regressions', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    }),
  );
  it('validates shapes, counts and opt-in membership without discarding the value', async () => {
    const f = TestBed.createComponent(BuludDropdown<string>),
      c = f.componentInstance;
    f.componentRef.setInput('multiple', true);
    f.componentRef.setInput('minSelected', 2);
    f.componentRef.setInput('maxSelected', 3);
    await f.whenStable();
    c.writeValue('a');
    expect(c.validate()).toEqual({ selectionType: { multiple: true } });
    c.writeValue(['a']);
    expect(c.validate()).toEqual({ minSelected: { min: 2, actual: 1 } });
    c.writeValue(['a', 'b', 'c', 'd']);
    expect(c.validate()).toEqual({ maxSelected: { max: 3, actual: 4 } });
    c.writeValue(['a', 'b']);
    expect(c.validate()).toBeNull();
    f.componentRef.setInput('requireOption', true);
    f.componentRef.setInput('options', ['a']);
    await f.whenStable();
    expect(c.validate()).toEqual({ option: true });
    f.componentRef.setInput('loading', true);
    await f.whenStable();
    expect(c.validate()).toBeNull();
    expect(c.value()).toEqual(['a', 'b']);
  });
  it('closes immediately on form disable and ignores stale option activation', async () => {
    const f = TestBed.createComponent(BuludDropdown<string>);
    f.componentRef.setInput('options', ['a']);
    await f.whenStable();
    f.nativeElement.querySelector('button').click();
    await f.whenStable();
    const option = f.nativeElement.querySelector(
      '[role="option"]',
    ) as HTMLButtonElement;
    f.componentInstance.setDisabledState(true);
    option.click();
    await f.whenStable();
    expect(f.componentInstance.value()).toBeNull();
    expect(
      f.nativeElement
        .querySelector('[role="combobox"]')
        .getAttribute('aria-expanded'),
    ).toBe('false');
  });
  it('indexes labels only once across successive searches', async () => {
    const f = TestBed.createComponent(BuludDropdown<string>);
    const label = jasmine.createSpy('label').and.callFake((v: string) => v);
    f.componentRef.setInput('options', ['alpha', 'beta', 'gamma']);
    f.componentRef.setInput('optionLabel', label);
    await f.whenStable();
    f.nativeElement.querySelector('button').click();
    await f.whenStable();
    const search = f.nativeElement.querySelector('input') as HTMLInputElement;
    search.value = 'al';
    search.dispatchEvent(new Event('input'));
    await f.whenStable();
    const afterFirst = label.calls.count();
    search.value = 'alph';
    search.dispatchEvent(new Event('input'));
    await f.whenStable();
    expect(label.calls.count() - afterFirst).toBeLessThan(3);
  });
  it('applies explicit language ahead of injected locale while retaining ISO-independent values', async () => {
    const f = TestBed.createComponent(BuludDropdown<string>);
    f.componentRef.setInput('multiple', true);
    f.componentRef.setInput('language', 'fa');
    f.componentInstance.writeValue(['a', 'b']);
    await f.whenStable();
    expect(
      f.nativeElement.querySelector('[role="combobox"]').textContent,
    ).toContain('انتخاب');
    f.componentRef.setInput('language', 'en');
    await f.whenStable();
    expect(
      f.nativeElement.querySelector('[role="combobox"]').textContent,
    ).toContain('selected');
    expect(f.componentInstance.value()).toEqual(['a', 'b']);
  });
});
