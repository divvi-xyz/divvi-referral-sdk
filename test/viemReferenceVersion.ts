// eslint-disable-next-line import/no-extraneous-dependencies
import {
  encodeAbiParameters,
  keccak256,
  toBytes,
  hexToBytes,
  isAddress,
} from 'viem'
import { InvalidAddressError, Address } from '../src/types'
import { REFERRAL_TAG_V2_FORMAT_BYTE } from '../src/constants'

/**
 * @deprecated This function is deprecated and should only be used to validate and compare
 * its functionality to getReferralTag in index.ts. Do not use this function in production code.
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
  // Compute the first 4 bytes of the function selector for "divvi"
  const magicPrefixBytes = keccak256(toBytes('divvi')).slice(2, 10) // remove "0x", take first 8 hex chars (4 bytes)

  if (!isAddress(user)) {
    throw new InvalidAddressError({ address: user })
  }

  if (!isAddress(consumer)) {
    throw new InvalidAddressError({ address: consumer })
  }

  providers.forEach((provider) => {
    if (!isAddress(provider)) {
      throw new InvalidAddressError({ address: provider })
    }
  })

  // Encode parameters: (address, address, address[])
  const encodedData = encodeAbiParameters(
    [{ type: 'address' }, { type: 'address' }, { type: 'address[]' }],
    [user, consumer, providers],
  )

  // Calculate total length
  const encodedBytes = hexToBytes(encodedData)
  const payloadLength = encodedBytes.length
  const payloadLengthHex = payloadLength.toString(16).padStart(4, '0') // uint16 as 4 hex chars

  // Construct appended data and final calldata
  const appendedData =
    magicPrefixBytes +
    REFERRAL_TAG_V2_FORMAT_BYTE +
    payloadLengthHex +
    encodedData.slice(2)
  return appendedData
}
