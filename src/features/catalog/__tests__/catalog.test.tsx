import { screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { apiError, http, HttpResponse, url } from '../../../../test/msw/http';
import { server } from '../../../../test/msw/server';
import { expectNoAxeViolations } from '../../../../test/utils/axe';
import { renderApp } from '../../../../test/utils/render';

const productNames = () =>
  within(screen.getByRole('list'))
    .getAllByRole('heading', { level: 2 })
    .map((h) => h.textContent);

describe('products page', () => {
  it('lists products with a result count', async () => {
    renderApp({ route: '/products' });
    expect(await screen.findByText('4 products')).toHaveAttribute('role', 'status');
    expect(productNames()).toHaveLength(4);
    expect(screen.getByText('Out of stock')).toBeInTheDocument();
  });

  it('applies filters from a shared URL (deep link)', async () => {
    renderApp({ route: '/products?category=audio&availability=in_stock' });
    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent('1 product');
    });
    expect(productNames()).toEqual(['Echo Studio Wireless Headphones']);
    expect(screen.getByRole('button', { name: 'Remove filter: Audio' })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Remove filter: In stock only' }),
    ).toBeInTheDocument();
  });

  it('writes filter changes to the URL and resets the page', async () => {
    const { user, router } = renderApp({ route: '/products?page=2' });
    const categories = await screen.findByRole('radiogroup', { name: 'Category' });
    await user.click(within(categories).getByRole('radio', { name: 'Home & Kitchen' }));

    await waitFor(() => {
      expect(router.state.location.search).toBe('?category=home-kitchen');
    });
    await waitFor(() => {
      expect(productNames()).toEqual(['Barista Burr Coffee Grinder']);
    });
  });

  it('removes a filter from its chip and goes back with browser history', async () => {
    const { user, router } = renderApp({ route: '/products?category=audio' });
    await user.click(await screen.findByRole('button', { name: 'Remove filter: Audio' }));
    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent('4 products');
    });

    await router.navigate(-1);
    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent('2 products');
    });
  });

  it('sorts by price', async () => {
    const { user } = renderApp({ route: '/products' });
    await screen.findByText('4 products');
    await user.click(screen.getByRole('combobox', { name: 'Sort by' }));
    await user.click(screen.getByRole('option', { name: 'Price: low to high' }));
    await waitFor(() => {
      expect(productNames()[0]).toBe('Pulse Mini Bluetooth Speaker');
    });
  });

  it('searches on the server as you type (debounced)', async () => {
    let requests = 0;
    server.events.on('request:start', ({ request }) => {
      if (new URL(request.url).searchParams.get('search')) requests++;
    });
    const { user, router } = renderApp({ route: '/products' });
    await screen.findByText('4 products');

    await user.type(screen.getByRole('searchbox', { name: 'Search in results' }), 'echo');
    await waitFor(() => {
      expect(router.state.location.search).toBe('?search=echo');
    });
    await waitFor(() => {
      expect(productNames()).toEqual(['Echo Studio Wireless Headphones']);
    });
    expect(requests).toBe(1);
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Results for “echo”' }),
    ).toBeInTheDocument();
    server.events.removeAllListeners();
  });

  it('shows an empty state that can clear the filters', async () => {
    const { user } = renderApp({ route: '/products?search=zzz' });
    expect(await screen.findByText('No products match')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Clear filters' }));
    expect(await screen.findByText('4 products')).toBeInTheDocument();
  });

  it('recovers from a server error with retry', async () => {
    let fail = true;
    server.use(
      http.get(url('/api/v1/products'), () =>
        fail
          ? apiError(500, 'INTERNAL_SERVER_ERROR')
          : HttpResponse.json({
              data: [],
              meta: { page: 1, pageSize: 24, total: 0, totalPages: 0 },
            }),
      ),
    );
    const { user } = renderApp({ route: '/products' });
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('We could not load products');
    expect(alert).toHaveTextContent('Something went wrong on our side');
    fail = false;
    await user.click(within(alert).getByRole('button', { name: 'Try again' }));
    expect(await screen.findByText('No products match')).toBeInTheDocument();
  });

  it('has no detectable accessibility violations', async () => {
    const { container } = renderApp({ route: '/products' });
    await screen.findByText('4 products');
    await expectNoAxeViolations(container);
  });
});

describe('category page', () => {
  it('shows the category, its subcategories and its products', async () => {
    renderApp({ route: '/categories/electronics' });
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Electronics' }),
    ).toBeInTheDocument();
    const subcategories = screen.getByRole('navigation', { name: 'Shop by subcategory' });
    expect(within(subcategories).getByRole('link', { name: 'Phones' })).toHaveAttribute(
      'href',
      '/categories/phones',
    );
    expect(await screen.findByText('3 products')).toBeInTheDocument();
    // The category is part of the path, so it is not offered again as a filter.
    expect(screen.queryByRole('radiogroup', { name: 'Category' })).not.toBeInTheDocument();
  });

  it('shows not found for unknown categories', async () => {
    renderApp({ route: '/categories/nope' });
    expect(await screen.findByText('Page not found')).toBeInTheDocument();
  });
});
