import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

test('supports accessible label and keyboard/pointer activation exactly once', async ({
  page,
}) => {
  const section = page.locator('#checkbox');
  const checkbox = section.getByRole('checkbox', { name: 'Accept terms' });

  await expect(checkbox).toHaveAttribute('aria-invalid', 'true');
  await checkbox.focus();
  await page.keyboard.press('Space');
  await expect(checkbox).toBeChecked();
  await expect(section.locator('#checkbox-state')).toHaveText('Accepted');
  await checkbox.press('Space');
  await expect(checkbox).not.toBeChecked();
  await section.getByText('Accept terms', { exact: true }).click();
  await expect(checkbox).toBeChecked();
  await expect(section.locator('#checkbox-state')).toHaveText('Accepted');
});

test('covers disabled, indeterminate, required, dark theme and instance overrides', async ({
  page,
}) => {
  const section = page.locator('#checkbox');
  const checkbox = section.getByRole('checkbox', { name: 'Accept terms' });
  const indeterminateToggle = section
    .locator('label')
    .filter({ hasText: 'Indeterminate' })
    .locator('input');

  await indeterminateToggle.click();
  await expect(indeterminateToggle).toBeChecked();
  await expect(checkbox).toHaveJSProperty('indeterminate', true);
  await checkbox.press('Space');
  await expect(checkbox).toBeChecked();
  await expect(checkbox).toHaveJSProperty('indeterminate', false);
  await expect(indeterminateToggle).not.toBeChecked();
  await section.getByText('Disabled', { exact: true }).click();
  await expect(checkbox).toBeDisabled();
  await checkbox.click({ force: true });
  await expect(section.locator('#checkbox-state')).toHaveText('Accepted');
  await section.getByText('Disabled', { exact: true }).click();
  await section.getByText('Indeterminate', { exact: true }).click();
  await expect(checkbox).toHaveJSProperty('indeterminate', false);
  await checkbox.click();
  await expect(checkbox).not.toBeChecked();
  await section.getByText('Dark theme', { exact: true }).click();
  await expect(checkbox).toHaveCSS('background-color', 'rgb(15, 23, 42)');
  await checkbox.press('Space');
  await expect(checkbox).toBeChecked();
  await expect(checkbox).toHaveCSS('background-color', 'rgb(96, 165, 250)');
  await expect(
    section.getByRole('checkbox', { name: 'Instance theme' }),
  ).toHaveCSS('background-color', 'rgb(20, 83, 45)');
});
