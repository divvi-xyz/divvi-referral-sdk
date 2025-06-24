import { decodeAbiParameters, hexToNumber } from 'viem'
import { getReferralTag as getReferralTagOriginal, submitReferral } from '.'
import { getReferralTag as getReferralTagViem } from '../test/viemReferenceVersion'
import { InvalidAddressError, Address } from './types'
import { DIVVI_MAGIC_PREFIX, REFERRAL_TAG_FORMAT_1_BYTE } from './constants'

const TEST_USER = '0x9999999999999999999999999999999999999999'
const TEST_CONSUMER = '0x1234567890123456789012345678901234567890'
const TEST_PROVIDERS = [
  '0x0987654321098765432109876543210987654321',
  '0xabCDeF0123456789AbcdEf0123456789aBCDEF01',
  '0xfEdcBA9876543210FedCBa9876543210fEdCBa98',
] as const

describe.each([
  ['Original', getReferralTagOriginal],
  ['Viem', getReferralTagViem],
])('getReferralTag (%s)', (name, getReferralTag) => {
  it(`[${name}] should throw if the consumer or provider is not a valid address`, () => {
    const badAddress: Address = '0x1234'
    const goodAddress: Address = '0x1234567890123456789012345678901234567890'

    expect(() =>
      getReferralTag({
        user: goodAddress,
        consumer: goodAddress,
        providers: [badAddress],
      }),
    ).toThrow(InvalidAddressError)
    expect(() =>
      getReferralTag({
        user: goodAddress,
        consumer: badAddress,
        providers: [goodAddress],
      }),
    ).toThrow(InvalidAddressError)
    expect(() =>
      getReferralTag({
        user: badAddress,
        consumer: goodAddress,
        providers: [goodAddress],
      }),
    ).toThrow(InvalidAddressError)
    expect(() =>
      getReferralTag({
        user: goodAddress,
        consumer: badAddress,
        providers: [badAddress],
      }),
    ).toThrow(InvalidAddressError)
    expect(() =>
      getReferralTag({
        user: badAddress,
        consumer: badAddress,
        providers: [badAddress],
      }),
    ).toThrow(InvalidAddressError)
    expect(() =>
      getReferralTag({
        user: goodAddress,
        consumer: goodAddress,
        providers: [goodAddress],
      }),
    ).not.toThrow()
  })

  it(`[${name}] should throw if there is no consumer`, () => {
    expect(() =>
      getReferralTag({
        user: TEST_USER,
        consumer: '' as Address,
        providers: [TEST_PROVIDERS[0]],
      }),
    ).toThrow(InvalidAddressError)
  })

  const testCases = [
    {
      name: 'no providers',
      providers: [] as Address[],
      expectedPayloadLength: '0080',
    },
    {
      name: 'single provider',
      providers: [TEST_PROVIDERS[0]],
      expectedPayloadLength: '00a0',
    },
    {
      name: 'multiple providers',
      providers: TEST_PROVIDERS,
      expectedPayloadLength: '00e0',
    },
  ]

  it.each(testCases)(
    `[${name}] should generate correct referral tag with $name`,
    ({ providers, expectedPayloadLength }) => {
      const result = getReferralTag({
        user: TEST_USER,
        consumer: TEST_CONSUMER,
        providers,
      })

      // The result should be a hex string without 0x prefix
      expect(result).toMatch(/^[0-9a-f]+$/)

      // The first 8 characters should be the magic prefix (keccak256("divvi"))
      const magicPrefix = result.slice(0, 8)
      expect(magicPrefix).toBe(DIVVI_MAGIC_PREFIX)

      // The format byte should be next
      const formatByte = result.slice(8, 10)
      expect(formatByte).toBe(REFERRAL_TAG_FORMAT_1_BYTE)

      // The next 4 characters should be the length of the payload
      const payloadLength = result.slice(10, 14)
      expect(payloadLength).toBe(expectedPayloadLength)

      // The payload length should be the length specified times 2 because every byte is 2 characters
      const payload = result.slice(14)
      expect(payload.length).toBe(hexToNumber(`0x${payloadLength}`) * 2)

      // The data can be decoded correctly
      const decodedData = decodeAbiParameters(
        [{ type: 'address' }, { type: 'address' }, { type: 'address[]' }],
        `0x${payload}`,
      )

      expect(decodedData[0]).toBe(TEST_USER)
      expect(decodedData[1]).toBe(TEST_CONSUMER)
      expect(decodedData[2]).toEqual(providers)
    },
  )

  it(`[${name}] should handle empty providers array`, () => {
    const providers: Address[] = []

    const result = getReferralTag({
      user: TEST_USER,
      consumer: TEST_CONSUMER,
      providers,
    })

    expect(result).toMatch(/^[0-9a-f]+$/)
    expect(result.slice(0, 8)).toBe(DIVVI_MAGIC_PREFIX)
  })

  it(`[${name}] should generate consistent output for same inputs`, () => {
    const result1 = getReferralTag({
      user: TEST_USER,
      consumer: TEST_CONSUMER,
      providers: [TEST_PROVIDERS[0]],
    })
    const result2 = getReferralTag({
      user: TEST_USER,
      consumer: TEST_CONSUMER,
      providers: [TEST_PROVIDERS[0]],
    })

    expect(result1).toBe(result2)
  })
})

