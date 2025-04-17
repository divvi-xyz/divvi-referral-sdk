import { DIVVI_MAGIC_PREFIX } from './constants';
import { InvalidAddressError } from './types';

// Helper function to validate Ethereum addresses
function isValidAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

// Helper function to pad hex string to 32 bytes (64 characters)
function padHex(hex: string): string {
  return hex.padStart(64, '0');
}

// Helper function to encode a single address
function encodeAddress(address: string): string {
  return padHex(address.slice(2).toLowerCase());
}

// Helper function to encode an array of addresses
function encodeAddressArray(addresses: string[]): string {
  // First encode the length of each element of the array (64 characters is 32 bytes)
  const addressLengthHex = (64).toString(16).padStart(64, '0');

  // Then encode the length of the array (32 bytes)
  const arrayLengthHex = addresses.length.toString(16).padStart(64, '0');

  // Then encode each address (32 bytes each)
  const addressesHex = addresses.map((addr) => encodeAddress(addr)).join('');

  return addressLengthHex + arrayLengthHex + addressesHex;
}

/**
 * Generates the calldata suffix for the Divvi referral system.
 *
 * @param consumer - The consumer address.
 * @param providers - An array of provider addresses.
 * @returns The calldata suffix as a hex string.
 */
export function getDataSuffix(consumer: `0x${string}`, providers: `0x${string}`[]): string {
  // Validate addresses
  if (!isValidAddress(consumer)) {
    throw new InvalidAddressError({ address: consumer });
  }

  for (const provider of providers) {
    if (!isValidAddress(provider)) {
      throw new InvalidAddressError({ address: provider });
    }
  }

  // Encode the data according to ABI encoding rules
  const encodedConsumer = encodeAddress(consumer);
  const encodedProviders = encodeAddressArray(providers);
  const encodedBytes = encodedConsumer + encodedProviders;

  // Calculate the total length of the data (in bytes)
  const totalLength = (8 + encodedBytes.length + 8) / 2;
  const lengthHex = totalLength.toString(16).padStart(8, '0');

  // Combine all parts
  return DIVVI_MAGIC_PREFIX + encodedBytes + lengthHex;
}
