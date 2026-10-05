import { USERS } from './env';
import { expect, test } from './fixtures';

test.describe('authentication', () => {
  test('a protected page sends visitors to sign in and back again', async ({ page }) => {
    await page.goto('/orders');
    await expect(page).toHaveURL(/\/login\?redirect=%2Forders/);
    await expect(page.getByText('Sign in to continue.')).toBeVisible();

    await page.getByRole('textbox', { name: 'Email' }).fill(USERS.customer.email);
    await page.getByLabel(/^Password\s*\*?$/).fill('not-the-password');
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page.getByRole('alert')).toContainText('The email or password is incorrect.');

    await page.getByLabel(/^Password\s*\*?$/).fill(USERS.customer.password);
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page).toHaveURL(/\/orders$/);
    await expect(page.getByRole('heading', { level: 1, name: 'Orders' })).toBeVisible();
  });

  test('the session survives a reload (refresh cookie) and ends on sign out', async ({
    page,
    loginAs,
  }) => {
    await loginAs('customer');
    await page.goto('/profile');
    await expect(page.getByRole('heading', { level: 1, name: 'Your account' })).toBeVisible();

    await page.reload();
    await expect(page.getByRole('heading', { level: 1, name: 'Your account' })).toBeVisible();

    await page.getByRole('button', { name: USERS.customer.firstName }).click();
    await page.getByRole('menuitem', { name: 'Sign out' }).click();
    await page.goto('/profile');
    await expect(page).toHaveURL(/\/login/);
  });

  test('customers cannot open the back office', async ({ page, loginAs }) => {
    await loginAs('customer');
    await page.goto('/admin');
    await expect(
      page.getByText('Your account does not have permission to view this page.'),
    ).toBeVisible();
  });
});
