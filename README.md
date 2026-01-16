# Veilo Wallet Extension

Veilo is a privacy-focused browser extension wallet for the Solana blockchain. It enables shielded transactions using Zero-Knowledge (ZK) proofs, allowing users to deposit, transfer, and withdraw assets privately while maintaining a user-friendly experience through usernames and abstraction of complex cryptographic operations.

## Features

- **🛡️ Shielded Balance:** Hold assets privately. Your balance and transaction history are not visible on the public ledger.
- **⚡ Private Transfers:** Send assets to other Veilo users instantaneously and privately using usernames (e.g., `@alice`).
- **🌉 Relayer Integration:** Transactions are submitted via a relayer to preserve privacy by dissociating the gas payer from the transaction origin.
- **🔑 Non-Custodial:** Your private keys and seed phrase are encrypted and stored locally. You have full control.
- **🪙 Multi-Token Support:** Support for SOL and SPL tokens (USDC, USDT, etc.) within the privacy pool.

## User Flows

### 1. Onboarding & Account Creation

- **New User:** The user chooses a unique username (e.g., `@satoshi`).
- **Key Generation:** The wallet generates a Solana Keypair (Public/Private keys) and a specific Privacy Keypair.
- **Security:** A mnemonic seed phrase is generated. The user sets a password which encrypts these keys in local storage.
- **Registration:** The username is registered with the backend service to map it to the user's public identity keys for discovery (while preserving transactional privacy).

### 2. Deposit (Shielding)

_Flow: Public Address → Shielded Pool_

1. User selects an amount to deposit from their public Solana balance.
2. The wallet creates a transaction calling the **Privacy Pool Program**.
3. Funds are transferred to the program's vault.
4. A "Note" (UTXO) representing the deposited value is created and added to the on-chain Merkle Tree.
5. The user's encrypted local state is updated to include this new Note.

### 3. Private Transfer

_Flow: User A (Shielded) → User B (Shielded)_

1. User A enters User B's username and amount.
2. **Note Selection:** The wallet selects "Notes" from User A's local storage that sum up to the required amount.
3. **ZK Proof Generation:** The wallet generates a Zero-Knowledge proof locally. This proof asserts:
   - User A owns the notes.
   - The notes exist in the Merkle Tree.
   - The notes have not been spent (nullifier check).
4. **Relayer Submission:** The proof and encrypted output notes (for User B) are sent to the Relayer.
5. **On-Chain Settlement:** The Relayer submits the transaction. The Program verifies the proof and updates the Merkle Tree with new notes for User B. User A's spent notes are nullified.

### 4. Withdraw (Unshielding)

_Flow: Shielded Pool → Public Address_

1. User selects an amount to withdraw to a public Solana address (their own or external).
2. Similar to a transfer, the wallet generates a ZK proof proving ownership of funds.
3. The transaction instructs the Privacy Pool Program to release funds from the vault to the target public address.
4. This action breaks the link between the deposit history and the withdrawal event.

## Use Cases

- **Private Payments:** Send money to friends or vendors without revealing your net worth or history.
- **Payroll:** Pay employees without exposing the company's full treasury or salary details publicly.
- **Trading:** Move funds to an exchange (via Withdraw) strategies without linking back to a main identifyable wallet.

## Technologies

- **Frontend:** React, TypeScript, Vite, Tailwind CSS
- **Cryptographic:** `circomlibjs` (for ZK integration), `@solana/web3.js`
- **State Management:** Zustand
- **Animation:** Framer Motion

## License

MIT

## Privacy Policy

Please see [PRIVACY_POLICY.md](./PRIVACY_POLICY.md) for details on how Veilo handles your data and protects your privacy.

## Permissions

Veilo requests the following browser permissions:

- **`storage`** - To securely store encrypted wallet data locally
- **`host_permissions: <all_urls>`** - To inject wallet provider into websites for dApp connectivity (standard for all Web3 wallets)

For detailed justification, see our [Privacy Policy](./PRIVACY_POLICY.md).
