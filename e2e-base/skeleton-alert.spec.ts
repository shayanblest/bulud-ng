import { test, expect } from '@playwright/test';
for (const english of [false, true])
  for (const dark of [false, true])
    test(`skeleton and Angour alerts ${english} ${dark}`, async ({ page }) => {
      await page.goto('/components/skeleton');
      if (english)
        await page.getByRole('button', { name: 'Toggle language' }).click();
      if (dark)
        await page.getByRole('switch', { name: 'Toggle theme' }).press('Space');
      await expect(page.locator('bulud-skeleton')).toHaveCount(4);
      await expect(page.locator('bulud-skeleton[role=status]')).toHaveAttribute(
        'aria-label',
        english ? 'Loading…' : 'در حال بارگذاری…',
      );
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await expect(page.locator('bulud-skeleton .block').first()).toHaveCSS(
        'animation-name',
        'none',
      );
      await page.goto('/components/alert');
      await expect(page.locator('bulud-alert')).toHaveCount(10);
      for (const kind of [
        'primary',
        'secondary',
        'success',
        'info',
        'warning',
        'danger',
        'neutral',
        'light',
        'dark',
      ])
        await expect(
          page.locator(`bulud-alert [data-kind=${kind}]`).first(),
        ).toHaveCSS('border-top-width', '1px');
      const palette = dark
        ? {
            primary: '253, 181, 21',
            secondary: '12, 35, 64',
            success: '38, 208, 124',
            info: '125, 76, 241',
            warning: '255, 204, 25',
            danger: '211, 48, 48',
            light: '0, 0, 0',
            dark: '255, 255, 255',
          }
        : {
            primary: '12, 35, 64',
            secondary: '253, 181, 21',
            success: '46, 125, 50',
            info: '84, 26, 219',
            warning: '255, 204, 25',
            danger: '161, 23, 41',
            light: '255, 255, 255',
            dark: '0, 0, 0',
          };
      for (const [kind, rgb] of Object.entries(palette)) {
        const alert = page.locator(`bulud-alert [data-kind=${kind}]`).first();
        await expect(alert).toHaveCSS('border-top-color', `rgb(${rgb})`);
        const expected = await alert.evaluate(
          (el, { rgb, kind, dark }) => {
            const ctx = document.createElement('canvas').getContext('2d')!;
            ctx.fillStyle = getComputedStyle(el).backgroundColor;
            ctx.fillRect(0, 0, 1, 1);
            const actual = Array.from(ctx.getImageData(0, 0, 1, 1).data);
            const alpha = ['primary', 'secondary'].includes(kind)
              ? dark
                ? 0.25
                : 0.2
              : ['light', 'dark'].includes(kind) && dark
                ? 0.2
                : 0.1;
            return {
              actual,
              expected: [
                ...rgb.split(',').map(Number),
                Math.round(alpha * 255),
              ],
            };
          },
          { rgb, kind, dark },
        );
        expected.actual.forEach((n, i) =>
          expect(Math.abs(n - expected.expected[i])).toBeLessThanOrEqual(5),
        );
      }
      const ratios = await page
        .locator('bulud-alert .notice')
        .evaluateAll((elements) => {
          const ctx = document.createElement('canvas').getContext('2d')!;
          const rgba = (color: string) => {
            ctx.clearRect(0, 0, 1, 1);
            ctx.fillStyle = color;
            ctx.fillRect(0, 0, 1, 1);
            return Array.from(ctx.getImageData(0, 0, 1, 1).data).map((n, i) =>
              i === 3 ? n / 255 : n,
            );
          };
          const luminance = (rgb: number[]) =>
            rgb
              .slice(0, 3)
              .map((v) => v / 255)
              .map((v) =>
                v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4,
              )
              .reduce((a, v, i) => a + v * [0.2126, 0.7152, 0.0722][i], 0);
          return elements.map((el) => {
            const style = getComputedStyle(el),
              base = rgba(
                style.getPropertyValue('--bulud-color-surface').trim(),
              ),
              bg = rgba(style.backgroundColor),
              fg = rgba(style.color);
            const background = bg.map((v, i) =>
              i < 3 ? v * bg[3] + base[i] * (1 - bg[3]) : 1,
            );
            const a = luminance(fg),
              b = luminance(background);
            return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
          });
        });
      for (const ratio of ratios) expect(ratio).toBeGreaterThanOrEqual(4.5);
      await page.locator('bulud-alert button').click();
      await expect(page.locator('bulud-alert')).toHaveCount(9);
      await page.goto('/components/confirm');
      const trigger = page
        .locator('feature-frame .toolbar bulud-button')
        .last()
        .locator('button');
      await trigger.click();
      const dialog = page.getByRole('dialog');
      await expect(dialog).toBeVisible();
      await expect(dialog).toHaveAccessibleName(
        english ? 'Reject' : 'رد درخواست',
      );
      await page.keyboard.press('Escape');
      await expect(dialog).not.toBeVisible();
      await expect(trigger).toBeFocused();
      await page
        .getByRole('switch', {
          name: english ? 'Processing state' : 'حالت در حال پردازش',
          exact: true,
        })
        .press('Space');
      await trigger.click();
      await expect(dialog).toBeVisible();
      await page.keyboard.press('Escape');
      await expect(dialog).toBeVisible();
      await expect(
        dialog.getByRole('button', {
          name: english ? 'Cancel' : 'انصراف',
          exact: true,
        }),
      ).toBeDisabled();
      await dialog
        .getByRole('button', {
          name: english ? 'Finish demo processing' : 'پایان پردازش نمونه',
        })
        .click();
      await dialog
        .getByRole('button', {
          name: english ? 'Confirm' : 'تأیید',
          exact: true,
        })
        .click();
      await expect(dialog).not.toBeVisible();
    });
