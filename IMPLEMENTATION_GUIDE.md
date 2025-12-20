# Privacy Pool SDK Integration - Implementation Guide

This document explains the privacy pool SOL sending implementation following SOLID principles.

## Architecture Overview

The implementation follows a clean architecture pattern with clear separation of concerns:

```
src/
├── types/           # Type definitions and interfaces
├── services/        # Business logic and SDK operations
├── sdk/             # Local SDK client implementations
├── utils/           # Helper functions
├── components/      # UI components
└── examples/        # Usage examples
```

## SDK Implementation

The SDK functions are implemented locally in `src/sdk/client.ts` as stubs that match the interface from the test file. These can be replaced with the actual `@zkprivacysol/sdk-core` package when it becomes available with proper entry points.

**Current approach:**

- Local implementations of: `getPoolPdas`, `initializePool`, `createNoteAndDeposit`, `withdrawViaRelayer`, `addRelayer`
- Uses Anchor's program methods directly
- Follows the same API as the SDK would provide

**To use the actual SDK package** (when available):

1. Ensure the package has proper `main`/`module`/`exports` in its package.json
2. Update the import in `src/services/privacyPool.service.ts` from `"../sdk/client"` to `"@zkprivacysol/sdk-core"`
3. Remove the local `src/sdk/client.ts` file

- `privacyPool.service.ts`: Handles all privacy pool operations
- `solana.utils.ts`: SOL/lamport conversions and helper functions
- `sdk.types.ts`: Type definitions only
- `SendModal.tsx`: UI rendering and user interaction

### 2. **Open/Closed Principle (OCP)**

- Service is extensible through configuration objects
- New pool operations can be added without modifying existing code
- Interface-based design allows for easy swapping of implementations

### 3. **Liskov Substitution Principle (LSP)**

- `IPrivacyPoolService` interface defines the contract
- Any implementation can replace `PrivacyPoolService` without breaking code

### 4. **Interface Segregation Principle (ISP)**

- Separate interfaces for different concerns (`PoolConfig`, `DepositConfig`, `WithdrawalConfig`)
- Clients only depend on methods they use

### 5. **Dependency Inversion Principle (DIP)**

- Components depend on abstractions (interfaces) not concrete implementations
- `SendModal` receives dependencies via props, not hard-coded

## Transaction Flow

The SOL sending process follows 5 clear steps from the test file:

### **Step 1: Derive Pool PDAs**

```typescript
const { config, vault } = privacyPoolService.getPoolAddresses(
  program.programId
);
```

Derives the Program Derived Addresses (config and vault) for the privacy pool.

### **Step 2: Initialize Pool (If Needed)**

```typescript
const poolExists = await privacyPoolService.checkPoolExists(config, connection);
if (!poolExists) {
  await privacyPoolService.initializePool({...});
}
```

Checks if the pool is already initialized. Only initializes if it doesn't exist.

### **Step 3: Create Note and Deposit**

```typescript
const depositResult = await privacyPoolService.createDeposit({
  program,
  depositor: wallet,
  denomIndex: 0,
  valueLamports: amountLamports,
  newRoot: depositRoot,
});
```

Creates a deposit note and commits to the privacy pool with a Merkle root.

### **Step 4: Setup Relayer and Recipient**

```typescript
const relayer = Keypair.generate();
await connection.requestAirdrop(relayer.publicKey, 2 * LAMPORTS_PER_SOL);
await privacyPoolService.registerRelayer(program, wallet, relayer.publicKey);
```

Creates and funds a relayer, then registers it with the pool.

### **Step 5: Withdraw Via Relayer**

```typescript
const withdrawalResult = await privacyPoolService.processWithdrawal({
  program,
  relayer,
  recipient: recipientPubkey,
  denomIndex: 0,
  root: depositRoot,
  nullifier,
});
```

Executes the withdrawal through the relayer to maintain privacy.

## File-by-File Breakdown

### [`types/sdk.types.ts`](types/sdk.types.ts)

**Purpose**: Type definitions for all SDK operations

**Key Types**:

- `PoolConfig`: Configuration for initializing a pool
- `DepositConfig`: Configuration for deposits
- `WithdrawalConfig`: Configuration for withdrawals
- `PoolOperationResult`: Standard result format

**SOLID**: Single Responsibility - only type definitions

### [`services/privacyPool.service.ts`](services/privacyPool.service.ts)

**Purpose**: Encapsulates all privacy pool business logic

**Key Features**:

