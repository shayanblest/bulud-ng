import { test, expect } from '@playwright/test';
test.use({ timezoneId: 'Asia/Tehran' });
for (const language of ['fa', 'en'] as const)
  for (const mode of ['single', 'range'] as const)
    test(`pointer clears optional ${language} ${mode} date`, async ({
      page,
    }) => {
      await page.clock.setFixedTime(new Date('2027-01-15T12:00:00Z'));
      await page.goto('/components/datepicker');
      if ((await page.locator('html').getAttribute('lang')) !== language)
        await page.getByRole('button', { name: 'Toggle language' }).click();
      const picker = page
        .locator('bulud-datepicker')
        .nth(mode === 'single' ? 0 : 1);
      const trigger = picker.locator('.bulud-datepicker__trigger');
      await trigger.click();
      await picker.locator('[data-date="2027-01-15"]').click();
      if (mode === 'range')
        await picker.locator('[data-date="2027-01-17"]').click();
      await expect(trigger).toHaveAttribute('aria-expanded', 'false');
      await trigger.click();
      await picker
        .getByRole('button', {
          name: language === 'fa' ? 'پاک کردن تاریخ' : 'Clear date',
          exact: true,
        })
        .click();
      await expect(trigger).toBeFocused();
      await expect(trigger).toHaveAttribute('aria-expanded', 'false');
      await trigger.click();
      await expect(
        picker.locator('[role=gridcell][aria-selected=true]'),
      ).toHaveCount(0);
      await expect(picker.locator('.bulud-datepicker__clear')).toHaveCount(0);
    });
for (const calendar of ['gregory', 'persian'] as const)
  test(`period clear uses the fresh ${calendar} year after local New Year`, async ({
    page,
  }) => {
    const gregory = calendar === 'gregory';
    await page.clock.setFixedTime(
      new Date(gregory ? '2026-12-31T20:29:00Z' : '2026-03-20T20:29:00Z'),
    );
    await page.goto('/components/period-picker');
    const picker = page.locator('bulud-period-picker').nth(gregory ? 1 : 0);
    const input = picker.locator('input[type=number]');
    await expect(input).toHaveValue(gregory ? '2026' : '1404');
    if (gregory) {
      await input.fill('2025');
      await input.press('Tab');
    } else await picker.locator('.months button').first().click();
    await expect(
      picker.getByRole('button', { name: 'Clear selection', exact: true }),
    ).toBeEnabled();
    await page.clock.setFixedTime(
      new Date(gregory ? '2026-12-31T20:31:00Z' : '2026-03-20T20:31:00Z'),
    );
    await picker
      .getByRole('button', { name: 'Clear selection', exact: true })
      .click();
    await expect(input).toHaveValue(gregory ? '2027' : '1405');
  });
