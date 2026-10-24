import { expect, test } from '@playwright/test';

for (const direction of ['rtl', 'ltr'] as const) {
  for (const theme of ['light', 'dark'] as const) {
    test.describe(`Dropdown ${theme} ${direction}`, () => {
      const surface =
        theme === 'dark' ? 'rgb(15, 23, 42)' : 'rgb(255, 255, 255)';
      const optionBackground =
        theme === 'dark' ? 'rgb(30, 58, 138)' : 'rgb(239, 246, 255)';
      const placeholder =
        direction === 'rtl' ? 'یک گزینه انتخاب کنید' : 'Select an option';

      test.beforeEach(async ({ page }) => {
        await page.goto('/');
        if (direction === 'ltr') {
          await page.locator('#demo-language-toggle').click();
        }
        if (theme === 'dark') {
          await page.locator('#dropdown-dark').check();
        }
        await expect(page.locator('html')).toHaveAttribute('dir', direction);
      });

      test('disables pointer and tab access without losing the selected value', async ({
        page,
      }) => {
        const single = page.locator('#demo-dropdown-single');
        const trigger = single.getByRole('combobox');
        const clear = single.getByRole('button', { name: 'Clear selection' });
        await expect(trigger).toBeEnabled();
        await expect(trigger).toHaveCSS('background-color', surface);
        await expect(trigger).toHaveCSS('direction', direction);
        await trigger.hover();
        await expect(trigger).toHaveCSS('border-top-color', 'rgb(37, 99, 235)');
        await page.locator('#dropdown-dark').focus();
        await page.keyboard.press('Tab');
        await expect(trigger).toBeFocused();
        await expect(trigger).toHaveCSS('outline-width', '3px');
        await expect(trigger).toHaveCSS('outline-color', 'rgb(147, 197, 253)');
        await trigger.press('ArrowDown');
        const search = single.getByRole('searchbox', {
          name: 'Search options',
        });
        await expect(search).toBeFocused();
        await search.press('Enter');
        await expect(trigger).toHaveText('Angular');
        await expect(trigger).toBeFocused();
        await expect(clear).toBeVisible();

        await page.locator('#dropdown-disabled').check();
        await expect(trigger).toBeDisabled();
        await expect(trigger).toHaveCSS('opacity', '0.55');
        await expect(clear).toHaveCount(0);
        await trigger.click({ force: true });
        await expect(trigger).toHaveAttribute('aria-expanded', 'false');
        await expect(single.getByRole('listbox')).toHaveCount(0);
        await expect(trigger).toHaveText('Angular');
        await page.locator('#dropdown-dark').focus();
        await page.keyboard.press('Tab');
        await expect(
          page.locator('#demo-dropdown-multiple').getByRole('combobox'),
        ).toBeFocused();
        await page.locator('#dropdown-disabled').uncheck();
        await expect(trigger).toBeEnabled();
        await expect(trigger).toHaveText('Angular');
        await expect(clear).toBeVisible();
        await trigger.click();
        await expect(
          single.getByRole('option', { name: 'Angular Framework' }),
        ).toHaveAttribute('aria-selected', 'true');
      });

      test('clears single and multiple selections with pointer and keyboard and restores trigger focus', async ({
        page,
      }) => {
        const single = page.locator('#demo-dropdown-single');
        const trigger = single.getByRole('combobox');
        await trigger.click();
        await expect(trigger).toHaveAttribute('aria-expanded', 'true');
        await expect(single.locator('.bulud-dropdown__panel')).toHaveCSS(
          'background-color',
          surface,
        );
        const angular = single.getByRole('option', {
          name: 'Angular Framework',
        });
        await angular.hover();
        await expect(angular).toHaveCSS('background-color', optionBackground);
        await angular.click();
        await expect(trigger).toHaveText('Angular');
        await expect(trigger).toHaveAttribute('aria-expanded', 'false');
        const clear = single.getByRole('button', { name: 'Clear selection' });
        await expect(clear).toHaveCSS(
          direction === 'rtl' ? 'left' : 'right',
          '44px',
        );
        await clear.hover();
        await expect(clear).toHaveCSS('background-color', 'rgb(241, 245, 249)');
        await clear.click();
        await expect(trigger).toHaveText(placeholder);
        await expect(clear).toHaveCount(0);
        await expect(trigger).toBeFocused();
        await expect(trigger).toHaveAttribute('aria-expanded', 'false');
        await trigger.press('ArrowDown');
        await expect(angular).toHaveAttribute('aria-selected', 'false');
        await single.getByRole('searchbox').press('Escape');
        await expect(trigger).toBeFocused();

        const multiple = page.locator('#demo-dropdown-multiple');
        const multipleTrigger = multiple.getByRole('combobox');
        await multipleTrigger.click();
        const listbox = multiple.getByRole('listbox');
        await expect(listbox).toHaveAttribute('aria-multiselectable', 'true');
        await expect(listbox).toHaveCSS('direction', direction);
        await multiple
          .getByRole('option', { name: 'Maya Chen Design systems' })
          .click();
        await multiple
          .getByRole('option', { name: 'Noah Williams Frontend platform' })
          .click();
        await expect(
          multiple.getByRole('option', { selected: true }),
        ).toHaveCount(2);
        await expect(multipleTrigger).toHaveText('2 selected');
        const multipleClear = multiple.getByRole('button', {
          name: 'Clear selection',
        });
        await multipleTrigger.focus();
        await page.keyboard.press('Tab');
        await expect(multipleClear).toBeFocused();
        await expect(multipleClear).toHaveCSS('outline-width', '3px');
        await multipleClear.press('Space');
        await expect(multipleTrigger).toHaveText(placeholder);
        await expect(multipleClear).toHaveCount(0);
        await expect(multipleTrigger).toBeFocused();
        await expect(multipleTrigger).toHaveAttribute('aria-expanded', 'true');
        await expect(
          multiple.getByRole('option', { selected: true }),
        ).toHaveCount(0);
        await multipleTrigger.press('Escape');
        await expect(multipleTrigger).toHaveAttribute('aria-expanded', 'false');
        await expect(multipleTrigger).toBeFocused();

        await single.evaluate((el) =>
          el.style.setProperty('--bulud-dropdown-background', '#123456'),
        );
        await expect(trigger).toHaveCSS('background-color', 'rgb(18, 52, 86)');
        await single.evaluate((el) =>
          el.style.removeProperty('--bulud-dropdown-background'),
        );
        await expect(trigger).toHaveCSS('background-color', surface);
      });

      test('validates the required form on blur and selection and propagates clear back to the form', async ({
        page,
      }) => {
        const scope = page.locator('#dropdown-forms');
        const required = scope.locator('#demo-dropdown-required');
        const trigger = required.getByRole('combobox', {
          name: 'Required framework',
        });
        const status = scope.locator('[aria-live="polite"]');
        const clear = required.getByRole('button', { name: 'Clear selection' });
        await expect(trigger).toHaveAttribute('aria-required', 'true');
        await expect(trigger).not.toHaveAttribute('aria-invalid');
        await expect(trigger).toHaveCSS('background-color', surface);
        await expect(trigger).toHaveCSS('direction', direction);
        await expect(status).toHaveText('Form status: invalid');
        await expect(clear).toHaveCount(0);
        await trigger.click();
        await expect(required.getByRole('searchbox')).toBeFocused();
        await expect(trigger).not.toHaveAttribute('aria-invalid');
        await required.getByRole('searchbox').press('Escape');
        await expect(trigger).toBeFocused();
        await expect(trigger).not.toHaveAttribute('aria-invalid');
        await page.keyboard.press('Tab');
        await expect(trigger).not.toBeFocused();
        await expect(trigger).toHaveAttribute('aria-invalid', 'true');
        await expect(required).toHaveClass(/bulud-dropdown-host--invalid/);
        await expect(trigger).toHaveCSS(
          'border-top-color',
          theme === 'dark' ? 'rgb(251, 113, 133)' : 'rgb(225, 29, 72)',
        );
        await trigger.hover();
        await expect(trigger).toHaveCSS(
          'border-top-color',
          theme === 'dark' ? 'rgb(251, 113, 133)' : 'rgb(225, 29, 72)',
        );
        await trigger.press('ArrowDown');
        await required.getByRole('searchbox').press('Enter');
        await expect(trigger).toHaveText('Angular');
        await expect(trigger).toBeFocused();
        await expect(status).toHaveText('Form status: valid');
        await expect(trigger).not.toHaveAttribute('aria-invalid');
        await expect(required).not.toHaveClass(/bulud-dropdown-host--invalid/);
        await expect(trigger).toHaveAttribute('aria-required', 'true');
        await page.keyboard.press('Tab');
        await expect(clear).toBeFocused();
        await clear.press('Enter');
        await expect(trigger).toBeFocused();
        await expect(clear).toHaveCount(0);
        await expect(trigger).toHaveText('Select an option');
        await expect(status).toHaveText('Form status: invalid');
        await expect(trigger).toHaveAttribute('aria-invalid', 'true');
        await expect(trigger).toHaveAttribute('aria-required', 'true');
        await expect(trigger).toHaveAttribute('aria-expanded', 'false');
        await trigger.click();
        await expect(
          required.getByRole('option', { selected: true }),
        ).toHaveCount(0);
        await required
          .getByRole('option', { name: 'React', exact: true })
          .click();
        await expect(status).toHaveText('Form status: valid');
        await expect(trigger).not.toHaveAttribute('aria-invalid');
      });
    });
  }
}
