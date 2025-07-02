import { DIVVI_MAGIC_PREFIX, REFERRAL_TAG_FORMAT_1_BYTE } from './constants'
import { InvalidAddressError, Address, Hex } from './types'

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
function encodeAddressArray(addresses: readonly string[]): string {
  // Calculate the offset to where the array data starts
  // This offset accounts for all static fields that come BEFORE this dynamic array:
  // - encodedUser: 32 bytes
  // - encodedConsumer: 32 bytes
  // - providers array offset (this field): 32 bytes
  // Total static data before array content: 3 × 32 = 96 bytes
  //
  // NOTE: When updating the ABI structure, update this calculation
  const arrayDataOffsetHex = (96).toString(16).padStart(64, '0')

  // Encode the length of the array (32 bytes)
  const arrayLengthHex = addresses.length.toString(16).padStart(64, '0')

  // Encode each address (32 bytes each)
  const addressesHex = addresses.map((addr) => encodeAddress(addr)).join('')

  return arrayDataOffsetHex + arrayLengthHex + addressesHex
}

/**
 * Generates the referral tag for the Divvi referral system.
 *
 * @param params - The parameters for generating the referral tag.
 * @param params.user - The user address that consented to the transaction. This is cryptographically verified on the backend to ensure accurate referral attribution.
 * @param params.consumer - The consumer address.
 * @param params.providers - An array of provider addresses. Defaults to an empty array.
 * @returns The referral tag as a hex string.
 */
export function getReferralTag({
  user,
  consumer,
  providers = [],
}: {
  user: Address
  consumer: Address
  providers?: readonly Address[]
}): string {
  // Validate addresses

  if (!isValidAddress(user)) {
    throw new InvalidAddressError({ address: user })
  }

  if (!isValidAddress(consumer)) {
    throw new InvalidAddressError({ address: consumer })
  }

  for (const provider of providers) {
    if (!isValidAddress(provider)) {
      throw new InvalidAddressError({ address: provider })
    }
  }

  // Encode the data according to ABI encoding rules
  const encodedUser = encodeAddress(user)
  const encodedConsumer = encodeAddress(consumer)
  const encodedProviders = encodeAddressArray(providers)
  const encodedBytes = encodedUser + encodedConsumer + encodedProviders

  // Calculate the length of the payload (in bytes)
  const payloadLength = encodedBytes.length / 2
  const payloadLengthHex = payloadLength.toString(16).padStart(4, '0')

  // Combine all parts
  return (
    DIVVI_MAGIC_PREFIX +
    REFERRAL_TAG_FORMAT_1_BYTE +
    payloadLengthHex +
    encodedBytes
  )
}

/**
 * Posts an attribution event to the tracking API
 *
 * @param params - The parameters for the attribution event
 * @param params.txHash - The transaction hash (for transaction-based referrals)
 * @param params.message - The signed message (for signed message-based referrals, can be string or Hex)
 * @param params.signature - The signature of the message (for signed message-based referrals)
 * @param params.chainId - The chain ID
 * @param params.baseUrl - The base URL for the API endpoint (optional)
 * @returns A promise that resolves to the response from the API
 * @throws {Error} Client error (4xx) - When the request fails due to client-side issues
 * @throws {Error} Server error (5xx) - When the request fails due to server-side issues, client should retry the request
 */
export async function submitReferral(
  params:
    | {
        txHash: Address
        chainId: number
        baseUrl?: string
      }
    | {
        message: string | Hex
        signature: Hex
        chainId: number
        baseUrl?: string
      },
): Promise<Response> {
  const { chainId, baseUrl = 'https://api.divvi.xyz/submitReferral' } = params

  let body: object
  if ('txHash' in params) {
    // Transaction-based referral
    body = {
      txHash: params.txHash,
      chainId,
    }
  } else {
    // Signed message-based referral
    body = {
      message: params.message,
      signature: params.signature,
      chainId,
    }
  }

  const response = await fetch(baseUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    // Handle 4xx client errors
    if (response.status >= 400 && response.status < 500) {
      const errorResponse = await response.text()
      throw new Error(
        `Client error: ${response.status} ${response.statusText} ${errorResponse}`,
      )
    }
    // Handle all other errors (5xx server errors, etc.)
    throw new Error(
      `Server error: Failed to submit referral event: ${response.statusText}. Client should retry the request.`,
    )
  }

  return response
}

// Re-export only the types that are needed for the public API
export { Address, Hex, InvalidAddressError } from './types'
