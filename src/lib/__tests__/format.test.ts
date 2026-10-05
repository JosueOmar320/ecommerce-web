import { describe, expect, it } from 'vitest';
import { currencySymbol, decimalToCents, formatMoney, formatPriceRange } from '../format';

describe('money formatting', () => {
  it('formats integer cents in the user language', () => {
    expect(formatMoney(49_999, 'USD', 'en')).toBe('$499.99');
    expect(formatMoney(49_999, 'USD', 'es')).toMatch(/499,99/);
  });

  it('formats price ranges and collapses equal bounds', () => {
    expect(formatPriceRange(10_000, 25_000, 'USD', 'en')).toBe('$100.00 – $250.00');
    expect(formatPriceRange(10_000, 10_000, 'USD', 'en')).toBe('$100.00');
    expect(formatPriceRange(null, null, 'USD', 'en')).toBeNull();
  });

  it('converts decimal strings to cents without floating-point errors', () => {
    expect(decimalToCents('0.29')).toBe(29);
    expect(decimalToCents('19.9')).toBe(1_990);
    expect(decimalToCents('500')).toBe(50_000);
  });

  it('extracts the currency symbol', () => {
    expect(currencySymbol('USD', 'en')).toBe('$');
  });
});
