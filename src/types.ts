/**
 * Ethereum address type
 */
export type Address = `0x${string}`

/**
 * Format identifier for the data suffix encoding.
 */
export type FormatID = 'default'

export class InvalidAddressError extends Error {
  constructor({ address }: { address: string }) {
    super(`Invalid Ethereum address: ${address}`)
    this.name = 'InvalidAddressError'
  }
}
