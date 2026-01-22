# Privacy Policy for Veilo Wallet

**Last Updated: January 22, 2026**

## Introduction

Veilo ("we," "our," or "us") is a privacy-focused browser extension wallet for the Solana blockchain. This Privacy Policy explains how we collect, use, store, and protect your information when you use the Veilo wallet extension.

## Our Commitment to Privacy

Veilo is designed with privacy as a core principle. We are a **non-custodial wallet**, meaning:

- We do NOT store your private keys, seed phrases, or passwords on our servers
- We do NOT have access to your funds
- We do NOT track your browsing activity
- We do NOT sell or share your personal data with third parties

## Information We Collect

### Information Stored Locally (On Your Device)

The following information is **encrypted and stored only on your device** using Chrome's local storage:

1. **Wallet Keys and Credentials:**
   - Solana public/private key pairs (encrypted)
   - Privacy keypairs for zero-knowledge transactions (encrypted)
   - Seed phrase/mnemonic (encrypted with your password)
   - Your chosen username (e.g., @username)

2. **Transaction History:**
   - Local record of your shielded transactions
   - Note (UTXO) data for your privacy pool balance
   - Nullifier tracking to prevent double-spending

3. **Settings and Preferences:**
   - Display currency preferences
   - Network settings (mainnet/devnet)
   - User interface preferences

### Information Sent to Our Backend Services

We operate backend services (relayers and username registry) that receive the following **non-identifying** information:

1. **Username Registration:**
   - Your chosen username
   - Your public identity keys (for username-to-address mapping)
   - Registration timestamp
   - **Note:** We do NOT store transaction history or balance information

2. **Transaction Relay:**
   - Zero-knowledge proofs (these do NOT reveal sender, recipient, or amount)
   - Encrypted transaction data
   - Merkle tree updates
   - **Note:** Relayers cannot determine who initiated transactions

3. **Blockchain Queries:**
   - Public blockchain state queries (Merkle tree roots, program state)
   - Token price information from public APIs

### Information NOT Collected

We explicitly do NOT collect:

- ❌ Your browsing history
- ❌ Websites you visit
- ❌ Content of web pages you view
- ❌ Your IP address (beyond temporary connection logs)
- ❌ Device information or fingerprinting data
- ❌ Analytics or tracking cookies
- ❌ Your real identity (name, email, phone number)
- ❌ Your transaction amounts or balances

## Why We Request Browser Permissions

Veilo requests the following Chrome extension permissions:

### 1. `storage` Permission

**Purpose:** To securely store your encrypted wallet data locally on your device.

**What We Store:**

- Encrypted private keys and seed phrase
- Local transaction history and notes
- User preferences and settings

**What We DON'T Do:**

- We do NOT sync this data to Google's cloud storage
- We do NOT transmit this data to our servers
- All data remains encrypted on your device

### 2. `host_permissions: <all_urls>` Permission

**Purpose:** To enable Veilo to function as a Web3 wallet provider for decentralized applications (dApps).

**Why This Is Necessary:**

- **Standard for all Web3 wallets** (MetaMask, Phantom, etc. require the same permission)
- Allows injection of the Veilo wallet provider into websites you visit
- Enables dApps to detect and connect to your wallet
- Required for you to interact with Solana-based websites and applications

**What We Access:**

- We inject a small JavaScript provider (Wallet Standard API) into web pages
- This provider ONLY responds when YOU explicitly approve a connection
- We do NOT read page content, forms, or personal data from websites
- We do NOT track which websites you visit

**What We DON'T Do:**

- ❌ We do NOT collect data from websites
- ❌ We do NOT track your browsing history
- ❌ We do NOT read or modify website content without your permission
- ❌ We do NOT inject ads or tracking scripts

### 3. Content Scripts (`<all_urls>`)

**Purpose:** To inject the wallet provider into all pages so dApps can detect Veilo.

**Behavior:**

- Runs at `document_start` to register wallet before dApps load
- Only injects a lightweight provider object
- Does not access page content or user data
- Only activates when YOU connect to a dApp

## How We Use Your Information

### Local Data (On Your Device)

- **Purpose:** To provide wallet functionality (sign transactions, manage keys)
- **Access:** Only you and the extension have access
- **Encryption:** All sensitive data is encrypted with your password

### Backend Services

- **Username Service:** Maps usernames to public keys for easy transfers
- **Relayer Service:** Submits zero-knowledge proofs to the blockchain for privacy
- **Purpose:** Enable private transactions without revealing your identity

## Data Security

We implement industry-standard security measures:

1. **Encryption:** All private keys and seed phrases are encrypted using AES-256
2. **Local Storage:** Sensitive data never leaves your device
3. **Zero-Knowledge Proofs:** Transaction details are cryptographically private
4. **No Server-Side Keys:** We cannot access your funds or decrypt your data
5. **Open Source:** Our code can be audited for security (on GitHub)

## Third-Party Services

Veilo interacts with the following third-party services:

1. **Solana RPC Nodes:** To read blockchain state and submit transactions
2. **Token Price APIs:** To display USD values (optional)
3. **Relayer Network:** To submit private transactions anonymously

These services may log IP addresses temporarily for rate-limiting and DDoS protection. We do not control their privacy practices.

## User Rights and Control

You have full control over your data:

- **Export:** You can export your seed phrase at any time
- **Delete:** Uninstalling the extension deletes all local data
- **Opt-Out:** You can choose not to register a username (affects UX only)
- **Disconnection:** You can disconnect from dApps at any time

## Children's Privacy

Veilo is not intended for users under 18 years of age. We do not knowingly collect information from minors.

## Changes to This Policy

We may update this Privacy Policy periodically. Changes will be reflected with a new "Last Updated" date. Significant changes will be communicated via the extension's update notes.

## Data Retention

- **Local Data:** Retained until you uninstall the extension or clear browser data
- **Username Registry:** Retained indefinitely (usernames are public identifiers)
- **Relayer Logs:** Automatically deleted after 30 days

## International Users

Veilo is available worldwide. By using Veilo, you consent to the transfer of information to the United States and other jurisdictions where our servers are located.

## Contact Us

If you have questions or concerns about this Privacy Policy, please contact us:

- **Email:** support@veilo.network
- **GitHub:** https://github.com/VeiloSolana/wallet-extension
- **Website:** https://veilo.network

## Transparency and Open Source

Veilo's code is open source and available on GitHub. You can audit our code to verify that we uphold the commitments made in this Privacy Policy.

## Legal Basis for Processing (GDPR)

For users in the European Union, we process data based on:

- **Contractual Necessity:** To provide wallet services
- **Legitimate Interest:** To improve security and prevent fraud
- **Consent:** For optional features like username registration

## Your Rights (GDPR/CCPA)

You have the right to:

- Access your data
- Delete your data
- Export your data
- Opt-out of non-essential data processing

To exercise these rights, contact us at privacy@veilo.network

---

**By using Veilo, you acknowledge that you have read and understood this Privacy Policy.**
