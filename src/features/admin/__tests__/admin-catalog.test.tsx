import { screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { CategoryNode, ProductDetail } from '@/api/schema';
import { categoryTree, phoneDetail, products } from '../../../../test/msw/catalog';
import { admin } from '../../../../test/msw/fixtures';
import { apiError, http, HttpResponse, url } from '../../../../test/msw/http';
import { server } from '../../../../test/msw/server';
import { signedInAs } from '../../../../test/msw/session';
import { expectNoAxeViolations } from '../../../../test/utils/axe';
import { renderApp } from '../../../../test/utils/render';

function asAdmin() {
  signedInAs(admin);
  server.use(http.get(url('/api/v1/categories'), () => HttpResponse.json({ data: categoryTree })));
}

describe('admin products', () => {
  it('lists active products by default and keeps filters in the URL', async () => {
    asAdmin();
    const requests: URLSearchParams[] = [];
    server.use(
      http.get(url('/api/v1/products'), ({ request }) => {
        const params = new URL(request.url).searchParams;
        requests.push(params);
        const data = params.get('status') === 'DRAFT' ? [] : products;
        return HttpResponse.json({
          data,
          meta: { page: 1, pageSize: 20, total: data.length, totalPages: 1 },
        });
      }),
    );
    const { user, router } = renderApp({ route: '/admin/products' });

    const link = await screen.findByRole('link', { name: 'Nimbus X Phone' });
    expect(link.closest('table')).toHaveAccessibleName('Products');
    expect(link).toHaveAttribute('href', `/admin/products/${phoneDetail.id}`);
    expect(requests.at(-1)?.get('status')).toBe('ACTIVE');
    expect(
      screen.getByText(`Showing 1–${products.length} of ${products.length}`),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('combobox', { name: 'Status' }));
    await user.click(await screen.findByRole('option', { name: 'Draft' }));
    expect(await screen.findByText('No products match these filters.')).toBeInTheDocument();
    expect(router.state.location.search).toBe('?status=DRAFT');
    expect(requests.at(-1)?.get('status')).toBe('DRAFT');
  });

  it('creates a product with its variants', async () => {
    asAdmin();
    let body: unknown;
    server.use(
      http.post(url('/api/v1/products'), async ({ request }) => {
        body = await request.json();
        return HttpResponse.json(
          {
            data: { ...phoneDetail, id: 'p9000000-0000-4000-8000-000000000009', name: 'Aero Lamp' },
          },
          { status: 201 },
        );
      }),
      http.get(url('/api/v1/products/{idOrSlug}'), () =>
        HttpResponse.json({ data: { ...phoneDetail, name: 'Aero Lamp' } }),
      ),
    );
    const { user, router } = renderApp({ route: '/admin/products/new' });

    await user.type(await screen.findByRole('textbox', { name: 'Name' }), 'Aero Lamp');
    await user.type(screen.getByRole('textbox', { name: 'Brand' }), 'Lumen');
    await user.type(screen.getByRole('textbox', { name: 'SKU' }), 'AERO-OAK');
    await user.type(screen.getByRole('textbox', { name: 'Price' }), '49.5');
    await user.type(screen.getByRole('textbox', { name: 'Attribute' }), 'finish');
    await user.type(screen.getByRole('textbox', { name: 'Value' }), 'Oak');
    await user.click(screen.getByRole('button', { name: 'Create product' }));

    expect(await screen.findByText('Product Aero Lamp created')).toBeInTheDocument();
    expect(body).toEqual({
      name: 'Aero Lamp',
      brand: 'Lumen',
      description: '',
      status: 'DRAFT',
      categoryIds: [],
      variants: [
        {
          sku: 'AERO-OAK',
          priceCents: 4950,
          compareAtPriceCents: null,
          attributes: { finish: 'Oak' },
          isActive: true,
          initialStock: 0,
        },
      ],
    });
    expect(router.state.location.pathname).toBe(
      '/admin/products/p9000000-0000-4000-8000-000000000009',
    );
  });

  it('validates variants before sending them', async () => {
    asAdmin();
    const { user } = renderApp({ route: '/admin/products/new' });
    await user.type(await screen.findByRole('textbox', { name: 'Name' }), 'Aero Lamp');
    await user.type(screen.getByRole('textbox', { name: 'SKU' }), 'A');
    await user.type(screen.getByRole('textbox', { name: 'Price' }), '20');
    await user.type(screen.getByRole('textbox', { name: 'Compare-at price' }), '10');
    await user.type(screen.getByRole('textbox', { name: 'Attribute' }), 'finish');
    await user.click(screen.getByRole('button', { name: 'Create product' }));

    expect(await screen.findByText('Use 2–64 characters.')).toBeInTheDocument();
    expect(screen.getByText('Must be higher than the price.')).toBeInTheDocument();
    expect(screen.getByText('Fill in both the attribute and its value.')).toBeInTheDocument();
  });

  it('edits a variant without touching its SKU and shows API conflicts', async () => {
    asAdmin();
    let product: ProductDetail = phoneDetail;
    const patches: unknown[] = [];
    server.use(
      http.get(url('/api/v1/products/{idOrSlug}'), () => HttpResponse.json({ data: product })),
      http.patch(url('/api/v1/products/{id}/variants/{variantId}'), async ({ request, params }) => {
        const body = (await request.json()) as { priceCents: number };
        patches.push(body);
        product = {
          ...product,
          variants: product.variants.map((v) =>
            v.id === params.variantId ? { ...v, priceCents: body.priceCents } : v,
          ),
        };
        return HttpResponse.json({ data: product.variants[0] });
      }),
    );
    const { user } = renderApp({ route: `/admin/products/${phoneDetail.id}` });

    await user.click(await screen.findByRole('button', { name: 'Edit variant NBX-BLACK-128' }));
    const dialog = await screen.findByRole('dialog', { name: 'Edit variant NBX-BLACK-128' });
    expect(within(dialog).getByRole('textbox', { name: 'SKU' })).toBeDisabled();
    const price = within(dialog).getByRole('textbox', { name: 'Price' });
    expect(price).toHaveValue('799.00');
    await user.clear(price);
    await user.type(price, '749.99');
    await user.click(within(dialog).getByRole('button', { name: 'Save' }));

    expect(await screen.findByText('Variant NBX-BLACK-128 saved')).toBeInTheDocument();
    expect(patches[0]).toEqual({
      name: 'Black / 128GB',
      priceCents: 74_999,
      compareAtPriceCents: null,
      attributes: { color: 'Black', storage: '128GB' },
      isActive: true,
    });
    const table = screen.getByRole('table', { name: 'Variants' });
    expect(await within(table).findByText('$749.99')).toBeInTheDocument();

    server.use(
      http.post(url('/api/v1/products/{id}/variants'), () =>
        apiError(409, 'SKU_TAKEN', 'SKU already exists'),
      ),
    );
    await user.click(screen.getByRole('button', { name: 'Add variant' }));
    const add = await screen.findByRole('dialog', { name: 'Add variant' });
    await user.type(within(add).getByRole('textbox', { name: 'SKU' }), 'NBX-BLACK-128');
    await user.type(within(add).getByRole('textbox', { name: 'Price' }), '799');
    await user.click(within(add).getByRole('button', { name: 'Save' }));
    expect(
      await within(add).findByText('Another variant already uses this SKU.'),
    ).toBeInTheDocument();
  });

  it('has no detectable accessibility violations in the editor', async () => {
    asAdmin();
    server.use(
      http.get(url('/api/v1/products/{idOrSlug}'), () => HttpResponse.json({ data: phoneDetail })),
    );
    const { container } = renderApp({ route: `/admin/products/${phoneDetail.id}` });
    await screen.findByRole('table', { name: 'Variants' });
    await expectNoAxeViolations(container);
  });
});

describe('admin categories', () => {
  it('adds a subcategory under the chosen parent', async () => {
    asAdmin();
    let body: unknown;
    server.use(
      http.post(url('/api/v1/categories'), async ({ request }) => {
        body = await request.json();
        const created: CategoryNode = {
          ...(categoryTree[0] as CategoryNode),
          id: 'c9000000-0000-4000-8000-000000000009',
          name: 'Tablets',
          slug: 'tablets',
          children: [],
        };
        return HttpResponse.json({ data: created }, { status: 201 });
      }),
    );
    const { user } = renderApp({ route: '/admin/categories' });
    await user.click(await screen.findByRole('button', { name: 'Add subcategory to Electronics' }));

    const dialog = await screen.findByRole('dialog', { name: 'New category' });
    expect(within(dialog).getByRole('combobox', { name: 'Parent category' })).toHaveTextContent(
      'Electronics',
    );
    await user.type(within(dialog).getByRole('textbox', { name: 'Name' }), 'Tablets');
    await user.click(within(dialog).getByRole('button', { name: 'Save' }));

    expect(await screen.findByText('Category Tablets created')).toBeInTheDocument();
    expect(body).toEqual({
      name: 'Tablets',
      description: null,
      parentId: categoryTree[0]?.id,
      sortOrder: 0,
      isActive: true,
    });
  });

  it('explains why a category with subcategories cannot be deleted', async () => {
    asAdmin();
    server.use(
      http.delete(url('/api/v1/categories/{id}'), () =>
        apiError(409, 'CATEGORY_HAS_CHILDREN', 'Category has sub-categories'),
      ),
    );
    const { user } = renderApp({ route: '/admin/categories' });
    await user.click(await screen.findByRole('button', { name: 'Delete Electronics' }));
    const confirm = await screen.findByRole('dialog', { name: 'Delete Electronics?' });
    await user.click(within(confirm).getByRole('button', { name: 'Delete' }));
    expect(await screen.findByText('Delete or move its subcategories first.')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });
});
