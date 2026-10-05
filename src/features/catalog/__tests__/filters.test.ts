import { describe, expect, it } from 'vitest';
import { countActiveFilters, parseFilters, serializeFilters } from '../filters';

const parse = (query: string) => parseFilters(new URLSearchParams(query));

describe('product filters in the URL', () => {
  it('parses a full set of filters', () => {
    expect(
      parse('search=iphone&category=phones&minPrice=500&maxPrice=1500&sort=price_asc&page=2'),
    ).toEqual({
      search: 'iphone',
      category: 'phones',
      brand: undefined,
      minPrice: '500',
      maxPrice: '1500',
      availability: undefined,
      sort: 'price_asc',
      page: 2,
    });
  });

  it.each([
    ['page=-3', 'page'],
    ['page=abc', 'page'],
    ['sort=random', 'sort'],
    ['minPrice=10.999', 'minPrice'],
    ['category=Not%20A%20Slug', 'category'],
    ['availability=maybe', 'availability'],
  ])('drops malformed values (%s)', (query, key) => {
    expect(parse(query)[key as keyof ReturnType<typeof parse>]).toBeUndefined();
  });

  it('drops combinations the API would reject', () => {
    expect(parse('sort=relevance').sort).toBeUndefined();
    expect(parse('sort=relevance&search=x').sort).toBe('relevance');
    expect(parse('minPrice=500&maxPrice=100')).toEqual({ minPrice: '500' });
  });

  it('serializes without empty values or page 1', () => {
    expect(
      serializeFilters({ search: 'a b', page: 1, category: undefined, sort: 'newest' }).toString(),
    ).toBe('search=a+b&sort=newest');
  });

  it('counts user filters, not search or sort', () => {
    expect(
      countActiveFilters({ search: 'x', sort: 'newest', category: 'audio', minPrice: '10' }),
    ).toBe(2);
  });
});
