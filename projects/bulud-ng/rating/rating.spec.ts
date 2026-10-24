import { Component, provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { BuludRating } from './rating';
@Component({
  imports: [BuludRating, ReactiveFormsModule],
  template: `<bulud-rating label="Rating" required [formControl]="control" />`,
})
class Host {
  control = new FormControl(0, { nonNullable: true });
}
describe('BuludRating', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    }),
  );
  it('uses native grouped radios and CVA validation without sharing names between instances', async () => {
    const f = TestBed.createComponent(Host);
    await f.whenStable();
    expect(f.componentInstance.control.hasError('required')).toBeTrue();
    const radios = f.nativeElement.querySelectorAll(
      'input',
    ) as NodeListOf<HTMLInputElement>;
    radios[3].click();
    await f.whenStable();
    expect(f.componentInstance.control.value).toBe(4);
    expect(f.componentInstance.control.valid).toBeTrue();
    expect(radios[3].checked).toBeTrue();
    expect(new Set(Array.from(radios, (r) => r.name)).size).toBe(1);
    const other = TestBed.createComponent(Host);
    await other.whenStable();
    expect(other.nativeElement.querySelector('input').name).not.toBe(
      radios[0].name,
    );
  });
  it('rejects fractional, string, nonfinite and out-of-range values and resets', async () => {
    const f = TestBed.createComponent(BuludRating);
    f.componentRef.setInput('label', 'Stars');
    await f.whenStable();
    for (const value of [-1, 6, 1.5, '3', NaN]) {
      f.componentInstance.writeValue(value);
      expect(f.componentInstance.validate()?.['rating']).toBeTrue();
    }
    f.componentInstance.writeValue(null);
    expect(f.componentInstance.validate()).toBeNull();
    f.componentInstance.setDisabledState(true);
    await f.whenStable();
    expect(f.nativeElement.querySelector('fieldset').disabled).toBeTrue();
  });
});
