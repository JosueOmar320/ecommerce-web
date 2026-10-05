import { screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { expectNoAxeViolations } from '../../../../test/utils/axe';
import { renderApp } from '../../../../test/utils/render';

describe('store layout', () => {
  it('offers a skip link that targets the main content', async () => {
    renderApp();
    const skip = await screen.findByRole('link', { name: 'Skip to main content' });
    expect(skip).toHaveAttribute('href', '#main-content');
    expect(screen.getByRole('main')).toHaveAttribute('id', 'main-content');
  });

  it('submits a search to the products page as URL state', async () => {
    const { user, router } = renderApp();
    const search = await screen.findByRole('searchbox', { name: 'Search products' });
    await user.type(search, 'wireless headphones{Enter}');
    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/products');
    });
    expect(router.state.location.search).toBe('?search=wireless%20headphones');
  });

  it('switches language instantly and keeps <html lang> in sync', async () => {
    const { user } = renderApp();
    await user.click(await screen.findByRole('button', { name: 'Theme · Language' }));
    const dialog = await screen.findByRole('dialog', { name: 'Theme · Language' });
    await user.click(within(dialog).getByRole('button', { name: 'Español' }));
    // The preferences popover is modal: close it to interact with the page again.
    await user.keyboard('{Escape}');

    expect(await screen.findByRole('link', { name: 'Iniciar sesión' })).toBeInTheDocument();
    expect(document.documentElement.lang).toBe('es');
    expect(window.localStorage.getItem('kestrel.language')).toBe('es');
  });

  it('shows a not-found page for unknown URLs', async () => {
    renderApp({ route: '/definitely/not/here' });
    expect(await screen.findByText('Page not found')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Go to the home page' })).toHaveAttribute('href', '/');
  });

  it('has no detectable accessibility violations', async () => {
    const { container } = renderApp();
    await screen.findByRole('heading', {
      level: 1,
      name: 'Well-made things for the way you live.',
    });
    await screen.findByRole('link', { name: 'Nimbus X Phone' });
    await expectNoAxeViolations(container);
  });
});
