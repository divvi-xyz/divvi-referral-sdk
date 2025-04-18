// eslint-disable-next-line import/no-extraneous-dependencies
import {
  encodeAbiParameters,
  keccak256,
  toBytes,
  hexToBytes,
  isAddress,
} from 'viem'
import { FormatID, InvalidAddressError, Address } from '../src/types'
import { FORMAT_ID_BYTES } from '../src/constants'

/**
 * @deprecated This function is deprecated and should only be used to validate and compare
 * its functionality to getDataSuffix in index.ts. Do not use this function in production code.
 */
export function getDataSuffix({
  consumer,
  providers = [],
  formatId = FormatID.Default,
}: {
  consumer: Address;
  providers?: Address[];
  formatId?: FormatID;
}): string {
  // Compute the first 4 bytes of the function selector for "divvi"
  const magicPrefixBytes = keccak256(toBytes('divvi')).slice(2, 10) // remove "0x", take first 8 hex chars (4 bytes)

  if (!isAddress(consumer)) {
    throw new InvalidAddressError({ address: consumer })
  }

  providers.forEach((provider) => {
    if (!isAddress(provider)) {
      throw new InvalidAddressError({ address: provider })
    }
  })

  // Encode parameters: (address, address[])
  const encodedData = encodeAbiParameters(
    [{ type: 'address' }, { type: 'address[]' }],
    [consumer, providers],
  )

  // Get the format byte
  const formatByte = FORMAT_ID_BYTES[formatId]

  // Calculate total length
  const encodedBytes = hexToBytes(encodedData)
  const totalLength = 4 + 1 + encodedBytes.length + 4 // 4 for prefix, 1 for format byte, rest for data and length
  const lengthHex = totalLength.toString(16).padStart(8, '0') // uint32 as 8 hex chars

  // Construct appended data and final calldata
  const appendedData = magicPrefixBytes + formatByte + encodedData.slice(2) + lengthHex
  return appendedData
}
