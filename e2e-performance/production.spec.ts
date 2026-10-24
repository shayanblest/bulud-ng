import { expect, test } from '@playwright/test';
test('production deep link sends compressed cached assets without HMR and retains URL state', async ({
  page,
}) => {
  const scripts: string[] = [];
  const sockets: string[] = [];
  page.on('request', (request) => {
    if (request.resourceType() === 'script') scripts.push(request.url());
  });
  page.on('websocket', (socket) => sockets.push(socket.url()));
  const response = await page.goto('/shared?filter=status:eq(%22draft%22)');
  expect(response?.status()).toBe(200);
  expect(response?.headers()['cache-control']).toBe('no-cache');
  expect(response?.headers()['content-encoding']).toBe('br');
  await expect(
    page.getByRole('heading', { name: 'ابزارهای مشترک پروژه‌ها', exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole('table').locator('tbody tr').first(),
  ).toContainText('draft');
  expect(
    scripts.some(
      (url) =>
        url.includes('/@vite/') ||
        url.includes('vite/client') ||
        url.includes('angular_debug'),
    ),
  ).toBe(false);
  expect(sockets).toEqual([]);
  const script = scripts.find((url) => /main-[A-Z0-9]+\.js/i.test(url));
  expect(script).toBeTruthy();
  const asset = await page.request.get(script!);
  expect(asset.headers()['cache-control']).toBe(
    'public, max-age=31536000, immutable',
  );
  expect(asset.headers()['content-encoding']).toMatch(/gzip|br/);
  const cached = await page.request.get(script!, {
    headers: {
      'If-None-Match': asset.headers()['etag'],
      'Accept-Encoding': asset.headers()['content-encoding'],
    },
  });
  expect(cached.status()).toBe(304);
  await page.getByRole('button', { name: 'Toggle language' }).click();
  await expect(page.locator('html')).toHaveAttribute('dir', 'ltr');
  await page.getByRole('switch', { name: 'Toggle theme' }).press('Space');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
test('cross-document back navigation restores the production document from bfcache', async ({
  page,
}) => {
  await page.goto('/shared?search=Project');
  await expect(
    page.getByRole('heading', { name: 'ابزارهای مشترک پروژه‌ها', exact: true }),
  ).toBeVisible();
  await page.evaluate(() => {
    window.addEventListener('pageshow', (event) => {
      document.documentElement.dataset['restoredFromCache'] = String(
        event.persisted,
      );
    });
  });
  await page.goto('/forms');
  await expect(page.locator('form')).toBeVisible();
  // BFCache restores an existing document without a new load event.
  await page.goBack({ waitUntil: 'commit' });
  await expect(page.locator('html')).toHaveAttribute(
    'data-restored-from-cache',
    'true',
  );
  await expect(page).toHaveURL(/shared\?search=Project/);
});
