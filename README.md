# @divvi/referral-sdk

SDK for managing referrals in the Divvi ecosystem.

## Installation

```bash
yarn add @divvi/referral-sdk
```

## Usage

The `getDataSuffix` function from `@divvi/referral-sdk` can be used to generate a hex string tag that should be appended to the calldata of an existing transaction in your application. This tag will allow divvi to track your referall of the end user in your application.

### Using getDataSuffix with viem's writeContract

```typescript
import { getDataSuffix } from '@divvi/referral-sdk';
import { writeContract } from 'viem';

// Example contract call with referral data
const result = await writeContract({
	address: contractAddress,
	abi: contractABI,
	functionName: 'yourFunction',
	args: [...yourArgs],
	dataSuffix: getDataSuffix(
		consumerAddress, // The address of the consumer making the call
		providerAddresses // Array of provider addresses involved in the referral
	),
});
```

### Using getDataSuffix with viem's sendTransaction

```typescript
import { getDataSuffix } from '@divvi/referral-sdk';
import { sendTransaction } from 'viem';

// Example transaction with referral data
const result = await sendTransaction({
	to: contractAddress,
	data:
		contractData +
		getDataSuffix(
			consumerAddress, // The address of the consumer making the call
			providerAddresses // Array of provider addresses involved in the referral
		),
	value: transactionValue,
	// ... other transaction parameters
});
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
