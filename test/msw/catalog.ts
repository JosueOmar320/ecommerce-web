import type { CategoryNode, ProductDetail, ProductSummary, ProductVariant } from '@/api/schema';

export const categoryTree: CategoryNode[] = [
  {
    id: 'c1000000-0000-4000-8000-000000000001',
    parentId: null,
    name: 'Electronics',
    slug: 'electronics',
    description: 'Phones, computers and audio',
    sortOrder: 0,
    isActive: true,
    children: [
      {
        id: 'c1000000-0000-4000-8000-000000000002',
        parentId: 'c1000000-0000-4000-8000-000000000001',
        name: 'Phones',
        slug: 'phones',
        description: 'Smartphones',
        sortOrder: 0,
        isActive: true,
        children: [],
      },
      {
        id: 'c1000000-0000-4000-8000-000000000003',
        parentId: 'c1000000-0000-4000-8000-000000000001',
        name: 'Audio',
        slug: 'audio',
        description: 'Headphones and speakers',
        sortOrder: 1,
        isActive: true,
        children: [],
      },
    ],
  },
  {
    id: 'c1000000-0000-4000-8000-000000000004',
    parentId: null,
    name: 'Home & Kitchen',
    slug: 'home-kitchen',
    description: 'Coffee and cookware',
    sortOrder: 1,
    isActive: true,
    children: [],
  },
];

const ref = (slug: string) => {
  const flat = categoryTree.flatMap((c) => [c, ...c.children]);
  const found = flat.find((c) => c.slug === slug);
  if (!found) throw new Error(`Unknown fixture category ${slug}`);
  return { id: found.id, name: found.name, slug: found.slug };
};

function summary(index: number, overrides: Partial<ProductSummary>): ProductSummary {
  return {
    id: `p1000000-0000-4000-8000-${String(index).padStart(12, '0')}`,
    name: `Product ${index}`,
    slug: `product-${index}`,
    brand: 'Acme',
    status: 'ACTIVE',
    currency: 'USD',
    minPriceCents: 10_000,
    maxPriceCents: 10_000,
    inStock: true,
    categories: [],
    createdAt: new Date(Date.UTC(2026, 0, index)).toISOString(),
    ...overrides,
  };
}

export const products: ProductSummary[] = [
  summary(1, {
    name: 'Nimbus X Phone',
    slug: 'nimbus-x-phone',
    brand: 'Nimbus',
    minPriceCents: 79_900,
    maxPriceCents: 89_900,
    categories: [ref('electronics'), ref('phones')],
  }),
  summary(2, {
    name: 'Echo Studio Wireless Headphones',
    slug: 'echo-studio-wireless-headphones',
    brand: 'Echo',
    minPriceCents: 34_900,
    maxPriceCents: 34_900,
    categories: [ref('electronics'), ref('audio')],
  }),
  summary(3, {
    name: 'Pulse Mini Bluetooth Speaker',
    slug: 'pulse-mini-bluetooth-speaker',
    brand: 'Pulse',
    minPriceCents: 4_900,
    maxPriceCents: 4_900,
    inStock: false,
    categories: [ref('electronics'), ref('audio')],
  }),
  summary(4, {
    name: 'Barista Burr Coffee Grinder',
    slug: 'barista-burr-coffee-grinder',
    brand: 'Barista',
    minPriceCents: 14_900,
    maxPriceCents: 14_900,
    categories: [ref('home-kitchen')],
  }),
];

const variant = (
  id: string,
  sku: string,
  attributes: Record<string, string>,
  priceCents: number,
  availableQuantity: number,
): ProductVariant => ({
  id,
  sku,
  name: Object.values(attributes).join(' / '),
  priceCents,
  compareAtPriceCents: null,
  attributes,
  isActive: true,
  availableQuantity,
  inStock: availableQuantity > 0,
});

export const phoneDetail: ProductDetail = {
  ...(products[0] as ProductSummary),
  description: '6.1" OLED smartphone with a dual camera and all-day battery.',
  updatedAt: '2026-02-01T00:00:00.000Z',
  options: { color: ['Black', 'White'], storage: ['128GB', '256GB'] },
  variants: [
    variant(
      'v1000000-0000-4000-8000-000000000001',
      'NBX-BLACK-128',
      { color: 'Black', storage: '128GB' },
      79_900,
      5,
    ),
    variant(
      'v1000000-0000-4000-8000-000000000002',
      'NBX-BLACK-256',
      { color: 'Black', storage: '256GB' },
      89_900,
      0,
    ),
    variant(
      'v1000000-0000-4000-8000-000000000003',
      'NBX-WHITE-128',
      { color: 'White', storage: '128GB' },
      79_900,
      2,
    ),
    variant(
      'v1000000-0000-4000-8000-000000000004',
      'NBX-WHITE-256',
      { color: 'White', storage: '256GB' },
      89_900,
      3,
    ),
  ],
};
