import { expect, expectAccessible, test } from './fixtures';

test.describe('phone layout', () => {
  test('menu and catalog filters work on a small screen', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Open menu' }).click();
    await page
      .getByRole('navigation', { name: 'Main navigation' })
      .getByRole('link', { name: 'All products' })
      .click();
    await expect(page.getByRole('heading', { level: 1, name: 'All products' })).toBeVisible();

    await page.getByRole('button', { name: /^Filters/ }).click();
    await page.getByRole('radio', { name: 'Phones' }).check();
    await page.getByRole('button', { name: /^Show \d+ product/ }).click();
    await expect(page).toHaveURL(/category=phones/);
    await expect(page.getByRole('link', { name: 'Nimbus X Phone', exact: true })).toBeVisible();

    // No horizontal page scroll at phone width.
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
    expect(overflow).toBe(false);
    await expectAccessible(page);
  });
});
