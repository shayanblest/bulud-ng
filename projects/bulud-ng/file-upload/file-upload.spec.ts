import { Component, provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { BuludFileUpload } from './file-upload';
@Component({
  imports: [BuludFileUpload, ReactiveFormsModule],
  template: `<bulud-file-upload
    label="Files"
    required
    multiple
    accept="image/*,.csv"
    [maxFiles]="2"
    [maxSize]="10"
    [formControl]="control"
  />`,
})
class Host {
  control = new FormControl<readonly File[]>([], { nonNullable: true });
}
describe('BuludFileUpload', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    }),
  );
  it('validates actual files for required, type, size, count and preserves invalid selections', async () => {
    const f = TestBed.createComponent(Host);
    await f.whenStable();
    expect(f.componentInstance.control.hasError('required')).toBeTrue();
    f.componentInstance.control.setValue([
      new File(['x'], 'image.png', { type: 'image/png' }),
      new File(['x'], 'report.CSV'),
    ]);
    await f.whenStable();
    expect(f.componentInstance.control.valid).toBeTrue();
    const files = [
      new File(['012345678901'], 'bad.exe'),
      new File(['x'], 'a.csv'),
      new File(['x'], 'b.csv'),
    ];
    f.componentInstance.control.setValue(files);
    await f.whenStable();
    expect(f.componentInstance.control.hasError('fileSize')).toBeTrue();
    expect(f.componentInstance.control.hasError('fileType')).toBeTrue();
    expect(f.componentInstance.control.hasError('fileCount')).toBeTrue();
    expect(f.componentInstance.control.value).toBe(files);
  });
  it('emits native selection, clears file input on reset and handles disabled state', async () => {
    const f = TestBed.createComponent(Host);
    await f.whenStable();
    const input = f.nativeElement.querySelector('input') as HTMLInputElement;
    const transfer = new DataTransfer();
    transfer.items.add(new File(['x'], 'test.csv'));
    input.files = transfer.files;
    input.dispatchEvent(new Event('change'));
    await f.whenStable();
    expect(f.componentInstance.control.value[0].name).toBe('test.csv');
    expect(f.componentInstance.control.touched).toBeTrue();
    (f.nativeElement.querySelector('button') as HTMLButtonElement).click();
    await f.whenStable();
    expect(input.value).toBe('');
    expect(f.componentInstance.control.value).toEqual([]);
    f.componentInstance.control.disable();
    await f.whenStable();
    expect(input.disabled).toBeTrue();
  });
  it('fails closed on bad configuration and malformed external values', async () => {
    const f = TestBed.createComponent(BuludFileUpload);
    f.componentRef.setInput('label', 'Files');
    f.componentRef.setInput('maxSize', -1);
    await f.whenStable();
    expect(f.componentInstance.validate()).toEqual({ fileConstraints: true });
    f.componentRef.setInput('maxSize', null);
    f.componentRef.setInput('accept', 'not a type');
    await f.whenStable();
    expect(f.componentInstance.validate()?.['fileAcceptConfig']).toBeTrue();
    f.componentInstance.writeValue(['fake-file']);
    expect(f.componentInstance.validate()?.['fileValue']).toBeTrue();
  });
});

describe('File upload actions and preview lifecycle', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    }),
  );
  it('revokes generated raster previews on replacement and destruction', async () => {
    const create = spyOn(URL, 'createObjectURL').and.returnValue(
        'blob:preview',
      ),
      revoke = spyOn(URL, 'revokeObjectURL');
    const f = TestBed.createComponent(BuludFileUpload);
    f.componentRef.setInput('label', 'Files');
    f.componentInstance.writeValue([
      new File(['image'], 'image.png', { type: 'image/png' }),
    ]);
    await f.whenStable();
    expect(create).toHaveBeenCalledTimes(1);
    expect(f.nativeElement.querySelector('img').getAttribute('alt')).toBe(
      'image.png',
    );
    f.componentInstance.writeValue([]);
    await f.whenStable();
    expect(revoke).toHaveBeenCalledWith('blob:preview');
    f.destroy();
  });
  it('rejects invalid selections before upload and can remove individual files', async () => {
    const f = TestBed.createComponent(BuludFileUpload);
    f.componentRef.setInput('label', 'Files');
    f.componentRef.setInput('multiple', true);
    f.componentRef.setInput('uploadOptions', { url: '/upload' });
    f.componentInstance.writeValue([
      new File([], 'empty.csv'),
      new File(['x'], 'good.csv'),
    ]);
    await f.whenStable();
    expect(f.nativeElement.querySelector('.upload-button').disabled).toBeTrue();
    f.componentInstance.remove(0);
    await f.whenStable();
    expect(
      f.nativeElement.querySelector('.upload-button').disabled,
    ).toBeFalse();
    expect(f.componentInstance.validate()).toBeNull();
    f.componentRef.setInput('disabled', true);
    await f.whenStable();
    f.componentInstance.remove(0);
    expect(f.componentInstance.validate()).toBeNull();
    expect(f.nativeElement.querySelector('.file-info').textContent).toContain(
      'good.csv',
    );
  });
});
