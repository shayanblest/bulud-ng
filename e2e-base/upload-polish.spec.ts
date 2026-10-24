import { test, expect } from '@playwright/test';
const tinyPng = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aEpsAAAAASUVORK5CYII=',
  'base64',
);
test.beforeEach(async ({ page }) => {
  await page.goto('/shared');
  await page.getByRole('button', { name: 'Toggle language' }).click();
});
test('validates files, displays a borderless image preview, removes it, uploads and retries failures', async ({
  page,
}) => {
  const upload = page.locator('bulud-file-upload'),
    input = upload.locator('input[type=file]');
  let requests = 0;
  await page.route('**/api/demo-upload', async (route) => {
    requests++;
    await route.fulfill({
      status: requests === 1 ? 500 : 200,
      contentType: 'application/json',
      body: JSON.stringify({ stored: false }),
    });
  });
  await input.setInputFiles({
    name: 'empty.csv',
    mimeType: 'text/csv',
    buffer: Buffer.alloc(0),
  });
  await expect(
    upload.getByRole('button', { name: 'Upload files', exact: true }),
  ).toBeDisabled();
  await expect(upload).toContainText('Empty files are not allowed');
  expect(requests).toBe(0);
  await input.setInputFiles([
    { name: 'photo.png', mimeType: 'image/png', buffer: tinyPng },
    { name: 'data.csv', mimeType: 'text/csv', buffer: Buffer.from('a,b') },
  ]);
  await expect(
    upload.getByRole('img', { name: 'photo.png', exact: true }),
  ).toBeVisible();
  await expect(upload.locator('img')).toHaveCSS('border-top-width', '0px');
  await upload
    .getByRole('button', { name: 'Remove photo.png', exact: true })
    .click();
  await expect(upload.locator('img')).toHaveCount(0);
  await expect(upload).toContainText('data.csv');
  await upload
    .getByRole('button', { name: 'Upload files', exact: true })
    .click();
  await expect(upload.getByRole('alert')).toHaveText(
    'Upload failed. Try again.',
  );
  await upload
    .getByRole('button', { name: 'Retry upload', exact: true })
    .click();
  await expect(upload).toContainText('Files uploaded successfully');
  await expect(upload.getByRole('progressbar')).toHaveAttribute('value', '100');
  await expect(upload.getByRole('progressbar')).toHaveCSS(
    'accent-color',
    await upload
      .locator('.upload-state.complete')
      .evaluate((el) => getComputedStyle(el).color),
  );
  expect(requests).toBe(2);
});
test('cancel aborts the active request and re-enables selection without showing an upload error', async ({
  page,
}) => {
  const upload = page.locator('bulud-file-upload');
  let release: () => void = () => {};
  const pending = new Promise<void>((resolve) => (release = resolve));
  await page.route('**/api/demo-upload', async (route) => {
    await pending;
    await route
      .fulfill({ status: 200, contentType: 'application/json', body: '{}' })
      .catch(() => {});
  });
  await upload.locator('input').setInputFiles({
    name: 'data.csv',
    mimeType: 'text/csv',
    buffer: Buffer.from('a,b'),
  });
  await upload
    .getByRole('button', { name: 'Upload files', exact: true })
    .click();
  await expect(upload.locator('input')).toBeDisabled();
  await upload
    .getByRole('button', { name: 'Cancel upload', exact: true })
    .click();
  await expect(upload.locator('input')).toBeEnabled();
  await expect(upload.getByRole('alert')).toHaveCount(0);
  await expect(
    upload.getByRole('button', { name: 'Upload files', exact: true }),
  ).toBeEnabled();
  release();
});
for (const rtl of [false, true])
  for (const dark of [false, true])
    test(`Angour stepper, rounded search, old pagination and borderless notification ${rtl} ${dark}`, async ({
      page,
    }) => {
      if (rtl)
        await page.getByRole('button', { name: 'Toggle language' }).click();
      if (dark)
        await page.getByRole('switch', { name: 'Toggle theme' }).press('Space');
      const stepper = page.locator('bulud-stepper'),
        primary = dark ? 'rgb(253, 181, 21)' : 'rgb(12, 35, 64)';
      await stepper
        .getByRole('button', { name: rtl ? /بازبینی/ : /Review/ })
        .press('Enter');
      await expect(stepper.locator('li.completed .number')).toHaveCSS(
        'background-color',
        primary,
      );
      await expect(stepper.locator('li.completed .number svg')).toHaveCount(1);
      await expect(stepper.locator('.number').first()).toHaveCSS(
        'width',
        '40px',
      );
      await expect(page.locator('bulud-file-upload .surface')).toHaveCSS(
        'border-top-width',
        '0px',
      );
      await expect(page.locator('bulud-file-upload .picker')).toHaveCSS(
        'border-top-width',
        '0px',
      );
      await expect(page.locator('bulud-file-upload .upload-icon')).toHaveCSS(
        'color',
        primary,
      );
      await expect(
        page.getByRole('button', {
          name: rtl ? 'نمایش اعلان' : 'Show notification',
          exact: true,
        }),
      ).toHaveCSS('border-top-width', '0px');
      await expect(
        page.locator('bulud-pagination .bulud-pagination__control').first(),
      ).toHaveCSS('border-top-width', '1px');
      await page
        .getByRole('combobox', { name: rtl ? 'وضعیت' : 'Status', exact: true })
        .click();
      const panel = page.locator('.bulud-dropdown__panel'),
        search = panel.locator('input');
      await expect(panel).toHaveCSS('border-top-left-radius', '8px');
      await expect(search).toHaveCSS('border-top-width', '0px');
      await expect(search).toHaveCSS('outline-style', 'none');
      await expect(panel.locator('.bulud-dropdown__search')).toHaveCSS(
        'border-top-width',
        '1px',
      );
      await expect(panel.locator('.bulud-dropdown__search')).toHaveCSS(
        'border-top-left-radius',
        '8px',
      );
      await expect(search).toBeFocused();
      await search.press('Escape');
      await page.setViewportSize({ width: 390, height: 844 });
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
    });
