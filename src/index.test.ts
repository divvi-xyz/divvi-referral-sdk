import { decodeAbiParameters, hexToNumber } from 'viem'
import { getDataSuffix as getCallDataSuffixOriginal, submitReferral } from '.'
import { getDataSuffix as getCallDataSuffixViem } from '../test/viemReferenceVersion'
import { InvalidAddressError, Address } from './types'
import { DIVVI_MAGIC_PREFIX, FORMAT_ID_BYTES } from './constants'

describe.each([
  ['Original', getCallDataSuffixOriginal],
  ['Viem', getCallDataSuffixViem],
])('getCallDataSuffix (%s)', (name, getCallDataSuffix) => {
  it(`[${name}] should throw if the consumer or provider is not a valid address`, () => {
    const badAddress: Address = '0x1234'
    const goodAddress: Address = '0x1234567890123456789012345678901234567890'

    expect(() =>
      getCallDataSuffix({ consumer: goodAddress, providers: [badAddress] }),
    ).toThrow(InvalidAddressError)
    expect(() =>
      getCallDataSuffix({ consumer: badAddress, providers: [goodAddress] }),
    ).toThrow(InvalidAddressError)
    expect(() =>
      getCallDataSuffix({ consumer: badAddress, providers: [badAddress] }),
    ).toThrow(InvalidAddressError)
    expect(() =>
      getCallDataSuffix({ consumer: goodAddress, providers: [goodAddress] }),
    ).not.toThrow()
  })

  it(`[${name}] should throw if there is no consumer`, () => {
    const providers: Address[] = ['0x0987654321098765432109876543210987654321']

    expect(() =>
      getCallDataSuffix({ consumer: '' as Address, providers }),
    ).toThrow(InvalidAddressError)
  })

  it(`[${name}] should generate correct calldata suffix with no providers`, () => {
    const consumer: Address = '0x1234567890123456789012345678901234567890'
    const providers: Address[] = []

    const result = getCallDataSuffix({ consumer, providers })

    // The result should be a hex string without 0x prefix
    expect(result).toMatch(/^[0-9a-f]+$/)

    // The first 8 characters should be the magic prefix (keccak256("divvi"))
    const magicPrefix = result.slice(0, 8)
    expect(magicPrefix).toBe(DIVVI_MAGIC_PREFIX)

    // The format byte should be next
    const formatByte = result.slice(8, 10)
    expect(formatByte).toBe(FORMAT_ID_BYTES['default'])

    // The last 8 characters should be the length of the data
    const length = result.slice(-8)
    expect(length).toBe('00000069')

    // The total length should be the length specified times 2 because every byte is 2 characters
    const expectedTotalLength = hexToNumber('0x00000069') * 2
    expect(result.length).toBe(expectedTotalLength)

    // The data can be decoded correctly
    const decodedData = decodeAbiParameters(
      [{ type: 'address' }, { type: 'address[]' }],
      `0x${result.slice(10, -8)}`, // Skip prefix and format byte
    )

    expect(decodedData[0]).toBe(consumer)
    expect(decodedData[1]).toEqual(providers)
  })

  it(`[${name}] should generate correct calldata suffix with single provider`, () => {
    const consumer: Address = '0x1234567890123456789012345678901234567890'
    const providers: Address[] = ['0x0987654321098765432109876543210987654321']

    const result = getCallDataSuffix({ consumer, providers })

    // The result should be a hex string without 0x prefix
    expect(result).toMatch(/^[0-9a-f]+$/)

    // The first 8 characters should be the magic prefix (keccak256("divvi"))
    const magicPrefix = result.slice(0, 8)
    expect(magicPrefix).toBe(DIVVI_MAGIC_PREFIX)

    // The format byte should be next
    const formatByte = result.slice(8, 10)
    expect(formatByte).toBe(FORMAT_ID_BYTES['default'])

    // The last 8 characters should be the length of the data
    const length = result.slice(-8)
    expect(length).toBe('00000089')

    // The total length should be the length specified times 2 because every byte is 2 characters
    const expectedTotalLength = hexToNumber('0x00000089') * 2
    expect(result.length).toBe(expectedTotalLength)

    // The data can be decoded correctly
    const decodedData = decodeAbiParameters(
      [{ type: 'address' }, { type: 'address[]' }],
      `0x${result.slice(10, -8)}`, // Skip prefix and format byte
    )

    expect(decodedData[0]).toBe(consumer)
    expect(decodedData[1]).toEqual(providers)
  })

  it(`[${name}] should generate correct calldata suffix with multiple providers`, () => {
    const consumer: Address = '0x1234567890123456789012345678901234567890'
    const providers: Address[] = [
      '0x0987654321098765432109876543210987654321',
      '0xabCDeF0123456789AbcdEf0123456789aBCDEF01',
      '0xfEdcBA9876543210FedCBa9876543210fEdCBa98',
    ]

    const result = getCallDataSuffix({ consumer, providers })

    // The result should be a hex string without 0x prefix
    expect(result).toMatch(/^[0-9a-f]+$/)

    // The first 8 characters should be the magic prefix (keccak256("divvi"))
    const magicPrefix = result.slice(0, 8)
    expect(magicPrefix).toBe(DIVVI_MAGIC_PREFIX)

    // The format byte should be next
    const formatByte = result.slice(8, 10)
    expect(formatByte).toBe(FORMAT_ID_BYTES['default'])

    // The last 8 characters should be the length of the data
    const length = result.slice(-8)
    expect(length).toBe('000000c9')

    // The total length should be the length specified times 2 because every byte is 2 characters
    const expectedTotalLength = hexToNumber('0x000000c9') * 2
    expect(result.length).toBe(expectedTotalLength)

    // The data can be decoded correctly
    const decodedData = decodeAbiParameters(
      [{ type: 'address' }, { type: 'address[]' }],
      `0x${result.slice(10, -8)}`, // Skip prefix and format byte
    )

    expect(decodedData[0]).toBe(consumer)
    expect(decodedData[1]).toEqual(providers)
  })

  it(`[${name}] should handle empty providers array`, () => {
    const consumer: Address = '0x1234567890123456789012345678901234567890'
    const providers: Address[] = []

    const result = getCallDataSuffix({ consumer, providers })

    expect(result).toMatch(/^[0-9a-f]+$/)
    expect(result.slice(0, 8)).toBe(DIVVI_MAGIC_PREFIX)
  })

  it(`[${name}] should generate consistent output for same inputs`, () => {
    const consumer: Address = '0x1234567890123456789012345678901234567890'
    const providers: Address[] = ['0x0987654321098765432109876543210987654321']

    const result1 = getCallDataSuffix({ consumer, providers })
    const result2 = getCallDataSuffix({ consumer, providers })

    expect(result1).toBe(result2)
  })

  it(`[${name}] should use default format ID when not specified`, () => {
    const consumer: Address = '0x1234567890123456789012345678901234567890'
    const providers: Address[] = ['0x0987654321098765432109876543210987654321']

    const result = getCallDataSuffix({ consumer, providers })

    // The format byte should be the default one
    const formatByte = result.slice(8, 10)
    expect(formatByte).toBe(FORMAT_ID_BYTES['default'])
  })

  it(`[${name}] should use specified format ID when provided`, () => {
    const consumer: Address = '0x1234567890123456789012345678901234567890'
    const providers: Address[] = ['0x0987654321098765432109876543210987654321']

    const result = getCallDataSuffix({
      consumer,
      providers,
    })

    // The format byte should match the specified format
    const formatByte = result.slice(8, 10)
    expect(formatByte).toBe(FORMAT_ID_BYTES['default'])
  })
})

describe('Implementation comparison', () => {
  const testCases: Array<{
    name: string
    input: {
      consumer: Address
      providers: Address[]
    }
  }> = [
    {
      name: 'empty providers array',
      input: {
        consumer: '0x1234567890123456789012345678901234567890',
        providers: [],
      },
    },
    {
      name: 'single provider',
      input: {
        consumer: '0x1234567890123456789012345678901234567890',
        providers: ['0x0987654321098765432109876543210987654321'],
      },
    },
    {
      name: 'multiple providers',
      input: {
        consumer: '0x1234567890123456789012345678901234567890',
        providers: [
          '0x0987654321098765432109876543210987654321',
          '0xabCDeF0123456789AbcdEf0123456789aBCDEF01',
          '0xfEdcBA9876543210FedCBa9876543210fEdCBa98',
        ],
      },
    },
  ]

  it.each(testCases)(
    'should produce identical results for both implementations: $name',
    ({ input }) => {
      const resultOriginal = getCallDataSuffixOriginal(input)
      const resultViem = getCallDataSuffixViem(input)

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
