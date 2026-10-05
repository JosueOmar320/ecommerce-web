import { describe, expect, it } from 'vitest';
import { parseEnv } from './env';

describe('parseEnv', () => {
  it('accepts valid URLs and strips trailing slashes', () => {
    expect(
      parseEnv({ VITE_API_URL: 'https://api.shop.test/', VITE_SITE_URL: 'https://shop.test' }),
    ).toEqual({
      VITE_API_URL: 'https://api.shop.test',
      VITE_SITE_URL: 'https://shop.test',
    });
  });

  it('fails with a readable message naming every invalid variable', () => {
    expect(() => parseEnv({ VITE_API_URL: 'not a url' })).toThrow(
      /VITE_API_URL[\s\S]*VITE_SITE_URL/,
    );
  });

  it('rejects non-http protocols', () => {
    expect(() =>
      parseEnv({ VITE_API_URL: 'javascript:alert(1)', VITE_SITE_URL: 'https://shop.test' }),
    ).toThrow(/VITE_API_URL/);
  });
});
