/**
 * Ethereum address type
 */
export type Address = `0x${string}`

/**
 * Hexadecimal string type
 */
export type Hex = `0x${string}`

export class InvalidAddressError extends Error {
  constructor({ address }: { address: string }) {
    super(`Invalid Ethereum address: ${address}`)
    this.name = 'InvalidAddressError'
  }
}
