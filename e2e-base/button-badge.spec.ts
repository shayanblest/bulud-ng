import { test, expect } from '@playwright/test';
for (const rtl of [true, false])
  for (const dark of [false, true])
    test(`ITB buttons and compact labels ${rtl} ${dark}`, async ({ page }) => {
      await page.goto('/components/button');
      if (!rtl)
        await page.getByRole('button', { name: 'Toggle language' }).click();
      if (dark)
        await page.getByRole('switch', { name: 'Toggle theme' }).press('Space');
      const example = page.locator('#example');
      const primary = example.getByRole('button', {
        name: 'Primary',
        exact: true,
      });
      const secondary = example.getByRole('button', {
        name: 'Secondary',
        exact: true,
      });
      await expect(primary).toHaveCSS(
        'background-color',
        dark ? 'rgb(253, 181, 21)' : 'rgb(12, 35, 64)',
      );
      await expect(primary).toHaveCSS('border-top-left-radius', '8px');
      await expect(primary).toHaveCSS('height', '40px');
      await expect(secondary).toHaveCSS(
        'background-color',
        dark ? 'rgb(12, 35, 64)' : 'rgb(253, 181, 21)',
      );
      await expect(secondary).toHaveCSS(
        'color',
        dark ? 'rgb(255, 255, 255)' : 'rgb(0, 0, 0)',
      );
      await secondary.hover();
      await expect(secondary).toHaveCSS(
        'background-color',
        dark ? 'rgb(36, 57, 82)' : 'rgb(228, 163, 19)',
      );
      const disabled = example.getByRole('button', {
        name: 'Disabled',
        exact: true,
      });
      await expect(disabled).toBeDisabled();
      await expect(disabled).toHaveCSS('opacity', '1');
      await expect(disabled).toHaveCSS(
        'background-color',
        dark ? 'rgba(213, 213, 213, 0.15)' : 'rgba(30, 30, 38, 0.15)',
      );
      await expect(
        example.getByRole('button', { name: 'Loading', exact: true }),
      ).toBeDisabled();
      await primary.press('Tab');
      await secondary.press('Shift+Tab');
      await expect(primary).toBeFocused();
      await expect(primary).toHaveCSS('outline-width', '3px');
      await primary.hover();
      const box = await primary.boundingBox();
      await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
      await page.mouse.down();
      await expect(primary).not.toHaveCSS('box-shadow', 'none');
      await page.mouse.up();
      await page.addStyleTag({
        content:
          'bulud-button {--bulud-button-secondary-background: rgb(1, 2, 3)}',
      });
      await page.mouse.move(0, 0);
      await expect(secondary).toHaveCSS('background-color', 'rgb(1, 2, 3)');
      await page.goto('/components/badge');
      const badge = page.locator('.bulud-badge--primary').first();
      await expect(badge).toHaveCSS('height', '24px');
      await expect(badge).toHaveCSS('font-size', '12px');
      await expect(badge).toHaveCSS('padding-left', '8px');
      await expect(badge).toHaveCSS('border-top-left-radius', '6px');
      await expect(badge).not.toHaveAttribute('role', 'button');
      await expect(badge.locator('button')).toHaveCount(0);
      await expect(page.locator('.bulud-badge--small')).toHaveCSS(
        'height',
        '20px',
      );
      await expect(page.locator('.bulud-badge--large')).toHaveCSS(
        'height',
        '28px',
      );
      await page.locator('.bulud-badge__dismiss').press('Enter');
      await expect(page.locator('.bulud-badge__dismiss')).toHaveCount(0);
      await page.getByRole('button', { name: 'Reset badge' }).click();
      await expect(page.locator('.bulud-badge__dismiss')).toBeVisible();
    });
