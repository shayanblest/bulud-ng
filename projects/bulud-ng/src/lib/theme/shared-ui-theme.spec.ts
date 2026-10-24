import { provideZonelessChangeDetection, Type } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  BULUD_SHARED_UI_CONFIG,
  buludSharedUiStyles,
  BuludSharedUiFeature,
} from './shared-ui-theme';
import { BuludTable, BuludTableFilters } from 'bulud-ng/table';
import { BuludSkeleton } from 'bulud-ng/skeleton';
import { BuludConfirm } from 'bulud-ng/confirm';
import { BuludChat } from 'bulud-ng/chat';
import { BuludFieldLabel } from 'bulud-ng/field-label';
import { BuludChart, BuludDonutChart, BuludProgress } from 'bulud-ng/charts';
import { BuludAvatar } from 'bulud-ng/avatar';
import { BuludEmptyState } from 'bulud-ng/empty-state';
import { BuludPeriodPicker } from 'bulud-ng/period-picker';
import { BuludLoadingBar } from 'bulud-ng/loading-bar';
import { BuludOtp } from 'bulud-ng/otp';
import { BuludFileUpload } from 'bulud-ng/file-upload';
import { BuludTooltip } from 'bulud-ng/tooltip';
import { BuludAlert } from 'bulud-ng/feedback';
import { BuludRating } from 'bulud-ng/rating';
import { BuludStepper } from 'bulud-ng/stepper';
import { BuludCarousel } from 'bulud-ng/carousel';
import { BuludCountdown } from 'bulud-ng/countdown';
describe('Shared UI typed theme precedence', () => {
  for (const [feature, type] of [
    ['chat', BuludChat],
    ['skeleton', BuludSkeleton],
    ['confirm', BuludConfirm],
    ['field-label', BuludFieldLabel],
    ['avatar', BuludAvatar],
    ['empty-state', BuludEmptyState],
    ['period-picker', BuludPeriodPicker],
    ['donut', BuludDonutChart],
    ['progress', BuludProgress],
    ['table', BuludTable],
    ['charts', BuludChart],
    ['loading-bar', BuludLoadingBar],
    ['table-filters', BuludTableFilters],
    ['otp', BuludOtp],
    ['file-upload', BuludFileUpload],
    ['tooltip', BuludTooltip],
    ['feedback', BuludAlert],
    ['rating', BuludRating],
    ['stepper', BuludStepper],
    ['carousel', BuludCarousel],
    ['countdown', BuludCountdown],
  ] as const) {
    it(`${feature} binds instance > component > global and leaves omitted CSS variables inherited`, async () => {
      TestBed.configureTestingModule({
        providers: [
          provideZonelessChangeDetection(),
          {
            provide: BULUD_SHARED_UI_CONFIG,
            useValue: {
              theme: { foreground: 'red', border: 'blue' },
              components: { [feature]: { border: 'green' } },
            },
          },
        ],
      });
      const f = TestBed.createComponent(type as Type<unknown>);
      f.componentRef.setInput('theme', { border: 'purple' });
      if (feature === 'table') {
        f.componentRef.setInput('rows', []);
        f.componentRef.setInput('columns', []);
        f.componentRef.setInput('rowKey', () => 1);
        f.componentRef.setInput('caption', 'Test');
      } else if (feature === 'confirm')
        f.componentRef.setInput('title', 'Confirm');
      else if (feature === 'empty-state')
        f.componentRef.setInput('title', 'Empty');
      else if (feature === 'avatar') f.componentRef.setInput('name', 'Avatar');
      else if (feature === 'charts' || feature === 'donut')
        f.componentRef.setInput('caption', 'Trend');
      else if (feature === 'table-filters')
        f.componentRef.setInput('definitions', []);
      else if (feature === 'tooltip')
        f.componentRef.setInput('text', 'Description');
      else if (
        feature !== 'feedback' &&
        feature !== 'chat' &&
        feature !== 'field-label'
      )
        f.componentRef.setInput('label', 'Test');
      await f.whenStable();
      const host = f.nativeElement as HTMLElement;
      expect(host.style.getPropertyValue(`--bulud-${feature}-border`)).toBe(
        'purple',
      );
      expect(host.style.getPropertyValue(`--bulud-${feature}-foreground`)).toBe(
        'red',
      );
      expect(host.style.getPropertyValue(`--bulud-${feature}-radius`)).toBe('');
      f.componentRef.setInput('theme', undefined);
      await f.whenStable();
      expect(host.style.getPropertyValue(`--bulud-${feature}-border`)).toBe(
        'green',
      );
    });
  }
  it('does not emit undefined fields or fallback styles that override scoped CSS', () => {
    expect(buludSharedUiStyles('otp', {}, undefined)).toEqual({});
    expect(
      buludSharedUiStyles(
        'otp',
        { theme: { disabledOpacity: '.4' } },
        { radius: undefined },
      ),
    ).toEqual({ '--bulud-otp-disabled-opacity': '.4' });
    expect(
      buludSharedUiStyles(
        'table',
        {
          theme: { border: 'red' },
          components: { table: { border: undefined } },
        },
        { border: undefined },
      ),
    ).toEqual({ '--bulud-table-border': 'red' });
    for (const feature of ['otp', 'table'] as BuludSharedUiFeature[])
      expect(
        buludSharedUiStyles(feature, { theme: { border: 'red' } }, {}),
      ).toEqual({ [`--bulud-${feature}-border`]: 'red' });
  });
});
