import { screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { Address } from '@/api/schema';
import { customer } from '../../../../test/msw/fixtures';
import { apiError, http, HttpResponse, url } from '../../../../test/msw/http';
import { server } from '../../../../test/msw/server';
import { signedInAs } from '../../../../test/msw/session';
import { homeAddress, officeAddress } from '../../../../test/msw/shop';
import { expectNoAxeViolations } from '../../../../test/utils/axe';
import { renderApp } from '../../../../test/utils/render';

function withProfile(addresses: Address[] = [homeAddress, officeAddress]) {
  signedInAs();
  const calls: { method: string; path: string; body?: unknown }[] = [];
  let list = [...addresses];
  server.use(
    http.get(url('/api/v1/orders'), () =>
      HttpResponse.json({ data: [], meta: { page: 1, pageSize: 10, total: 0, totalPages: 0 } }),
    ),
    http.get(url('/api/v1/users/me/addresses'), () => HttpResponse.json({ data: list })),
    http.patch(url('/api/v1/users/me/addresses/{id}'), async ({ request, params }) => {
      const body = (await request.json()) as Partial<Address>;
      calls.push({ method: 'PATCH', path: String(params.id), body });
      list = list.map((a) =>
        a.id === params.id ? { ...a, ...body } : body.isDefault ? { ...a, isDefault: false } : a,
      );
      return HttpResponse.json({ data: list.find((a) => a.id === params.id) });
    }),
    http.delete(url('/api/v1/users/me/addresses/{id}'), ({ params }) => {
      calls.push({ method: 'DELETE', path: String(params.id) });
      list = list.filter((a) => a.id !== params.id);
      return new HttpResponse(null, { status: 204 });
    }),
  );
  return calls;
}

describe('profile', () => {
  it('updates the name and reflects it in the header right away', async () => {
    withProfile();
    server.use(
      http.patch(url('/api/v1/users/me'), async ({ request }) => {
        const body = (await request.json()) as { firstName: string; lastName: string };
        return HttpResponse.json({ data: { ...customer, ...body } });
      }),
    );
    const { user } = renderApp({ route: '/profile' });
    const save = await screen.findByRole('button', { name: 'Save changes' });
    expect(save).toBeDisabled();

    const firstName = screen.getByRole('textbox', { name: 'First name' });
    await user.clear(firstName);
    await user.type(firstName, 'Carla');
    await user.click(save);

    expect(await screen.findByText('Profile updated')).toBeInTheDocument();
    const header = screen.getByRole('banner');
    expect(within(header).getByText('Carla')).toBeInTheDocument();
    expect(save).toBeDisabled();
  });

  it('flags a wrong current password on its field and keeps the session', async () => {
    withProfile();
    server.use(
      http.post(url('/api/v1/users/me/password'), () =>
        apiError(401, 'INVALID_CREDENTIALS', 'Current password is incorrect'),
      ),
    );
    const { user, router } = renderApp({ route: '/profile' });
    await user.type(await screen.findByLabelText(/^Current password/), 'not-it');
    await user.type(screen.getByLabelText(/^New password/), 'Brand-new-pass-9');
    await user.type(screen.getByLabelText(/^Confirm new password/), 'Brand-new-pass-9');
    await user.click(screen.getByRole('button', { name: 'Change password' }));

    const current = screen.getByLabelText(/^Current password/);
    expect(await screen.findByText('The current password is incorrect.')).toBeInTheDocument();
    expect(current).toHaveAttribute('aria-invalid', 'true');
    expect(current).toHaveFocus();
    expect(router.state.location.pathname).toBe('/profile');
  });

  it('validates the confirmation before calling the API', async () => {
    withProfile();
    const { user } = renderApp({ route: '/profile' });
    await user.type(await screen.findByLabelText(/^Current password/), 'Password123!');
    await user.type(screen.getByLabelText(/^New password/), 'Brand-new-pass-9');
    await user.type(screen.getByLabelText(/^Confirm new password/), 'Brand-new-pass-0');
    await user.click(screen.getByRole('button', { name: 'Change password' }));
    expect(await screen.findByText('The passwords do not match.')).toBeInTheDocument();
  });

  it('signs out everywhere after a password change and explains why', async () => {
    withProfile();
    let body: unknown;
    server.use(
      http.post(url('/api/v1/users/me/password'), async ({ request }) => {
        body = await request.json();
        return new HttpResponse(null, { status: 204 });
      }),
    );
    const { user, router } = renderApp({ route: '/profile' });
    await user.type(await screen.findByLabelText(/^Current password/), 'Password123!');
    await user.type(screen.getByLabelText(/^New password/), 'Brand-new-pass-9');
    await user.type(screen.getByLabelText(/^Confirm new password/), 'Brand-new-pass-9');
    await user.click(screen.getByRole('button', { name: 'Change password' }));

    expect(
      await screen.findByText('Your password was changed. Sign in with your new password.'),
    ).toBeInTheDocument();
    expect(body).toEqual({ currentPassword: 'Password123!', newPassword: 'Brand-new-pass-9' });
    expect(router.state.location.pathname).toBe('/login');
  });

  it('manages saved addresses', async () => {
    const calls = withProfile();
    const { user } = renderApp({ route: '/profile' });

    await user.click(await screen.findByRole('button', { name: 'Set as default: Office' }));
    expect(await screen.findByText('Default address updated')).toBeInTheDocument();
    expect(calls).toContainEqual({
      method: 'PATCH',
      path: officeAddress.id,
      body: { isDefault: true },
    });
    // The list is refetched, so the default moves to Office.
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Set as default: Home' })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: 'Delete address: Home' }));
    const confirm = await screen.findByRole('dialog', { name: 'Delete this address?' });
    await user.click(within(confirm).getByRole('button', { name: 'Delete' }));
    expect(await screen.findByText('Address deleted')).toBeInTheDocument();
    expect(calls).toContainEqual({ method: 'DELETE', path: homeAddress.id });
    await waitFor(() => {
      expect(screen.queryByRole('heading', { level: 3, name: 'Home' })).not.toBeInTheDocument();
    });
  });

  it('edits an address in a dialog prefilled with its values', async () => {
    const calls = withProfile();
    const { user } = renderApp({ route: '/profile' });
    await user.click(await screen.findByRole('button', { name: 'Edit address: Office' }));
    const dialog = await screen.findByRole('dialog', { name: 'Edit address' });
    const line1 = within(dialog).getByRole('textbox', { name: /Address line 1/ });
    expect(line1).toHaveValue('Paseo de la Reforma 500');
    await user.clear(line1);
    await user.type(line1, 'Paseo de la Reforma 505');
    await user.click(within(dialog).getByRole('button', { name: 'Save address' }));

    expect(await screen.findByText('Address saved')).toBeInTheDocument();
    expect(calls[0]).toMatchObject({
      method: 'PATCH',
      path: officeAddress.id,
      body: { line1: 'Paseo de la Reforma 505', label: 'Office', country: 'MX' },
    });
  });

  it('has no detectable accessibility violations', async () => {
    withProfile();
    const { container } = renderApp({ route: '/profile' });
    await screen.findByRole('heading', { level: 3, name: 'Office' });
    await expectNoAxeViolations(container);
  });
});
