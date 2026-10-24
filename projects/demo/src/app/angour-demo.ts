import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { BuludButton } from 'bulud-ng/button';
import { BuludBadge } from 'bulud-ng/badge';
import { BuludDropdown } from 'bulud-ng/dropdown';
import { BuludCheckbox } from 'bulud-ng/checkbox';
import { BuludSwitch } from 'bulud-ng/switch';
import { BuludTabs, BuludTab, BuludTabPanel } from 'bulud-ng/tabs';
import { BuludAccordion, BuludAccordionItem } from 'bulud-ng/accordion';
import { BuludDialog } from 'bulud-ng/dialog';
import { BuludPagination } from 'bulud-ng/pagination';

@Component({
  selector: 'app-angour-demo',
  imports: [
    BuludButton,
    BuludBadge,
    BuludDropdown,
    BuludCheckbox,
    BuludSwitch,
    BuludTabs,
    BuludTab,
    BuludTabPanel,
    BuludAccordion,
    BuludAccordionItem,
    BuludDialog,
    BuludPagination,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section
      id="angour"
      class="bulud-app bulud-stack"
      data-bulud-preset="angour"
      [attr.data-theme]="dark() ? 'dark' : 'light'"
      [attr.dir]="rtl() ? 'rtl' : 'ltr'"
      [attr.lang]="rtl() ? 'fa' : 'en'"
    >
      <div class="bulud-row">
        <h2>{{ rtl() ? 'دیزاین سیستم انگور' : 'Angour design system' }}</h2>
        <button
          type="button"
          class="bulud-input"
          style="inline-size:auto"
          (click)="dark.set(!dark())"
          [attr.aria-pressed]="dark()"
          aria-label="Toggle Angour dark theme"
        >
          {{ dark() ? 'Light' : 'Dark' }}
        </button>
        <button
          type="button"
          class="bulud-input"
          style="inline-size:auto"
          (click)="rtl.set(!rtl())"
          aria-label="Toggle Angour direction"
        >
          {{ rtl() ? 'English / LTR' : 'فارسی / RTL' }}
        </button>
      </div>
      <p class="bulud-muted">
        {{
          rtl()
            ? 'پایهٔ مشترک پروژه‌ها با تم روشن و تیره'
            : 'Shared application foundations with light and dark themes'
        }}
      </p>
      <div class="bulud-panel bulud-stack">
        <div class="bulud-row">
          <bulud-button id="angour-primary">{{
            rtl() ? 'ذخیره' : 'Save'
          }}</bulud-button>
          <bulud-button variant="secondary">{{
            rtl() ? 'انصراف' : 'Cancel'
          }}</bulud-button>
          <bulud-button variant="danger">{{
            rtl() ? 'حذف' : 'Delete'
          }}</bulud-button>
          <bulud-button variant="ghost">Ghost</bulud-button>
          <bulud-button disabled>Disabled</bulud-button>
          <bulud-button loading>Loading</bulud-button>
          <bulud-button
            id="angour-override"
            style="--bulud-button-background: #7c3aed; --bulud-button-background-hover: #6d28d9"
            >Instance override</bulud-button
          >
        </div>
        <div class="bulud-row">
          <bulud-badge variant="primary">Primary</bulud-badge>
          <bulud-badge variant="success">Success</bulud-badge>
          <bulud-badge variant="warning">Warning</bulud-badge>
          <bulud-badge variant="danger">Danger</bulud-badge>
        </div>
        <label for="angour-name">{{
          rtl() ? 'نام پروژه' : 'Project name'
        }}</label>
        <input
          id="angour-name"
          class="bulud-input"
          placeholder="Bulud application"
        />
        <bulud-dropdown
          id="angour-dropdown"
          [options]="options"
          [searchable]="false"
          [aria-label]="rtl() ? 'انتخاب پروژه' : 'Choose a project'"
        />
        <div class="bulud-row">
          <bulud-checkbox [checked]="true">{{
            rtl() ? 'قوانین را می‌پذیرم' : 'Accept terms'
          }}</bulud-checkbox>
          <bulud-switch [checked]="true">{{
            rtl() ? 'اعلان‌ها' : 'Notifications'
          }}</bulud-switch>
        </div>
        <bulud-tabs aria-label="Angour example tabs" [(activeId)]="tab">
          <button buludTab="overview">Overview</button>
          <button buludTab="details">Details</button>
          <div buludTabPanel="overview">Reusable surfaces and controls.</div>
          <div buludTabPanel="details">
            No application services or Bootstrap dependency.
          </div>
        </bulud-tabs>
        <bulud-accordion>
          <section buludAccordionItem="foundations">
            <span buludAccordionTrigger>Design foundations</span>
            <p buludAccordionPanel>
              Colors, spacing, typography, radii and shadows.
            </p>
          </section>
        </bulud-accordion>
        <div class="bulud-table-container">
          <table class="bulud-table">
            <caption>
              {{
                rtl() ? 'پروژه‌های مشترک' : 'Shared projects'
              }}
            </caption>
            <thead>
              <tr>
                <th scope="col">Project</th>
                <th scope="col">Status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Bulud</td>
                <td>Ready</td>
              </tr>
            </tbody>
          </table>
        </div>
        <bulud-pagination
          [pageCount]="5"
          [currentPage]="page()"
          (pageChange)="page.set($event)"
        />
        <bulud-button id="angour-open-dialog" (click)="dialog.set(true)"
          >Open Angour dialog</bulud-button
        >
        <bulud-dialog
          [open]="dialog()"
          (openChange)="dialog.set($event)"
          aria-label="Angour dialog"
        >
          <div class="bulud-stack">
            <h3>{{ rtl() ? 'تم مشترک' : 'Shared theme' }}</h3>
            <p>
              {{
                rtl()
                  ? 'تمام اجزا از تم یکسان استفاده می‌کنند.'
                  : 'Every component inherits the same theme.'
              }}
            </p>
            <bulud-button (click)="dialog.set(false)">Close</bulud-button>
          </div>
        </bulud-dialog>
      </div>
    </section>
  `,
})
export class AngourDemo {
  protected readonly dark = signal(false);
  protected readonly rtl = signal(true);
  protected readonly dialog = signal(false);
  protected readonly page = signal(1);
  protected readonly tab = signal<string | null>('overview');
  protected readonly options = ['Angour', 'Bulud NG'];
}
