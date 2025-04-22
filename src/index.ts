import { DIVVI_MAGIC_PREFIX, FORMAT_ID_BYTES } from './constants'
import { InvalidAddressError, Address } from './types'

// Helper function to validate Ethereum addresses
function isValidAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address)
}

// Helper function to pad hex string to 32 bytes (64 characters)
function padHex(hex: string): string {
  return hex.padStart(64, '0')
}

// Helper function to encode a single address
function encodeAddress(address: string): string {
  return padHex(address.slice(2).toLowerCase())
}

// Helper function to encode an array of addresses
function encodeAddressArray(addresses: string[]): string {
  // First encode the length of each element of the array (64 characters is 32 bytes)
  const addressLengthHex = (64).toString(16).padStart(64, '0')

  // Then encode the length of the array (32 bytes)
  const arrayLengthHex = addresses.length.toString(16).padStart(64, '0')

  // Then encode each address (32 bytes each)
  const addressesHex = addresses.map((addr) => encodeAddress(addr)).join('')

  return addressLengthHex + arrayLengthHex + addressesHex
}

/**
 * Generates the calldata suffix for the Divvi referral system.
 *
 * @param params - The parameters for generating the calldata suffix.
 * @param params.consumer - The consumer address.
 * @param params.providers - An array of provider addresses. Defaults to an empty array.
 * @param params.formatId - The format identifier for encoding. Defaults to FormatID.Default.
 * @returns The calldata suffix as a hex string.
 */
export function getDataSuffix({
  consumer,
  providers = [],
}: {
  consumer: Address
  providers?: Address[]
}): string {
  // Validate addresses
  if (!isValidAddress(consumer)) {
    throw new InvalidAddressError({ address: consumer })
  }

  for (const provider of providers) {
    if (!isValidAddress(provider)) {
      throw new InvalidAddressError({ address: provider })
    }
  }

  // Encode the data according to ABI encoding rules
  const encodedConsumer = encodeAddress(consumer)
  const encodedProviders = encodeAddressArray(providers)
  const encodedBytes = encodedConsumer + encodedProviders

  // Calculate the total length of the data (in bytes)
  const totalLength = (8 + 2 + encodedBytes.length + 8) / 2 // 8 for prefix, 2 for format byte, rest for data and length
  const lengthHex = totalLength.toString(16).padStart(8, '0')

  // Get the format byte
  const formatByte = FORMAT_ID_BYTES['default']

  // Combine all parts
  return DIVVI_MAGIC_PREFIX + formatByte + encodedBytes + lengthHex
}

/**
 * Posts an attribution event to the tracking API
 *
 * @param params - The parameters for the attribution event
 * @param params.txHash - The transaction hash
 * @param params.chainId - The chain ID
 * @param params.baseUrl - The base URL for the API endpoint (optional)
 * @returns A promise that resolves to the response from the API
 */
export async function postAttributionEvent({
  txHash,
  chainId,
  baseUrl = 'https://api.mainnet.valora.xyz/trackRegistrationEvent',
}: {
  txHash: Address
  chainId: number
  baseUrl?: string
}): Promise<Response> {
  const response = await fetch(baseUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      txHash,
      chainId,
    }),
  })

  if (!response.ok) {
    throw new Error(`Failed to post attribution event: ${response.statusText}`)
  }

  return response
}
