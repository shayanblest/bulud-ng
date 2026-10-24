import { expect, test } from '@playwright/test';

for (const direction of ['rtl', 'ltr'] as const) {
  for (const mode of ['light', 'dark'] as const) {
    test(`Angour native checkbox and radio styling, forms and keyboard in ${mode} ${direction}`, async ({
      page,
    }) => {
      await page.goto('/#angour-controls');
      const scope = page.locator('#angour-controls');
      if (direction === 'ltr')
        await scope
          .getByRole('button', { name: 'Toggle controls language' })
          .click();
      if (mode === 'dark')
        await scope
          .getByRole('button', { name: 'Toggle controls theme' })
          .click();
      const primary = mode === 'dark' ? 'rgb(253, 181, 21)' : 'rgb(12, 35, 64)';
      const checkbox = scope.locator('#angour-check');
      await expect(checkbox).toHaveCSS('width', '16px');
      await expect(checkbox).toHaveCSS('border-radius', '4px');
      await checkbox.check();
      await expect(checkbox).toBeChecked();
      await expect(checkbox).toHaveCSS('background-color', primary);
      const group = scope.locator('#angour-radios');
      const radios = group.getByRole('radio');
      await expect(radios.first()).toHaveCSS('width', '16px');
      await expect(radios.first()).toHaveCSS('border-radius', '50%');
      await radios.first().check();
      await radios.first().focus();
      await page.keyboard.press('ArrowDown');
      await expect(radios.nth(1)).toBeChecked();
      await expect(scope.locator('#angour-plan')).toHaveText('pro');
      const dot = await radios.nth(1).evaluate((element) => ({
        background: getComputedStyle(element, '::after').backgroundColor,
        width: getComputedStyle(element, '::after').width,
      }));
      expect(dot).toEqual({ background: primary, width: '8px' });
      await expect(radios.nth(2)).toBeDisabled();
      await page.keyboard.press('ArrowDown');
      await expect(radios.first()).toBeChecked();
      await scope.getByRole('button', { name: 'Reset controls' }).click();
      await expect(checkbox).not.toBeChecked();
      await expect(radios.first()).not.toBeChecked();
      await scope.getByRole('button', { name: 'Disable controls' }).click();
      await expect(checkbox).toBeDisabled();
      await expect(radios.first()).toBeDisabled();
      await scope.getByRole('button', { name: 'Disable controls' }).click();
      await expect(radios.first()).toBeEnabled();
      const override = scope
        .getByRole('radiogroup', { name: 'Custom plan' })
        .getByRole('radio');
      expect(
        await override.evaluate(
          (element) => getComputedStyle(element, '::after').backgroundColor,
        ),
      ).toBe('rgb(124, 58, 237)');
      await expect(
        scope
          .getByRole('radiogroup', { name: 'Invalid plan' })
          .getByRole('radio'),
      ).toHaveAttribute('aria-invalid', 'true');
    });
  }
}
