# Privacy Policy for Veilo Wallet

**Last Updated:** February 11, 2026

Veilo Wallet is a **browser extension** wallet for Solana that helps keep your transactions private. It runs entirely inside your Chrome or Firefox browser — your secret keys and recovery phrase never leave your device. This policy explains what data we collect, what we share, and why.

**Current Status:** Veilo supports standard wallet features (send, receive, swap) on Solana mainnet. The advanced privacy features are currently running on Solana devnet (a test network) using test tokens with no real value. Mainnet privacy features are coming soon.

---

## 1. What We Collect (and What We Don't)

| Your Data                  | Stored on Your Device? | Sent to Anyone?       | Why                                            |
| -------------------------- | ---------------------- | --------------------- | ---------------------------------------------- |
| Recovery phrase (12 words) | Yes, encrypted         | Never                 | —                                              |
| Private key                | Yes, encrypted         | Never                 | —                                              |
| Wallet address (public)    | Yes                    | Yes                   | Needed to interact with the Solana blockchain  |
| Username                   | Yes                    | Yes                   | To create or restore your Veilo Wallet account |
| Veilo keys                 | Yes, encrypted         | Yes, encrypted        | To enable private transactions                 |
| SOL price                  | No                     | No personal data sent | To show your balance in USD                    |

**The bottom line:** Your recovery phrase and private key are **never** sent anywhere. They stay encrypted on your device, always.

---

## 2. How Your Keys Are Created

- **Your recovery phrase** (12 words) is generated right on your device using the same industry standard every major Solana wallet uses. It never touches our servers.
- **Your wallet keys** are derived from that phrase on your device — same method as Phantom, Solflare, and other popular wallets.
- **To restore your account**, you prove you own the wallet by signing a challenge — your recovery phrase still never leaves your device.
- **Veilo keys** are generated on our server but encrypted specifically for your wallet before being sent to you. Only your wallet can decrypt them.

**During sign-up, we only receive:**

- Your wallet address (this is public — like a bank account number)
- Your chosen username
- We **never** receive your recovery phrase
- We **never** receive your private key

---

## 3. How Your Data Is Protected on Your Device

All sensitive data stored by the extension is encrypted using a strong, industry-standard encryption method before being saved. Your password is used to lock and unlock your data — we never see or store your password itself.

---

## 4. Who We Talk To and Why

Veilo connects to **four external services** to work. Here's what each one does and what data is involved.

### Veilo Server (our backend)

Handles account creation, account restoration, encrypted note storage, and processing of private transactions.

- **Account setup & restore:** We receive your wallet address and username to create or restore your account. Your encrypted Veilo keys are returned to you.
- **Privacy notes:** We store encrypted notes that represent your private balances. These notes are encrypted before they leave your device — our server stores them but cannot read them.
- **Private transactions:** When you withdraw or transfer privately, the transaction details are encrypted before being sent to our server for processing.

**About trust:** Our server helps process private transactions on your behalf, but it never has access to your private key, recovery phrase, or password.

### Solana Network

Standard Solana blockchain connections — the same ones every Solana wallet uses. Used to check your balances, load your transaction history, and submit transactions you've approved.

- We send your wallet address to look up balances and history.
- We send your signed transactions when you approve a transfer, deposit, or swap.
- We simulate transactions before you approve so you can see estimated fees.

### Jupiter (token swap service)

When you swap one token for another, we use Jupiter to find the best rate across Solana exchanges.

- We send the tokens you want to swap, the amount, and your wallet address (so the transaction is built for your wallet).
- We do not send your private key or any other personal information.

### DexScreener (price feed)

Used only to display the current SOL price in USD.

- No wallet address, username, or personal data is ever sent. We only request the current token price.

---

## 5. Browser Permissions

| Permission                 | Why we need it                                                         |
| -------------------------- | ---------------------------------------------------------------------- |
| Storage                    | To save your encrypted wallet data on your device                      |
| Access to websites (host)  | To connect to the Solana network, our server, Jupiter, and DexScreener |
| Content script on websites | To let Solana apps detect and connect to your Veilo Wallet             |

We do NOT request access to your tabs, browsing history, cookies, location, camera, microphone, or any other sensitive browser data.

---

## 6. What We Will Never Do

- No tracking. We don't use any analytics or tracking tools.
- No data sales. We never sell, share, or monetize your data.
- No browsing surveillance. We don't monitor what websites you visit.
- No remote code. Everything the extension runs is included at install time. Nothing is downloaded from the internet.
- No keylogging. We only read what you type inside the Veilo Wallet popup — never on other websites or tabs.

---

## 7. Connecting to Apps (DApps)

When you connect Veilo Wallet to a Solana app (like a DEX or NFT marketplace):

- The app only gets your wallet address — and only after you approve the connection.
- Your private key never leaves the extension. Transactions are signed inside Veilo Wallet.
- You must approve every transaction before it's sent.
- Transactions are simulated first so you can see estimated fees and catch errors before approving.

---

## 8. How Long We Keep Data

- On your device: Your data stays until you uninstall the extension or clear your browser data.
- Session: Cleared when you close the browser or lock the wallet.
- On our server: We store your wallet address, username, and encrypted notes. We never store your private key, recovery phrase, or password.

---

## 9. Open Source

Veilo Wallet is open source. You can read our code and verify every claim in this policy yourself.

---

## 10. Liability

Veilo Wallet is provided "as is" without warranties. We are not liable for any loss of funds, data, or damages from using the extension, third-party services, or unexpected failures.

---

## 11. Contact

Questions? Reach out:

- Twitter: @VeiloWallet
- Email: support@veilo.network
- Website: https://wallet.veilo.network/

---

## 12. Chrome Web Store Compliance

- We follow the Chrome Web Store User Data Policy, including Limited Use requirements.
- We only share your data with third parties when it's essential for the wallet to work (blockchain transactions, token swaps).
- We don't use your data for anything unrelated to the wallet.
- We don't use your data for advertising, credit scoring, or lending.

---

## 13. Changes to This Policy

We may update this policy from time to time. If we make significant changes, we'll let you know through extension update notes or on our website. Continuing to use Veilo Wallet after changes means you accept the updated policy.

---

Built with zero-knowledge proofs on Solana
