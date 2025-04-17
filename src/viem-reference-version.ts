// eslint-disable-next-line import/no-extraneous-dependencies
import {
  encodeAbiParameters,
  keccak256,
  toBytes,
  hexToBytes,
  isAddress,
} from 'viem'
import { InvalidAddressError } from './types'

export function getDataSuffix(
  consumer: `0x${string}`,
  providers: `0x${string}`[],
): string {
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

  // Calculate total length
  const encodedBytes = hexToBytes(encodedData)
  const totalLength = 4 + encodedBytes.length + 4 // 4 for prefix, 4 for length
  const lengthHex = totalLength.toString(16).padStart(8, '0') // uint32 as 8 hex chars

  // Construct appended data and final calldata
  const appendedData = magicPrefixBytes + encodedData.slice(2) + lengthHex
  return appendedData
}
