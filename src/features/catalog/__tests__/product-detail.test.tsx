import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { Cart } from '@/api/schema';
import { phoneDetail } from '../../../../test/msw/catalog';
import { apiError, http, HttpResponse, url } from '../../../../test/msw/http';
import { server } from '../../../../test/msw/server';
import { emptyCart, signedInAs } from '../../../../test/msw/session';
import { expectNoAxeViolations } from '../../../../test/utils/axe';
import { renderApp } from '../../../../test/utils/render';

const PATH = `/products/${phoneDetail.slug}`;

describe('product detail', () => {
  it('shows the product with the first purchasable variant selected', async () => {
    renderApp({ route: PATH });
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Nimbus X Phone' }),
    ).toBeInTheDocument();
    expect(screen.getByText('$799.00')).toBeInTheDocument();
    expect(screen.getByText('NBX-BLACK-128')).toBeInTheDocument();
    expect(screen.getByText('Only 5 left')).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Breadcrumb' })).toBeInTheDocument();
  });

  it('switches variants, updating price, SKU and the URL', async () => {
    const { user, router } = renderApp({ route: PATH });
    const storage = await screen.findByRole('group', { name: /Storage/ });
    await user.click(within(storage).getByRole('button', { name: '256GB (out of stock)' }));
    expect(router.state.location.search).toBe('?variant=NBX-BLACK-256');
    expect(screen.getByText('$899.00')).toBeInTheDocument();

    const color = screen.getByRole('group', { name: /Color/ });
    await user.click(within(color).getByRole('button', { name: 'White' }));
    expect(router.state.location.search).toBe('?variant=NBX-WHITE-256');
    expect(screen.getByText('Only 3 left')).toBeInTheDocument();
  });

  it('opens the exact variant from a shared link', async () => {
    renderApp({ route: `${PATH}?variant=NBX-WHITE-128` });
    expect(await screen.findByText('NBX-WHITE-128')).toBeInTheDocument();
    expect(screen.getByText('Only 2 left')).toBeInTheDocument();
  });

  it('never allows adding a sold-out variant', async () => {
    signedInAs();
    renderApp({ route: `${PATH}?variant=NBX-BLACK-256` });
    const button = await screen.findByRole('button', { name: 'Sold out' });
    expect(button).toBeDisabled();
  });

  it('asks visitors to sign in, returning to the same variant', async () => {
    renderApp({ route: `${PATH}?variant=NBX-WHITE-128` });
    const link = await screen.findByRole('link', { name: 'Sign in to add to cart' });
    expect(link).toHaveAttribute(
      'href',
      `/login?redirect=${encodeURIComponent(`${PATH}?variant=NBX-WHITE-128`)}`,
    );
  });

  it('adds the selected variant and quantity to the cart', async () => {
    signedInAs();
    let body: unknown;
    server.use(
      http.post(url('/api/v1/cart/items'), async ({ request }) => {
        body = await request.json();
        const cart: Cart = { ...emptyCart, itemCount: 2, isCheckoutReady: true };
        return HttpResponse.json({ data: cart }, { status: 201 });
      }),
    );
    const { user } = renderApp({ route: PATH });
    await user.click(await screen.findByRole('button', { name: 'Increase quantity' }));
    await user.click(screen.getByRole('button', { name: 'Add to cart' }));

    expect(await screen.findByText('Added to cart')).toBeInTheDocument();
    expect(body).toEqual({ variantId: phoneDetail.variants[0]!.id, quantity: 2 });
    // The header badge reads the cart the mutation wrote to the cache.
    expect(screen.getByRole('link', { name: 'Cart, 2 items' })).toBeInTheDocument();
  });

  it('caps the quantity at the available stock', async () => {
    const { user } = renderApp({ route: `${PATH}?variant=NBX-WHITE-128` }); // 2 in stock
    const increase = await screen.findByRole('button', { name: 'Increase quantity' });
    await user.click(increase);
    expect(increase).toBeDisabled();
    expect(screen.getByRole('spinbutton', { name: 'Quantity' })).toHaveValue('2');
  });

  it('explains stock conflicts inline', async () => {
    signedInAs();
    server.use(http.post(url('/api/v1/cart/items'), () => apiError(422, 'INSUFFICIENT_STOCK')));
    const { user } = renderApp({ route: PATH });
    await user.click(await screen.findByRole('button', { name: 'Add to cart' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'There is not enough stock for that quantity.',
    );
  });

  it('shows not found for unknown products', async () => {
    renderApp({ route: '/products/does-not-exist' });
    expect(await screen.findByText('Page not found')).toBeInTheDocument();
  });

  it('has no detectable accessibility violations', async () => {
    const { container } = renderApp({ route: PATH });
    await screen.findByRole('heading', { level: 1 });
    await expectNoAxeViolations(container);
  });
});

describe('recently viewed', () => {
  it('lists products opened in this browser on the home page', async () => {
    const { router } = renderApp({ route: PATH });
    await screen.findByRole('heading', { level: 1, name: 'Nimbus X Phone' });
    await router.navigate('/');
    const section = await screen.findByRole('heading', { level: 2, name: 'Recently viewed' });
    expect(section).toBeInTheDocument();
  });
});