- Implements `IPrivacyPoolService` interface
- Each method handles one specific operation
- Proper error handling and result formatting
- Singleton pattern for easy access

**SOLID**:

- SRP: Each method has one job
- OCP: Extensible through interface
- DIP: Depends on SDK abstractions

### [`utils/solana.utils.ts`](utils/solana.utils.ts)

**Purpose**: Helper utilities for common Solana operations

**Functions**:

- `sol(amount)`: Convert SOL to lamports
- `lamportsToSol(lamports)`: Convert lamports to SOL
- `createPlaceholderRoot()`: Generate test Merkle root
- `createPlaceholderNullifier()`: Generate test nullifier

**SOLID**: SRP - pure utility functions only

### [`components/SendModal.tsx`](components/SendModal.tsx)

**Purpose**: UI component for sending SOL

**Key Features**:

- Clear step-by-step transaction flow with comments
- Real-time status updates
- Proper loading and disabled states
- Error handling with user feedback

**Dependencies** (via props):

- `program`: Anchor program instance
- `wallet`: User's wallet
- `connection`: Solana RPC connection

**SOLID**:

- SRP: Handles UI only, delegates logic to service
- DIP: Receives dependencies via props

## Usage Example

See [`examples/AppWithPrivacyPool.example.tsx`](examples/AppWithPrivacyPool.example.tsx) for complete integration example.

Basic usage:

```typescript
<SendModal
  isOpen={isSendModalOpen}
  onClose={() => setIsSendModalOpen(false)}
  onSend={handleSend}
  program={program}
  wallet={wallet}
  connection={connection}
/>
```

## Required Dependencies

```json
{
  "@coral-xyz/anchor": "^0.30.1",
  "@solana/web3.js": "^1.98.4"
}
```

**Note:** `@zkprivacysol/sdk-core` is not currently required as we use local implementations in `src/sdk/client.ts`.

## Important Notes

### Development vs Production

**Current Implementation** (Development):

- Uses placeholder Merkle roots and nullifiers
- Airdrops SOL to relayer for testing
- No real zero-knowledge proofs

**Production Requirements**:

1. Replace placeholder roots with real Merkle tree roots
2. Replace placeholder nullifiers with real nullifiers from notes
3. Implement proper zero-knowledge proof generation
4. Use proper relayer funding mechanism (no airdrops)
5. Add transaction confirmation waiting
6. Implement proper error recovery

### Security Considerations

1. **Never expose private keys** in the browser extension
2. **Validate all user inputs** (addresses, amounts)
3. **Implement rate limiting** for transaction attempts
4. **Use secure storage** for wallet data (chrome.storage.local with encryption)
5. **Verify all signatures** before submitting transactions

## Testing

The implementation follows the test pattern from:
`tests/sdk.integration.test.ts`

To test:

1. Ensure local validator is running: `solana-test-validator`
2. Deploy privacy pool program
3. Configure RPC URL in environment
4. Test each step independently
5. Verify balance changes

## Extending the Implementation

### Adding New Pool Operations

1. Add type to `sdk.types.ts`:

```typescript
export interface NewOperationConfig {
  program: Program<any>;
  // ... other params
}
```

2. Add method to `IPrivacyPoolService`:

```typescript
newOperation(config: NewOperationConfig): Promise<PoolOperationResult>;
```

3. Implement in `PrivacyPoolService`:

```typescript
async newOperation(config: NewOperationConfig): Promise<PoolOperationResult> {
  // Implementation
}
```

### Adding UI Features

The `SendModal` can be extended with:

- Transaction history tracking
- Fee estimation display
- Multiple recipient support
- Scheduled transactions
- Transaction cancellation

## Troubleshooting

### Common Issues

1. **"Missing required parameters"**

   - Ensure `program`, `wallet`, and `connection` are initialized
   - Check example file for proper initialization

2. **"Failed to initialize pool"**

   - Verify wallet has sufficient SOL for rent
   - Check program is deployed correctly

3. **"Failed to create deposit"**

   - Ensure wallet has enough SOL for deposit + fees
   - Verify denomination index is valid

4. **"Failed to process withdrawal"**
   - Check relayer is registered and funded
   - Verify nullifier hasn't been used before

## Resources

- [Anchor Documentation](https://www.anchor-lang.com/)
- [Solana Web3.js Guide](https://solana-labs.github.io/solana-web3.js/)
- [SOLID Principles](https://en.wikipedia.org/wiki/SOLID)
