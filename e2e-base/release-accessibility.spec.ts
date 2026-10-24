import { test, expect } from '@playwright/test';
test('release language control includes visible text in its accessible name', async ({
  page,
}) => {
  await page.goto('/components/alert');
  const language = page.getByRole('button', { name: 'Toggle language' });
  await expect(language).toHaveText('English');
  await expect(language).toHaveAccessibleName('Toggle language: English');
  await language.click();
  await expect(language).toHaveText('فارسی');
  await expect(language).toHaveAccessibleName('Toggle language: فارسی');
});
