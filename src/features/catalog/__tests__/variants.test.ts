import { describe, expect, it } from 'vitest';
import type { ProductVariant } from '@/api/schema';
import { defaultVariant, findVariant, optionState, selectOption } from '../variants';

const v = (
  sku: string,
  attributes: Record<string, string>,
  stock: number,
  isActive = true,
): ProductVariant => ({
  id: sku,
  sku,
  name: sku,
  priceCents: 100,
  compareAtPriceCents: null,
  attributes,
  isActive,
  availableQuantity: stock,
  inStock: stock > 0,
});

// Black/128 in stock, Black/256 sold out, White/128 in stock, White/256 inactive (not sold).
const variants = [
  v('B128', { color: 'Black', storage: '128GB' }, 5),
  v('B256', { color: 'Black', storage: '256GB' }, 0),
  v('W128', { color: 'White', storage: '128GB' }, 2),
  v('W256', { color: 'White', storage: '256GB' }, 9, false),
];
const axes = ['color', 'storage'];

describe('variant selection', () => {
  it('defaults to the first variant that can be bought', () => {
    expect(defaultVariant(variants)?.sku).toBe('B128');
    expect(defaultVariant([variants[1]!])?.sku).toBe('B256');
  });

  it('finds the exact variant only when every axis is chosen', () => {
    expect(findVariant(variants, { color: 'White', storage: '128GB' }, axes)?.sku).toBe('W128');
    expect(findVariant(variants, { color: 'White' }, axes)).toBeUndefined();
    expect(findVariant(variants, { color: 'White', storage: '256GB' }, axes)).toBeUndefined(); // inactive
  });

  it('reports option states relative to the other choices', () => {
    const selection = { color: 'Black', storage: '128GB' };
    expect(optionState(variants, selection, 'storage', '256GB')).toBe('out_of_stock');
    expect(optionState(variants, { color: 'White', storage: '128GB' }, 'storage', '256GB')).toBe(
      'unavailable',
    );
    expect(optionState(variants, selection, 'color', 'White')).toBe('available');
  });

  it('jumps to a valid combination when a choice conflicts with the others', () => {
    expect(selectOption(variants, { color: 'Black', storage: '256GB' }, 'color', 'White')).toEqual({
      color: 'White',
      storage: '128GB',
    });
    expect(
      selectOption(variants, { color: 'Black', storage: '128GB' }, 'storage', '256GB'),
    ).toEqual({
      color: 'Black',
      storage: '256GB',
    });
  });
});
