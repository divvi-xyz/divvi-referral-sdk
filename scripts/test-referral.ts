import { getDataSuffix, submitReferral } from '../src/index'
import { Address, createWalletClient, Hex, http, parseUnits } from 'viem'
import { celo } from 'viem/chains'
import { privateKeyToAccount } from 'viem/accounts'

// Check for private key in environment
if (!process.env.PRIVATE_KEY) {
  throw new Error('Please set PRIVATE_KEY environment variable')
}

const privateKey = process.env.PRIVATE_KEY as Hex

// cUSD token contract address on CELO
const CUSD_ADDRESS = '0x765DE816845861e75A25fCA122bb6898B8B1282a'

// some consumer and providers in the staging contract that have a rewards agreement registered
const STAGING_REWARDS_CONSUMER_PROVIDER_PAIRS: {
  consumer: Address
  providers: Address[]
}[] = [
  {
    consumer: '0x544402f32c46a5c120e89421f15c8a21f77d6087',
    providers: [
      '0x34e6a195fbd090c0f2d2d3d326508a12e35d2c97',
      '0xda7dfd01dd5cf31bc2d069f38b9f4e5bdcb8e199',
      '0x89786bc94115984f5309c91a469ae25448bbdde9',
      '0x096991d5fd06eaf1fcceaa5c59a951e964743dd8',
      '0x266ca9f02e8395d7cc746cb6ec986c2e06c75a28',
    ],
  },
  {
    consumer: '0x644b896b0c45717215c0f10501b20fafd9bceb24',
    providers: ['0x644b896b0c45717215c0f10501b20fafd9bceb24'],
  },
]
async function main() {
  // Create wallet client
  const account = privateKeyToAccount(privateKey)
  const walletClient = createWalletClient({
    account,
    chain: celo,
    transport: http(),
  })

  // Replace as necessary, the consumer and providers must have a rewards agreement registered
  const consumerAddress = STAGING_REWARDS_CONSUMER_PROVIDER_PAIRS[0].consumer
  const providerAddresses = STAGING_REWARDS_CONSUMER_PROVIDER_PAIRS[0].providers

  try {
    // Step 1: Send cUSD transaction with referral data
    const txHash = await walletClient.writeContract({
      address: CUSD_ADDRESS,
      abi: [
        {
          inputs: [
            { name: 'to', type: 'address' },
            { name: 'value', type: 'uint256' },
          ],
          name: 'transfer',
          outputs: [{ name: '', type: 'bool' }],
          stateMutability: 'nonpayable',
          type: 'function',
        },
      ],
      functionName: 'transfer',
      args: [consumerAddress, parseUnits('0.001', 18)], // 0.001 cUSD
      dataSuffix: `0x${getDataSuffix({
        consumer: consumerAddress,
        providers: providerAddresses,
      })}`,
    })

    console.log('Transaction sent:', txHash)

    // Step 2: Get chain ID
    const chainId = await walletClient.getChainId()

    // Step 3: Submit referral
    await submitReferral({
      txHash,
      chainId,
      baseUrl: 'https://api.staging.divvi.xyz/submitReferral', // remove this if you want to use the production contract
    })

    console.log('Referral submitted successfully')
  } catch (error) {
    console.error('Error:', error)
  }
}

main()
