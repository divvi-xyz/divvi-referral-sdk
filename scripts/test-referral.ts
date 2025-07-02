import { Address, createWalletClient, Hex, http, parseUnits } from 'viem'
import { getReferralTag, submitReferral } from '../src/index'
import { celo } from 'viem/chains'
import { mnemonicToAccount } from 'viem/accounts'

// Configuration
const USE_SIGNED_MESSAGE = process.env.USE_SIGNED_MESSAGE === 'true' // Set to 'true' to use signed message approach
const BASE_URL =
  process.env.DIVVI_BASE_URL || 'https://api.staging.divvi.xyz/submitReferral'

// Check for mnemonic in environment
if (!process.env.MNEMONIC) {
  throw new Error('Please set MNEMONIC environment variable')
}

const mnemonic = process.env.MNEMONIC

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
  console.log(
    `Using ${USE_SIGNED_MESSAGE ? 'signed message' : 'transaction'} approach`,
  )
  console.log(`Base URL: ${BASE_URL}`)

  // Create wallet client
  const account = mnemonicToAccount(mnemonic)
  const walletClient = createWalletClient({
    account,
    chain: celo,
    transport: http(),
  })

  // Replace as necessary, the consumer and providers must have a rewards agreement registered
  const consumerAddress = STAGING_REWARDS_CONSUMER_PROVIDER_PAIRS[0].consumer
  const providerAddresses = STAGING_REWARDS_CONSUMER_PROVIDER_PAIRS[0].providers

  // Get chain ID
  const chainId = await walletClient.getChainId()

  // Generate referral tag
  const referralTag = getReferralTag({
    user: account.address,
    consumer: consumerAddress,
    providers: providerAddresses,
  })

  try {
    if (!USE_SIGNED_MESSAGE) {
      // Transaction-based approach (existing)
      console.log('Creating transaction with referral data...')

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
        args: [account.address, parseUnits('0.001', 18)], // 0.001 cUSD
        dataSuffix: `0x${referralTag}`,
      })

      console.log('Transaction sent:', txHash)

      // Submit transaction referral
      await submitReferral({
        txHash,
        chainId,
        baseUrl: BASE_URL,
      })

      console.log('Transaction referral submitted successfully')
    } else {
      // Signed message approach
      console.log('Creating signed message for referral...')

      // Create a message containing the referral data
      const message = `Divvi Referral Attribution\nReferral Tag: ${referralTag}\nChain ID: ${chainId}\nTimestamp: ${Date.now()}`

      console.log('Message to sign:', message)

      // Sign the message
      const signature = await walletClient.signMessage({
        message,
      })

      console.log('Message signature:', signature)

      // Submit signed message referral
      await submitReferral({
        message,
        signature,
        chainId,
        baseUrl: BASE_URL,
      })

      console.log('Signed message referral submitted successfully')
    }
  } catch (error) {
    console.error('Error:', error)
  }
}

main()
