# Privacy Policy for Veilo Wallet Extension

**Last Updated:** January 16, 2026

## Introduction

Veilo ("we", "our", "us") is committed to protecting your privacy. This Privacy Policy explains how our browser extension handles your information while providing privacy-focused cryptocurrency wallet services on the Solana blockchain.

## Data Collection and Storage

### Locally Stored Data

Veilo stores the following data **locally on your device only** using browser storage:

- **Wallet Keys:** Your encrypted private keys and seed phrase (encrypted with your password)
- **Username:** Your chosen Veilo username (e.g., @username)
- **Transaction Notes:** Encrypted UTXO notes representing your shielded balance
- **Preferences:** User settings and configuration
- **Connected Sites:** List of websites you've authorized to connect to your wallet

**Important:** All sensitive cryptographic data is encrypted using your password and stored exclusively in your browser's local storage. We do not have access to your private keys, seed phrase, or password.

### Data Transmitted to External Services

#### Relayer Service (relayer-server.onrender.com)

To maintain transaction privacy, Veilo uses a relayer service that:

- **Receives:** Encrypted transaction proofs, public transaction data, username lookups
- **Purpose:** Submit transactions on your behalf to preserve privacy by dissociating the gas payer from your identity
- **Encryption:** Sensitive transaction data is encrypted end-to-end using public-key cryptography
- **Does NOT receive:** Your private keys, seed phrase, or unencrypted wallet data

#### DexScreener API (api.dexscreener.com)

- **Receives:** Public API requests for cryptocurrency price data
- **Purpose:** Display current token prices in the wallet interface
- **Data Sent:** No personal information is transmitted

#### Solana Blockchain

- **Receives:** Public blockchain transactions (shielded using zero-knowledge proofs)
- **Purpose:** Execute deposits, transfers, and withdrawals
- **Privacy:** Your transactions are designed to be private and unlinkable to your identity

## Data We Do NOT Collect

- Personal identification information (name, email, address, phone number)
- Browsing history
- IP addresses (not logged or stored by us)
- Unencrypted private keys or passwords
- Analytics or tracking data

## Third-Party Services

Veilo integrates with the following third-party services:

1. **Relayer Server** - Transaction relay service for privacy preservation
2. **DexScreener** - Public cryptocurrency price API
3. **Solana RPC Nodes** - Public blockchain infrastructure

Each service has its own privacy policy. We encourage you to review them:

- Solana: https://solana.com/privacy-policy
- DexScreener: https://dexscreener.com/

## How We Use Information

The locally stored information is used exclusively to:

- Manage your cryptocurrency wallet
- Generate and verify zero-knowledge proofs
- Display your shielded balance and transaction history
- Connect to decentralized applications (dApps)
- Provide username-based transfers

## Data Security

We implement security measures including:

- **Encryption:** All sensitive data is encrypted using industry-standard cryptography
- **Local Storage:** Private keys never leave your device unencrypted
- **Zero-Knowledge Proofs:** Transactions are private by design
- **Non-Custodial:** You maintain full control of your funds and keys

## User Control and Data Deletion

You have complete control over your data:

- **Export Seed Phrase:** Access and backup your seed phrase at any time
- **Delete Wallet:** Uninstalling the extension removes all locally stored data
- **Disconnect Sites:** Revoke dApp connections at any time through settings

## Children's Privacy

Veilo is not intended for users under the age of 18. We do not knowingly collect information from children.

## Changes to This Policy

We may update this Privacy Policy periodically. Changes will be posted with an updated "Last Updated" date. Continued use of Veilo after changes constitutes acceptance of the updated policy.

## Open Source

Veilo's code is open source and available for audit at: https://github.com/VeiloSolana/wallet-extension

## Contact

For privacy concerns or questions, please contact us:

- GitHub Issues: https://github.com/VeiloSolana/wallet-extension/issues
- Repository: https://github.com/VeiloSolana/wallet-extension

## Permissions Justification

### Why Veilo Requests Certain Permissions:

**`storage`** - Required to securely store encrypted wallet data, transaction notes, and user preferences locally on your device.

**`host_permissions: <all_urls>`** - Required to inject the Veilo wallet provider into web pages, enabling decentralized applications (dApps) to connect to your wallet. This is standard for all Web3 wallet extensions (similar to MetaMask, Phantom, etc.) and does not grant us access to view or collect your browsing data.

**Content Scripts** - Enables communication between web pages and your wallet, allowing dApps to request transaction approvals while keeping your private keys secure within the extension.

## Compliance

Veilo complies with:

- Chrome Web Store Developer Program Policies
- General Data Protection Regulation (GDPR) principles
- California Consumer Privacy Act (CCPA) where applicable

---

**By using Veilo Wallet Extension, you acknowledge that you have read and understood this Privacy Policy.**
