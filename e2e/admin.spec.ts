import { expect, expectAccessible, test } from './fixtures';

test.describe('back office', () => {
  test.beforeEach(async ({ loginAs }) => {
    await loginAs('admin');
  });

  test('dashboard figures link to the lists behind them', async ({ page }) => {
    await page.goto('/admin');
    const metrics = page.getByRole('list', { name: 'Store metrics' });
    await expect(metrics.getByRole('link', { name: 'Orders' })).toBeVisible();
    await metrics.getByRole('link', { name: 'Low-stock variants' }).click();
    await expect(page).toHaveURL(/\/admin\/inventory\?lowStock=true/);
    await expect(page.getByRole('switch', { name: 'Low stock only' })).toBeChecked();
  });

  test('creates a draft product with a variant, then finds it in the drafts list', async ({
    page,
  }) => {
    const name = `E2E Desk Lamp ${Date.now()}`;
    await page.goto('/admin/products/new');
    await page.getByRole('textbox', { name: 'Name', exact: true }).fill(name);
    await page.getByRole('textbox', { name: 'Brand' }).fill('Lumen');
    await page.getByRole('textbox', { name: 'SKU' }).fill(`E2E-LAMP-${Date.now()}`);
    await page.getByRole('textbox', { name: 'Price', exact: true }).fill('59.90');
    await page.getByRole('textbox', { name: 'Initial stock' }).fill('12');
    await page.getByRole('textbox', { name: 'Attribute' }).fill('finish');
    await page.getByRole('textbox', { name: 'Value' }).fill('Oak');
    await page.getByRole('button', { name: 'Create product' }).click();

    await expect(page.getByText(`Product ${name} created`)).toBeVisible();
    await expect(page.getByRole('heading', { level: 1, name })).toBeVisible();
    await expect(page.getByRole('table', { name: 'Variants' })).toContainText('finish: Oak');

    await page.goto('/admin/products?status=DRAFT');
    await page.getByRole('searchbox', { name: 'Search products' }).fill('E2E Desk Lamp');
    await expect(page.getByRole('link', { name })).toBeVisible();
  });

  test('records a stock purchase from a variant history', async ({ page }) => {
    await page.goto('/admin/inventory');
    await page
      .getByRole('button', { name: /^Stock history for / })
      .first()
      .click();
    const drawer = page.getByRole('dialog', { name: /^Stock history for / });
    const available = drawer.locator('dl > div').nth(2).locator('dd');
    const before = Number(await available.textContent());

    await drawer.getByRole('textbox', { name: 'Quantity' }).fill('5');
    await drawer.getByRole('textbox', { name: 'Reason' }).fill('E2E supplier delivery');
    await drawer.getByRole('button', { name: 'Record' }).click();
    await expect(page.getByText(/^Stock updated for /)).toBeVisible();
    await expect(available).toHaveText(String(before + 5));
    await expect(drawer.getByRole('table', { name: 'Movement ledger' })).toContainText(
      'E2E supplier delivery',
    );
  });

  test('moves a confirmed order forward', async ({ page }) => {
    await page.goto('/admin/orders?status=CONFIRMED');
    await page.getByRole('table', { name: 'Orders' }).getByRole('link').first().click();
    await page
      .getByRole('group', { name: 'Update status' })
      .getByRole('button', { name: 'Start processing' })
      .click();
    const dialog = page.getByRole('dialog', { name: /^Start processing · ORD-/ });
    await dialog.getByRole('textbox', { name: 'Note (optional)' }).fill('Picked by E2E');
    await dialog.getByRole('button', { name: 'Start processing' }).click();

    await expect(page.getByText(/: Processing$/)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Mark as shipped' })).toBeVisible();
  });

  for (const colorScheme of ['light', 'dark'] as const) {
    test(`admin pages have no axe violations (${colorScheme})`, async ({ page }) => {
      await page.emulateMedia({ colorScheme });
      for (const path of [
        '/admin',
        '/admin/products',
        '/admin/products/new',
        '/admin/categories',
        '/admin/inventory',
        '/admin/orders',
        '/admin/users',
      ]) {
        await page.goto(path);
        await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
        await page.waitForLoadState('networkidle');
        await expectAccessible(page);
      }
    });
  }
});