describe('Implementation comparison', () => {
  const testCases: Array<{
    name: string
    input: {
      user: Address
      consumer: Address
      providers: readonly Address[]
    }
  }> = [
    {
      name: 'empty providers array',
      input: {
        user: TEST_USER,
        consumer: TEST_CONSUMER,
        providers: [],
      },
    },
    {
      name: 'single provider',
      input: {
        user: TEST_USER,
        consumer: TEST_CONSUMER,
        providers: [TEST_PROVIDERS[0]],
      },
    },
    {
      name: 'multiple providers',
      input: {
        user: TEST_USER,
        consumer: TEST_CONSUMER,
        providers: TEST_PROVIDERS,
      },
    },
  ]

  it.each(testCases)(
    'should produce identical results for both implementations: $name',
    ({ input }) => {
      const resultOriginal = getReferralTagOriginal(input)
      const resultViem = getReferralTagViem(input)

      expect(resultOriginal).toBe(resultViem)
    },
  )
})

describe('submitReferral', () => {
  // Mock fetch before each test
  let originalFetch: typeof global.fetch

  beforeEach(() => {
    originalFetch = global.fetch
    global.fetch = jest.fn()
  })

  afterEach(() => {
    global.fetch = originalFetch
  })

  it('should make a POST request with the correct parameters', async () => {
    // Arrange
    const mockResponse = new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })

    jest.mocked(global.fetch).mockResolvedValueOnce(mockResponse)

    const params = {
      txHash: '0x1234567890123456789012345678901234567890',
      chainId: 1,
    } as const

    // Act
    const response = await submitReferral(params)

    // Assert
    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.divvi.xyz/submitReferral',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          txHash: params.txHash,
          chainId: params.chainId,
        }),
      },
    )
    expect(response).toBe(mockResponse)
  })

  it('should make a POST request with the correct parameters for signed message referrals', async () => {
    // Arrange
    const mockResponse = new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })

    jest.mocked(global.fetch).mockResolvedValueOnce(mockResponse)

    const params = {
      message:
        'Divvi Referral Attribution\nReferral Tag: abc123\nTimestamp: 1234567890',
      signature:
        '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef12',
      chainId: 1,
    } as const

    // Act
    const response = await submitReferral(params)

    // Assert
    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.divvi.xyz/submitReferral',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: params.message,
          signature: params.signature,
          chainId: params.chainId,
        }),
      },
    )
    expect(response).toBe(mockResponse)
  })

  it('should use a custom baseUrl when provided', async () => {
    // Arrange
    const mockResponse = new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })

    jest.mocked(global.fetch).mockResolvedValueOnce(mockResponse)

    const params = {
      txHash: '0x1234567890123456789012345678901234567890',
      chainId: 1,
      baseUrl: 'https://custom-api.example.com/track',
    } as const

    // Act
    await submitReferral(params)

    // Assert
    expect(global.fetch).toHaveBeenCalledWith(
      'https://custom-api.example.com/track',
      expect.any(Object),
    )
  })

  it('should throw an error when the API response is not ok', async () => {
    // Arrange
    const mockResponse = new Response('Bad Request', {
      status: 400,
      statusText: 'Bad Request',
    })

    jest.mocked(global.fetch).mockResolvedValueOnce(mockResponse)

    const params = {
      txHash: '0x1234567890123456789012345678901234567890',
      chainId: 1,
    } as const

    // Act & Assert
    await expect(submitReferral(params)).rejects.toThrow(
      'Client error: 400 Bad Request',
    )
  })

  it('should throw a client error with specific message for 4xx responses', async () => {
    // Arrange
    const mockResponse = new Response('Not Found', {
      status: 404,
      statusText: 'Not Found',
    })

    jest.mocked(global.fetch).mockResolvedValueOnce(mockResponse)

    const params = {
      txHash: '0x1234567890123456789012345678901234567890',
      chainId: 1,
    } as const

    // Act & Assert
    await expect(submitReferral(params)).rejects.toThrow(
      'Client error: 404 Not Found',
    )
  })

  it('should throw a server error with retry message for 5xx responses', async () => {
    // Arrange
    const mockResponse = new Response('Internal Server Error', {
      status: 500,
      statusText: 'Internal Server Error',
    })

    jest.mocked(global.fetch).mockResolvedValueOnce(mockResponse)

    const params = {
      txHash: '0x1234567890123456789012345678901234567890',
      chainId: 1,
    } as const

    // Act & Assert
    await expect(submitReferral(params)).rejects.toThrow(
      'Server error: Failed to submit referral event: Internal Server Error. Client should retry the request.',
    )
  })

  it('should throw an error when the fetch operation fails', async () => {
    // Arrange
    const networkError = new Error('Network error')
    jest.mocked(global.fetch).mockRejectedValueOnce(networkError)

    const params = {
      txHash: '0x1234567890123456789012345678901234567890',
      chainId: 1,
    } as const

    // Act & Assert
    await expect(submitReferral(params)).rejects.toThrow('Network error')
  })
})
