# Veilo Wallet Extension

The first privacy-focused Solana wallet extension. Now in beta.

We've designed Veilo to be private by default, and completely behind the scenes.

## Features

- **🔮 Smart Wallet Management:** We create and manage wallets behind the scenes for enhanced privacy
- **🔒 Private dApp Connections:** Create fresh wallets specifically for connecting to dApps
- **🛡️ Veilo Balance:** All crypto that flows through Veilo is pooled with other users' funds to enhance privacy
- **⚡ Private Transfers:** Send crypto to other Veilo users by username - fast and private
- **🪙 Multi-Token Support:** Support for SOL and SPL tokens (USDC, USDT, etc.)
- **🔑 Username System:** No more complex wallet addresses - send money to easy usernames like @alice

## User Flows

### 1. Onboarding & Account Creation

- **New User:** The user chooses a unique username (e.g., `@satoshi`).
- **Key Generation:** The wallet generates a Solana Keypair (Public/Private keys).
- **Security:** A mnemonic seed phrase is generated. The user sets a password which encrypts these keys in local storage using AES-256.
- **Registration:** The username is registered with our backend service to map it to the user's public address for easy transfers.

### 2. Send Tokens

1. User enters recipient's username or public address and amount.
2. The wallet creates a standard Solana transaction.
3. User approves the transaction.
4. Transaction is submitted to the Solana network.

### 3. Receive Tokens

1. User shares their username or public address.
2. Sender sends tokens to the user's address.
3. Tokens appear in the user's balance.

### 4. Connect to dApps

1. User visits a Solana dApp.
2. dApp detects Veilo via the Wallet Standard API.
3. User clicks "Connect" and approves in the extension popup.
4. dApp can now request transaction signatures (with user approval).

## Use Cases

- **Everyday Payments:** Send money to friends or pay for goods and services.
- **DeFi Participation:** Connect to DEXs, lending protocols, and other DeFi apps.
- **NFT Transactions:** Buy, sell, and transfer NFTs on Solana marketplaces.
- **Gaming:** Use with Solana-based games and gaming platforms.

## Technologies

- **Frontend:** React, TypeScript, Vite, Tailwind CSS
- **Cryptographic:** `@solana/web3.js`
- **State Management:** Zustand
- **Animation:** Framer Motion

## License

MIT

## Privacy Policy

Please see [PRIVACY_POLICY.md](./PRIVACY_POLICY.md) for details on how Veilo handles your data and protects your security.

## Permissions

Veilo requests the following browser permissions:

- **`storage`** - To securely store encrypted wallet data locally
- **`host_permissions: <all_urls>`** - To inject wallet provider into websites for dApp connectivity (standard for all Web3 wallets)

For detailed justification, see our [Privacy Policy](./PRIVACY_POLICY.md).
