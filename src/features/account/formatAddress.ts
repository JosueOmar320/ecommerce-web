import type { Address, AddressSnapshot } from '@/api/schema';
import type { AddressFormInput } from './addressSchema';
import { COUNTRIES } from './addressSchema';

type PostalAddress = Pick<
  AddressSnapshot,
  'line1' | 'line2' | 'city' | 'state' | 'postalCode' | 'country'
>;

/** One-line postal address, used in address pickers, cards and order details. */
export function formatAddress(address: PostalAddress) {
  return [
    address.line1,
    address.line2,
    `${address.city}${address.state ? `, ${address.state}` : ''} ${address.postalCode}`,
    address.country,
  ]
    .filter(Boolean)
    .join(' · ');
}

const isKnownCountry = (code: string): code is (typeof COUNTRIES)[number] =>
  (COUNTRIES as readonly string[]).includes(code);

/** Saved address → form values (nullable API fields become empty inputs). */
export function toAddressForm(address: Address): AddressFormInput {
  return {
    recipientName: address.recipientName,
    phone: address.phone ?? '',
    line1: address.line1,
    line2: address.line2 ?? '',
    city: address.city,
    state: address.state ?? '',
    postalCode: address.postalCode,
    country: isKnownCountry(address.country) ? address.country : 'MX',
    label: address.label ?? '',
    isDefault: address.isDefault,
  };
}
