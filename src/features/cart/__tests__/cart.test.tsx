import { screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { rememberPrice } from '../priceMemory';
import { http, HttpResponse, url } from '../../../../test/msw/http';
import { server } from '../../../../test/msw/server';
import { signedInAs } from '../../../../test/msw/session';
import { cartItem, cartWith } from '../../../../test/msw/shop';
import { expectNoAxeViolations } from '../../../../test/utils/axe';
import { renderApp } from '../../../../test/utils/render';

function withCart(cart = cartWith([cartItem()])) {
  signedInAs();
  server.use(http.get(url('/api/v1/cart'), () => HttpResponse.json({ data: cart })));
}

describe('cart page', () => {
  it('asks visitors to sign in', async () => {
    renderApp({ route: '/cart' });
    expect(await screen.findByText('Sign in to see your cart')).toBeInTheDocument();
  });

  it('shows lines and the totals computed by the API', async () => {
    withCart();
    renderApp({ route: '/cart' });
    expect(
      await screen.findByRole('heading', { level: 2, name: 'Nimbus X Phone' }),
    ).toBeInTheDocument();
    const summary = screen.getByRole('region', { name: 'Order summary' });
    expect(within(summary).getByText('$63.92')).toBeInTheDocument(); // 8% tax
    expect(within(summary).getByText('$862.92')).toBeInTheDocument();
    expect(within(summary).getByText('Free')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Proceed to checkout' })).toHaveAttribute(
      'href',
      '/checkout',
    );
  });

  it('updates quantities with a single debounced request', async () => {
    withCart();
    const requests: unknown[] = [];
    server.use(
      http.patch(url('/api/v1/cart/items/{id}'), async ({ request }) => {
        const body = (await request.json()) as { quantity: number };
        requests.push(body);
        return HttpResponse.json({
          data: cartWith([
            cartItem({ quantity: body.quantity, lineTotalCents: 79_900 * body.quantity }),
          ]),
        });
      }),
    );
    const { user } = renderApp({ route: '/cart' });
    const increase = await screen.findByRole('button', { name: 'Increase quantity' });
    await user.click(increase);
    await user.click(increase);
    await waitFor(() => {
      expect(requests).toEqual([{ quantity: 3 }]);
    });
    const summary = screen.getByRole('region', { name: 'Order summary' });
    expect(await within(summary).findByText('$2,397.00')).toBeInTheDocument();
  });

  it('removes a line', async () => {
    withCart();
    server.use(
      http.delete(url('/api/v1/cart/items/{id}'), () => HttpResponse.json({ data: cartWith([]) })),
    );
    const { user } = renderApp({ route: '/cart' });
    await user.click(await screen.findByRole('button', { name: 'Remove Nimbus X Phone' }));
    expect(await screen.findByText('Your cart is empty')).toBeInTheDocument();
  });

  it('blocks checkout while a line has a stock issue', async () => {
    withCart(
      cartWith([
        cartItem({
          quantity: 4,
          lineTotalCents: 319_600,
          availableQuantity: 2,
          issue: 'INSUFFICIENT_STOCK',
        }),
      ]),
    );
    renderApp({ route: '/cart' });
    expect(
      await screen.findByText('Only 2 left. Lower the quantity to check out.'),
    ).toBeInTheDocument();
    expect(screen.getByText('Resolve the highlighted items to continue.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Proceed to checkout' })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
  });

  it('tells the customer when a price changed since they added the item', async () => {
    rememberPrice('v1000000-0000-4000-8000-000000000001', 89_900);
    withCart();
    renderApp({ route: '/cart' });
    expect(
      await screen.findByText('Price changed from $899.00 to $799.00 since you added it.'),
    ).toBeInTheDocument();
  });

  it('has no detectable accessibility violations', async () => {
    withCart();
    const { container } = renderApp({ route: '/cart' });
    await screen.findByRole('heading', { level: 2, name: 'Nimbus X Phone' });
    await expectNoAxeViolations(container);
  });
});
