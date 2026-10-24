import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/#angour');
});

for (const direction of ['ltr', 'rtl'] as const) {
  for (const mode of ['light', 'dark'] as const) {
    test(`Angour components inherit ${mode} in ${direction} with overrides and keyboard access`, async ({
      page,
    }) => {
      const scope = page.locator('#angour');
      if (direction === 'ltr')
        await scope
          .getByRole('button', { name: 'Toggle Angour direction' })
          .click();
      if (mode === 'dark')
        await scope
          .getByRole('button', { name: 'Toggle Angour dark theme' })
          .click();
      const dark = mode === 'dark';
      const surface = dark ? 'rgb(30, 30, 38)' : 'rgb(255, 255, 255)';
      const primary = dark ? 'rgb(253, 181, 21)' : 'rgb(12, 35, 64)';
      const button = scope.locator('#angour-primary button');
      await expect(scope).toHaveCSS('direction', direction);
      await expect(scope).toHaveCSS(
        'background-color',
        dark ? 'rgb(0, 0, 0)' : 'rgb(243, 246, 249)',
      );
      await expect(button).toHaveCSS('background-color', primary);
      await expect(button).toHaveCSS(
        'color',
        dark ? 'rgb(0, 0, 0)' : 'rgb(255, 255, 255)',
      );
      await expect(button).toHaveCSS('border-radius', '8px');
      await expect(scope.locator('#angour-override button')).toHaveCSS(
        'background-color',
        'rgb(124, 58, 237)',
      );
      await expect(scope.locator('.bulud-panel')).toHaveCSS(
        'background-color',
        surface,
      );
      await expect(scope.locator('.bulud-input').last()).toHaveCSS(
        'background-color',
        dark ? 'rgb(0, 0, 0)' : 'rgb(243, 246, 249)',
      );
      for (const selector of [
        '.bulud-tabs',
        '.bulud-accordion',
        '.bulud-checkbox__input',
        '.bulud-switch__track',
      ]) {
        const control = scope.locator(selector).first();
        if (selector.includes('__input') || selector.includes('__track'))
          await expect(control).toHaveCSS('background-color', primary);
        else await expect(control).toHaveCSS('background-color', surface);
      }
      await button.focus();
      await page.keyboard.press('Tab');
      await expect(
        scope.getByRole('button', {
          name: direction === 'rtl' ? 'انصراف' : 'Cancel',
          exact: true,
        }),
      ).toBeFocused();
      await scope.locator('#angour-dropdown .bulud-dropdown__trigger').click();
      await expect(scope.locator('.bulud-dropdown__panel')).toHaveCSS(
        'background-color',
        dark ? 'rgb(0, 0, 0)' : 'rgb(243, 246, 249)',
      );
      await page.keyboard.press('Escape');
      await scope.locator('#angour-open-dialog button').click();
      const dialog = scope.getByRole('dialog');
      await expect(dialog).toBeVisible();
      await expect(dialog).toHaveCSS('background-color', surface);
      await page.keyboard.press('Escape');
      await expect(dialog).toBeHidden();
      await expect(scope.locator('#angour-open-dialog button')).toBeFocused();
    });
  }
}

test('Angour supports ancestor dark selectors, nested light scopes and scoped token overrides', async ({
  page,
}) => {
  const scope = page.locator('#angour');
  const button = scope.locator('#angour-primary button');
  for (const selector of ['class', 'data-theme', 'data-bs-theme']) {
    await scope.evaluate((element) => element.removeAttribute('data-theme'));
    await page
      .locator('html')
      .evaluate(
        (element, selector) => element.setAttribute(selector, 'dark'),
        selector,
      );
    await expect(button).toHaveCSS('background-color', 'rgb(253, 181, 21)');
    await scope.evaluate((element) =>
      element.setAttribute('data-theme', 'light'),
    );
    await expect(button).toHaveCSS('background-color', 'rgb(12, 35, 64)');
    await page
      .locator('html')
      .evaluate(
        (element, selector) => element.removeAttribute(selector),
        selector,
      );
  }
  await scope.evaluate((element) =>
    element.style.setProperty('--bulud-button-background', '#123456'),
  );
  await expect(button).toHaveCSS('background-color', 'rgb(18, 52, 86)');
  await expect(scope.locator('#angour-override button')).toHaveCSS(
    'background-color',
    'rgb(124, 58, 237)',
  );
});
