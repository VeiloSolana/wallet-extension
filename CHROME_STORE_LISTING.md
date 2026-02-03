# Chrome Web Store Listing - Veilo Wallet

## Extension Name

Veilo Wallet

## Tagline (Short Description)

The privacy-focused Solana wallet. Manage your crypto privately.

## Detailed Description

**The first privacy-by-default Solana wallet extension. Now in beta.**

We've designed Veilo to be private by default, and completely behind the scenes. Our core features include:

### ✨ Core Features

- **🔮 Smart Wallet Management:** We create and manage wallets behind the scenes for enhanced privacy

- **🔒 Private dApp Connections:** Create fresh wallets specifically for connecting to dApps to prevent wallet-IP connections

- **🛡️ Veilo Balance:** All crypto that flows through Veilo is pooled with other users' funds to enhance privacy

- **⚡ Private Transfers:** Send crypto to other Veilo users by username - fast and private

- **🪙 Multi-Token Support:** Support for SOL and SPL tokens (USDC, USDT, etc.)

- **🔑 Username System:** No more complex wallet addresses - send money to easy usernames like @alice

### 🔐 Security & Privacy

- **AES-256 Encryption:** Your private keys and seed phrase are encrypted with your password
- **Local-Only Storage:** Sensitive data never leaves your device
- **Non-Custodial:** You control your keys. We cannot access your funds.
- **Open Source:** Our code is publicly auditable on GitHub

### 📱 How It Works

1. Create a wallet with a unique username
2. Deposit crypto into your Veilo balance
3. Send private transfers to other users by username
4. Connect to dApps with fresh wallets for enhanced privacy
5. All wallet management happens behind the scenes

Welcome to magical privacy.

### 🌐 Permissions Explanation

**Why does Veilo need "access to all websites"?**

Like ALL Web3 wallets (MetaMask, Phantom, Hush, etc.), Veilo requires `<all_urls>` permission to:

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

**Storage Permission:**
Used to securely store your encrypted wallet data locally on your device.

### 🔗 Links

- Privacy Policy: [Full privacy policy included in extension]
- Website: https://veilo.network
- Docs: https://veilo.network/docs
- GitHub: https://github.com/VeiloSolana/wallet-extension
- Support: support@veilo.network

### ⚠️ Important Disclaimers

- **Beta Software:** Veilo is currently in beta. Use at your own risk and start with small amounts.
- **Cryptocurrency Risk:** Trading and holding cryptocurrency involves risk. Only invest what you can afford to lose.
- **User Responsibility:** You are responsible for securing your seed phrase and password. We cannot recover lost credentials.
- **Not Financial Advice:** Veilo is a tool, not financial advice. Do your own research.

### 🆘 Support

For help, bug reports, or feature requests:

- Email: support@veilo.network
- GitHub Issues: https://github.com/VeiloSolana/wallet-extension/issues
- Response Time: We respond to all inquiries within 3 business days (24 hours for urgent issues)

---

**Welcome to magical privacy.**

## Category

Tools

## Language

English

## Privacy Policy URL

https://veilo.network/privacy-policy

## Single Purpose Description

Veilo is a privacy-focused cryptocurrency wallet for the Solana blockchain. Its single purpose is to enable users to privately manage their digital assets and interact with decentralized applications (dApps).

Users need this extension to:

1. Create and manage a non-custodial Solana wallet with smart wallet management for privacy.
2. Send and receive SOL and SPL tokens privately using your Veilo balance.
3. Inject a wallet provider into websites to connect with Web3 dApps (requires access to all sites to detect and facilitate these connections).

## Justification for Permissions (For Reviewer Notes)

### host_permissions: <all_urls>

The extension requires access to all URLs (<all_urls>) to inject the bundled wallet provider (content.js and injected.js) into the DOM at 'document_start'.

This is a functional requirement for the Solana Wallet Standard. Decentralized applications (dApps) running on arbitrary web domains need to detect 'window.solana' immediately upon page load to initialize.

This is identical to how Hush Wallet, Phantom, MetaMask, and all other Web3 wallets operate.

Security limitations:

- The content script (content.js) ignores all page content.
- It does not read cookies, input forms, or DOM elements.
- It functions solely as a communication bridge between the dApp and the extension background process.
- No user data is transmitted unless the user explicitly clicks "Connect" in the extension UI.

### storage permission

**Required for:** Storing encrypted wallet data locally

- All data encrypted with user's password using AES-256
- Never synced to cloud or transmitted to servers
- Non-custodial design - we cannot access user data

### Content Scripts (all_urls)

**Required for:** Injecting wallet provider before dApps load

- Runs at document_start to register wallet API
- Lightweight script (~50KB)
- Does not access DOM content or user input
- Required for dApp detection of wallet

## Screenshots to Include

1. Main wallet interface showing Veilo balance
2. Send transaction screen with username input
3. dApp connection approval dialog
4. Security/seed phrase backup screen
5. Private transfer confirmation

## Target Audience

- Privacy-conscious cryptocurrency users
- Solana blockchain users
- DeFi participants
- Web3 developers
- Users seeking enhanced financial privacy
