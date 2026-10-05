import { expect, expectAccessible, test } from './fixtures';

test.describe('storefront', () => {
  test('browse a category, search, sort and keep it all in the URL', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    await page
      .getByRole('navigation', { name: 'Main navigation' })
      .getByRole('link', { name: 'Apparel' })
      .click();
    await expect(page).toHaveURL(/\/categories\/apparel$/);
    await expect(page.getByRole('heading', { level: 1, name: 'Apparel' })).toBeVisible();

    await page.goto('/products');
    await page.getByRole('searchbox', { name: 'Search in results' }).fill('phone');
    await expect(page).toHaveURL(/search=phone/);
    await expect(page.getByRole('link', { name: 'Nimbus X Phone', exact: true })).toBeVisible();

    await page.getByRole('combobox', { name: 'Sort by' }).click();
    await page.getByRole('option', { name: 'Price: low to high' }).click();
    await expect(page).toHaveURL(/sort=price_asc/);

    // The URL is the state: a reload shows the same results.
    await page.reload();
    await expect(page.getByRole('searchbox', { name: 'Search in results' })).toHaveValue('phone');
    await expect(page.getByRole('combobox', { name: 'Sort by' })).toHaveText('Price: low to high');
  });

  test('pick a variant on the product page; visitors are asked to sign in to buy', async ({
    page,
  }) => {
    await page.goto('/products/nimbus-x-phone');
    await expect(page.getByRole('heading', { level: 1, name: 'Nimbus X Phone' })).toBeVisible();

    const colors = page.getByRole('group', { name: 'Color' });
    await colors.getByRole('button', { name: /^White/ }).click();
    await expect(page).toHaveURL(/variant=/);
    await expect(colors.getByRole('button', { name: /^White/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    );

    await page.getByRole('link', { name: 'Sign in to add to cart' }).click();
    await expect(page).toHaveURL(/\/login\?redirect=%2Fproducts%2Fnimbus-x-phone/);
  });

  test('switches language and theme without reloading, and remembers them', async ({ page }) => {
    await page.goto('/products');
    await page.getByRole('button', { name: 'Theme · Language' }).click();
    await page.getByRole('button', { name: 'Dark' }).click();
    await page
      .getByRole('group', { name: 'Language' })
      .getByRole('button', { name: 'Español' })
      .click();
    await page.keyboard.press('Escape');

    await expect(
      page.getByRole('heading', { level: 1, name: 'Todos los productos' }),
    ).toBeVisible();
    await expect(page.locator('html')).toHaveAttribute('lang', 'es');
    await expect(page.locator('html')).toHaveAttribute('data-color-scheme', 'dark');

    await page.reload();
    await expect(
      page.getByRole('heading', { level: 1, name: 'Todos los productos' }),
    ).toBeVisible();
    await expect(page.locator('html')).toHaveAttribute('data-color-scheme', 'dark');
  });

  for (const colorScheme of ['light', 'dark'] as const) {
    test(`public pages have no axe violations (${colorScheme})`, async ({ page }) => {
      await page.emulateMedia({ colorScheme });
      for (const path of [
        '/',
        '/products',
        '/categories/electronics',
        '/products/nimbus-x-phone',
        '/login',
        '/register',
      ]) {
        await page.goto(path);
        await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
        await page.waitForLoadState('networkidle');
        await expectAccessible(page);
      }
    });
  }
});
