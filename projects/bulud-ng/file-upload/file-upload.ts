import { BuludFieldLabel } from 'bulud-ng/field-label';
import {
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
/** Client-side validation is a convenience. Applications must validate file content on their server. */
@Component({
  imports: [BuludFieldLabel],
  selector: 'bulud-file-upload',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './file-upload.scss',
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
  host: { '[style]': 'styles()' },
  template: `<div class="surface">
    <label
      class="picker"
      [class.dragging]="dragging()"
      [class.invalid]="invalid() || (showErrors() && errors())"
      (dragover)="dragOver($event)"
      (dragleave)="dragLeave($event)"
      (drop)="drop($event)"
    >
      <svg
        class="upload-icon"
        viewBox="0 0 48 48"
        aria-hidden="true"
        focusable="false"
      >
        <path d="M29 8H9v32h30V24M33 4v16m-8-8h16M9 33l10-11 8 8 5-5 7 9" />
        <circle cx="19" cy="15" r="3" />
      </svg>
      <span buludFieldLabel [required]="required()">{{ label() }}</span
      ><small>{{ hint() }}</small>
      <input
        #input
        type="file"
        [attr.aria-label]="label()"
        [accept]="accept()"
        [multiple]="multiple()"
        [disabled]="isDisabled() || busy()"
        [required]="required() && !files().length"
        [attr.aria-invalid]="invalid() || (showErrors() && !!errors()) || null"
        [attr.aria-describedby]="describedBy() || null"
        (change)="choose($event)"
        (blur)="onTouched()"
      />
    </label>
    @if (files().length) {
      <div class="file-toolbar">
        <span>{{ files().length }} {{ selectedLabel() }}</span
        ><button
          type="button"
          [disabled]="isDisabled() || busy()"
          (click)="clear()"
        >
          {{ clearLabel() }}
        </button>
      </div>
      <ul class="file-list">
        @for (file of files(); track $index; let i = $index) {
          <li>
            @if (previews()[i]; as url) {
              <img [src]="url" [alt]="file.name" (error)="previewFailed(i)" />
            } @else {
              <svg
                class="file-icon"
                viewBox="0 0 24 24"
                aria-hidden="true"
                focusable="false"
              >
                <path d="M5 2h9l5 5v15H5Zm9 0v6h5M8 13h8m-8 4h8" />
              </svg>
            }
            <span class="file-info"
              ><span>{{ file.name }}</span
              ><small class="muted">{{ file.size }} B</small></span
            >
            <button
              class="remove"
              type="button"
              [attr.aria-label]="removeLabel() + ' ' + file.name"
              [disabled]="isDisabled() || busy()"
              (click)="remove(i)"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <path d="m6 6 12 12M6 18 18 6" />
              </svg>
            </button>
          </li>
        }
      </ul>
    }
    @if (showErrors() && errors()) {
      <p class="upload-error" role="status">{{ validationLabel() }}</p>
    }
    @if (uploadState() === 'error') {
      <p class="upload-error" role="alert">{{ errorLabel() }}</p>
    }
    @if (progress() !== null || busy() || uploadState() === 'success') {
      <div class="upload-state" [class.complete]="uploadState() === 'success'">
        <svg
          class="upload-state-icon"
          viewBox="0 0 24 24"
          aria-hidden="true"
          focusable="false"
        >
          @if (uploadState() === 'success') {
            <path d="M22 11v1a10 10 0 1 1-6-9 M22 4 12 14l-3-3" />
          } @else {
            <path d="M12 16V3m-5 5 5-5 5 5 M4 16v5h16v-5" />
          }
        </svg>
        <div class="upload-progress-details">
          <div class="upload-progress-heading">
            <span class="upload-caption" role="status">{{
              uploadState() === 'success' ? successLabel() : loadingLabel()
            }}</span>
            <span class="upload-percent" dir="ltr" aria-hidden="true">{{
              safeProgress() === null ? '' : safeProgress() + '%'
            }}</span>
          </div>
          <progress
            [class.complete]="uploadState() === 'success'"
            max="100"
            [attr.value]="safeProgress()"
            [attr.aria-label]="
              uploadState() === 'success' ? successLabel() : loadingLabel()
            "
          ></progress>
        </div>
      </div>
    }
    @if (uploadOptions() && uploadState() !== 'success') {
      <div class="actions">
        @if (uploadState() === 'uploading') {
          <button type="button" (click)="cancelUpload()">
            {{ cancelLabel() }}
          </button>
        } @else {
          <button
            class="upload-button"
            type="button"
            [disabled]="!canUpload()"
            (click)="startUpload()"
          >
            {{ uploadState() === 'error' ? retryLabel() : uploadLabel() }}
          </button>
        }
      </div>
    }
    <ng-content />
  </div>`,
})
export class BuludFileUpload implements ControlValueAccessor, Validator {
  private readonly browser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly config = inject(BULUD_SHARED_UI_CONFIG);
  private readonly inputElement =
    viewChild<ElementRef<HTMLInputElement>>('input');
  readonly label = input.required<string>();
  private readonly uploader = inject(BuludUploadService);
  private subscription: Subscription | undefined;
  readonly uploadOptions = input<BuludUploadOptions>();
  readonly hint = input('Drop files here or click to choose');
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
  readonly progress = input<number | null>(null);
  readonly theme = input<Partial<BuludSharedUiTheme>>();
  readonly filesChange = output<readonly File[]>();
  private readonly value = signal<unknown>([]);
  private readonly formDisabled = signal(false);
  protected readonly files = computed<readonly File[]>(() => {
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
      this.files().length > 0 &&
      !this.errors() &&
      !validateBuludFiles(this.files(), {
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
    inject(DestroyRef).onDestroy(() => this.subscription?.unsubscribe());
    effect(() => {
      this.constraints();
      this.validatorChange();
    });
    effect((onCleanup) => {
      const files = this.files();
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
      .upload(this.files(), {
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
      index >= this.files().length
    )
      return;
    const input = this.inputElement();
    if (input) input.nativeElement.value = '';
    this.commit(this.files().filter((_, i) => i !== index));
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
}
