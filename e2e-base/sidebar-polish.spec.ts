import { test, expect } from '@playwright/test';
for (const rtl of [true, false])
  for (const dark of [false, true]) {
    test(`Angour navigation and outlined dropdown search ${rtl} ${dark}`, async ({
      page,
    }) => {
      await page.goto('/components/dropdown');
      if (!rtl)
        await page.getByRole('button', { name: 'Toggle language' }).click();
      if (dark)
        await page.getByRole('switch', { name: 'Toggle theme' }).press('Space');
      const nav = page.locator('base-sidebar');
      const group = nav.getByRole('button', {
        name: rtl ? 'کنترل‌ها و فرم' : 'Controls & forms',
        exact: true,
      });
      await expect(group).toHaveAttribute('aria-expanded', 'true');
      await group.press('Enter');
      await expect(group).toHaveAttribute('aria-expanded', 'false');
      await expect(nav.locator('#menu-controls')).toBeHidden();
      await group.press('Space');
      const section = nav.locator('#sections-dropdown');
      const disclosure = nav.getByRole('button', {
        name: rtl ? 'بخش‌های فهرست انتخاب' : 'Sections: dropdown',
        exact: true,
      });
      await expect(section).toBeVisible();
      await disclosure.click();
      await expect(section).toBeHidden();
      await disclosure.press('Enter');
      const code = section.getByRole('link', {
        name: rtl ? 'نمونه‌کد' : 'Sample code',
        exact: true,
      });
      await code.click();
      await expect(page).toHaveURL(/\/components\/dropdown#code$/);
      await expect(code).toHaveAttribute('aria-current', 'location');
      await expect(code).toHaveCSS('font-weight', '700');
      await page.mouse.move(0, 0);
      await expect(code).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
      await section.getByRole('link', { name: 'API', exact: true }).click();
      await expect(page).toHaveURL(/#api$/);
      await expect(code).not.toHaveAttribute('aria-current', 'location');
      await section
        .getByRole('link', {
          name: rtl ? 'نمایش و حالت‌ها' : 'Example & states',
          exact: true,
        })
        .click();
      await page.getByRole('combobox', { name: 'Framework' }).click();
      const search = page.locator('.bulud-dropdown__search');
      await expect(search).toHaveCSS('border-top-width', '1px');
      await expect(search).toHaveCSS('border-top-left-radius', '8px');
      const input = search.locator('input');
      await expect(input).toBeFocused();
      await expect(input).toHaveCSS('border-top-width', '0px');
      await input.fill('React');
      await expect(
        page.getByRole('option', { name: 'React', exact: true }),
      ).toBeVisible();
      await expect(
        page.getByRole('option', { name: 'Angular', exact: true }),
      ).toHaveCount(0);
      await input.press('ArrowDown');
      await input.press('Enter');
      await expect(page.locator('#example')).toContainText('Selected: React');
      await expect(
        page.getByRole('combobox', { name: 'Framework' }),
      ).toBeFocused();
      const positions = await group.evaluate((el) => {
        const icon = el.querySelector('.menu-icon')!.getBoundingClientRect();
        const arrow = el.querySelector('.chevron')!.getBoundingClientRect();
        return { icon: icon.x, arrow: arrow.x };
      });
      expect(
        rtl
          ? positions.icon > positions.arrow
          : positions.icon < positions.arrow,
      ).toBe(true);
    });
  }
test('navigation opens the destination group after changing routes', async ({
  page,
}) => {
  await page.goto('/components/button');
  const nav = page.locator('base-sidebar');
  await nav.getByRole('button', { name: 'نمودارها', exact: true }).click();
  await nav.getByRole('link', { name: 'نمودار خطی', exact: true }).click();
  await expect(page).toHaveURL(/\/components\/line-chart$/);
  await expect(nav.locator('#sections-line-chart')).toBeVisible();
  await expect(nav.locator('#menu-controls')).toBeHidden();
});

for (const dark of [false, true])
  test(`Pagination input uses Angour primitives ${dark}`, async ({ page }) => {
    await page.goto('/components/pagination');
    if (dark)
      await page.getByRole('switch', { name: 'Toggle theme' }).press('Space');
    const input = page.getByRole('spinbutton', { name: 'Total pages' });
    await expect(input).toHaveClass('bulud-input');
    await expect(input).toHaveCSS('border-top-left-radius', '8px');
    await expect(input).toHaveCSS('padding-top', '12px');
    await expect(input).toHaveCSS(
      'background-color',
      dark ? 'rgb(0, 0, 0)' : 'rgb(243, 246, 249)',
    );
    await input.fill('3');
    await input.press('Tab');
    await expect(page.locator('bulud-pagination')).toContainText('3');
    await input.fill('0');
    await input.press('Tab');
    await expect(input).toHaveValue('1');
    await input.fill('');
    await input.press('Tab');
    await expect(input).toHaveValue('1');
    await input.fill('1.5');
    await input.press('Tab');
    await expect(input).toHaveValue('1');
  });
