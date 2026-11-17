import { test, expect } from '@playwright/test';
test('loads complete control tokens once, before activating the first feature route', async ({
  page,
}) => {
  await page.goto('/');
  await expect(page.locator('base-root')).toBeVisible();
  await expect(page.locator('link[data-bulud-feature-theme]')).toHaveCount(0);
  await page.locator('a[href="/components"]').first().click();
  await expect(page.locator('link[data-bulud-feature-theme]')).toHaveCount(1);
  await expect(page.locator('feature-frame')).toHaveCount(0);
  await page
    .getByRole('link', { name: /skeleton/i })
    .first()
    .click();
  await expect(page.locator('bulud-skeleton').first()).toBeVisible();
  await expect(page.locator('link[data-bulud-feature-theme]')).toHaveCount(1);
});
