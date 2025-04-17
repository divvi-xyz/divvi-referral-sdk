export class InvalidAddressError extends Error {
  constructor({ address }: { address: string }) {
    super(`Invalid address: ${address}`)
    this.name = 'InvalidAddressError'
  }
}
