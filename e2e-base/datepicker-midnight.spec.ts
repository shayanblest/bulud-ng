import { test, expect } from '@playwright/test';

test.use({ timezoneId: 'Asia/Tehran' });
for (const language of ['fa', 'en'] as const)
  for (const mode of ['single', 'range'] as const)
    test(`datepicker refreshes the local day across midnight: ${language} ${mode}`, async ({
      page,
    }) => {
      // UTC is still December 31 when Tehran has entered January 1.
      await page.clock.setFixedTime(new Date('2026-12-31T20:29:00Z'));
      await page.goto('/components/datepicker');
      if ((await page.locator('html').getAttribute('lang')) !== language)
        await page.getByRole('button', { name: 'Toggle language' }).click();
      if (language === 'fa')
        await page.getByRole('switch', { name: 'Toggle theme' }).press('Space');
      const picker = page
        .locator('bulud-datepicker')
        .nth(mode === 'single' ? 0 : 1);
      const trigger = picker.locator('.bulud-datepicker__trigger');
      await expect(trigger).toBeVisible();
      await page.clock.setFixedTime(new Date('2026-12-31T20:31:00Z'));
      await trigger.click();
      const firstToday = picker.locator('[data-date="2027-01-01"]');
      await expect(firstToday).toBeFocused();
      await expect(firstToday).toHaveAttribute('aria-current', 'date');
      await expect(picker.locator('[aria-current="date"]')).toHaveCount(1);
      // Keep the mounted, open calendar across another local midnight.
      await page.clock.setFixedTime(new Date('2027-01-01T20:31:00Z'));
      await firstToday.press('Control+Home');
      const nextToday = picker.locator('[data-date="2027-01-02"]');
      await expect(nextToday).toBeFocused();
      await expect(nextToday).toHaveAttribute('aria-current', 'date');
      await expect(firstToday).not.toHaveAttribute('aria-current', 'date');
      await expect(picker.locator('[aria-current="date"]')).toHaveCount(1);
      await nextToday.press('Escape');
      await expect(trigger).toBeFocused();
      await trigger.click();
      await expect(nextToday).toBeFocused();
    });
