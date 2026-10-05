import type { CurrentUser } from '@/api/schema';
import { customer } from './fixtures';
import { http, HttpResponse, url } from './http';
import { server } from './server';

/** A visitor whose browser holds a valid refresh cookie for `user`. */
export function signedInAs(user: CurrentUser = customer) {
  server.use(
    http.post(url('/api/v1/auth/refresh'), () =>
      HttpResponse.json({
        data: { accessToken: `token-${user.id}`, tokenType: 'Bearer', expiresIn: 900 },
      }),
    ),
    http.get(url('/api/v1/auth/me'), () => HttpResponse.json({ data: user })),
    http.get(url('/api/v1/cart'), () => HttpResponse.json({ data: emptyCart })),
    http.get(url('/api/v1/wishlist'), () => HttpResponse.json({ data: [] })),
  );
}

export const emptyCart = {
  items: [],
  itemCount: 0,
  currency: 'USD',
  subtotalCents: 0,
  shippingCents: 0,
  taxCents: 0,
  totalCents: 0,
  isCheckoutReady: false,
};
