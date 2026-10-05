import { describe, expect, it } from 'vitest';
import { ApiError } from '@/api/errors';
import { i18n } from '@/i18n';
import { getErrorMessage } from '../errorMessage';
import { safeRedirect } from '../safeRedirect';

describe('safeRedirect', () => {
  it.each([
    ['/orders', '/orders'],
    ['/products?search=a', '/products?search=a'],
    ['//evil.com', '/'],
    ['/\\evil.com', '/'],
    ['https://evil.com', '/'],
    ['javascript:alert(1)', '/'],
    [null, '/'],
  ])('%s → %s', (input, expected) => {
    expect(safeRedirect(input)).toBe(expected);
  });
});

describe('getErrorMessage', () => {
  const t = i18n.t.bind(i18n);

  it('prefers copy for the backend error code', () => {
    expect(getErrorMessage(new ApiError(401, 'INVALID_CREDENTIALS', 'raw'), t)).toBe(
      'The email or password is incorrect.',
    );
  });

  it('falls back to the status family and never shows the raw message', () => {
    const message = getErrorMessage(new ApiError(503, 'SOMETHING_NEW', 'stack trace here'), t);
    expect(message).toBe('Something went wrong on our side. Please try again.');
    expect(message).not.toContain('stack trace');
  });

  it('explains network failures', () => {
    expect(getErrorMessage(new ApiError(0, 'NETWORK_ERROR', ''), t)).toMatch(
      /could not reach the store/,
    );
  });

  it('handles non-API errors', () => {
    expect(getErrorMessage(new Error('boom'), t)).toBe(
      'An unexpected error occurred. Please try again.',
    );
  });
});
