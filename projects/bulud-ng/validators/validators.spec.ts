import { FormControl, FormGroup, Validators } from '@angular/forms';
import {
  buludRequiredText,
  buludFiniteNumber,
  buludHttpUrl,
  buludIsoDate,
  buludMatchFields,
} from './validators';
describe('Bulud reusable validators', () => {
  it('rejects whitespace and preserves meaningful Unicode text', () => {
    expect(
      new FormControl('  ', buludRequiredText).hasError('required'),
    ).toBeTrue();
    expect(new FormControl(' فارسی ', buludRequiredText).valid).toBeTrue();
  });
  it('rejects nonfinite and coerced numbers, allows optional empty and zero', () => {
    for (const v of [NaN, Infinity, '12'])
      expect(new FormControl(v, buludFiniteNumber).invalid).toBeTrue();
    for (const v of [0, -1, null])
      expect(new FormControl(v, buludFiniteNumber).valid).toBeTrue();
  });
  it('validates URL protocols and required composition', () => {
    for (const v of ['https://example.com/a', 'http://localhost:4200', ''])
      expect(new FormControl(v, buludHttpUrl).valid).toBeTrue();
    for (const v of [
      'javascript:alert(1)',
      'relative/path',
      'ftp://example.com',
    ])
      expect(new FormControl(v, buludHttpUrl).invalid).toBeTrue();
    expect(
      new FormControl('', [Validators.required, buludHttpUrl]).hasError(
        'required',
      ),
    ).toBeTrue();
  });
  it('handles ISO leap days, era limits and optional empty values', () => {
    for (const v of ['2024-02-29', '0001-01-01', null])
      expect(new FormControl(v, buludIsoDate).valid).toBeTrue();
    for (const v of ['2025-02-29', '0000-01-01', '1405/7/29', '2025-1-01'])
      expect(new FormControl(v, buludIsoDate).invalid).toBeTrue();
  });
  it('matches fields reactively without overwriting child validators', () => {
    const f = new FormGroup(
      {
        password: new FormControl('', Validators.required),
        confirm: new FormControl('x'),
      },
      { validators: buludMatchFields('password', 'confirm') },
    );
    expect(f.hasError('matchFields')).toBeTrue();
    expect(f.controls.password.hasError('required')).toBeTrue();
    f.controls.password.setValue('x');
    expect(f.valid).toBeTrue();
    expect(
      buludMatchFields('missing', 'confirm')(f)?.['matchFields'],
    ).toBeDefined();
  });
});
