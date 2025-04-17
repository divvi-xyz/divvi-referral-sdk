import { decodeAbiParameters, hexToNumber } from "viem";
import { getDataSuffix as getCallDataSuffixOriginal } from ".";
import { getDataSuffix as getCallDataSuffixViem } from "./viem-reference-version";
import { InvalidAddressError } from "./types";
import { DIVVI_MAGIC_PREFIX } from "./constants";

describe.each([
  ["Original", getCallDataSuffixOriginal],
  ["Viem", getCallDataSuffixViem],
])("getCallDataSuffix (%s)", (name, getCallDataSuffix) => {
  it(`[${name}] should throw if the consumer or provider is not a valid address`, () => {
    const badAddress = "0x1234" as `0x${string}`;
    const goodAddress =
      "0x1234567890123456789012345678901234567890" as `0x${string}`;

    expect(() => getCallDataSuffix(goodAddress, [badAddress])).toThrow(
      InvalidAddressError,
    );
    expect(() => getCallDataSuffix(badAddress, [goodAddress])).toThrow(
      InvalidAddressError,
    );
    expect(() => getCallDataSuffix(badAddress, [badAddress])).toThrow(
      InvalidAddressError,
    );
    expect(() => getCallDataSuffix(goodAddress, [goodAddress])).not.toThrow();
  });

  it(`[${name}] should throw if there is no consumer`, () => {
    const providers = [
      "0x0987654321098765432109876543210987654321" as `0x${string}`,
    ];

    expect(() => getCallDataSuffix("" as `0x${string}`, providers)).toThrow(
      InvalidAddressError,
    );
  });

  it(`[${name}] should generate correct calldata suffix with no providers`, () => {
    const consumer =
      "0x1234567890123456789012345678901234567890" as `0x${string}`;
    const providers = [] as `0x${string}`[];

    const result = getCallDataSuffix(consumer, providers);

    // The result should be a hex string without 0x prefix
    expect(result).toMatch(/^[0-9a-f]+$/);

    // The first 8 characters should be the magic prefix (keccak256("divvi"))
    const magicPrefix = result.slice(0, 8);
    expect(magicPrefix).toBe(DIVVI_MAGIC_PREFIX);

    // The last 8 characters should be the length of the data
    const length = result.slice(-8);
    expect(length).toBe("00000068");

    // The total length should be the length specified times 2 because every byte is 2 characters
    const expectedTotalLength = hexToNumber("0x00000068") * 2;
    expect(result.length).toBe(expectedTotalLength);

    // The data can be decoded correctly
    const decodedData = decodeAbiParameters(
      [{ type: "address" }, { type: "address[]" }],
      `0x${result.slice(8, -8)}`,
    );

    expect(decodedData[0]).toBe(consumer);
    expect(decodedData[1]).toEqual(providers);
  });

  it(`[${name}] should generate correct calldata suffix with single provider`, () => {
    const consumer =
      "0x1234567890123456789012345678901234567890" as `0x${string}`;
    const providers = [
      "0x0987654321098765432109876543210987654321" as `0x${string}`,
    ];

    const result = getCallDataSuffix(consumer, providers);

    // The result should be a hex string without 0x prefix
    expect(result).toMatch(/^[0-9a-f]+$/);

    // The first 8 characters should be the magic prefix (keccak256("divvi"))
    const magicPrefix = result.slice(0, 8);
    expect(magicPrefix).toBe(DIVVI_MAGIC_PREFIX);

    // The last 8 characters should be the length of the data
    const length = result.slice(-8);
    expect(length).toBe("00000088");

    // The total length should be the length specified times 2 because every byte is 2 characters
    const expectedTotalLength = hexToNumber("0x00000088") * 2;
    expect(result.length).toBe(expectedTotalLength);

    // The data can be decoded correctly
    const decodedData = decodeAbiParameters(
      [{ type: "address" }, { type: "address[]" }],
      `0x${result.slice(8, -8)}`,
    );

    expect(decodedData[0]).toBe(consumer);
    expect(decodedData[1]).toEqual(providers);
  });

  it(`[${name}] should generate correct calldata suffix with multiple providers`, () => {
    const consumer =
      "0x1234567890123456789012345678901234567890" as `0x${string}`;
    const providers = [
      "0x0987654321098765432109876543210987654321" as `0x${string}`,
      "0xBa9655677f4E42DD289F5b7888170bC0c7dA8Cdc" as `0x${string}`,
    ];

    const result = getCallDataSuffix(consumer, providers);

    expect(result).toMatch(/^[0-9a-f]+$/);
    expect(result.slice(0, 8)).toBe(DIVVI_MAGIC_PREFIX);

    const length = result.slice(-8);
    expect(length).toBe("000000a8");

    const expectedTotalLength = hexToNumber("0x000000a8") * 2;
    expect(result.length).toBe(expectedTotalLength);

    const decodedData = decodeAbiParameters(
      [{ type: "address" }, { type: "address[]" }],
      `0x${result.slice(8, -8)}`,
    );

    expect(decodedData[0]).toBe(consumer);
    expect(decodedData[1]).toEqual(providers);
  });

  it(`[${name}] should handle empty providers array`, () => {
    const consumer =
      "0x1234567890123456789012345678901234567890" as `0x${string}`;
    const providers: `0x${string}`[] = [];

    const result = getCallDataSuffix(consumer, providers);

    expect(result).toMatch(/^[0-9a-f]+$/);
    expect(result.slice(0, 8)).toBe(DIVVI_MAGIC_PREFIX);
  });

  it(`[${name}] should generate consistent output for same inputs`, () => {
    const consumer =
      "0x1234567890123456789012345678901234567890" as `0x${string}`;
    const providers = [
      "0x0987654321098765432109876543210987654321" as `0x${string}`,
    ];

    const result1 = getCallDataSuffix(consumer, providers);
    const result2 = getCallDataSuffix(consumer, providers);

    expect(result1).toBe(result2);
  });
});
