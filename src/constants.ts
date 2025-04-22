import { FormatID } from './types'

// Magic prefix is keccak256("divvi").slice(2, 10)
export const DIVVI_MAGIC_PREFIX = '6decb85d'

/**
 * Maps format IDs to their byte representations.
 * Each format ID is represented as a 2-character hex string (1 byte).
 */
export const FORMAT_ID_BYTES: Record<FormatID, string> = {
  default: '00',
}
