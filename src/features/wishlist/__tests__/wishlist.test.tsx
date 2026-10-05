import { screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { Cart, WishlistItem } from '@/api/schema';
import { products } from '../../../../test/msw/catalog';
import { apiError, http, HttpResponse, url } from '../../../../test/msw/http';
import { server } from '../../../../test/msw/server';
import { emptyCart, signedInAs } from '../../../../test/msw/session';
import { renderApp } from '../../../../test/utils/render';

const phone = products[0]!;
const saved = (product = phone): WishlistItem => ({
  productId: product.id,
  addedAt: '2026-03-01T00:00:00.000Z',
  product,
});

describe('wishlist', () => {
  it('saves a product optimistically from the product grid', async () => {
    signedInAs();
    let resolve: () => void = () => undefined;
    server.use(
      http.post(url('/api/v1/wishlist/items'), async () => {
        await new Promise<void>((r) => (resolve = r));
        return HttpResponse.json({ data: [saved()] }, { status: 201 });
      }),
    );
    const { user } = renderApp({ route: '/products' });
    await screen.findByText('4 products');
    const [toggle] = screen.getAllByRole('button', { name: 'Save to wishlist' });
    await user.click(toggle!);

    // Flipped before the server answered.
    expect(toggle).toHaveAttribute('aria-pressed', 'true');
    resolve();
    expect(await screen.findByText('Saved to your wishlist')).toBeInTheDocument();
  });

  it('rolls back when saving fails', async () => {
    signedInAs();
    server.use(
      http.post(url('/api/v1/wishlist/items'), () => apiError(422, 'WISHLIST_LIMIT_REACHED')),
    );
    const { user } = renderApp({ route: '/products' });
    await screen.findByText('4 products');
    const [toggle] = screen.getAllByRole('button', { name: 'Save to wishlist' });
    await user.click(toggle!);

    expect(await screen.findByText('Your wishlist is full.')).toBeInTheDocument();
    expect(toggle).toHaveAttribute('aria-pressed', 'false');
  });

  it('asks visitors to sign in', async () => {
    renderApp({ route: '/wishlist' });
    expect(await screen.findByText('Sign in to see your wishlist')).toBeInTheDocument();
  });

  it('moves a saved product to the cart after choosing a variant', async () => {
    signedInAs();
    let wishlist = [saved()];
    let added: unknown;
    server.use(
      http.get(url('/api/v1/wishlist'), () => HttpResponse.json({ data: wishlist })),
      http.delete(url('/api/v1/wishlist/items/{productId}'), () => {
        wishlist = [];
        return HttpResponse.json({ data: wishlist });
      }),
      http.post(url('/api/v1/cart/items'), async ({ request }) => {
        added = await request.json();
        const cart: Cart = { ...emptyCart, itemCount: 1 };
        return HttpResponse.json({ data: cart }, { status: 201 });
      }),
    );
    const { user } = renderApp({ route: '/wishlist' });
    await user.click(await screen.findByRole('button', { name: 'Move to cart' }));

    const dialog = await screen.findByRole('dialog', { name: 'Choose options for Nimbus X Phone' });
    await user.click(within(dialog).getByRole('button', { name: 'White' }));
    await user.click(within(dialog).getByRole('button', { name: 'Move to cart' }));

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
    expect(added).toEqual({ variantId: 'v1000000-0000-4000-8000-000000000003', quantity: 1 });
    expect(await screen.findByText('Your wishlist is empty')).toBeInTheDocument();
  });
});
