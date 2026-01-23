# Chrome Web Store Listing - Veilo Wallet

## Extension Name

Veilo - Privacy Wallet for Solana

## Tagline (Short Description)

Non-custodial privacy wallet for Solana. Send shielded transactions using zero-knowledge proofs.

## Detailed Description

**Veilo is a privacy-focused browser extension wallet for the Solana blockchain.**

### 🛡️ What is Veilo?

Veilo enables you to hold and transfer cryptocurrency privately on Solana using zero-knowledge (ZK) proof technology. Your balance and transaction history remain confidential while maintaining blockchain security.

### ✨ Key Features

- **🔐 Non-Custodial:** You control your private keys and seed phrase. We cannot access your funds.
- **🛡️ Shielded Balance:** Hold assets privately. Your balance is not visible on the public ledger.
- **⚡ Private Transfers:** Send crypto to other users by username (e.g., @alice) with zero-knowledge proofs.
- **🌐 dApp Connectivity:** Connect to Solana decentralized applications (dApps) with standard wallet integration.
- **🪙 Multi-Token Support:** Support for SOL and SPL tokens (USDC, USDT, etc.).
- **🔑 Username System:** No more complex wallet addresses - send money to easy usernames.

### 🔒 Privacy & Security

- **Zero-Knowledge Proofs:** Transactions are cryptographically private - no one can see sender, recipient, or amounts.
- **Local Encryption:** All keys are encrypted with your password and stored only on your device.
- **No Data Collection:** We do not track your browsing, transactions, or personal information.
- **Open Source:** Our code is publicly auditable on GitHub.

### 📱 How It Works

1. Create a wallet with a unique username
2. Deposit crypto into your shielded balance
3. Send private transfers to other Veilo users by username
4. Withdraw to public addresses when needed
5. Connect to dApps for private blockchain interactions

### 🌐 Permissions Explanation

**Why does Veilo need "access to all websites"?**

Like ALL Web3 wallets (MetaMask, Phantom, etc.), Veilo requires `<all_urls>` permission to:

- Inject a wallet provider into websites (Wallet Standard API)
- Allow dApps to detect and request connection to your wallet
- Enable you to interact with blockchain-based websites

**What Veilo DOES:**
✅ Injects a lightweight wallet provider object when you visit websites
✅ Responds ONLY when YOU explicitly connect to a dApp
✅ Signs transactions ONLY with your approval

**What Veilo DOES NOT DO:**
❌ Does NOT read website content or forms
❌ Does NOT track your browsing history
❌ Does NOT collect personal data from websites
❌ Does NOT inject ads or tracking scripts
❌ Does NOT access data beyond wallet connection requests

**Storage Permission:**
Used to securely store your encrypted wallet data locally on your device. Data is encrypted with your password and never transmitted to our servers.

### 📋 For Developers

Veilo implements the Solana Wallet Standard, making it compatible with any dApp that supports standard Solana wallets. Developers can integrate Veilo just like any other wallet - no special code required.

### 🔗 Links

- Privacy Policy: [Full privacy policy included in extension]
- Website: https://veilo.network
- GitHub: https://github.com/VeiloSolana/wallet-extension
- Documentation: https://docs.veilo.network
- Support: support@veilo.network

### ⚠️ Important Disclaimers

- **Cryptocurrency Risk:** Trading and holding cryptocurrency involves risk. Only invest what you can afford to lose.
- **User Responsibility:** You are responsible for securing your seed phrase and password. We cannot recover lost credentials.
- **Beta Software:** Veilo is new software. Use at your own risk and start with small amounts.
- **Not Financial Advice:** Veilo is a tool, not financial advice. Do your own research.

### 🆘 Support

For help, bug reports, or feature requests:

- Email: support@veilo.network
- GitHub Issues: https://github.com/VeiloSolana/wallet-extension/issues
- Discord: [Your Discord link]

---

**Privacy-first. User-controlled. Open source.**

## Category

Productivity / Developer Tools

## Language

English

## Privacy Policy URL

https://raw.githubusercontent.com/VeiloSolana/wallet-extension/master/PRIVACY_POLICY.md
(Or host it on your website)

## Single Purpose Description

Veilo is a privacy-focused cryptocurrency wallet for the Solana blockchain. Its single purpose is to enable users to securely manage their digital assets and interact with decentralized applications (dApps) using privacy-preserving zero-knowledge proof technology.

Users need this extension to:

1. Create and manage a non-custodial Solana wallet.
2. Hold and transfer assets privately using shielded transactions.
3. Inject a wallet provider into websites to connect with Web3 dApps (requires access to all sites to detect and facilitate these connections).

## Justification for Permissions (For Reviewer Notes)

### host_permissions: <all_urls>

The extension requires access to all URLs (<all_urls>) to inject the bundled wallet provider (content.js and injected.js) into the DOM at 'document_start'.

This is a functional requirement for the Solana Wallet Standard. Decentralized applications (dApps) running on arbitrary web domains need to detect 'window.solana' immediately upon page load to initialize.

Security limitations:

- The content script (content.js) ignores all page content.
- It does not read cookies, input forms, or DOM elements.
- It functions solely as a communication bridge between the dApp and the extension background process.
- No user data is transmitted unless the user explicitly clicks "Connect" in the extension UI.

### storage permission

**Required for:** Storing encrypted wallet data locally

- All data encrypted with user's password
- Never synced to cloud or transmitted to servers
- Non-custodial design - we cannot access user data

### Content Scripts (all_urls)

**Required for:** Injecting wallet provider before dApps load

- Runs at document_start to register wallet API
- Lightweight script (~50KB)
- Does not access DOM content or user input
- Required for dApp detection of wallet

## Screenshots to Include

1. Main wallet interface showing shielded balance
2. Send transaction screen with username input
3. dApp connection approval dialog
4. Security/seed phrase backup screen
5. Settings showing privacy features

## Target Audience

- Cryptocurrency users seeking privacy
- Solana blockchain users
- Privacy-conscious individuals
- DeFi participants
- Web3 developers testing privacy features
