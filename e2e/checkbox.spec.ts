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
  await checkbox.hover();
  await expect(checkbox).toHaveCSS('background-color', 'rgb(37, 99, 235)');
  await checkbox.press('Space');
  await expect(checkbox).not.toBeChecked();
  await expect(checkbox).toHaveCSS('background-color', 'rgb(248, 250, 252)');
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
  await checkbox.hover();
  await expect(checkbox).toHaveCSS('background-color', 'rgb(37, 99, 235)');
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
  await page.mouse.move(0, 0);
  await page.evaluate(() => document.documentElement.classList.add('dark'));
  await expect(checkbox).toHaveCSS('background-color', 'rgb(15, 23, 42)');
  await page.evaluate(() => document.documentElement.classList.remove('dark'));
  await page.evaluate(() =>
    document.documentElement.setAttribute('data-theme', 'dark'),
  );
  await expect(checkbox).toHaveCSS('background-color', 'rgb(15, 23, 42)');
  await page.evaluate(() =>
    document.documentElement.removeAttribute('data-theme'),
  );
  await section.getByText('Dark theme', { exact: true }).click();
  await expect(checkbox).toHaveCSS('background-color', 'rgb(15, 23, 42)');
  await checkbox.press('Space');
  await expect(checkbox).toBeChecked();
  await expect(checkbox).toHaveCSS('background-color', 'rgb(96, 165, 250)');
  const instance = section.getByRole('checkbox', { name: 'Instance theme' });
  await expect(instance).toHaveCSS('background-color', 'rgb(20, 83, 45)');
  await expect
    .poll(() =>
      instance.evaluate((element) =>
        getComputedStyle(element, '::after').getPropertyValue('height'),
      ),
    )
    .toBe('16px');
  expect(
    await instance.evaluate(
      (element) => getComputedStyle(element.parentElement!).gap,
    ),
  ).toBe('16px');
  await page.evaluate(() => (document.documentElement.dir = 'rtl'));
  await expect
    .poll(() =>
      checkbox.evaluate((element) => {
        const styles = getComputedStyle(element, '::after');
        return [styles.borderRightWidth, styles.borderLeftWidth];
      }),
    )
    .toEqual(['2px', '0px']);
  await page.evaluate(() => document.documentElement.removeAttribute('dir'));
});
