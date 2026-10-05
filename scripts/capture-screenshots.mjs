/**
 * Captures the README screenshots against the production build (vite preview) and a freshly
 * seeded API, so they always show real data and can be regenerated after UI changes:
 *
 *   npm run build && npm run preview          # http://localhost:4173
 *   npm run screenshots                       # writes docs/screenshots/*.png
 *
 * The API must allow http://localhost:4173 (CORS) and have rate limiting off, e.g. started with
 * e2e/compose.e2e.yml. The seed wipes the API's database (development data only).
 */
import { execSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { chromium } from '@playwright/test';

const APP = process.env.SCREENSHOT_APP_URL ?? 'http://localhost:4173';
const API = (process.env.SCREENSHOT_API_URL ?? 'http://localhost:3000').replace(/\/+$/, '');
const OUT = 'docs/screenshots';
// Development-only accounts created by the API's seed.
const USERS = {
  customer: { email: 'customer@example.com', password: 'Password123!' },
  admin: { email: 'admin@example.com', password: 'Password123!' },
};
const DESKTOP = { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 };
const PHONE = {
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
};

mkdirSync(OUT, { recursive: true });

if (!process.env.SCREENSHOT_SKIP_SEED) {
  const seed = process.env.SCREENSHOT_SEED_COMMAND ?? 'npm --prefix ../ecommerce-api run db:seed';
  console.log(`seeding: ${seed}`);
  execSync(seed, { stdio: 'inherit' });
}

// ---------------------------------------------------------------- API helpers (test data setup)

async function apiLogin(role) {
  const response = await fetch(`${API}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(USERS[role]),
  });
  if (!response.ok) throw new Error(`login ${role}: ${response.status}`);
  return (await response.json()).data.accessToken;
}

async function api(token, method, path, body, headers = {}) {
  const response = await fetch(`${API}${path}`, {
    method,
    headers: {
      authorization: `Bearer ${token}`,
      ...(body === undefined ? {} : { 'content-type': 'application/json' }),
      ...headers,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!response.ok && response.status !== 204) {
    throw new Error(`${method} ${path}: ${response.status} ${await response.text()}`);
  }
  return response.status === 204 ? null : (await response.json()).data;
}

/** A product with an in-stock variant whose neighbour (one attribute apart) is sold out. */
async function findProductWithSoldOutOption(token) {
  const list = await api(token, 'GET', '/api/v1/products?pageSize=50');
  for (const summary of list) {
    const product = await api(token, 'GET', `/api/v1/products/${summary.slug}`);
    const variants = product.variants.filter((v) => v.isActive);
    for (const soldOut of variants.filter((v) => v.availableQuantity === 0)) {
      const inStock = variants.find((v) => {
        if (v.availableQuantity < 3) return false;
        const keys = Object.keys(v.attributes);
        const differing = keys.filter((k) => v.attributes[k] !== soldOut.attributes[k]);
        return keys.length > 1 && differing.length === 1;
      });
      if (inStock) return { product, inStock, soldOut };
    }
  }
  throw new Error('No product with a sold-out option in the seed data');
}

// ---------------------------------------------------------------- browser helpers

const browser = await chromium.launch();

async function context(options = {}, { role, language, storage } = {}) {
  const ctx = await browser.newContext({
    baseURL: APP,
    locale: language === 'es' ? 'es-ES' : 'en-US',
    reducedMotion: 'reduce',
    colorScheme: 'light',
    ...DESKTOP,
    ...options,
  });
  await ctx.addInitScript(
    ([lang, extra]) => {
      localStorage.setItem('kestrel.language', lang);
      for (const [key, value] of Object.entries(extra)) localStorage.setItem(key, value);
    },
    [language ?? 'en', storage ?? {}],
  );
  if (role) {
    const response = await ctx.request.post(`${API}/api/v1/auth/login`, { data: USERS[role] });
    if (!response.ok()) throw new Error(`browser login ${role}: ${response.status()}`);
  }
  return ctx;
}

/** Waits for data, fonts and toasts to settle, then captures the viewport. */
async function shot(page, name) {
  await page.waitForLoadState('networkidle');
  await page.evaluate(() => document.fonts.ready);
  await page
    .locator('[role="status"] .MuiAlert-root')
    .waitFor({ state: 'detached', timeout: 8000 })
    .catch(() => undefined);
  await page.mouse.move(0, 0);
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${OUT}/${name}.png` });
  console.log(`  ✓ ${name}.png`);
}

