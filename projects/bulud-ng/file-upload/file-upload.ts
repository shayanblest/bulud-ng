import { BuludSymbol } from 'bulud-ng/symbol';
import { BuludRuntime } from 'bulud-ng/runtime';
import { BuludFieldLabel } from 'bulud-ng/field-label';
import {
  DOCUMENT,
  model,
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  DestroyRef,
  PLATFORM_ID,
  ElementRef,
  forwardRef,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Subscription } from 'rxjs';
import { BuludFileConstraints, validateBuludFiles } from './file-validation';
import {
  BuludUploadService,
  BuludUploadOptions,
  BuludUploadError,
} from './upload.service';
import {
  ControlValueAccessor,
  NG_VALIDATORS,
  NG_VALUE_ACCESSOR,
  ValidationErrors,
  Validator,
} from '@angular/forms';
import {
  BULUD_SHARED_UI_CONFIG,
  buludSharedUiStyles,
  BuludSharedUiTheme,
} from 'bulud-ng';
import { BULUD_FILE_UPLOAD_CONFIG, type BuludUploadIssue } from 'bulud-ng';
export { BULUD_FILE_UPLOAD_CONFIG } from 'bulud-ng';
export type { BuludFileUploadConfig, BuludUploadIssue } from 'bulud-ng';
/** Client-side validation is a convenience. Applications must validate file content on their server. */
@Component({
  imports: [BuludFieldLabel, BuludSymbol],
  selector: 'bulud-file-upload',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './file-upload.css',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => BuludFileUpload),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => BuludFileUpload),
      multi: true,
    },
  ],
  host: {
    '[style]': 'styles()',
    '[class.bulud-file-upload--list]': "presentation()==='list'",
    '[class.bulud-file-upload--preview]': "presentation()==='preview'",
    '[class.bulud-standalone]': "presentation()==='preview'",
  },
  template:
    '@if(presentation()===\'preview\'){<div class="file-upload">\n  @if (!loading()) {\n    <div class="flex top-0 start-0 bulud-margin-3 absolute bulud-upload-actions">\n      @if (image() && !readonly()) {\n        <button type="button" [attr.aria-label]="text(\'Delete\')" (click)="clear()" class="bulud-action bulud-action-link" [id]="parentSection() + \'_delete_file\'">\n          <bulud-symbol [legacy]="legacyIcons()" name="x-close" legacyClass="icon-x-close" />\n        </button>\n      }\n      @if (canPaste() && !image()) {\n        <button type="button" (click)="pasteFileFromClipboard()" class="bulud-action bulud-action-outline">\n          <bulud-symbol [legacy]="legacyIcons()" name="copy" legacyClass="icon-copy" />\n          <span class="bulud-type-8">{{ text(\'PasteFile\') }}</span>\n        </button>\n      }\n    </div>\n  }\n  @if (!loading() && !files.length && !image()) {\n    <input #fileInput [attr.aria-label]="text(\'UploadFile\')"\n           (change)="onFileChanged($event)" [disabled]="isDisabled() || readonly() || busy()"\n           [multiple]="multiple()" [attr.id]="inputId()" type="file"\n           [accept]="uploadType() === \'csv\' ? \'.csv,text/csv\' : \'image/*\'">\n    <div class="bulud-padding-y-5"></div>\n\n    @if (uploadType() === \'csv\') {\n      <bulud-symbol [legacy]="legacyIcons()" name="csv" legacyClass="icon-csv bulud-color-accent bulud-margin-b-4" class="bulud-upload-csv-icon" />\n      <span [innerHtml]="hint() ?? text(\'VERIFICATION.Drag&dropCSVFileOrClickHereToUpload\')" class="bulud-margin-b-2"></span>\n    } @else {\n      <bulud-symbol [legacy]="legacyIcons()" name="add-image" legacyClass="icon-add-image bulud-color-accent" class="bulud-upload-image-icon" />\n      <div class="bulud-padding-y-5"></div>\n      <span [innerHtml]="hint() ?? text(\'VERIFICATION.Drag&dropFileOrClickHereToUpload\')" class="bulud-margin-b-2"></span>\n    }\n  }\n  @if (uploadType() === \'image\' && image() && !loading()) {\n    <div class="bulud-padding-3">\n      <img [src]="image()" alt="" class="w-full">\n    </div>\n  }\n  @if (uploadType() === \'csv\' && files.length && !loading()) {\n    <div  class="csv-preview">\n      <div class="flex">\n        <bulud-symbol [legacy]="legacyIcons()" name="csv" legacyClass="icon-csv bulud-color-positive" class="bulud-upload-preview-icon" />\n        <div class="w-full">\n          <div class="flex justify-between w-full">\n            <span class="font-medium truncate">{{ text(\'VERIFICATION.YourFileHasBeenSuccessfullyUploaded\') }}</span>\n            <div class="flex content-center">\n              <span class="font-medium truncate content-center">{{ files[0].name }}</span>\n              @if (!readonly()) {\n                <button\n                  class="bulud-action bulud-action-link"\n                  type="button" [attr.aria-label]="text(\'Delete\')" (click)="clear()">\n                  <bulud-symbol [legacy]="legacyIcons()" name="x-close" legacyClass="icon-x-close" />\n                </button>\n              }\n            </div>\n          </div>\n\n          <div class="csv-line-success"></div>\n        </div>\n      </div>\n      @if (loading()) {\n        <i class="loading loading-dark bulud-margin-y-8"></i>\n      }\n    </div>\n  }\n</div>\n\n@if (previewProgress() > -1) {\n  <div class="preview-upload-state" dir="ltr">\n    <i [class.bulud-color-accent]="previewProgress() >= 0 && previewProgress() < 101" [class.bulud-color-positive]="previewProgress() > 100"\n       class="icon-add-image"></i>\n    <div>\n      <div class="flex justify-between items-center bulud-color-muted bulud-type-7">\n\n        @if (files && files.length > 0) {\n          <span>{{ files[0].name }}</span>\n        }\n\n        @if (previewProgress() < 101) {\n          <span>{{ previewProgress() }}%</span>\n        }\n\n        @if (previewProgress() > 100) {\n          <span>\n            {{ text(\'VERIFICATION.YourFileHasBeenSuccessfullyUploaded\') }}\n          </span>\n        }\n\n      </div>\n      <div class="upload-progress">\n        <div [class.bulud-background-accent]="previewProgress() >= 0 && previewProgress() < 101"\n             [class.bulud-background-positive]="previewProgress() > 100" [style.width.%]="previewProgress()"></div>\n      </div>\n    </div>\n  </div>\n}\n}@else{<div class="surface">\n    <label\n      class="picker"\n      [class.dragging]="dragging()"\n      [class.invalid]="invalid() || (showErrors() && errors())"\n      (dragover)="dragOver($event)"\n      (dragleave)="dragLeave($event)"\n      (drop)="drop($event)"\n    >\n      <svg\n        class="upload-icon"\n        viewBox="0 0 48 48"\n        aria-hidden="true"\n        focusable="false"\n      >\n        <path d="M29 8H9v32h30V24M33 4v16m-8-8h16M9 33l10-11 8 8 5-5 7 9" />\n        <circle cx="19" cy="15" r="3" />\n      </svg>\n      <span buludFieldLabel [required]="required()">{{ label() }}</span\n      ><small>{{ hint() ?? text(\'UploadHint\') }}</small>\n      <input\n        #input\n        [attr.id]="inputId()" type="file"\n        [attr.aria-label]="label()"\n        [accept]="accept()"\n        [multiple]="multiple()"\n        [disabled]="isDisabled() || busy()"\n        [required]="required() && !fileValues().length"\n        [attr.aria-invalid]="invalid() || (showErrors() && !!errors()) || null"\n        [attr.aria-describedby]="describedBy() || null"\n        (change)="choose($event)"\n        (blur)="onTouched()"\n      />\n    </label>\n    @if (fileValues().length) {\n      <div class="file-toolbar">\n        <span>{{ fileValues().length }} {{ selectedLabel() }}</span\n        ><button\n          type="button"\n          [disabled]="isDisabled() || busy()"\n          (click)="clear()"\n        >\n          {{ clearLabel() }}\n        </button>\n      </div>\n      <ul class="file-list">\n        @for (file of fileValues(); track $index; let i = $index) {\n          <li>\n            @if (previews()[i]; as url) {\n              <img [src]="url" [alt]="file.name" (error)="previewFailed(i)" />\n            } @else {\n              <svg\n                class="file-icon"\n                viewBox="0 0 24 24"\n                aria-hidden="true"\n                focusable="false"\n              >\n                <path d="M5 2h9l5 5v15H5Zm9 0v6h5M8 13h8m-8 4h8" />\n              </svg>\n            }\n            <span class="file-info"\n              ><span>{{ file.name }}</span\n              ><small class="muted">{{ file.size }} B</small></span\n            >\n            <button\n              class="remove"\n              type="button"\n              [attr.aria-label]="removeLabel() + \' \' + file.name"\n              [disabled]="isDisabled() || busy()"\n              (click)="remove(i)"\n            >\n              <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">\n                <path d="m6 6 12 12M6 18 18 6" />\n              </svg>\n            </button>\n          </li>\n        }\n      </ul>\n    }\n    @if (showErrors() && errors()) {\n      <p class="upload-error" role="status">{{ validationLabel() }}</p>\n    }\n    @if (uploadState() === \'error\') {\n      <p class="upload-error" role="alert">{{ errorLabel() }}</p>\n    }\n    @if (progress() !== null || busy() || uploadState() === \'success\') {\n      <div class="upload-state" [class.complete]="uploadState() === \'success\'">\n        <svg\n          class="upload-state-icon"\n          viewBox="0 0 24 24"\n          aria-hidden="true"\n          focusable="false"\n        >\n          @if (uploadState() === \'success\') {\n            <path d="M22 11v1a10 10 0 1 1-6-9 M22 4 12 14l-3-3" />\n          } @else {\n            <path d="M12 16V3m-5 5 5-5 5 5 M4 16v5h16v-5" />\n          }\n        </svg>\n        <div class="upload-progress-details">\n          <div class="upload-progress-heading">\n            <span class="upload-caption" role="status">{{\n              uploadState() === \'success\' ? successLabel() : loadingLabel()\n            }}</span>\n            <span class="upload-percent" dir="ltr" aria-hidden="true">{{\n              safeProgress() === null ? \'\' : safeProgress() + \'%\'\n            }}</span>\n          </div>\n          <progress\n            [class.complete]="uploadState() === \'success\'"\n            max="100"\n            [attr.value]="safeProgress()"\n            [attr.aria-label]="\n              uploadState() === \'success\' ? successLabel() : loadingLabel()\n            "\n          ></progress>\n        </div>\n      </div>\n    }\n    @if (uploadOptions() && uploadState() !== \'success\') {\n      <div class="actions">\n        @if (uploadState() === \'uploading\') {\n          <button type="button" (click)="cancelUpload()">\n            {{ cancelLabel() }}\n          </button>\n        } @else {\n          <button\n            class="upload-button"\n            type="button"\n            [disabled]="!canUpload()"\n            (click)="startUpload()"\n          >\n            {{ uploadState() === \'error\' ? retryLabel() : uploadLabel() }}\n          </button>\n        }\n      </div>\n    }\n    <ng-content />\n  </div>}',
})
export class BuludFileUpload implements ControlValueAccessor, Validator {
  /** Project-owned native control identifier; no prefix normalization. */
  readonly inputId = input<string | null>(null);
  private readonly browser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly config = inject(BULUD_SHARED_UI_CONFIG);
  private readonly inputElement =
    viewChild<ElementRef<HTMLInputElement>>('input');
  readonly presentation = input<'list' | 'preview'>('list');
  readonly label = input('Upload files');
  private readonly uploader = inject(BuludUploadService);
  private subscription: Subscription | undefined;
  readonly uploadOptions = input<BuludUploadOptions>();
  readonly hint = input<string>();
  readonly selectedLabel = input('files selected');
  readonly removeLabel = input('Remove');
  readonly uploadLabel = input('Upload files');
  readonly cancelLabel = input('Cancel upload');
  readonly retryLabel = input('Retry upload');
  readonly successLabel = input('Files uploaded successfully');
  readonly errorLabel = input('Upload failed. Try again.');
  readonly validationLabel = input(
    'Check file type, size and count. Empty files are not allowed.',
  );
  readonly maxTotalSize = input<number | null>(null);
  readonly allowEmptyFiles = input(false, { transform: booleanAttribute });
  readonly uploadCompleted = output<unknown>();
  readonly uploadFailed = output<BuludUploadError>();
  private readonly state = signal<'idle' | 'uploading' | 'success' | 'error'>(
    'idle',
  );
  readonly uploadState = this.state.asReadonly();
  private readonly uploadProgress = signal<number | null>(null);
  protected readonly dragging = signal(false);
  protected readonly showErrors = signal(false);
  protected readonly previews = signal<readonly (string | null)[]>([]);
  readonly clearLabel = input('Clear files');
  readonly loadingLabel = input('Uploading…');
  readonly describedBy = input<string>();
  readonly accept = input('');
  readonly multiple = input(false, { transform: booleanAttribute });
  readonly required = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly invalid = input(false, { transform: booleanAttribute });
  readonly loading = input(false, { transform: booleanAttribute });
  readonly maxSize = input<number | null>(null);
  readonly maxFiles = input<number | null>(null);
  readonly progress = model<number | null>(null);
  readonly theme = input<Partial<BuludSharedUiTheme>>();
  readonly filesChange = output<readonly File[]>();
  private readonly value = signal<unknown>([]);
  private readonly formDisabled = signal(false);
  private readonly fileValues = computed<readonly File[]>(() => {
    const value = this.value();
    return Array.isArray(value)
      ? value.filter(
          (v): v is File => typeof File !== 'undefined' && v instanceof File,
        )
      : [];
  });
  protected readonly safeProgress = computed(() => {
    const value = this.progress() ?? this.uploadProgress();
    return value !== null && Number.isFinite(value)
      ? Math.min(100, Math.max(0, value))
      : null;
  });
  protected readonly busy = computed(
    () => this.loading() || this.uploadState() === 'uploading',
  );
  private readonly constraints = computed<BuludFileConstraints>(() => ({
    accept: this.accept(),
    multiple: this.multiple(),
    required: this.required(),
    maxSize: this.maxSize(),
    maxFiles: this.maxFiles(),
    maxTotalSize: this.maxTotalSize(),
    allowEmptyFiles: this.allowEmptyFiles(),
  }));
  protected readonly errors = computed(() =>
    validateBuludFiles(this.value(), this.constraints()),
  );
  protected readonly canUpload = computed(
    () =>
      !!this.uploadOptions() &&
      this.fileValues().length > 0 &&
      !this.errors() &&
      !validateBuludFiles(this.fileValues(), {
        ...this.uploadOptions()?.constraints,
        multiple: this.uploadOptions()?.constraints?.multiple ?? true,
      }) &&
      !this.invalid() &&
      !this.isDisabled() &&
      !this.busy(),
  );
  protected readonly isDisabled = computed(
    () => this.disabled() || this.formDisabled(),
  );
  protected readonly styles = computed(() =>
    buludSharedUiStyles('file-upload', this.config, this.theme()),
  );
  private onChange: (value: readonly File[]) => void = () => {};
  protected onTouched: () => void = () => {};
  private validatorChange: () => void = () => {};
  constructor() {
    inject(DestroyRef).onDestroy(() => {
      this.request++;
      this.revoke();
    });
    inject(DestroyRef).onDestroy(() => this.subscription?.unsubscribe());
    effect(() => {
      this.constraints();
      this.validatorChange();
    });
    effect((onCleanup) => {
      const files = this.presentation() === 'list' ? this.fileValues() : [];
      const urls = files.map((file, index) =>
        this.browser &&
        index < 8 &&
        /^image\/(png|jpeg|gif|webp|avif|bmp)$/.test(file.type) &&
        !validateBuludFiles([file], {
          ...this.constraints(),
          multiple: false,
          maxFiles: 1,
          required: false,
        }) &&
        typeof URL !== 'undefined' &&
        typeof URL.createObjectURL === 'function'
          ? URL.createObjectURL(file)
          : null,
      );
      this.previews.set(urls);
      onCleanup(() => {
        for (const url of urls) if (url) URL.revokeObjectURL(url);
      });
    });
  }
  writeValue(value: unknown): void {
    this.request++;
    this.revoke();
    this.image.set(undefined);
    this.cancelUpload();
    this.showErrors.set(false);
    this.value.set(value ?? []);
    const el = this.inputElement();
    if (el) el.nativeElement.value = '';
  }
  registerOnChange(fn: (value: readonly File[]) => void): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }
  registerOnValidatorChange(fn: () => void): void {
    this.validatorChange = fn;
  }
  setDisabledState(value: boolean): void {
    this.formDisabled.set(value);
  }
  validate(): ValidationErrors | null {
    return this.errors();
  }
  startUpload(): void {
    if (!this.canUpload()) return;
    const options = this.uploadOptions();
    if (!options) return;
    this.subscription?.unsubscribe();
    this.state.set('uploading');
    this.uploadProgress.set(null);
    this.subscription = this.uploader
      .upload(this.fileValues(), {
        ...options,
        constraints: options.constraints ?? this.constraints(),
      })
      .subscribe({
        next: (event) => {
          if (event.kind === 'progress') this.uploadProgress.set(event.percent);
          else {
            this.uploadProgress.set(100);
            this.state.set('success');
            this.uploadCompleted.emit(event.body);
          }
        },
        error: (error: unknown) => {
          this.state.set('error');
          this.uploadFailed.emit(
            error instanceof BuludUploadError
              ? error
              : new BuludUploadError('network'),
          );
        },
      });
  }
  cancelUpload(): void {
    this.subscription?.unsubscribe();
    this.subscription = undefined;
    this.state.set('idle');
    this.uploadProgress.set(null);
  }
  remove(index: number): void {
    if (
      this.isDisabled() ||
      this.busy() ||
      !Number.isInteger(index) ||
      index < 0 ||
      index >= this.fileValues().length
    )
      return;
    const input = this.inputElement();
    if (input) input.nativeElement.value = '';
    this.commit(this.fileValues().filter((_, i) => i !== index));
    this.onTouched();
  }
  protected previewFailed(index: number): void {
    this.previews.update((urls) =>
      urls.map((url, i) => (i === index ? null : url)),
    );
  }
  protected dragOver(event: DragEvent): void {
    event.preventDefault();
    if (this.isDisabled() || this.busy()) return;
    this.dragging.set(true);
    if (event.dataTransfer) event.dataTransfer.dropEffect = 'copy';
  }
  protected dragLeave(event: DragEvent): void {
    if (
      !(event.currentTarget as HTMLElement).contains(
        event.relatedTarget as Node | null,
      )
    )
      this.dragging.set(false);
  }
  protected drop(event: DragEvent): void {
    event.preventDefault();
    this.dragging.set(false);
    if (this.isDisabled() || this.busy()) return;
    this.commit(Array.from(event.dataTransfer?.files ?? []));
    this.onTouched();
  }
  protected choose(event: Event): void {
    if (this.isDisabled() || this.busy()) return;
    this.commit(Array.from((event.target as HTMLInputElement).files ?? []));
    this.onTouched();
  }
  clear(): void {
    if (this.presentation() === 'preview') {
      if (!this.isDisabled() && !this.readonly()) this.clearPreview();
      return;
    }
    if (this.isDisabled() || this.busy()) return;
    const el = this.inputElement();
    if (el) el.nativeElement.value = '';
    this.commit([]);
    this.onTouched();
  }
  private commit(files: readonly File[]): void {
    this.cancelUpload();
    this.showErrors.set(true);
    this.value.set(files);
    this.onChange(files);
    this.filesChange.emit(files);
  }

  readonly legacyIcons = input(
    inject(BULUD_SHARED_UI_CONFIG).legacyIcons ?? false,
  );
  private readonly previewConfig = inject(BULUD_FILE_UPLOAD_CONFIG);
  protected readonly previewProgress = computed(() => this.progress() ?? -1);
  get files(): readonly File[] {
    return this.fileValues();
  }
  set files(value: readonly File[]) {
    this.value.set(value);
  }
  private emitFiles(): void {
    this.onChange(this.fileValues());
    this.filesChange.emit(this.fileValues());
    this.onTouched();
  }

  private readonly runtime = inject(BuludRuntime);

  private readonly document = inject(DOCUMENT);

  private readonly destroyed = inject(DestroyRef);

  protected readonly text = (key: string) =>
    this.runtime.text(
      key,
      (
        {
          UploadFile: 'Upload file',
          UploadHint: 'Drop files here or click to choose',
          Delete: 'Remove file',
          PasteFile: 'Paste file',
          'VERIFICATION.OnlyCSVAllowed': 'Only CSV files are allowed',
          'VERIFICATION.Drag&dropCSVFileOrClickHereToUpload':
            'Drag and drop a CSV file or click here to upload',
          'VERIFICATION.Drag&dropFileOrClickHereToUpload':
            'Drag and drop a file or click here to upload',
          'VERIFICATION.YourFileHasBeenSuccessfullyUploaded':
            'Your file has been successfully uploaded',
        } as Readonly<Record<string, string>>
      )[key] ?? key,
    );

  readonly canPaste = input(false);

  readonly readonly = input(false);

  readonly parentSection = input('');

  readonly image = model<unknown>();

  readonly uploadType = input<'image' | 'csv'>('image');

  readonly maxWidth = input(this.previewConfig.maxWidth ?? 1000);

  readonly maxHeight = input(this.previewConfig.maxHeight ?? 1000);

  readonly quality = input(this.previewConfig.quality ?? 0.9);

  readonly issue = output<BuludUploadIssue>();

  protected readonly fileInput =
    viewChild<ElementRef<HTMLInputElement>>('fileInput');

  private request = 0;

  private objectUrl?: string;

  private revoke(): void {
    if (this.objectUrl)
      this.document.defaultView?.URL.revokeObjectURL(this.objectUrl);
    this.objectUrl = undefined;
  }

  private clearPreview(): void {
    this.request++;
    this.revoke();
    this.image.set(undefined);
    this.files = [];
    this.progress.set(null);
    const input = this.fileInput()?.nativeElement;
    if (input) input.value = '';
    this.emitFiles();
  }

  async pasteFileFromClipboard(): Promise<void> {
    if (
      !this.document.hasFocus() ||
      this.isDisabled() ||
      this.readonly() ||
      this.busy()
    )
      return;
    const request = ++this.request;
    try {
      const items = await this.document.defaultView?.navigator.clipboard.read();
      for (const item of items ?? [])
        for (const type of item.types)
          if (type.startsWith('image/') || type.startsWith('application/')) {
            const blob = await item.getType(type);
            if (request !== this.request || this.destroyed.destroyed) return;
            this.files = [new File([blob], 'pasted-file', { type: blob.type })];
            this.revoke();
            this.objectUrl = URL.createObjectURL(blob);
            this.image.set(this.objectUrl);
          }
    } catch (cause) {
      this.notify({
        kind: 'clipboard',
        message: 'Failed to paste file from clipboard',
        cause,
      });
    }
  }

  protected async onFileChanged(event?: Event): Promise<void> {
    this.progress.set(null);
    if (!event || this.isDisabled() || this.readonly() || this.busy()) return;
    const file = this.fileInput()?.nativeElement.files?.[0];
    if (!file) return;
    const request = ++this.request;
    this.files = [file];
    if (this.uploadType() === 'csv') {
      const type = file.type.toLowerCase();
      if (
        !file.name.toLowerCase().endsWith('.csv') &&
        type !== 'text/csv' &&
        type !== 'application/vnd.ms-excel'
      ) {
        this.notify({
          kind: 'csv',
          message: this.text('VERIFICATION.OnlyCSVAllowed'),
        });
        this.clearPreview();
        return;
      }
      this.emitFiles();
      return;
    }
    if (!file.type.includes('image/')) {
      this.emitFiles();
      return;
    }
    try {
      const preview = this.getBase64(file)
        .then((value) => {
          if (request === this.request && !this.destroyed.destroyed)
            this.image.set(value);
        })
        .catch((cause) => {
          if (request === this.request && !this.destroyed.destroyed)
            this.notify({
              kind: 'image',
              message: 'Failed to load image',
              cause,
            });
        });
      const resized = await this.resizeImage(
        file,
        this.maxWidth(),
        this.maxHeight(),
      );
      if (request !== this.request || this.destroyed.destroyed) return;
      this.files = [resized];
      this.emitFiles();
      await preview;
    } catch (cause) {
      if (request === this.request)
        this.notify({ kind: 'image', message: 'Failed to load image', cause });
    }
  }

  private notify(issue: BuludUploadIssue): void {
    this.issue.emit(issue);
    this.previewConfig.onIssue?.(issue);
  }

  private getBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () =>
        typeof reader.result === 'string'
          ? resolve(reader.result)
          : reject(new Error('Invalid image data'));
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  }

  async resizeImage(
    file: File,
    maxWidth: number,
    maxHeight: number,
  ): Promise<File> {
    if (
      !Number.isFinite(maxWidth) ||
      !Number.isFinite(maxHeight) ||
      maxWidth <= 0 ||
      maxHeight <= 0
    )
      throw new Error('Image bounds must be positive finite numbers');
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = reject;
      void this.getBase64(file).then((src) => (image.src = src), reject);
    });
    if (image.width <= maxWidth && image.height <= maxHeight) return file;
    const canvas = this.document.createElement('canvas'),
      context = canvas.getContext('2d');
    if (!context) throw new Error('Canvas context is not available');
    const scale = Math.min(maxWidth / image.width, maxHeight / image.height);
    canvas.width = Math.round(image.width * scale);
    canvas.height = Math.round(image.height * scale);
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = 'high';
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob(
        (blob) =>
          blob ? resolve(blob) : reject(new Error('Failed to create blob')),
        file.type || 'image/jpeg',
        Number.isFinite(this.quality())
          ? Math.min(1, Math.max(0, this.quality()))
          : 0.9,
      ),
    );
    return new File([blob], file.name, { type: blob.type });
  }
}
