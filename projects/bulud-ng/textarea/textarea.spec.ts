import { Component, provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { BULUD_SHARED_UI_CONFIG } from 'bulud-ng';
import { signal } from '@angular/core';
import { BuludTextarea } from './textarea';
@Component({
  imports: [BuludTextarea, ReactiveFormsModule],
  template: `<label
    >Message<textarea
      buludTextarea
      [formControl]="control"
      [buludTextareaInvalid]="control.invalid"
    ></textarea>
  </label>`,
})
class Host {
  readonly control = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.maxLength(5)],
  });
}
describe('Native themed textarea', () => {
  it('keeps native Angular forms, validation, reset and disabled behavior', async () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    const f = TestBed.createComponent(Host);
    await f.whenStable();
    const el = f.nativeElement.querySelector('textarea') as HTMLTextAreaElement;
    expect(el.classList.contains('bulud-textarea')).toBeTrue();
    expect(el.getAttribute('aria-invalid')).toBe('true');
    el.value = 'Hello';
    el.dispatchEvent(new Event('input'));
    await f.whenStable();
    expect(f.componentInstance.control.value).toBe('Hello');
    expect(f.componentInstance.control.valid).toBeTrue();
    f.componentInstance.control.setValue('Too long');
    await f.whenStable();
    expect(f.componentInstance.control.hasError('maxlength')).toBeTrue();
    f.componentInstance.control.reset();
    await f.whenStable();
    expect(el.value).toBe('');
    f.componentInstance.control.disable();
    await f.whenStable();
    expect(el.disabled).toBeTrue();
  });
});

@Component({
  imports: [BuludTextarea],
  template: `<textarea
    buludTextarea
    aria-label="Message"
    [theme]="theme()"
  ></textarea>`,
})
class ThemeHost {
  readonly theme = signal<{ border: string } | undefined>({ border: 'purple' });
}
describe('Textarea theme precedence', () => {
  it('keeps instance > component > global > inherited CSS', async () => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        {
          provide: BULUD_SHARED_UI_CONFIG,
          useValue: {
            theme: { foreground: 'red', border: 'blue' },
            components: { textarea: { border: 'green' } },
          },
        },
      ],
    });
    const f = TestBed.createComponent(ThemeHost);
    await f.whenStable();
    const el = f.nativeElement.querySelector('textarea') as HTMLTextAreaElement;
    expect(el.style.getPropertyValue('--bulud-textarea-border')).toBe('purple');
    expect(el.style.getPropertyValue('--bulud-textarea-foreground')).toBe(
      'red',
    );
    expect(el.style.getPropertyValue('--bulud-textarea-radius')).toBe('');
    f.componentInstance.theme.set(undefined);
    await f.whenStable();
    expect(el.style.getPropertyValue('--bulud-textarea-border')).toBe('green');
  });
});
