import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

test('supports switch semantics, projected label, and keyboard interaction', async ({
  page,
}) => {
  const section = page.locator('#switch');
  const control = section.getByRole('switch', { name: 'Enable notifications' });
  const label = control.locator('xpath=..').locator('.bulud-switch__label');
  const track = label.locator('.bulud-switch__track');

  await expect(control).toHaveAttribute('role', 'switch');
  await expect(control).not.toBeChecked();
  await expect(control).toHaveAttribute('aria-invalid', 'true');
  await label.hover();
  await expect(track).toHaveCSS('background-color', 'rgb(248, 250, 252)');
  await control.press('Space');
  await expect(control).toBeChecked();
  await expect(control).not.toHaveAttribute('aria-invalid');
  await label.hover();
  await expect(track).toHaveCSS('background-color', 'rgb(37, 99, 235)');
  await expect(section.locator('#switch-state')).toHaveText(
    'Notifications enabled',
  );
  await control.press('Space');
  await expect(control).not.toBeChecked();

  await section.getByText('Enable notifications', { exact: true }).click();
  await expect(control).toBeChecked();
});

test('covers disabled, dark theme, focus, and instance theme overrides', async ({
  page,
}) => {
  const section = page.locator('#switch');
  const control = section.getByRole('switch', { name: 'Enable notifications' });
  const track = control.locator('xpath=..').locator('.bulud-switch__track');
  const label = control.locator('xpath=..').locator('.bulud-switch__label');
  const focusStart = section.locator('#switch-focus-start');

  await section.getByText('Disabled', { exact: true }).click();
  await expect(control).toBeDisabled();
  await label.hover();
  await expect(track).toHaveCSS('background-color', 'rgb(255, 255, 255)');
  await control.click({ force: true });
  await expect(control).not.toBeChecked();

  await section.getByText('Disabled', { exact: true }).click();
  await focusStart.focus();
  await page.keyboard.press('Tab');
  await expect(control).toBeFocused();
  await expect(track).toHaveCSS('outline-width', '3px');

  await section.getByText('Dark theme', { exact: true }).click();
  await expect(track).toHaveCSS('background-color', 'rgb(15, 23, 42)');
  await control.press('Space');
  await expect(control).toBeChecked();
  await expect(track).toHaveCSS('background-color', 'rgb(96, 165, 250)');

  const instance = section.getByRole('switch', { name: 'Instance theme' });
  const instanceTrack = instance
    .locator('xpath=..')
    .locator('.bulud-switch__track');
  const thumb = control.locator('xpath=..').locator('.bulud-switch__thumb');
  await expect(instance).toBeChecked();
  await expect(instanceTrack).toHaveCSS('background-color', 'rgb(20, 83, 45)');
  await expect(instanceTrack).toHaveCSS('width', '52px');

  await page.evaluate(() => (document.documentElement.dir = 'rtl'));
  await expect(control).toBeChecked();
  await expect
    .poll(() =>
      thumb.evaluate((element) => {
        const transform = getComputedStyle(element).transform;
        return transform === 'none'
          ? 0
          : Number.parseFloat(transform.split(',')[4] ?? 'NaN');
      }),
    )
    .toBeLessThan(0);
  await page.evaluate(() => document.documentElement.removeAttribute('dir'));
});
