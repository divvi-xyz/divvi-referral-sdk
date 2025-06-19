/**
 * Ethereum address type
 */
export type Address = `0x${string}`

export class InvalidAddressError extends Error {
  constructor({ address }: { address: string }) {
    super(`Invalid Ethereum address: ${address}`)
    this.name = 'InvalidAddressError'
  }
}
