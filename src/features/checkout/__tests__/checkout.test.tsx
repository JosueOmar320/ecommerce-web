import { screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { Order, Payment } from '@/api/schema';
import { apiError, http, HttpResponse, url } from '../../../../test/msw/http';
import { server } from '../../../../test/msw/server';
import { signedInAs } from '../../../../test/msw/session';
import { cartItem, cartWith, homeAddress, orderFrom, payment } from '../../../../test/msw/shop';
import { renderApp } from '../../../../test/utils/render';

/** A stateful backend for one checkout: cart → order → payments decided by the chosen method. */
function checkoutBackend() {
  signedInAs();
  const state = {
    cart: cartWith([cartItem({ quantity: 2, lineTotalCents: 159_800 })]),
    order: undefined as Order | undefined,
    payments: [] as Payment[],
    orderKeys: [] as string[],
    paymentKeys: [] as string[],
    failNextOrder: false,
    polls: 0,
  };
  server.use(
    http.get(url('/api/v1/cart'), () => HttpResponse.json({ data: state.cart })),
    http.get(url('/api/v1/users/me/addresses'), () => HttpResponse.json({ data: [homeAddress] })),
    http.post(url('/api/v1/orders'), ({ request }) => {
      state.orderKeys.push(request.headers.get('idempotency-key') ?? '');
      if (state.failNextOrder) {
        state.failNextOrder = false;
        return HttpResponse.error();
      }
      state.order ??= orderFrom(state.cart);
      state.cart = cartWith([]);
      return HttpResponse.json({ data: state.order }, { status: 201 });
    }),
    http.get(url('/api/v1/orders/{id}'), () => HttpResponse.json({ data: state.order })),
    http.get(url('/api/v1/orders/{id}/payments'), () => {
      // The provider "answers" on the second poll, like the async webhook.
      const [latest] = state.payments;
      state.polls += 1;
      if (state.polls < 2) {
        // still pending
      } else if (latest?.status === 'PENDING' && latest.failureReason === 'pending-success') {
        state.payments[0] = { ...latest, status: 'COMPLETED', failureReason: null };
        state.order = { ...state.order!, status: 'CONFIRMED' };
      } else if (latest?.status === 'PENDING' && latest.failureReason === 'pending-decline') {
        state.payments[0] = { ...latest, status: 'FAILED', failureReason: 'card_declined' };
      }
      return HttpResponse.json({
        data: state.payments.map((p) =>
          p.failureReason?.startsWith('pending') ? { ...p, failureReason: null } : p,
        ),
      });
    }),
    http.post(url('/api/v1/payments'), async ({ request }) => {
      state.paymentKeys.push(request.headers.get('idempotency-key') ?? '');
      const body = (await request.json()) as { paymentMethod: string };
      const created = payment(state.order!, {
        id: `pay-${state.payments.length}`,
        failureReason:
          body.paymentMethod === 'mock_card_success' ? 'pending-success' : 'pending-decline',
      });
      state.polls = 0;
      state.payments.unshift(created);
      return HttpResponse.json(
        { data: { ...created, failureReason: null, clientSecret: 'secret' } },
        { status: 201 },
      );
    }),
  );
  return state;
}

describe('checkout', () => {
  it('goes from shipping to a paid, confirmed order', async () => {
    const state = checkoutBackend();
    const { user, router } = renderApp({ route: '/checkout' });

    // Shipping: the default address is preselected.
    expect(
      await screen.findByRole('heading', { level: 2, name: 'Where should we send your order?' }),
    ).toHaveFocus();
    expect(screen.getByRole('radio', { name: /Carlos Customer · Home/ })).toBeChecked();
    await user.click(screen.getByRole('button', { name: 'Continue' }));

    // Review: totals from the API, then place the order.
    expect(
      await screen.findByRole('heading', { level: 2, name: 'Review your order' }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Place order · $1,725.84' }));

    // Lands on payment (not on the now-empty cart), and "back" cannot place it again.
    expect(await screen.findByRole('heading', { level: 2, name: 'Payment' })).toBeInTheDocument();
    expect(router.state.location.search).toContain(`order=${state.order!.id}`);
    expect(screen.getByText('Test mode')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Pay $1,725.84' }));
    expect(
      await screen.findByText('Waiting for the payment provider to confirm…'),
    ).toBeInTheDocument();

    expect(
      await screen.findByText('Thank you! Your order is confirmed.', {}, { timeout: 5_000 }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'View order details' })).toHaveAttribute(
      'href',
      `/orders/${state.order!.id}`,
    );
    expect(state.orderKeys).toHaveLength(1);
    expect(state.paymentKeys[0]).toMatch(/^[0-9a-f-]{36}$/);
  });

  it('reuses the idempotency key when placing the order is retried after a network error', async () => {
    const state = checkoutBackend();
    state.failNextOrder = true;
    const { user } = renderApp({ route: `/checkout?step=review&address=${homeAddress.id}` });

    const place = await screen.findByRole('button', { name: /Place order/ });
    await user.click(place);
    expect(await screen.findByRole('alert')).toHaveTextContent('We could not reach the store');
    await user.click(screen.getByRole('button', { name: /Place order/ }));

    expect(await screen.findByRole('heading', { level: 2, name: 'Payment' })).toBeInTheDocument();
    expect(state.orderKeys).toHaveLength(2);
    expect(state.orderKeys[0]).toBe(state.orderKeys[1]);
  });

  it('explains a declined payment and lets the customer retry with a new attempt', async () => {
    const state = checkoutBackend();
    state.order = orderFrom(state.cart);
    const { user } = renderApp({ route: `/checkout?step=payment&order=${state.order.id}` });

    const methods = await screen.findByRole('radiogroup', { name: 'Simulated payment outcome' });
    await user.click(within(methods).getByRole('radio', { name: 'Card declined' }));
    await user.click(screen.getByRole('button', { name: /^Pay / }));

    expect(
      await screen.findByText(
        'The payment did not go through: card declined. You can try again.',
        {},
        { timeout: 5_000 },
      ),
    ).toBeInTheDocument();

    await user.click(
      within(screen.getByRole('radiogroup')).getByRole('radio', { name: 'Successful payment' }),
    );
    await user.click(screen.getByRole('button', { name: /^Pay / }));
    expect(
      await screen.findByText('Thank you! Your order is confirmed.', {}, { timeout: 5_000 }),
    ).toBeInTheDocument();
    expect(state.paymentKeys[0]).not.toBe(state.paymentKeys[1]);
  });

  it('uses a new idempotency key after a definitive failure, once the cart is fixed', async () => {
    const state = checkoutBackend();
    let rejectNext = true;
    server.use(
      http.post(url('/api/v1/orders'), ({ request }) => {
        state.orderKeys.push(request.headers.get('idempotency-key') ?? '');
        if (rejectNext) {
          rejectNext = false;
          return apiError(422, 'CART_HAS_UNAVAILABLE_ITEMS', 'Unavailable items');
        }
        state.order = orderFrom(state.cart);
        return HttpResponse.json({ data: state.order }, { status: 201 });
      }),
    );
    const { user } = renderApp({ route: `/checkout?step=review&address=${homeAddress.id}` });

    await user.click(await screen.findByRole('button', { name: /Place order/ }));
    expect(await screen.findByRole('alert')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Place order/ }));

    expect(await screen.findByRole('heading', { level: 2, name: 'Payment' })).toBeInTheDocument();
    // The API stored the 422 under the first key: reusing it would replay the failure.
    expect(state.orderKeys).toHaveLength(2);
    expect(state.orderKeys[0]).not.toBe(state.orderKeys[1]);
  });

  it('never shows a cancelled order as confirmed, even if a payment completed', async () => {
    const state = checkoutBackend();
    state.order = orderFrom(state.cart, {
      status: 'CANCELLED',
      allowedTransitions: [],
      expiresAt: null,
    });
    state.payments = [payment(state.order, { status: 'COMPLETED' })];
    renderApp({ route: `/checkout?step=payment&order=${state.order.id}` });

    expect(
      await screen.findByText('This order is no longer awaiting payment.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'View order details' })).toHaveAttribute(
      'href',
      `/orders/${state.order.id}`,
    );
    expect(screen.queryByText('Thank you! Your order is confirmed.')).not.toBeInTheDocument();
  });

  it('does not show the confirmation for an unpaid order opened by URL', async () => {
    const state = checkoutBackend();
    state.order = orderFrom(state.cart);
    const { router } = renderApp({ route: `/checkout?step=confirmation&order=${state.order.id}` });
    expect(await screen.findByRole('heading', { level: 2, name: 'Payment' })).toBeInTheDocument();
    expect(router.state.location.search).toContain('step=payment');
    expect(screen.queryByText('Thank you! Your order is confirmed.')).not.toBeInTheDocument();
  });

  it('falls back to shipping when a step is opened without its prerequisites', async () => {
    checkoutBackend();
    renderApp({ route: '/checkout?step=review' });
    expect(
      await screen.findByRole('heading', { level: 2, name: 'Where should we send your order?' }),
    ).toBeInTheDocument();
  });

  it('requires a signed-in customer', async () => {
    const { router } = renderApp({ route: '/checkout' });
    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/login');
    });
  });
});
