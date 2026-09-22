import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.locator('#dialog').scrollIntoViewIfNeeded();
});

test('opens with semantics, initial focus, trapping, and restoration', async ({
  page,
}) => {
  const section = page.locator('#dialog');
  const trigger = section.getByRole('button', { name: 'Open dialog' });
  await trigger.click();

  const dialog = page.getByRole('dialog', { name: 'Review changes' });
  await expect(dialog).toHaveAttribute('aria-modal', 'true');
  await expect(dialog).toHaveAttribute(
    'aria-describedby',
    'dialog-description',
  );
  await expect(section.locator('#dialog-name')).toBeFocused();

  await section.locator('#dialog-name').press('Tab');
  await expect(dialog.getByRole('button', { name: 'Cancel' })).toBeFocused();
  await dialog.getByRole('button', { name: 'Save changes' }).press('Tab');
  await expect(section.locator('#dialog-name')).toBeFocused();
  await section.locator('#dialog-name').press('Shift+Tab');
  await expect(
    dialog.getByRole('button', { name: 'Save changes' }),
  ).toBeFocused();

  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();
});

test('lets a native popover light-dismiss before the containing Dialog', async ({
  page,
}) => {
  const supported = await page.evaluate(
    () =>
      typeof (HTMLElement.prototype as HTMLElement & {
        showPopover?: unknown;
      }).showPopover === 'function',
  );
  test.skip(!supported, 'Native popover APIs are unavailable.');

  const section = page.locator('#dialog');
  const trigger = section.getByRole('button', { name: 'Open dialog' });
  await trigger.click();
  const dialog = page.getByRole('dialog', { name: 'Review changes' });
  const popover = dialog.locator('#dialog-test-popover');

  await dialog.evaluate((element) => {
    const popover = document.createElement('div');
    popover.id = 'dialog-test-popover';
    popover.setAttribute('popover', 'auto');
    const action = document.createElement('button');
    action.type = 'button';
    action.textContent = 'Popover action';
    popover.append(action);
    element.append(popover);
    (
      popover as HTMLDivElement & { showPopover: () => void }
    ).showPopover();
    action.focus();
  });
  await expect(popover).toBeVisible();

  await page.keyboard.press('Escape');
  await expect(popover).toBeHidden();
  await expect(dialog).toBeVisible();

  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();
});

test('supports disabled Escape and backdrop policies', async ({ page }) => {
  const section = page.locator('#dialog');
  const trigger = section.getByRole('button', { name: 'Open dialog' });
  const escapeToggle = section.getByText('Escape close', { exact: true });
  const backdropToggle = section.getByText('Backdrop close', { exact: true });

  await escapeToggle.click();
  await trigger.click();
  const dialog = page.getByRole('dialog', { name: 'Review changes' });
  await page.keyboard.press('Escape');
  await expect(dialog).toBeVisible();
  await page
    .locator('.bulud-dialog__backdrop')
    .click({ position: { x: 2, y: 2 } });
  await expect(dialog).toBeHidden();

  await backdropToggle.click();
  await trigger.click();
  await page
    .locator('.bulud-dialog__backdrop')
    .click({ position: { x: 2, y: 2 } });
  await expect(dialog).toBeVisible();
  await page.getByRole('button', { name: 'Cancel' }).click();
  await expect(dialog).toBeHidden();
});

test('supports dark theme, RTL, and instance geometry override', async ({
  page,
}) => {
  const section = page.locator('#dialog');
  await section.getByText('Dark theme', { exact: true }).click();
  await section.getByRole('button', { name: 'Open dialog' }).click();
  const dialog = page.getByRole('dialog', { name: 'Review changes' });

  await expect(dialog).toHaveCSS('background-color', 'rgb(15, 23, 42)');
  await expect(dialog).toHaveCSS('max-width', '640px');
  await page.evaluate(() => (document.documentElement.dir = 'rtl'));
  await expect(dialog).toBeVisible();
  await page.keyboard.press('Escape');
  await page.evaluate(() => document.documentElement.removeAttribute('dir'));
});

test('keeps the overlay in the viewport top layer under clipped ancestors', async ({
  page,
}) => {
  const section = page.locator('#dialog');
  await section.locator('bulud-dialog').evaluate((dialog) => {
    const shell = document.createElement('div');
    shell.style.contain = 'paint';
    shell.style.overflow = 'hidden';
    shell.style.transform = 'translateZ(0)';
    dialog.replaceWith(shell);
    shell.append(dialog);
  });

  await section.getByRole('button', { name: 'Open dialog' }).click();
  const overlay = page.locator('dialog.bulud-dialog__overlay');
  await expect(overlay).toHaveAttribute('open', '');
  await expect
    .poll(() => overlay.evaluate((element) => element.matches(':modal')))
    .toBe(true);

  const viewport = page.viewportSize();
  const box = await overlay.boundingBox();
  expect(box?.x).toBe(0);
  expect(box?.y).toBe(0);
  expect(box?.width).toBe(viewport?.width);
  expect(box?.height).toBe(viewport?.height);
});
