import { test, expect } from '@playwright/test';
import { CATALOG } from '../projects/base/src/catalog/catalog';
for (const dark of [false, true])
  for (const rtl of [true, false])
    test(`Catalog, automatic required labels and chat ${dark} ${rtl}`, async ({
      page,
    }) => {
      const errors: string[] = [];
      page.on('pageerror', (error) => errors.push(error.message));
      await page.goto('/');
      if (!rtl)
        await page.getByRole('button', { name: 'Toggle language' }).click();
      if (dark)
        await page.getByRole('switch', { name: 'Toggle theme' }).press('Space');
      await expect(
        page
          .getByRole('navigation', {
            name: rtl ? 'ناوبری اصلی' : 'Main navigation',
          })
          .getByRole('link', { name: 'Demo', exact: true }),
      ).toHaveCount(0);
      await page.goto('/components');
      await page.locator('#component-search').fill('chat');
      await expect(page.locator('.cards a')).toHaveCount(1);
      await page.locator('.cards a').click();
      await expect(page.locator('h1')).toContainText('Chat');
      const chat = page.locator('bulud-chat');
      await expect(chat.locator('.message')).toHaveCount(3);
      const sides = await chat
        .locator('.message')
        .evaluateAll((nodes) =>
          nodes.map((el) => el.getBoundingClientRect().left),
        );
      expect(rtl ? sides[1] < sides[0] : sides[1] > sides[0]).toBe(true);
      await chat.locator('textarea').fill('Example message');
      await chat.locator('textarea').press('Control+Enter');
      await expect(chat.locator('.message')).toHaveCount(5);
      await expect(chat.locator('textarea')).toHaveValue('');
      await page
        .getByRole('checkbox', { name: 'Fail next message', exact: true })
        .check();
      await chat.locator('textarea').fill('Retry example');
      await chat.locator('textarea').press('Control+Enter');
      await expect(chat.locator('.status.failed')).toBeVisible();
      await chat
        .getByRole('button', {
          name: rtl ? 'ارسال مجدد' : 'Retry message',
          exact: true,
        })
        .click();
      await expect(chat.locator('.status.failed')).toHaveCount(0);
      await page
        .getByRole('checkbox', { name: 'Custom theme', exact: true })
        .check();
      await expect(chat).toHaveCSS('--bulud-chat-accent', '#8040c0');
      await page
        .getByRole('checkbox', { name: 'Loading', exact: true })
        .check();
      await expect(chat.getByRole('log')).toHaveAttribute('aria-busy', 'true');
      await page
        .getByRole('checkbox', { name: 'Loading', exact: true })
        .uncheck();
      await page
        .getByRole('checkbox', { name: 'Disabled', exact: true })
        .check();
      await expect(chat.locator('textarea')).toBeDisabled();
      await page
        .getByRole('checkbox', { name: 'Disabled', exact: true })
        .uncheck();
      await page.goto('/components/field-label');
      const label = page.locator('label[buludFieldLabel]');
      await expect(label.locator('.marker')).toBeVisible();
      await page.locator('#required-example').fill('Valid name');
      await expect(label.locator('.marker')).toBeVisible();
      await page
        .getByRole('checkbox', { name: 'Required', exact: true })
        .uncheck();
      await expect(label.locator('.marker')).toHaveCount(0);
      await page.goto('/components/badge');
      const badge = page.locator('.bulud-badge--primary').first();
      await expect(badge).toHaveCSS('border-top-left-radius', '6px');
      await expect(badge).toHaveCSS(
        'background-color',
        dark ? 'rgb(253, 181, 21)' : 'rgb(12, 35, 64)',
      );
      await page.setViewportSize({ width: 390, height: 844 });
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      expect(errors).toEqual([]);
    });
test('every feature has its own lazy page, live example and sample code', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  for (const feature of CATALOG) {
    await page.goto('/components/' + feature.id);
    await expect(page.locator('feature-frame h1').first()).toBeVisible();
    await expect(page.locator('#example')).toBeVisible();
    await expect(page.locator('#code code')).not.toBeEmpty();
    await expect(page.locator('#api')).toContainText('API');
  }
  expect(errors).toEqual([]);
});
test('component submenus navigate to code and the old Demo redirects', async ({
  page,
}) => {
  await page.goto('/demo');
  await expect(page).toHaveURL(/\/components$/);
  await page.goto('/components/button');
  const sidebar = page.locator('base-sidebar');
  await sidebar
    .getByRole('link', { name: 'نمونه‌کد', exact: true })
    .first()
    .click();
  await expect(page).toHaveURL(/#code$/);
  await expect
    .poll(() =>
      page
        .locator('#code')
        .evaluate((el) => Math.abs(el.getBoundingClientRect().top)),
    )
    .toBeLessThan(200);
});

test('mobile navigation reserves a stable collapsed menu and opens accessibly', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/components/chat');
  const menu = page.getByRole('button', { name: 'منوی کامپوننت‌ها' });
  await expect(menu).toHaveAttribute('aria-expanded', 'false');
  await expect(page.locator('#navigation-panel')).toBeHidden();
  await menu.click();
  await expect(menu).toHaveAttribute('aria-expanded', 'true');
  await expect(page.locator('#navigation-panel')).toBeVisible();
  await page
    .locator('#navigation-panel')
    .getByRole('link', { name: 'نمای کلی', exact: true })
    .click();
  await expect(page).toHaveURL(/\/$/);
});
