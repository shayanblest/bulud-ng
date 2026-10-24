import { test, expect } from '@playwright/test';
for (const rtl of [true, false])
  for (const dark of [false, true])
    test(`Angour icon switch and clean upload status ${rtl} ${dark}`, async ({
      page,
    }) => {
      await page.goto('/components/file-upload');
      if (!rtl)
        await page.getByRole('button', { name: 'Toggle language' }).click();
      const toggle = page.getByRole('switch', { name: 'Toggle theme' }),
        host = page.locator('base-toolbar bulud-switch');
      if (dark) await toggle.press('Space');
      const track = host.locator('.bulud-switch__track'),
        thumb = host.locator('.bulud-switch__thumb');
      await expect(track).toHaveCSS('width', '54px');
      await expect(track).toHaveCSS('height', '22px');
      await expect(thumb).toHaveCSS('width', '24px');
      await expect(thumb).toHaveCSS('background-color', 'rgb(255, 255, 255)');
      await expect(host.locator('.bulud-switch__theme-icon')).toHaveCount(1);
      await expect(host.locator('.bulud-switch__theme-icon--moon')).toHaveCount(
        dark ? 1 : 0,
      );
      await expect
        .poll(async () =>
          Math.round(
            (await thumb.boundingBox())!.x - (await track.boundingBox())!.x,
          ),
        )
        .toBe(dark ? 30 : 0);
      const before = (await thumb.boundingBox())!.x;
      await toggle.press('Space');
      await expect(page.locator('html')).toHaveAttribute(
        'data-theme',
        dark ? 'light' : 'dark',
      );
      await expect
        .poll(async () => Math.round((await thumb.boundingBox())!.x - before))
        .toBe(dark ? -30 : 30);
      await toggle.press('Space');
      await expect(page.locator('html')).toHaveAttribute(
        'data-theme',
        dark ? 'dark' : 'light',
      );
      const upload = page.locator('bulud-file-upload'),
        input = upload.locator('input[type=file]');
      let release!: () => void;
      const gate = new Promise<void>((resolve) => (release = resolve));
      await page.route('**/api/demo-upload', async (route) => {
        await gate;
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: '{}',
        });
      });
      await input.setInputFiles({
        name: 'report.csv',
        mimeType: 'text/csv',
        buffer: Buffer.from('a,b\n1,2'),
      });
      await upload
        .getByRole('button', {
          name: rtl ? 'آپلود فایل‌ها' : 'Upload files',
          exact: true,
        })
        .click();
      await expect(upload.locator('.upload-state-icon')).toBeVisible();
      await expect(upload.getByRole('status')).toHaveText(
        rtl ? 'در حال ارسال…' : 'Uploading…',
      );
      release();
      const status = upload.getByRole('status');
      await expect(status).toHaveText(
        rtl ? 'فایل‌ها با موفقیت ارسال شدند' : 'Files uploaded successfully',
      );
      await expect(status).toHaveCSS('border-top-width', '0px');
      await expect(upload.locator('.upload-state.complete')).toBeVisible();
      await expect(upload.getByRole('progressbar')).toHaveCSS('height', '2px');
      await expect(upload.getByRole('progressbar')).toHaveAttribute(
        'value',
        '100',
      );
      await expect(upload.locator('.upload-button')).toHaveCount(0);
      await input.setInputFiles({
        name: 'next.csv',
        mimeType: 'text/csv',
        buffer: Buffer.from('a,b'),
      });
      await expect(upload.locator('.upload-state')).toHaveCount(0);
      await expect(upload.locator('.upload-button')).toBeEnabled();
    });
