import { screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { admin, customer } from '../../../../test/msw/fixtures';
import { apiError, http, HttpResponse, url } from '../../../../test/msw/http';
import { server } from '../../../../test/msw/server';
import { signedInAs } from '../../../../test/msw/session';
import { expectNoAxeViolations } from '../../../../test/utils/axe';
import { renderApp } from '../../../../test/utils/render';

const session = (user = customer) => ({
  accessToken: `token-${user.id}`,
  tokenType: 'Bearer',
  expiresIn: 900,
  user,
});

describe('authentication', () => {
  it('signs in and continues to the page that required it', async () => {
    server.use(
      http.post(url('/api/v1/auth/login'), async ({ request }) => {
        const body = (await request.json()) as { email: string; password: string };
        return body.password === 'Password123!'
          ? HttpResponse.json({ data: session() })
          : apiError(401, 'INVALID_CREDENTIALS');
      }),
    );
    const { user, router } = renderApp({ route: '/login?redirect=%2Forders' });

    expect(await screen.findByText('Sign in to continue.')).toBeInTheDocument();
    await user.type(screen.getByLabelText(/^Email/), 'customer@example.com');
    await user.type(screen.getByLabelText(/^Password/), 'nope-nope');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'The email or password is incorrect.',
    );

    await user.clear(screen.getByLabelText(/^Password/));
    await user.type(screen.getByLabelText(/^Password/), 'Password123!');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/orders');
    });
    expect(await screen.findByRole('button', { name: 'Carlos' })).toBeInTheDocument();
  });

  it('validates the form before calling the API', async () => {
    const { user } = renderApp({ route: '/login' });
    await user.click(await screen.findByRole('button', { name: 'Sign in' }));
    expect(await screen.findByText('Enter a valid email address.')).toBeInTheDocument();
    expect(screen.getByText('Enter your password.')).toBeInTheDocument();
    expect(screen.getByLabelText(/^Email/)).toHaveAttribute('aria-invalid', 'true');
  });

  it('never redirects to another site after signing in', async () => {
    server.use(http.post(url('/api/v1/auth/login'), () => HttpResponse.json({ data: session() })));
    const { user, router } = renderApp({ route: '/login?redirect=%2F%2Fevil.example' });
    await user.type(await screen.findByLabelText(/^Email/), 'customer@example.com');
    await user.type(screen.getByLabelText(/^Password/), 'Password123!');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));
    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/');
    });
  });

  it('shows an already-registered email on the email field', async () => {
    server.use(
      http.post(url('/api/v1/auth/register'), () => apiError(409, 'EMAIL_ALREADY_REGISTERED')),
    );
    const { user } = renderApp({ route: '/register' });
    await user.type(await screen.findByLabelText(/^First name/), 'Jane');
    await user.type(screen.getByLabelText(/^Last name/), 'Doe');
    await user.type(screen.getByLabelText(/^Email/), 'customer@example.com');
    await user.type(screen.getByLabelText(/^Password/), 'a-good-password');
    await user.click(screen.getByRole('button', { name: 'Create account' }));

    const email = screen.getByLabelText(/^Email/);
    await waitFor(() => {
      expect(email).toHaveAttribute('aria-invalid', 'true');
    });
    expect(screen.getByText('An account with this email already exists.')).toBeInTheDocument();
    expect(email).toHaveFocus();
  });

  it('restores the session from the refresh cookie on page load', async () => {
    signedInAs(customer);
    renderApp({ route: '/' });
    expect(await screen.findByRole('button', { name: 'Carlos' })).toBeInTheDocument();
  });

  it('signs out and returns to the anonymous header', async () => {
    signedInAs(customer);
    const { user } = renderApp({ route: '/' });
    await user.click(await screen.findByRole('button', { name: 'Carlos' }));
    await user.click(within(screen.getByRole('menu')).getByRole('menuitem', { name: 'Sign out' }));
    expect(await screen.findByRole('link', { name: 'Sign in' })).toBeInTheDocument();
  });

  it('tells the user when the server could not end the session (offline sign-out)', async () => {
    signedInAs(customer);
    server.use(http.post(url('/api/v1/auth/logout'), () => HttpResponse.error()));
    const { user } = renderApp({ route: '/' });
    await user.click(await screen.findByRole('button', { name: 'Carlos' }));
    await user.click(within(screen.getByRole('menu')).getByRole('menuitem', { name: 'Sign out' }));
    expect(await screen.findByText(/You are signed out on this device/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Sign in' })).toBeInTheDocument();
  });

  it('has accessible sign-in and sign-up forms', async () => {
    const { container, unmount } = renderApp({ route: '/login' });
    await screen.findByRole('heading', { level: 1, name: 'Sign in' });
    await expectNoAxeViolations(container);
    unmount();
    const registerPage = renderApp({ route: '/register' });
    await screen.findByRole('heading', { level: 1, name: 'Create your account' });
    await expectNoAxeViolations(registerPage.container);
  });
});

describe('route protection', () => {
  it('sends anonymous visitors to sign in, remembering where they were going', async () => {
    const { router } = renderApp({ route: '/orders?page=2' });
    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/login');
    });
    expect(router.state.location.search).toBe('?redirect=%2Forders%3Fpage%3D2');
  });

  it('shows "access denied" to customers in the admin area', async () => {
    signedInAs(customer);
    renderApp({ route: '/admin' });
    expect(await screen.findByText('Access denied')).toBeInTheDocument();
  });

  it('lets admins into the admin area', async () => {
    signedInAs(admin);
    renderApp({ route: '/admin' });
    expect(await screen.findByRole('heading', { level: 1, name: 'Dashboard' })).toBeInTheDocument();
  });
});
