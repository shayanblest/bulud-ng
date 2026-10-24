import { Routes } from '@angular/router';
export const CATALOG_ROUTES: Routes = [
  {
    path: 'skeleton',
    loadComponent: () =>
      import('./catalog/skeleton').then((m) => m.PageSkeleton),
  },
  {
    path: 'alert',
    loadComponent: () => import('./catalog/alert').then((m) => m.PageAlert),
  },
  {
    path: 'confirm',
    loadComponent: () => import('./catalog/confirm').then((m) => m.PageConfirm),
  },

  {
    path: '',
    loadComponent: () => import('./catalog/index').then((m) => m.CatalogIndex),
  },
  {
    path: 'button',
    loadComponent: () => import('./catalog/button').then((m) => m.PageButton),
  },
  {
    path: 'badge',
    loadComponent: () => import('./catalog/badge').then((m) => m.PageBadge),
  },
  {
    path: 'checkbox',
    loadComponent: () =>
      import('./catalog/checkbox').then((m) => m.PageCheckbox),
  },
  {
    path: 'switch',
    loadComponent: () => import('./catalog/switch').then((m) => m.PageSwitch),
  },
  {
    path: 'radio',
    loadComponent: () => import('./catalog/radio').then((m) => m.PageRadio),
  },
  {
    path: 'dropdown',
    loadComponent: () =>
      import('./catalog/dropdown').then((m) => m.PageDropdown),
  },
  {
    path: 'datepicker',
    loadComponent: () =>
      import('./catalog/datepicker').then((m) => m.PageDatepicker),
  },
  {
    path: 'period-picker',
    loadComponent: () =>
      import('./catalog/period-picker').then((m) => m.PagePeriodPicker),
  },
  {
    path: 'textarea',
    loadComponent: () =>
      import('./catalog/textarea').then((m) => m.PageTextarea),
  },
  {
    path: 'otp',
    loadComponent: () => import('./catalog/otp').then((m) => m.PageOtp),
  },
  {
    path: 'rating',
    loadComponent: () => import('./catalog/rating').then((m) => m.PageRating),
  },
  {
    path: 'file-upload',
    loadComponent: () =>
      import('./catalog/file-upload').then((m) => m.PageFileUpload),
  },
  {
    path: 'field-label',
    loadComponent: () =>
      import('./catalog/field-label').then((m) => m.PageFieldLabel),
  },
  {
    path: 'forms',
    loadComponent: () => import('./catalog/forms').then((m) => m.PageForms),
  },
  {
    path: 'tabs',
    loadComponent: () => import('./catalog/tabs').then((m) => m.PageTabs),
  },
  {
    path: 'accordion',
    loadComponent: () =>
      import('./catalog/accordion').then((m) => m.PageAccordion),
  },
  {
    path: 'dialog',
    loadComponent: () => import('./catalog/dialog').then((m) => m.PageDialog),
  },
  {
    path: 'pagination',
    loadComponent: () =>
      import('./catalog/pagination').then((m) => m.PagePagination),
  },
  {
    path: 'table',
    loadComponent: () => import('./catalog/table').then((m) => m.PageTable),
  },
  {
    path: 'avatar',
    loadComponent: () => import('./catalog/avatar').then((m) => m.PageAvatar),
  },
  {
    path: 'empty-state',
    loadComponent: () =>
      import('./catalog/empty-state').then((m) => m.PageEmptyState),
  },
  {
    path: 'tooltip',
    loadComponent: () => import('./catalog/tooltip').then((m) => m.PageTooltip),
  },
  {
    path: 'feedback',
    loadComponent: () =>
      import('./catalog/feedback').then((m) => m.PageFeedback),
  },
  {
    path: 'stepper',
    loadComponent: () => import('./catalog/stepper').then((m) => m.PageStepper),
  },
  {
    path: 'carousel',
    loadComponent: () =>
      import('./catalog/carousel').then((m) => m.PageCarousel),
  },
  {
    path: 'countdown',
    loadComponent: () =>
      import('./catalog/countdown').then((m) => m.PageCountdown),
  },
  {
    path: 'loading-bar',
    loadComponent: () =>
      import('./catalog/loading-bar').then((m) => m.PageLoadingBar),
  },
  {
    path: 'line-chart',
    loadComponent: () =>
      import('./catalog/line-chart').then((m) => m.PageLineChart),
  },
  {
    path: 'candlestick-chart',
    loadComponent: () =>
      import('./catalog/candlestick-chart').then((m) => m.PageCandlestickChart),
  },
  {
    path: 'donut-chart',
    loadComponent: () =>
      import('./catalog/donut-chart').then((m) => m.PageDonutChart),
  },
  {
    path: 'progress',
    loadComponent: () =>
      import('./catalog/progress').then((m) => m.PageProgress),
  },
  {
    path: 'resize-observer',
    loadComponent: () =>
      import('./catalog/resize-observer').then((m) => m.PageResizeObserver),
  },
  {
    path: 'clickoutside',
    loadComponent: () =>
      import('./catalog/clickoutside').then((m) => m.PageClickoutside),
  },
  {
    path: 'textarea-autosize',
    loadComponent: () =>
      import('./catalog/textarea-autosize').then((m) => m.PageTextareaAutosize),
  },
  {
    path: 'digits',
    loadComponent: () => import('./catalog/digits').then((m) => m.PageDigits),
  },
  {
    path: 'initials',
    loadComponent: () =>
      import('./catalog/initials').then((m) => m.PageInitials),
  },
  {
    path: 'filesize',
    loadComponent: () =>
      import('./catalog/filesize').then((m) => m.PageFilesize),
  },
  {
    path: 'utilities',
    loadComponent: () =>
      import('./catalog/utilities').then((m) => m.PageUtilities),
  },
  {
    path: 'query',
    loadComponent: () => import('./catalog/query').then((m) => m.PageQuery),
  },
  {
    path: 'validators',
    loadComponent: () =>
      import('./catalog/validators').then((m) => m.PageValidators),
  },
  {
    path: 'chat',
    loadComponent: () => import('./catalog/chat').then((m) => m.PageChat),
  },
  { path: 'charts', redirectTo: 'line-chart' },
];
