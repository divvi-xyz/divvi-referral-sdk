# @divvi/referral-sdk

The Divvi referral ecosystem enables decentralized applications to implement and track referral systems on blockchain networks. This SDK simplifies the process of integrating with Divvi's referral attribution system by providing tools to tag transactions with referral metadata and report them to Divvi's tracking API.

With this SDK, dApps can:

- Attribute on-chain transactions to specific referrers

For more information about the Divvi ecosystem, visit our [documentation](https://docs.divvi.xyz/).

## Installation

```bash
yarn add @divvi/referral-sdk
```

## Usage

The SDK provides two main functions:

1. `getDataSuffix` - Generates a hex string tag to append to transaction calldata for tracking referrals.
2. `submitReferral` - Reports the transaction to the attribution tracking API

### Complete Referral Flow

- Identify an appropriate transaction in your codebase to append the dataSuffix
  - The transaction must be a state changing function like transfer
  - The transaction should be towards the beginning of the user journey
- Append the dataSuffix to your transaction and call submitReferral with the transaction hash

Here's how to implement the complete referral flow in your application:

```typescript
import { getDataSuffix, submitReferral } from '@divvi/referral-sdk'
import { createWalletClient, custom } from 'viem'
import { mainnet } from 'viem/chains'

// Step 1: Create a wallet client and get the account
export const walletClient = createWalletClient({
  chain: mainnet,
  transport: custom(window.ethereum),
})
const [account] = await walletClient.getAddresses()

// Step 2: Execute an existing transaction within your codebase with the referral data suffix
const txHash = await walletClient.writeContract({
  address: contractAddress,
  account,
  abi: contractABI,
  functionName: 'yourFunction',
  args: [...yourArgs],
  dataSuffix: `0x${getDataSuffix({
    consumer: consumerAddress,
    providers: providerAddresses,
  })}`
})

// Step 3: Get the current chain ID
const chainId = await walletClient.getChainId()

// Step 4: Report the transaction to the attribution tracking API
await submitReferral({
  txHash,
  chainId,
})
```

### Using getDataSuffix with viem's sendTransaction

```typescript
import { getDataSuffix, submitReferral } from '@divvi/referral-sdk'
import { createWalletClient, custom } from 'viem'
import { mainnet } from 'viem/chains'

const walletClient = createWalletClient({
  chain: mainnet,
  transport: custom(window.ethereum),
})
const [account] = await walletClient.getAddresses()

// Example transaction with referral data
const txHash = await walletClient.sendTransaction({
  account,
  to: contractAddress,
  data:
    contractData +
    getDataSuffix({
      consumer: consumerAddress, // The address of the consumer making the call
      providers: providerAddresses, // Array of provider addresses involved in the referral
    }),
  value: transactionValue,
  // ... other transaction parameters
})
```

### Using submitReferral

```typescript
import { submitReferral } from '@divvi/referral-sdk'

// Report transaction for attribution tracking
await submitReferral({
  txHash, // Transaction hash from writeContract or sendTransaction
  chainId, // Chain ID from your client
  // Optional: custom API endpoint
  // baseUrl: 'https://your-custom-endpoint.com'
})
```

## Development

1. Clone the repository
1. Install dependencies:

   ```bash
   yarn install
   ```

1. Run tests:

   ```bash
   yarn test
   ```

## License

MIT
