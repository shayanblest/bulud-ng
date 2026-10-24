import {
  Component,
  ChangeDetectionStrategy,
  computed,
  inject,
} from '@angular/core';
import { BuludFileUpload } from 'bulud-ng/file-upload';
import { BasePreferences } from '../preferences';
import { FeatureFrame } from './frame';
const UPLOAD_TEXT = {
  fa: {
    label: 'انتخاب تصویر یا فایل CSV',
    hint: 'فایل را اینجا رها کنید یا برای انتخاب کلیک کنید',
    selectedLabel: 'فایل انتخاب‌شده',
    removeLabel: 'حذف',
    uploadLabel: 'آپلود فایل‌ها',
    cancelLabel: 'لغو آپلود',
    retryLabel: 'تلاش مجدد',
    successLabel: 'فایل‌ها با موفقیت ارسال شدند',
    errorLabel: 'آپلود ناموفق بود؛ دوباره تلاش کنید',
    validationLabel:
      'نوع، تعداد و حجم فایل‌ها را بررسی کنید؛ فایل خالی مجاز نیست',
    clearLabel: 'پاک کردن فایل‌ها',
    loadingLabel: 'در حال ارسال…',
  },
  en: {
    label: 'Choose images or CSV',
    hint: 'Drop files here or click to choose',
    selectedLabel: 'files selected',
    removeLabel: 'Remove',
    uploadLabel: 'Upload files',
    cancelLabel: 'Cancel upload',
    retryLabel: 'Retry upload',
    successLabel: 'Files uploaded successfully',
    errorLabel: 'Upload failed. Try again.',
    validationLabel:
      'Check file type, size and count. Empty files are not allowed.',
    clearLabel: 'Clear files',
    loadingLabel: 'Uploading…',
  },
} as const;
@Component({
  imports: [FeatureFrame, BuludFileUpload],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<feature-frame
    [title]="p.text('آپلود فایل', 'File upload')"
    [code]="source"
    [description]="
      p.text(
        'انتخاب و ارسال تصویر و فایل CSV با طراحی انگور',
        'Choose and upload images or CSV with the Angour design'
      )
    "
    [api]="
      p.text(
        'نوع، تعداد و حجم مجاز فایل‌ها را مشخص کنید. برچسب‌ها، پیام‌های خطا و وضعیت ارسال قابل ترجمه‌اند. ارسال، لغو و تلاش مجدد از طریق uploadOptions در اختیار برنامهٔ شماست.',
        'Configure allowed types, counts and sizes. All labels and validation/upload messages are translatable. Configure uploadOptions for upload, cancel and retry.'
      )
    "
    entry="bulud-ng/file-upload"
  >
    <bulud-file-upload
      [label]="copy().label"
      [hint]="copy().hint"
      [selectedLabel]="copy().selectedLabel"
      [removeLabel]="copy().removeLabel"
      [uploadLabel]="copy().uploadLabel"
      [cancelLabel]="copy().cancelLabel"
      [retryLabel]="copy().retryLabel"
      [successLabel]="copy().successLabel"
      [errorLabel]="copy().errorLabel"
      [validationLabel]="copy().validationLabel"
      [clearLabel]="copy().clearLabel"
      [loadingLabel]="copy().loadingLabel"
      accept=".png,.jpg,.csv"
      multiple
      [maxSize]="2097152"
      [maxFiles]="3"
      [uploadOptions]="uploadOptions"
    />
    <p>
      {{
        p.text(
          'در این نمونه فایل‌ها ذخیره نمی‌شوند.',
          'Files are not stored in this example.'
        )
      }}
    </p>
  </feature-frame>`,
})
export class PageFileUpload {
  readonly p = inject(BasePreferences);
  readonly copy = computed(() => UPLOAD_TEXT[this.p.language()]);
  readonly uploadOptions = { url: '/api/demo-upload' };
  readonly source = `import {Component,ChangeDetectionStrategy,input,computed} from '@angular/core';
import {BuludFileUpload} from 'bulud-ng/file-upload';
const labels = ${JSON.stringify(UPLOAD_TEXT, null, 2)};
@Component({selector:'example-upload',imports:[BuludFileUpload],changeDetection:ChangeDetectionStrategy.OnPush,template: \`
<bulud-file-upload [label]="copy().label" [hint]="copy().hint" [selectedLabel]="copy().selectedLabel"
[removeLabel]="copy().removeLabel" [uploadLabel]="copy().uploadLabel" [cancelLabel]="copy().cancelLabel"
[retryLabel]="copy().retryLabel" [successLabel]="copy().successLabel" [errorLabel]="copy().errorLabel"
[validationLabel]="copy().validationLabel" [clearLabel]="copy().clearLabel" [loadingLabel]="copy().loadingLabel"
accept=".png,.jpg,.csv" multiple [maxSize]="2097152" [maxFiles]="3" [uploadOptions]="uploadOptions"/>\`})
export class ExampleUpload {
 readonly language=input<'fa'|'en'>('fa');
 readonly copy=computed(()=>labels[this.language()]);
 readonly uploadOptions={url:'/api/upload'};
}`;
}
