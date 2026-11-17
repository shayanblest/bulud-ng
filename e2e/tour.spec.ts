import { expect, test } from '@playwright/test';
test('portable tour walks, traps focus, supports Escape and restores its trigger in four locales/two themes/mobile and desktop', async ({
  page,
}) => {
  await page.goto('/#tour-demo');
  const demo = page.locator('#tour-demo');
  for (const width of [375, 1280]) {
    await page.setViewportSize({ width, height: 800 });
    for (const language of ['en', 'fa', 'ar', 'tr']) {
      const dropdown = demo.getByRole('combobox', { name: 'Tour language' });
      await dropdown.click();
      await demo.getByRole('option', { name: language, exact: true }).click();
      for (const dark of [false, true]) {
        const toggle = demo.getByRole('switch', { name: 'Tour dark theme' });
        if ((await toggle.isChecked()) !== dark) await toggle.press('Space');
        const trigger = demo.getByRole('button', { name: 'Start tour' });
        await trigger.click();
        const dialog = demo.getByRole('dialog');
        await expect(dialog).toBeVisible();
        await expect(dialog).toHaveAttribute(
          'dir',
          ['fa', 'ar'].includes(language) ? 'rtl' : 'ltr',
        );
        await expect(dialog).toHaveCSS(
          'color',
          dark ? 'rgb(255, 255, 255)' : 'rgb(0, 0, 0)',
        );
        const bounds = await dialog.boundingBox();
        expect(bounds!.x).toBeGreaterThanOrEqual(15);
        expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(width - 15);
        const buttons = dialog.getByRole('button');
        await expect(buttons.first()).toBeFocused();
        await buttons.last().focus();
        await page.keyboard.press('Tab');
        await expect(buttons.first()).toBeFocused();
        await buttons.first().click();
        await expect(dialog.locator('.tour-count')).toContainText(
          new Intl.NumberFormat(language).format(2),
        );
        await expect(page.locator('#tour-demo-second')).toHaveClass(
          /tour-active/,
        );
        await page.keyboard.press('Escape');
        await expect(dialog).toHaveCount(0);
        await expect(trigger).toBeFocused();
        await expect(page.locator('body')).not.toHaveClass(/tour-freeze/);
      }
    }
  }
});
test('missing targets release focus and interaction without leaving a stale highlight', async ({
  page,
}) => {
  await page.goto('/#tour-demo');
  const demo = page.locator('#tour-demo');
  const button = demo.getByRole('button', { name: 'Missing tour target' });
  await button.click();
  await expect(demo.getByTestId('tour-active')).toHaveText('false');
  await expect(page.locator('.tour-highlight')).toHaveCount(0);
  await expect(page.locator('body')).not.toHaveClass(/tour-freeze/);
  await expect(button).toBeFocused();
  await demo.getByRole('button', { name: 'Start tour' }).click();
  await expect(demo.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
});
