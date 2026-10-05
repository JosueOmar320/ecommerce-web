import { categoryTree, phoneDetail, products } from './catalog';
import { apiError, http, HttpResponse, url } from './http';

/**
 * Baseline: an anonymous visitor (no refresh cookie) and a small catalog whose list endpoint
 * implements the filters the UI sends, like the real API. Tests override per scenario with
 * `server.use(...)`.
 */
export const handlers = [
  http.post(url('/api/v1/auth/refresh'), () => apiError(401, 'INVALID_REFRESH_TOKEN')),
  http.post(url('/api/v1/auth/logout'), () => new HttpResponse(null, { status: 204 })),

  http.get(url('/api/v1/categories'), () => HttpResponse.json({ data: categoryTree })),

  http.get(url('/api/v1/products'), ({ request }) => {
    const query = new URL(request.url).searchParams;
    const page = Number(query.get('page') ?? 1);
    const pageSize = Number(query.get('pageSize') ?? 20);
    const search = query.get('search')?.toLowerCase();
    const category = query.get('category');
    const availability = query.get('availability');
    const minCents = query.get('minPrice') ? Number(query.get('minPrice')) * 100 : undefined;

    let result = products.filter(
      (p) =>
        (!search || p.name.toLowerCase().includes(search)) &&
        (!category || p.categories.some((c) => c.slug === category)) &&
        (availability !== 'in_stock' || p.inStock) &&
        (minCents === undefined || (p.maxPriceCents ?? 0) >= minCents),
    );
    if (query.get('sort') === 'price_asc')
      result = [...result].sort((a, b) => (a.minPriceCents ?? 0) - (b.minPriceCents ?? 0));

    const data = result.slice((page - 1) * pageSize, page * pageSize);
    return HttpResponse.json({
      data,
      meta: {
        page,
        pageSize,
        total: result.length,
        totalPages: Math.ceil(result.length / pageSize),
      },
    });
  }),

  http.get(url('/api/v1/products/{idOrSlug}'), ({ params }) =>
    params.idOrSlug === phoneDetail.slug || params.idOrSlug === phoneDetail.id
      ? HttpResponse.json({ data: phoneDetail })
      : apiError(404, 'PRODUCT_NOT_FOUND', 'Product not found'),
  ),
];
