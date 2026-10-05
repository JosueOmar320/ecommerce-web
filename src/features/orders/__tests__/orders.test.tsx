import { screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { Invoice, Order } from '@/api/schema';
import { apiError, http, HttpResponse, url } from '../../../../test/msw/http';
import { server } from '../../../../test/msw/server';
import { signedInAs } from '../../../../test/msw/session';
import { cartItem, cartWith, orderFrom, payment, summaryOf } from '../../../../test/msw/shop';
import { expectNoAxeViolations } from '../../../../test/utils/axe';
import { renderApp } from '../../../../test/utils/render';

const cart = cartWith([cartItem({ quantity: 2, lineTotalCents: 159_800 })]);
const pending = orderFrom(cart);
const confirmed = orderFrom(cart, {
  id: 'o2000000-0000-4000-8000-000000000002',
  orderNumber: 'ORD-00001235',
  status: 'CONFIRMED',
  expiresAt: null,
  allowedTransitions: [],
  statusHistory: [
    ...pending.statusHistory,
    {
      fromStatus: 'PENDING',
      toStatus: 'CONFIRMED',
      reason: null,
      changedBy: null,
      createdAt: '2026-03-01T10:02:00.000Z',
    },
  ],
});
const invoice: Invoice = {
  id: 'inv10000-0000-4000-8000-000000000001',
  invoiceNumber: 'INV-00001235',
  orderId: confirmed.id,
  orderNumber: confirmed.orderNumber,
  issuedAt: '2026-03-01T10:03:00.000Z',
  currency: 'USD',
  subtotalCents: confirmed.subtotalCents,
  shippingCents: confirmed.shippingCents,
  taxCents: confirmed.taxCents,
  totalCents: confirmed.totalCents,
  billedTo: { name: 'Carlos Customer', email: 'customer@example.com' },
  items: confirmed.items,
};

function withOrders(orders: Order[], { invoiceReady = true } = {}) {
  signedInAs();
  const requests: URLSearchParams[] = [];
  server.use(
    http.get(url('/api/v1/orders'), ({ request }) => {
      const params = new URL(request.url).searchParams;
      requests.push(params);
      const status = params.get('status');
      const data = orders.filter((o) => !status || o.status === status).map(summaryOf);
      return HttpResponse.json({
        data,
        meta: { page: 1, pageSize: 10, total: data.length, totalPages: 1 },
      });
    }),
    http.get(url('/api/v1/orders/{id}'), ({ params }) => {
      const order = orders.find((o) => o.id === params.id);
      return order
        ? HttpResponse.json({ data: order })
        : apiError(404, 'ORDER_NOT_FOUND', 'Order not found');
    }),
    http.get(url('/api/v1/orders/{id}/payments'), ({ params }) => {
      const order = orders.find((o) => o.id === params.id)!;
      return HttpResponse.json({
        data: order.status === 'PENDING' ? [] : [payment(order, { status: 'COMPLETED' })],
      });
    }),
    http.get(url('/api/v1/orders/{id}/invoice'), () =>
      invoiceReady
        ? HttpResponse.json({ data: invoice })
        : apiError(404, 'INVOICE_NOT_FOUND', 'This order has no invoice yet'),
    ),
  );
  return requests;
}

describe('orders list', () => {
  it('lists the customer orders with their status and total', async () => {
    withOrders([pending, confirmed]);
    renderApp({ route: '/orders' });
    const link = await screen.findByRole('link', { name: 'ORD-00001234' });
    expect(link).toHaveAttribute('href', `/orders/${pending.id}`);
    const row = link.closest('li')!;
    expect(within(row).getByText('Awaiting payment')).toBeInTheDocument();
    expect(within(row).getByText('$1,725.84')).toBeInTheDocument();
    expect(within(screen.getByRole('main')).getByRole('status')).toHaveTextContent('2 orders');
  });

  it('filters by status from the URL and offers a way back', async () => {
    const requests = withOrders([pending]);
    renderApp({ route: '/orders?status=DELIVERED' });
    expect(await screen.findByText('No orders with this status')).toBeInTheDocument();
    expect(requests.at(-1)?.get('status')).toBe('DELIVERED');
    const filters = screen.getByRole('navigation', { name: 'Filter by status' });
    expect(within(filters).getByRole('link', { name: 'Delivered' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(screen.getByRole('link', { name: 'Show all orders' })).toHaveAttribute(
      'href',
      '/orders',
    );
  });

  it('ignores an unknown status in the URL', async () => {
    const requests = withOrders([pending]);
    renderApp({ route: '/orders?status=LOST&page=-3' });
    await screen.findByRole('link', { name: 'ORD-00001234' });
    expect(requests.at(-1)?.has('status')).toBe(false);
    expect(requests.at(-1)?.get('page')).toBe('1');
  });
});

describe('order detail', () => {
  it('shows progress, payments and the invoice of a paid order', async () => {
    withOrders([confirmed]);
    const { user } = renderApp({ route: `/orders/${confirmed.id}` });

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Order ORD-00001235' }),
    ).toBeInTheDocument();
    const progress = screen.getByRole('list', { name: 'Order progress' });
    const current = within(progress)
      .getByText(/Confirmed/)
      .closest('li');
    expect(current).toHaveAttribute('aria-current', 'step');
    expect(current).toHaveTextContent('(current status)');
    expect(screen.queryByRole('button', { name: 'Cancel order' })).not.toBeInTheDocument();
    expect(await screen.findByText('Paid')).toBeInTheDocument();

    await user.click(await screen.findByRole('button', { name: 'View invoice INV-00001235' }));
    const dialog = await screen.findByRole('dialog', { name: 'Invoice INV-00001235' });
    expect(within(dialog).getByText('customer@example.com')).toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: 'Print' })).toBeInTheDocument();
  });

  it('explains that the invoice is still being generated', async () => {
    withOrders([confirmed], { invoiceReady: false });
    renderApp({ route: `/orders/${confirmed.id}` });
    expect(
      await screen.findByText('The invoice is being generated and will appear here shortly.'),
    ).toBeInTheDocument();
  });

  it('lets the customer pay or cancel a pending order', async () => {
    withOrders([pending]);
    let body: unknown;
    server.use(
      http.patch(url('/api/v1/orders/{id}/status'), async ({ request }) => {
        body = await request.json();
        return HttpResponse.json({
          data: {
            ...pending,
            status: 'CANCELLED',
            cancelledAt: '2026-03-01T10:05:00.000Z',
            cancellationReason: 'Ordered by mistake',
            allowedTransitions: [],
          },
        });
      }),
    );
    const { user } = renderApp({ route: `/orders/${pending.id}` });

    expect(await screen.findByRole('link', { name: 'Complete payment' })).toHaveAttribute(
      'href',
      `/checkout?step=payment&order=${pending.id}`,
    );
    await user.click(screen.getByRole('button', { name: 'Cancel order' }));
    const dialog = await screen.findByRole('dialog', { name: 'Cancel order ORD-00001234?' });
    const reason = within(dialog).getByRole('textbox', { name: 'Reason' });

    await user.type(reason, 'no');
    await user.click(within(dialog).getByRole('button', { name: 'Cancel order' }));
    expect(
      within(dialog).getByText('Use at least 3 characters, or leave it empty.'),
    ).toBeInTheDocument();
    expect(body).toBeUndefined();

    await user.clear(reason);
    await user.type(reason, 'Ordered by mistake');
    await user.click(within(dialog).getByRole('button', { name: 'Cancel order' }));

    expect(await screen.findByText('Order ORD-00001234 cancelled')).toBeInTheDocument();
    expect(body).toEqual({ status: 'CANCELLED', reason: 'Ordered by mistake' });
    expect(screen.getByText('Reason: Ordered by mistake')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Complete payment' })).not.toBeInTheDocument();
    // The trigger is gone, so focus continues from the page heading.
    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1 })).toHaveFocus();
    });
  });

  it('shows a not-found state for an order that is not the customer’s', async () => {
    withOrders([]);
    renderApp({ route: '/orders/o9999999-0000-4000-8000-000000000009' });
    expect(await screen.findByRole('heading', { name: 'Order not found' })).toBeInTheDocument();
  });

  it('has no detectable accessibility violations', async () => {
    withOrders([confirmed]);
    const { container } = renderApp({ route: `/orders/${confirmed.id}` });
    await screen.findByText('Paid');
    await expectNoAxeViolations(container);
  });
});
