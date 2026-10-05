import { screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { CurrentUser, InventoryLevel, Order, User } from '@/api/schema';
import { admin, customer } from '../../../../test/msw/fixtures';
import { http, HttpResponse, url } from '../../../../test/msw/http';
import { server } from '../../../../test/msw/server';
import { signedInAs } from '../../../../test/msw/session';
import { cartItem, cartWith, orderFrom, summaryOf } from '../../../../test/msw/shop';
import { expectNoAxeViolations } from '../../../../test/utils/axe';
import { renderApp } from '../../../../test/utils/render';

const page = <T,>(data: T[], total = data.length) => ({
  data,
  meta: { page: 1, pageSize: 20, total, totalPages: Math.max(1, Math.ceil(total / 20)) },
});

const level: InventoryLevel = {
  variantId: 'v1000000-0000-4000-8000-000000000002',
  sku: 'NBX-BLACK-256',
  variantName: 'Black / 256GB',
  productId: 'p1000000-0000-4000-8000-000000000001',
  productName: 'Nimbus X Phone',
  onHand: 0,
  reserved: 0,
  available: 0,
  updatedAt: '2026-03-01T10:00:00.000Z',
};

const confirmed: Order = orderFrom(cartWith([cartItem()]), {
  status: 'CONFIRMED',
  expiresAt: null,
  allowedTransitions: ['PROCESSING', 'CANCELLED'],
});

describe('admin access', () => {
  it('shows only the sections the account can open', async () => {
    const support: CurrentUser = { ...admin, permissions: ['orders:read'] };
    signedInAs(support);
    server.use(
      http.get(url('/api/v1/orders'), ({ request }) => {
        const status = new URL(request.url).searchParams.get('status');
        return HttpResponse.json(page([summaryOf(confirmed)], status ? 1 : 12));
      }),
    );
    renderApp({ route: '/admin' });

    const nav = await screen.findByRole('navigation', { name: 'Admin navigation' });
    expect(
      within(nav)
        .getAllByRole('link')
        .map((link) => link.textContent),
    ).toEqual(['Dashboard', 'Orders']);
    // Only the order metrics are requested and shown (the page loads after the layout).
    const metrics = await screen.findByRole('list', { name: 'Store metrics' });
    expect(await within(metrics).findByText('12')).toBeInTheDocument();
    expect(within(metrics).queryByText('Customers')).not.toBeInTheDocument();
  });

  it('refuses a section without its permission', async () => {
    signedInAs({ ...admin, permissions: ['orders:read'] });
    renderApp({ route: '/admin/users' });
    expect(
      await screen.findByText('Your account does not have permission to view this page.'),
    ).toBeInTheDocument();
  });

  it('keeps customers out of the back office', async () => {
    signedInAs(customer);
    renderApp({ route: '/admin' });
    expect(
      await screen.findByText('Your account does not have permission to view this page.'),
    ).toBeInTheDocument();
  });
});

describe('admin dashboard', () => {
  it('shows exact counts from the API and what is running low', async () => {
    signedInAs(admin);
    server.use(
      http.get(url('/api/v1/orders'), ({ request }) => {
        const status = new URL(request.url).searchParams.get('status');
        const total = { PENDING: 3, CONFIRMED: 2 }[status ?? ''] ?? 41;
        return HttpResponse.json(page([summaryOf(confirmed)], total));
      }),
      http.get(url('/api/v1/inventory'), () => HttpResponse.json(page([level], 7))),
      http.get(url('/api/v1/products'), () => HttpResponse.json(page([], 27))),
      http.get(url('/api/v1/users'), () => HttpResponse.json(page([], 1250))),
    );
    const { container } = renderApp({ route: '/admin' });

    const metrics = await screen.findByRole('list', { name: 'Store metrics' });
    const value = (label: string) =>
      within(metrics).getByRole('link', { name: label }).closest('li');
    await waitFor(() => {
      expect(value('Customers')).toHaveTextContent('1,250');
    });
    expect(value('Orders')).toHaveTextContent('41');
    expect(value('Awaiting payment')).toHaveTextContent('3');
    expect(value('To fulfil')).toHaveTextContent('2');
    expect(value('Low-stock variants')).toHaveTextContent('7');
    expect(value('Active products')).toHaveTextContent('27');
    expect(within(metrics).getByRole('link', { name: 'Awaiting payment' })).toHaveAttribute(
      'href',
      '/admin/orders?status=PENDING',
    );
    expect(screen.getByRole('link', { name: 'Nimbus X Phone' })).toHaveAttribute(
      'href',
      `/admin/inventory?variant=${level.variantId}`,
    );
    await expectNoAxeViolations(container);
  });
});

describe('admin inventory', () => {
  it('records a stock movement from the variant history', async () => {
    signedInAs(admin);
    let current = level;
    let body: unknown;
    server.use(
      http.get(url('/api/v1/inventory'), () => HttpResponse.json(page([current]))),
      http.get(url('/api/v1/inventory/{variantId}'), () => HttpResponse.json({ data: current })),
      http.get(url('/api/v1/inventory/{variantId}/movements'), () => HttpResponse.json(page([]))),
      http.post(url('/api/v1/inventory/{variantId}/movements'), async ({ request }) => {
        body = await request.json();
        current = { ...current, onHand: 12, available: 12 };
        return HttpResponse.json({ data: { level: current } }, { status: 201 });
      }),
    );
    const { user, router } = renderApp({ route: '/admin/inventory' });

    await user.click(
      await screen.findByRole('button', { name: 'Stock history for NBX-BLACK-256' }),
    );
    expect(router.state.location.search).toBe(`?variant=${level.variantId}`);
    const drawer = await screen.findByRole('dialog', { name: 'Stock history for NBX-BLACK-256' });

    await user.type(within(drawer).getByRole('textbox', { name: 'Quantity' }), '-2');
    await user.type(within(drawer).getByRole('textbox', { name: 'Reason' }), 'Supplier delivery');
    await user.click(within(drawer).getByRole('button', { name: 'Record' }));
    expect(await within(drawer).findByText('Must be greater than zero.')).toBeInTheDocument();
    expect(body).toBeUndefined();

    const quantity = within(drawer).getByRole('textbox', { name: 'Quantity' });
    await user.clear(quantity);
    await user.type(quantity, '12');
    await user.click(within(drawer).getByRole('button', { name: 'Record' }));

    expect(await screen.findByText('Stock updated for NBX-BLACK-256')).toBeInTheDocument();
    expect(body).toEqual({ type: 'PURCHASE', quantity: 12, reason: 'Supplier delivery' });
    await waitFor(() => {
      expect(within(drawer).getAllByText('12').length).toBeGreaterThan(0);
    });

    await user.click(within(drawer).getByRole('button', { name: 'Close' }));
    await waitFor(() => {
      expect(router.state.location.search).toBe('');
    });
  });
});

describe('admin orders', () => {
  it('offers only the transitions the API allows and applies one with a note', async () => {
    signedInAs(admin);
    let order = confirmed;
    let body: unknown;
    server.use(
      http.get(url('/api/v1/orders/{id}'), () => HttpResponse.json({ data: order })),
      http.get(url('/api/v1/orders/{id}/payments'), () => HttpResponse.json({ data: [] })),
      http.patch(url('/api/v1/orders/{id}/status'), async ({ request }) => {
        body = await request.json();
        order = { ...order, status: 'PROCESSING', allowedTransitions: ['SHIPPED', 'CANCELLED'] };
        return HttpResponse.json({ data: order });
      }),
    );
    const { user } = renderApp({ route: `/admin/orders/${confirmed.id}` });

    const actions = await screen.findByRole('group', { name: 'Update status' });
    expect(
      within(actions)
        .getAllByRole('button')
        .map((b) => b.textContent),
    ).toEqual(['Start processing', 'Cancel order']);
    await user.click(within(actions).getByRole('button', { name: 'Start processing' }));
    const dialog = await screen.findByRole('dialog', { name: 'Start processing · ORD-00001234' });
    await user.type(within(dialog).getByRole('textbox', { name: 'Note (optional)' }), 'Picked');
    await user.click(within(dialog).getByRole('button', { name: 'Start processing' }));

    expect(await screen.findByText('Order ORD-00001234: Processing')).toBeInTheDocument();
    expect(body).toEqual({ status: 'PROCESSING', reason: 'Picked' });
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
    expect(
      within(screen.getByRole('group', { name: 'Update status' })).getByRole('button', {
        name: 'Mark as shipped',
      }),
    ).toBeInTheDocument();
  });
});

describe('admin users', () => {
  const carlos: User = {
    id: customer.id,
    email: customer.email,
    firstName: customer.firstName,
    lastName: customer.lastName,
    isActive: true,
    roles: ['CUSTOMER'],
    createdAt: customer.createdAt,
  };
  const ada: User = {
    ...carlos,
    id: admin.id,
    email: admin.email,
    firstName: 'Ada',
    lastName: 'Admin',
    roles: ['ADMIN'],
  };

  it('deactivates another user after confirmation, never yourself', async () => {
    signedInAs(admin);
    let users = [carlos, ada];
    let body: unknown;
    server.use(
      http.get(url('/api/v1/users'), () => HttpResponse.json(page(users))),
      http.patch(url('/api/v1/users/{id}'), async ({ request, params }) => {
        body = await request.json();
        users = users.map((u) => (u.id === params.id ? { ...u, isActive: false } : u));
        return HttpResponse.json({ data: users.find((u) => u.id === params.id) });
      }),
    );
    const { user } = renderApp({ route: '/admin/users' });

    await user.click(await screen.findByRole('button', { name: 'Deactivate Carlos Customer' }));
    expect(screen.queryByRole('button', { name: 'Deactivate Ada Admin' })).not.toBeInTheDocument();
    const confirm = await screen.findByRole('dialog', { name: 'Deactivate Carlos Customer?' });
    await user.click(within(confirm).getByRole('button', { name: 'Deactivate Carlos Customer' }));

    expect(await screen.findByText('Carlos Customer deactivated')).toBeInTheDocument();
    expect(body).toEqual({ isActive: false });
    expect(
      await screen.findByRole('button', { name: 'Activate Carlos Customer' }),
    ).toBeInTheDocument();
  });

  it('cannot remove your own administrator role', async () => {
    signedInAs(admin);
    server.use(http.get(url('/api/v1/users'), () => HttpResponse.json(page([ada]))));
    const { user } = renderApp({ route: '/admin/users' });
    await user.click(await screen.findByRole('button', { name: 'Edit roles of Ada Admin' }));
    const dialog = await screen.findByRole('dialog', { name: 'Roles of Ada Admin' });
    expect(within(dialog).getByRole('checkbox', { name: 'Administrator' })).toBeDisabled();
    expect(within(dialog).getByRole('checkbox', { name: 'Customer' })).toBeEnabled();
  });
});