/** `offset` leaves room for the storefront's sticky header (the admin toolbar scrolls away). */
async function scrollTo(page, locator, offset = 88) {
  await locator.evaluate((el, gap) => {
    window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - gap });
  }, offset);
}

// ---------------------------------------------------------------- data for the scenes

const adminToken = await apiLogin('admin');
const customerToken = await apiLogin('customer');
const { product, inStock } = await findProductWithSoldOutOption(adminToken);

// Cart scene: one line whose price "changed" since it was added (remembered higher in the
// browser) and one line asking for more units than remain (stock lowered by an adjustment).
await api(customerToken, 'DELETE', '/api/v1/cart');
await api(customerToken, 'POST', '/api/v1/cart/items', { variantId: inStock.id, quantity: 1 });
const all = await api(adminToken, 'GET', '/api/v1/products?pageSize=50');
let shortVariant;
for (const summary of all) {
  if (summary.id === product.id) continue;
  const detail = await api(adminToken, 'GET', `/api/v1/products/${summary.slug}`);
  shortVariant = detail.variants.find((v) => v.isActive && v.availableQuantity >= 4);
  if (shortVariant) break;
}
await api(customerToken, 'POST', '/api/v1/cart/items', {
  variantId: shortVariant.id,
  quantity: 3,
});
await api(adminToken, 'POST', `/api/v1/inventory/${shortVariant.id}/movements`, {
  type: 'ADJUSTMENT',
  quantity: -(shortVariant.availableQuantity - 1),
  reason: 'Cycle count: damaged units removed',
});

console.log('capturing…');

// 1. Home, light and dark
{
  const ctx = await context();
  const page = await ctx.newPage();
  await page.goto('/');
  await page.getByRole('heading', { level: 1 }).waitFor();
  await shot(page, '01-home');
  await ctx.close();
}
{
  const ctx = await context({ colorScheme: 'dark' });
  const page = await ctx.newPage();
  await page.goto('/');
  await page.getByRole('heading', { level: 1 }).waitFor();
  await shot(page, '02-home-dark');
  await ctx.close();
}

// 2. Catalog with category, price range and sort
{
  const ctx = await context();
  const page = await ctx.newPage();
  await page.goto('/products?category=electronics&minPrice=50&maxPrice=1500&sort=price_asc');
  await page.getByRole('heading', { level: 1 }).waitFor();
  await shot(page, '03-catalog-filters');
  await ctx.close();
}

// 3. Product page with a variant selected and a sold-out option
{
  const ctx = await context();
  const page = await ctx.newPage();
  await page.goto(`/products/${product.slug}?variant=${encodeURIComponent(inStock.sku)}`);
  await page.getByRole('heading', { level: 1, name: product.name }).waitFor();
  await shot(page, '04-product-variants');
  await ctx.close();
}

