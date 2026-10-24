import { test, expect } from '@playwright/test';
for (const rtl of [true, false])
  for (const dark of [false, true])
    test(`Localized upload and readable calendar ${rtl} ${dark}`, async ({
      page,
    }) => {
      await page.goto('/components/file-upload');
      if (!rtl)
        await page.getByRole('button', { name: 'Toggle language' }).click();
      if (dark)
        await page.getByRole('switch', { name: 'Toggle theme' }).press('Space');
      const upload = page.locator('bulud-file-upload');
      await expect(page.locator('h1')).toHaveText(
        rtl ? 'آپلود فایل' : 'File upload',
      );
      await expect(upload).toContainText(
        rtl ? 'فایل را اینجا رها کنید' : 'Drop files here',
      );
      await expect(
        upload.getByRole('button', {
          name: rtl ? 'آپلود فایل‌ها' : 'Upload files',
          exact: true,
        }),
      ).toBeDisabled();
      await upload.locator('input[type=file]').setInputFiles({
        name: 'empty.csv',
        mimeType: 'text/csv',
        buffer: Buffer.alloc(0),
      });
      await expect(upload).toContainText(
        rtl ? 'فایل خالی مجاز نیست' : 'Empty files are not allowed',
      );
      await upload.locator('input[type=file]').setInputFiles({
        name: 'sample.csv',
        mimeType: 'text/csv',
        buffer: Buffer.from('name,value\na,1'),
      });
      await expect(upload).toContainText('sample.csv');
      await expect(
        upload.getByRole('button', {
          name: rtl ? 'حذف sample.csv' : 'Remove sample.csv',
          exact: true,
        }),
      ).toBeVisible();
      await page.getByRole('button', { name: 'Toggle language' }).click();
      await expect(upload).toContainText('sample.csv');
      await expect(
        upload.getByRole('button', {
          name: rtl ? 'Remove sample.csv' : 'حذف sample.csv',
          exact: true,
        }),
      ).toBeVisible();
      await page.getByRole('button', { name: 'Toggle language' }).click();
      await page.route('**/api/demo-upload', (route) =>
        route.fulfill({ status: 500, body: 'failed' }),
      );
      await upload
        .getByRole('button', {
          name: rtl ? 'آپلود فایل‌ها' : 'Upload files',
          exact: true,
        })
        .click();
      await expect(upload.getByRole('alert')).toContainText(
        rtl ? 'آپلود ناموفق بود' : 'Upload failed',
      );
      await expect(
        upload.getByRole('button', {
          name: rtl ? 'تلاش مجدد' : 'Retry upload',
          exact: true,
        }),
      ).toBeVisible();
      await page.goto('/components/datepicker');
      await page.setViewportSize({ width: 390, height: 844 });
      for (const name of [
        rtl ? 'تاریخ' : 'Date',
        rtl ? 'بازهٔ تاریخ' : 'Date range',
      ]) {
        await page.getByRole('button', { name, exact: true }).click();
        const headers = page.locator('.bulud-datepicker__panel th');
        await expect(headers).toHaveCount(7);
        expect(
          (await headers.allTextContents()).map((text) => text.trim()),
        ).toEqual(
          rtl
            ? ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج']
            : ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'],
        );
        const geometry = await headers.evaluateAll((elements) =>
          elements.map((el) => {
            const rect = el.getBoundingClientRect();
            const abbr = el.querySelector('abbr')!;
            return {
              width: rect.width,
              textWidth: abbr.scrollWidth,
              cellWidth: el.clientWidth,
              name: el.getAttribute('aria-label'),
              title: abbr.title,
            };
          }),
        );
        for (const cell of geometry) {
          expect(cell.textWidth).toBeLessThanOrEqual(cell.cellWidth);
          expect(cell.name).toBe(cell.title);
          expect(cell.width).toBeGreaterThan(20);
        }
        expect(
          Math.max(...geometry.map((x) => x.width)) -
            Math.min(...geometry.map((x) => x.width)),
        ).toBeLessThan(1);
        await page.getByRole('dialog', { name, exact: true }).press('Escape');
      }
    });
