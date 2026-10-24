import { expect, test } from '@playwright/test';
test('sends real multipart data to the discard-only local receiver with no request interception', async ({
  page,
}) => {
  await page.goto('/shared');
  await page.getByRole('button', { name: 'Toggle language' }).click();
  const upload = page.locator('bulud-file-upload');
  await upload.locator('input[type=file]').setInputFiles({
    name: 'sample.csv',
    mimeType: 'text/csv',
    buffer: Buffer.from('name,value\nexample,42'),
  });
  const response = page.waitForResponse(
    (response) =>
      response.url().endsWith('/api/demo-upload') &&
      response.request().method() === 'POST',
  );
  await upload
    .getByRole('button', { name: 'Upload files', exact: true })
    .click();
  const received = await response;
  expect(received.status()).toBe(200);
  expect(await received.json()).toEqual({
    stored: false,
    receivedBytes: expect.any(Number),
  });
  expect((await received.json()).receivedBytes).toBeGreaterThan(21);
  await expect(upload).toContainText('Files uploaded successfully');
  await expect(upload.getByRole('progressbar')).toHaveAttribute('value', '100');
  await upload
    .getByRole('button', { name: 'Clear files', exact: true })
    .click();
  await expect(upload.locator('.file-list')).toHaveCount(0);
  await expect(upload.getByRole('progressbar')).toHaveCount(0);
});
