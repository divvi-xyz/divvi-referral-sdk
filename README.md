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

1. `getReferralTag` - Generates a hex string tag to include in transaction calldata for tracking referrals (appending is recommended).
2. `submitReferral` - Reports the transaction to the attribution tracking API

### Complete Referral Flow

- Identify an appropriate transaction in your codebase to include the referral tag
  - The transaction must be a state changing function like transfer
  - The transaction should be towards the beginning of the user journey
- Include the referral tag in your transaction data (appending is recommended) and call submitReferral with the transaction hash

Here's how to implement the complete referral flow in your application:

```typescript
import { getReferralTag, submitReferral } from '@divvi/referral-sdk'
import { createWalletClient, custom } from 'viem'
import { mainnet } from 'viem/chains'

// Step 1: Create a wallet client and get the account
export const walletClient = createWalletClient({
  chain: mainnet,
  transport: custom(window.ethereum),
})
const [account] = await walletClient.getAddresses()

// Step 2: Execute an existing transaction within your codebase with the referral tag
const txHash = await walletClient.writeContract({
  address: contractAddress,
  account,
  abi: contractABI,
  functionName: 'yourFunction',
  args: [...yourArgs],
  dataSuffix: `0x${getReferralTag({
    user: account, // The user address making the transaction (required)
    consumer: consumerAddress, // The address of the consumer making the call
  })}`, // Using dataSuffix appends the tag (recommended)
})

// Step 3: Get the current chain ID
const chainId = await walletClient.getChainId()

// Step 4: Report the transaction to the attribution tracking API
await submitReferral({
  txHash,
  chainId,
})
```

### Using getReferralTag with viem's sendTransaction

```typescript
import { getReferralTag, submitReferral } from '@divvi/referral-sdk'
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
    getReferralTag({
      user: account, // The user address making the transaction (required)
      consumer: consumerAddress, // The address of the consumer making the call
    }), // Appending to existing data (recommended)
  value: transactionValue,
  // ... other transaction parameters
})

// Alternative: You can also include the tag anywhere in the transaction data
// const referralTag = getReferralTag({ user: account, consumer: consumerAddress })
// data: someCustomData + referralTag + moreData
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

## Why the `user` Parameter Matters

The `user` parameter is crucial because Divvi cryptographically verifies that the user you specify is actually the one who consented to the transaction. This prevents fake referrals and ensures accurate attribution.

Here's how it works:

**For regular wallets (EOAs):** We check that `user` matches who actually sent the transaction (`tx.from`).

**For smart accounts:** We're smarter about verification and can handle more complex scenarios like Account Abstraction wallets or Safe multisigs. The system automatically detects the transaction type and applies the right verification method.

This means you get **accurate referral tracking** regardless of whether your users have simple wallets or more advanced smart account setups. If you're using a custom smart account architecture and verification fails, reach out to us - we can add support for additional patterns as needed.

**Bottom line:** Set the `user` parameter to the actual person making the transaction, and Divvi will cryptographically ensure they're the one who really consented to it. No fake referrals, no attribution errors.

## Migration from v1 to v2

This is a **breaking change**. The SDK has been updated from v1 to v2 with the following changes:

### What Changed

- `getDataSuffix` has been replaced with `getReferralTag`
- A new `user` parameter is now **required** in `getReferralTag` to ensure proper referral attribution of the right user

### Migration Steps

1. **Update function imports**: Replace `getDataSuffix` with `getReferralTag` in your imports:

   ```typescript
   // v1 (OLD)
   import { getDataSuffix, submitReferral } from '@divvi/referral-sdk'

   // v2 (NEW)
   import { getReferralTag, submitReferral } from '@divvi/referral-sdk'
   ```

2. **Update function calls**: Replace all instances of `getDataSuffix` with `getReferralTag` and add the new required `user` parameter for proper attribution:

   ```typescript
   // v1 (OLD)
   dataSuffix: `0x${getDataSuffix({ consumer })}`

   // v2 (NEW)
   dataSuffix: `0x${getReferralTag({ user, consumer })}`
   ```

   The `user` parameter should be the address of the user making the transaction to ensure accurate referral attribution.

### Example Migration

```typescript
// v1 Implementation (OLD)
import { getDataSuffix, submitReferral } from '@divvi/referral-sdk'

const txHash = await walletClient.writeContract({
  // ... other parameters
  dataSuffix: `0x${getDataSuffix({ consumer })}`,
})

// v2 Implementation (NEW)
import { getReferralTag, submitReferral } from '@divvi/referral-sdk'

const txHash = await walletClient.writeContract({
  // ... other parameters
  dataSuffix: `0x${getReferralTag({ user, consumer })}`,
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
