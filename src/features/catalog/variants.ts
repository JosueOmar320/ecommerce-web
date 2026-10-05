import type { ProductVariant } from '@/api/schema';

export type Selection = Record<string, string>;
export type OptionState = 'available' | 'out_of_stock' | 'unavailable';

const active = (variants: ProductVariant[]) => variants.filter((v) => v.isActive);

const matches = (variant: ProductVariant, selection: Selection) =>
  Object.entries(selection).every(([axis, value]) => variant.attributes[axis] === value);

/** The variant whose attributes equal the selection exactly (all axes chosen), if any. */
export function findVariant(variants: ProductVariant[], selection: Selection, axes: string[]) {
  if (axes.some((axis) => !selection[axis])) return undefined;
  return active(variants).find((v) => matches(v, selection));
}

/** Default selection: the first variant that can be bought, otherwise the first active one. */
export function defaultVariant(variants: ProductVariant[]): ProductVariant | undefined {
  const candidates = active(variants);
  return candidates.find((v) => v.inStock) ?? candidates[0];
}

/**
 * State of one option value given the rest of the current selection:
 *  - available: some active, in-stock variant has it together with the other choices;
 *  - out_of_stock: the combination exists but has no stock;
 *  - unavailable: no active variant has that combination.
 */
export function optionState(
  variants: ProductVariant[],
  selection: Selection,
  axis: string,
  value: string,
): OptionState {
  const others = Object.fromEntries(Object.entries(selection).filter(([key]) => key !== axis));
  const candidates = active(variants).filter(
    (v) => v.attributes[axis] === value && matches(v, others),
  );
  if (candidates.length === 0) return 'unavailable';
  return candidates.some((v) => v.inStock) ? 'available' : 'out_of_stock';
}

/**
 * Applies a user's choice. When the new value is incompatible with the other choices, the
 * selection jumps to the best variant that has it (in stock first) instead of leaving the user
 * on a combination that does not exist.
 */
export function selectOption(
  variants: ProductVariant[],
  selection: Selection,
  axis: string,
  value: string,
): Selection {
  const next = { ...selection, [axis]: value };
  if (active(variants).some((v) => matches(v, next))) return next;
  const withValue = active(variants).filter((v) => v.attributes[axis] === value);
  const best = withValue.find((v) => v.inStock) ?? withValue[0];
  return best ? { ...best.attributes } : next;
}