// 4–7. Cart, checkout (declined then paid), confirmation, order detail and invoice
let paidOrderPath;
{
  const ctx = await context(
    {},
    {
      role: 'customer',
      storage: {
        'kestrel.cart-prices': JSON.stringify({ [inStock.id]: inStock.priceCents + 1500 }),
      },
    },
  );
  const page = await ctx.newPage();
  await page.goto('/cart');
  await page.getByText(/Only \d+ left/).waitFor();
  await shot(page, '05-cart-notices');

  // Resolve the stock conflict so the cart can be checked out.
  const cart = await api(customerToken, 'GET', '/api/v1/cart');
  const shortLine = cart.items.find((item) => item.variantId === shortVariant.id);
  await api(customerToken, 'DELETE', `/api/v1/cart/items/${shortLine.id}`);

  await page.goto('/checkout');
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: /^Place order/ }).click();
  await page.getByRole('heading', { name: 'Payment' }).waitFor();
  await page.getByRole('radio', { name: 'Card declined' }).check();
  await page.getByRole('button', { name: /^Pay / }).click();
  await page.getByText(/The payment did not go through/).waitFor({ timeout: 30_000 });
  await page.getByRole('radio', { name: 'Successful payment' }).check();
  await page.evaluate(() => {
    window.scrollTo(0, 0);
  });
  await shot(page, '06-checkout-payment');

  await page.getByRole('button', { name: /^Pay / }).click();
  await page.getByText('Thank you! Your order is confirmed.').waitFor({ timeout: 30_000 });
  await shot(page, '07-checkout-confirmation');

  await page.getByRole('link', { name: 'View order details' }).click();
  await page.getByRole('button', { name: /^View invoice/ }).waitFor({ timeout: 30_000 });
  paidOrderPath = new URL(page.url()).pathname;
  await shot(page, '08-order-detail');

  await page.getByRole('button', { name: /^View invoice/ }).click();
  await page.getByRole('dialog').waitFor();
  await shot(page, '09-invoice');
  await ctx.close();
}

// 8. Profile address book on a phone
{
  const ctx = await context(PHONE, { role: 'customer' });
  const page = await ctx.newPage();
  await page.goto('/profile');
  const addresses = page.getByRole('heading', { level: 2, name: 'Addresses' });
  await addresses.waitFor();
  await page.waitForLoadState('networkidle');
  await scrollTo(page, addresses);
  await shot(page, '10-profile-addresses-phone');
  await ctx.close();
}

// 9. Back office: dashboard, product editor (variants), inventory ledger, order actions
{
  const ctx = await context({}, { role: 'admin' });
  const page = await ctx.newPage();
  await page.goto('/admin');
  await page.getByRole('list', { name: 'Store metrics' }).waitFor();
  await shot(page, '11-admin-dashboard');

  await page.goto(`/admin/products/${product.id}`);
  const variants = page.getByRole('heading', { level: 2, name: 'Variants' });
  await variants.waitFor();
  await page.waitForLoadState('networkidle');
  await scrollTo(page, variants.locator('xpath=ancestor::section[1]'), 24);
  await shot(page, '12-admin-product-editor');

  await page.goto(`/admin/inventory?variant=${shortVariant.id}`);
  await page.getByRole('table', { name: 'Movement ledger' }).waitFor();
  await page.getByText('Cycle count: damaged units removed').waitFor();
  await shot(page, '13-admin-inventory-ledger');

  // The order just paid is CONFIRMED: its next steps are offered as actions.
  const orderId = paidOrderPath.split('/').pop();
  await page.goto(`/admin/orders/${orderId}`);
  await page.getByRole('group', { name: 'Update status' }).waitFor();
  await shot(page, '14-admin-order-detail');
  await ctx.close();
}
{
  const ctx = await context(PHONE, { role: 'admin' });
  const page = await ctx.newPage();
  await page.goto('/admin/users');
  await page
    .getByRole('table', { name: 'Users' })
    .getByText('customer@example.com')
    .first()
    .waitFor();
  await shot(page, '15-admin-users-phone');
  await ctx.close();
}

// 10. Spanish UI
{
  const ctx = await context({}, { language: 'es' });
  const page = await ctx.newPage();
  await page.goto('/products?sort=newest');
  await page.getByRole('heading', { level: 1, name: 'Todos los productos' }).waitFor();
  await shot(page, '16-catalog-es');
  await ctx.close();
}

await browser.close();
// Keep the cart tidy for whoever uses the seeded data next.
await api(customerToken, 'DELETE', '/api/v1/cart').catch(() => undefined);
console.log(`done → ${OUT}/`);
