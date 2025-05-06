import { getDataSuffix, submitReferral } from '../src/index'
import { createWalletClient, http, parseUnits } from 'viem'
import { celo } from 'viem/chains'
import { privateKeyToAccount } from 'viem/accounts'

// Check for private key in environment
if (!process.env.PRIVATE_KEY) {
  throw new Error('Please set PRIVATE_KEY environment variable')
}

const privateKey = process.env.PRIVATE_KEY as `0x${string}`

// cUSD token contract address on CELO
const CUSD_ADDRESS =
  '0x765DE816845861e75A25fCA122bb6898B8B1282a' as `0x${string}`

async function main() {
  // Create wallet client
  const account = privateKeyToAccount(privateKey)
  const walletClient = createWalletClient({
    account,
    chain: celo,
    transport: http(),
  })

  // Get the consumer address (our wallet)
  const consumerAddress = account.address

  // Example provider address (this would be the referrer in a real scenario)
  const providerAddress =
    '0x14e5d43fA4Addbe4d8B352F16e6B7f33325070D1' as `0x${string}`

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
        providers: [providerAddress],
      })}`,
    })

    console.log('Transaction sent:', txHash)

    // Step 2: Get chain ID
    const chainId = await walletClient.getChainId()

    // Step 3: Submit referral
    await submitReferral({
      txHash,
      chainId,
    })

    console.log('Referral submitted successfully')
  } catch (error) {
    console.error('Error:', error)
  }
}

main()
