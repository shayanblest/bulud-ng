import {
  Component,
  ChangeDetectionStrategy,
  provideZonelessChangeDetection,
  signal,
} from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { BuludOtp } from './otp';
import { BuludFileUpload } from 'bulud-ng/file-upload';
import { BuludRating } from 'bulud-ng/rating';
import { BuludPeriodPicker } from 'bulud-ng/period-picker';
import { BuludPagination } from 'bulud-ng/pagination';
import { BuludLanguageSwitch } from 'bulud-ng/language-switch';
import { BuludAccordion, BuludAccordionItem } from 'bulud-ng/accordion';
import { BuludTabs, BuludTab, BuludTabPanel } from 'bulud-ng/tabs';
import { BuludCarousel, BuludSlide } from 'bulud-ng/carousel';
import { BuludStepper, BuludStep } from 'bulud-ng/stepper';
@Component({
  imports: [
    BuludAccordion,
    BuludAccordionItem,
    BuludTabs,
    BuludTab,
    BuludTabPanel,
    BuludCarousel,
    BuludSlide,
    BuludStepper,
    BuludStep,
    BuludOtp,
    BuludFileUpload,
    BuludRating,
    BuludPeriodPicker,
    BuludPagination,
    BuludLanguageSwitch,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <bulud-accordion
      [idPrefix]="prefix() ? prefix() + '_accordion' : null"
      expanded="details"
    >
      <section buludAccordionItem="details">
        <span buludAccordionTrigger>Details</span>
        <p buludAccordionPanel>Details content</p>
      </section>
    </bulud-accordion>
    <bulud-tabs [id]="prefix() ? prefix() + '_tabs' : undefined">
      <button buludTab="details">Details</button>
      <section buludTabPanel="details">Tab content</section>
    </bulud-tabs>
    <bulud-carousel label="Accounts" [idPrefix]="prefix()">
      <ng-template buludSlide="First">First</ng-template
      ><ng-template buludSlide="Second">Second</ng-template>
    </bulud-carousel>
    <bulud-stepper [idPrefix]="prefix()">
      <ng-template buludStep="First">First</ng-template
      ><ng-template buludStep="Second">Second</ng-template>
    </bulud-stepper>
    <bulud-otp
      label="Code"
      [layout]="separate() ? 'separate' : 'single'"
      [inputId]="prefix() ? prefix() + '_otp' : null"
    />
    <bulud-file-upload
      label="Upload"
      [presentation]="preview() ? 'preview' : 'list'"
      [inputId]="prefix() ? prefix() + '_file' : null"
    />
    <bulud-rating
      label="Rating"
      [inputIdPrefix]="prefix() ? prefix() + '_rating' : null"
    />
    <bulud-period-picker
      label="Period"
      [presentation]="grid() ? 'grid' : 'fields'"
      [inputIdPrefix]="prefix() ? prefix() + '_month' : null"
    />
    <bulud-pagination
      [pageCount]="3"
      [idPrefix]="prefix() ? prefix() + '_pages' : null"
    />
    <bulud-language-switch
      [inputId]="prefix() ? prefix() + '_language' : null"
    />
  `,
})
class Host {
  readonly prefix = signal<string | null>('dashboard_real');
  readonly separate = signal(false);
  readonly preview = signal(false);
  readonly grid = signal(false);
}
describe('Project-owned native identifiers', () => {
  it('keeps underscore/hyphen identifiers reactive and unique across control presentations', async () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    const f = TestBed.createComponent(Host);
    await f.whenStable();
    const root = f.nativeElement as HTMLElement;
    const verify = () => {
      const ids = Array.from(root.querySelectorAll('[id]')).map((el) => el.id);
      expect(new Set(ids).size).toBe(ids.length);
      for (const control of root.querySelectorAll(
        'bulud-tabs [aria-controls],bulud-accordion [aria-controls]',
      )) {
        const panel = root.querySelector(
          '[id="' + control.getAttribute('aria-controls') + '"]',
        );
        expect(panel).not.toBeNull();
        expect(panel?.getAttribute('aria-labelledby')).toBe(control.id);
      }
      return ids;
    };
    expect(root.querySelector('bulud-otp input')?.id).toBe(
      'dashboard_real_otp',
    );
    expect(root.querySelector('input[type=file]')?.id).toBe(
      'dashboard_real_file',
    );
    expect(root.querySelector('bulud-pagination button')?.id).toBe(
      'dashboard_real_pages_previous',
    );
    verify();
    f.componentInstance.prefix.set('account-42');
    f.componentInstance.separate.set(true);
    f.componentInstance.preview.set(true);
    f.componentInstance.grid.set(true);
    await f.whenStable();
    expect(root.querySelector('bulud-otp input')?.id).toBe('account-42_otp_1');
    expect(root.querySelector('input[type=file]')?.id).toBe('account-42_file');
    expect(root.querySelector('bulud-language-switch button')?.id).toBe(
      'account-42_language',
    );
    expect(root.querySelector('bulud-carousel button')?.id).toBe(
      'account-42_previous',
    );
    expect(root.querySelector('bulud-stepper button')?.id).toBe(
      'account-42_step_1',
    );
    expect(
      root
        .querySelector('bulud-accordion button')
        ?.id.startsWith('account-42_accordion-item-'),
    ).toBeTrue();
    const ids = verify();
    expect(ids).toContain('account-42_month_month_1');
    expect(ids).toContain('account-42_month_month_12');
    f.componentInstance.prefix.set(null);
    await f.whenStable();
    expect(verify().some((id) => id.startsWith('account-42'))).toBeFalse();
    f.destroy();
  });
});
