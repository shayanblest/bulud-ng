import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

test('native keyboard, pointer, disabled, loading recovery, and form behavior', async ({
  page,
}) => {
  const section = page.locator('#button-interactions');
  const action = section.locator('#button-dynamic button');
  const count = section.locator('#button-count');
  await section.getByLabel('Dark button theme').focus();
  await page.keyboard.press('Tab');
  await expect(action).toBeFocused();
  await expect(action).toHaveCSS('outline-style', 'solid');
  await expect(action).toHaveCSS('outline-width', '3px');
  await page.keyboard.press('Enter');
  await expect(count).toHaveText('Actions: 1');
  await page.keyboard.press('Space');
  await expect(count).toHaveText('Actions: 2');
  await action.click();
  await expect(count).toHaveText('Actions: 3');
  await section.getByLabel('Disable action').check();
  await expect(action).toBeDisabled();
  await action.click({ force: true });
  await expect(count).toHaveText('Actions: 3');
  await section.getByLabel('Dark button theme').focus();
  await page.keyboard.press('Tab');
  await expect(
    section.getByRole('button', { name: 'Empty content action' }),
  ).toBeFocused();
  await section.getByLabel('Loading action').check();
  await expect(action).toHaveAttribute('aria-busy', 'true');
  await expect(section.locator('#button-dynamic [role="status"]')).toHaveText(
    'Saving changes',
  );
  await expect(action).toHaveAccessibleName('Save changes');
  await section.getByLabel('Disable action').uncheck();
  await expect(action).toBeDisabled();
  await section.getByLabel('Loading action').uncheck();
  await expect(action).toBeEnabled();
  await expect(action).not.toHaveAttribute('aria-busy');
  await expect(section.locator('#button-dynamic [role="status"]')).toBeEmpty();
  await action.click();
  await expect(count).toHaveText('Actions: 4');
  await section.getByLabel('Example value').fill('Changed');
  await section.getByRole('button', { name: 'Reset example' }).click();
  await expect(section.getByLabel('Example value')).toHaveValue('Initial');
  await section.getByRole('button', { name: 'Submit example' }).press('Enter');
  await expect(count).toHaveText('Actions: 5');
});

test('variant hover and active colors, sizes, RTL, dark theme and override precedence', async ({
  page,
}) => {
  const variants = [
    ['primary', 'rgb(124, 58, 237)', 'rgb(109, 40, 217)', 'rgb(91, 33, 182)'],
    [
      'secondary',
      'rgb(255, 255, 255)',
      'rgb(245, 243, 255)',
      'rgb(237, 233, 254)',
    ],
    ['danger', 'rgb(225, 29, 72)', 'rgb(190, 18, 60)', 'rgb(159, 18, 57)'],
    ['ghost', 'rgba(0, 0, 0, 0)', 'rgb(245, 243, 255)', 'rgb(237, 233, 254)'],
  ];
  for (const [variant, background, hover, active] of variants) {
    const button = page.locator(`#variants .bulud-button--${variant}`);
    await expect(button).toHaveCSS('background-color', background);
    await button.hover();
    await expect(button).toHaveCSS('background-color', hover);
    await page.mouse.down();
    await expect(button).toHaveCSS('background-color', active);
    await page.mouse.up();
    await page.mouse.move(0, 0);
  }
  for (const [size, height] of [
    ['small', '32px'],
    ['medium', '44px'],
    ['large', '48px'],
  ]) {
    await expect(page.locator(`.bulud-button--${size}`).first()).toHaveCSS(
      'height',
      height,
    );
  }
  const section = page.locator('#button-interactions');
  const host = section.locator('#button-dynamic');
  const button = host.locator('button');
  await expect(button).toHaveCSS('direction', 'rtl');
  await page.locator('header button').first().click();
  await expect(button).toHaveCSS('direction', 'ltr');
  await section.getByLabel('Dark button theme').check();
  await expect(button).toHaveCSS('background-color', 'rgb(96, 165, 250)');
  await expect(
    section.getByRole('button', { name: 'Instance theme' }),
  ).toHaveCSS('background-color', 'rgb(20, 83, 45)');
  await section.getByLabel('Dark button theme').uncheck();
  await expect(button).toHaveCSS('background-color', 'rgb(124, 58, 237)');
  await section.evaluate((element) =>
    element.style.setProperty('--bulud-button-background', '#123456'),
  );
  await expect(button).toHaveCSS('background-color', 'rgb(18, 52, 86)');
  await host.evaluate((element) =>
    element.style.setProperty('--bulud-button-background', '#234567'),
  );
  await expect(button).toHaveCSS('background-color', 'rgb(35, 69, 103)');
  await section.getByLabel('Disable action').check();
  await button.hover({ force: true });
  await expect(button).toHaveCSS('background-color', 'rgb(35, 69, 103)');
  await expect(button).toHaveCSS('opacity', '0.55');
});

test('full width, focus overrides, and reduced motion', async ({ page }) => {
  const section = page.locator('#button-interactions');
  const host = section.locator('#button-dynamic');
  const button = host.locator('button');
  await host.evaluate((element) => {
    element.style.setProperty('--bulud-button-focus-width', '5px');
    element.style.setProperty('--bulud-button-focus-offset', '4px');
    element.style.setProperty('--bulud-button-focus-ring', '#123456');
  });
  await section.getByLabel('Dark button theme').focus();
  await page.keyboard.press('Tab');
  await expect(button).toHaveCSS('outline-width', '5px');
  await expect(button).toHaveCSS('outline-offset', '4px');
  await expect(button).toHaveCSS('outline-color', 'rgb(18, 52, 86)');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await section.getByLabel('Loading action').check();
  await expect(button.locator('.bulud-button__spinner')).toHaveCSS(
    'animation-name',
    'none',
  );
  await expect(button).toHaveCSS('transition-duration', '0s');
  const fullWidth = page.locator('#variants bulud-button').first();
  const bounds = await fullWidth.boundingBox();
  const buttonBounds = await fullWidth.locator('button').boundingBox();
  expect(bounds?.width).toBe(buttonBounds?.width);
});
