# Privacy Policy for Veilo Wallet

**Last Updated:** February 11, 2026

Veilo Wallet is a **browser extension** for Solana that gives you full control over your crypto. Your keys, your coins — everything stays on your device. We're here to help you manage your crypto safely and easily.

This policy explains what information we collect, how we protect it, and what we share (spoiler: very little).

**Note:** Veilo currently supports standard wallet features (send, receive, swap) on Solana mainnet. We're also testing advanced features on Solana's devnet (a test network with test tokens that have no real value).

---

## 1. What Information Do We Collect?

| Information                | Where It's Stored       | Shared With Anyone? | Why We Need It                             |
| -------------------------- | ----------------------- | ------------------- | ------------------------------------------ |
| Recovery phrase (12 words) | Your device (encrypted) | Never               | —                                          |
| Wallet private key         | Your device (encrypted) | Never               | —                                          |
| Wallet address             | Your device             | Yes                 | To show your balance and make transactions |
| Username                   | Your device             | Yes                 | To set up your account                     |
| Veilo keys                 | Your device (encrypted) | Yes (encrypted)     | For enhanced transaction features          |
| Token prices               | Not stored              | No info sent        | To show your portfolio value in dollars    |

**Most importantly:** Your recovery phrase and private key **never leave your device**. We can't see them, and nobody else can either.

---

## 2. How We Keep Your Wallet Secure

**Your wallet, your control:**

- **Recovery phrase** (12 words) is created on your device using the same proven method that Phantom, Solflare, and other major wallets use. It never leaves your device.
- **Wallet keys** come from your recovery phrase — again, all generated on your device.
- **Account recovery** works by signing a message to prove you own the wallet. Your recovery phrase stays private.
- **Veilo keys** (used for enhanced features) are created by our server but encrypted so only you can use them.

**What we see when you sign up:**

- Your wallet address (this is public info, like a username)
- Your chosen username
- Your recovery phrase — we never see this
- Your private key — we never see this either

---

## 3. How Your Information Is Protected

We use bank-level encryption to protect everything stored on your device. Your password locks everything up — we never see or store your password.

---

## 4. Services We Use

Veilo Wallet connects to **four services** to function properly. Here's what each one does:

### Veilo Server (our own backend)

Handles your account setup and enhanced wallet features.

- **Account creation & recovery:** We receive your wallet address and username to set up your account. We send back your encrypted Veilo keys.
- **Encrypted notes (blind storage):** We store encrypted records as a blind storage system. The encrypted notes remain unreadable to our server unless you explicitly grant access by performing a private withdrawal or transfer — only then does your wallet decrypt and send the necessary transaction details.
- **Enhanced transactions:** When you use private withdrawals or transfers, you grant our server temporary access to the decrypted transaction details needed to process your request.

**Important:** Our server acts as blind storage by default and never sees your private key, recovery phrase, or password. It only sees the contents of specific notes when you choose to withdraw or transfer, at which point you're granting temporary access to process that transaction.

### Solana Network

Standard blockchain connection that all Solana wallets use. We connect to check your balances, load your transaction history, and submit transactions you approve.

- We send your wallet address to look up balances and history
- We send your signed transactions when you approve them
- We check estimated fees before you confirm

### Jupiter (token swap service)

When you swap tokens, we use Jupiter to find the best rates across Solana exchanges.

- We send which tokens you want to swap, the amount, and your wallet address
- We don't send your private key or personal information

### DexScreener (price service)

We use this to show current token prices in dollars.

- No wallet address or personal information is sent
- We only request current price data

---

## 5. Browser Permissions Explained

| Permission          | Why We Need It                                         |
| ------------------- | ------------------------------------------------------ |
| Storage             | To save your encrypted wallet on your device           |
| Internet access     | To connect to Solana and check prices/balances         |
| Website integration | So crypto apps (like exchanges) can detect your wallet |

We do NOT access your browsing history, passwords, cookies, location, camera, microphone, or any personal files.

---

## 6. Our Promises to You

- No tracking — We don't use Google Analytics or any tracking tools
- No selling your data — Your information is never sold or shared for profit
- No spying — We can't see what websites you visit
- No hidden downloads — All code is included when you install. Nothing sneaky.
- No keylogging — We only see what you type in the Veilo Wallet popup, nowhere else

---

## 7. Using Veilo With Other Apps

When you connect to a Solana app (like an exchange or NFT site):

- The app only sees your wallet address — and only after you click "Connect"
- Your private key stays locked inside Veilo Wallet
- You approve every transaction — nothing happens without your permission
- We show you estimated fees before you confirm

---

## 8. How Long We Keep Your Information

- On your device: Everything stays until you uninstall Veilo Wallet or clear your browser data
- Active session: Cleared when you close your browser or lock the wallet
- On our server: We keep your wallet address, username, and encrypted notes (we can't read the notes)
- Never stored: Your private key, recovery phrase, or password

---

## 9. Open Source

Veilo Wallet is open source. You can read our code and verify everything in this policy yourself.

---

## 10. Important Legal Stuff

Veilo Wallet is provided free of charge, and like all software, it comes with no guarantees. We work hard to keep your funds safe, but cryptocurrency involves risk. We're not responsible for losses caused by the extension, third-party services, user error, or network issues.

**Always keep your recovery phrase safe and never share it with anyone.**

---

## 11. Contact Us

Have questions? Reach out:

- Twitter: @VeiloWallet
- Email: support@veilo.network
- Website: https://wallet.veilo.network/

---

## 12. Chrome Web Store Compliance

- We follow the Chrome Web Store User Data Policy, including Limited Use requirements
- We only share your data when absolutely necessary (blockchain transactions, token swaps)
- We don't use your data for advertising, credit checks, or anything unrelated to the wallet

---

## 13. Updates to This Policy

We may update this policy occasionally to reflect new features or requirements. If we make big changes, we'll let you know through the extension or on our website. By continuing to use Veilo Wallet, you agree to the updated terms.

---

Built with zero-knowledge proofs on Solana
