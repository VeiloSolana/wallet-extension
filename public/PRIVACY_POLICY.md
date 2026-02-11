# Privacy Policy for Veilo

**Last Updated:** February 11, 2026

Veilo is a **browser extension** wallet for Solana that helps keep your transactions private. It runs entirely inside your Chrome or Firefox browser — your secret keys and recovery phrase never leave your device. This policy explains in plain language what data we collect, what we send and to whom, and why.

**Current Status:** Veilo supports standard wallet features (send, receive, swap) on Solana mainnet. The advanced privacy features are currently running on Solana devnet (a test network) using test tokens with no real value. Mainnet privacy features are coming soon.

---

## 1. What We Collect (and What We Don't)

| Your Data                  | Stored on Your Device? | Sent to Anyone?       | Who Receives It                       | Why                                         |
| -------------------------- | ---------------------- | --------------------- | ------------------------------------- | ------------------------------------------- |
| Recovery phrase (12 words) | Yes, encrypted         | Never                 | Nobody                                | —                                           |
| Private key                | Yes, encrypted         | Never                 | Nobody                                | —                                           |
| Wallet address (public)    | Yes                    | Yes                   | Veilo server, Jupiter, Solana network | So others can identify your wallet on-chain |
| Username                   | Yes                    | Yes                   | Veilo server                          | To create or restore your account           |
| Privacy keys               | Yes, encrypted         | Yes, encrypted        | Veilo server                          | To enable private transactions              |
| Transactions you sign      | No                     | Yes                   | Solana network                        | To execute your transfers and deposits      |
| Swap details               | No                     | Yes                   | Jupiter (swap service)                | To find you the best swap rate              |
| SOL price                  | No                     | No personal data sent | DexScreener (price feed)              | To show your balance in USD                 |

**The bottom line:** Your recovery phrase and private key are **never** sent anywhere. They stay encrypted on your device, always.

---

## 2. How Your Keys Are Created

- **Your recovery phrase** (12 words) is generated right on your device using the same industry standard every major Solana wallet uses. It never touches our servers.
- **Your wallet keys** are derived from that recovery phrase, on your device. Same method as Phantom, Solflare, and other popular wallets.
- **To restore your account**, you prove you own the wallet by signing a challenge — your recovery phrase still never leaves your device.
- **Privacy keys** are generated on our server, but they are encrypted specifically for your wallet before being sent to you. Only your wallet can decrypt them — we can't read them in transit.

**During sign-up, we only receive:**

- Your wallet address (this is public — like a bank account number)
- Your chosen username
- We **never** receive your recovery phrase
- We **never** receive your private key

---

## 3. How Your Data Is Protected on Your Device

All sensitive data stored by the extension is encrypted with a strong password-based encryption method before being saved. When you set your password, it's used to lock your data — we never see or store your password. Each time you open Veilo, you enter your password to unlock your wallet locally.

---

## 4. Who We Talk To and Why

Veilo connects to **four external services** to work. Here's every connection, what data is involved, and why we need it.

### Veilo Server (our backend)

This is the Veilo team's own server. It handles account setup, stores your encrypted privacy notes, and processes private transactions.

**Account-related requests:**

| What happens                       | What we send                         | Why                                                                  |
| ---------------------------------- | ------------------------------------ | -------------------------------------------------------------------- |
| Checking if your username is taken | Your chosen username                 | So you can pick a unique name                                        |
| Creating your account              | Your wallet address + username       | To register you and send back your encrypted privacy keys            |
| Restoring your account             | Your wallet address + a signed proof | To verify you own this wallet and return your encrypted privacy keys |
| Looking up another user            | Their username                       | So you can send them a private transfer                              |

**Privacy balance requests:**

| What happens                    | What we send                             | Why                                                                                     |
| ------------------------------- | ---------------------------------------- | --------------------------------------------------------------------------------------- |
| Fetching your encrypted notes   | Your wallet address                      | To calculate your private balance. The notes are encrypted — our server can't read them |
| Saving a new note after deposit | The encrypted note + your wallet address | So the recipient can later find and decrypt it                                          |

**Private transactions:**

| What happens                     | What we send                                                           | Why                                                                                                        |
| -------------------------------- | ---------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Withdrawing from privacy pool    | An encrypted package containing your proof, amount, and destination    | To withdraw funds to a regular Solana address. Our server decrypts this to submit the transaction on-chain |
| Private transfer to another user | An encrypted package containing your proof, amount, and recipient info | To privately send funds to another Veilo user                                                              |

**Other:**

| What happens               | What we send                   | Why                                                 |
| -------------------------- | ------------------------------ | --------------------------------------------------- |
| Fetching privacy pool data | Which network (mainnet/devnet) | To build the proofs needed for private transactions |
| Health check               | Nothing                        | To check if our server is online                    |

**Important note about trust:** For private transactions, our server needs to decrypt your transaction details to submit them on the Solana blockchain. This means our server temporarily sees the transaction contents. However, it never has access to your private key, recovery phrase, or password.

---

### Solana Network (blockchain nodes)

These are standard Solana blockchain connections — the same ones every Solana wallet uses.

| What happens                 | What we send             | Why                                                            |
| ---------------------------- | ------------------------ | -------------------------------------------------------------- |
| Checking your SOL balance    | Your wallet address      | To show how much SOL you have                                  |
| Checking your token balances | Your wallet address      | To show your USDC, USDT, and other token balances              |
| Loading transaction history  | Your wallet address      | To show your recent transactions                               |
| Loading transaction details  | Transaction IDs          | To show details like amounts and dates                         |
| Sending a transaction        | Your signed transaction  | To execute a transfer, deposit, or swap you approved           |
| Confirming a transaction     | Transaction ID           | To verify your transaction went through                        |
| Simulating a transaction     | The unsigned transaction | To show you estimated fees and catch errors before you approve |
| Reading privacy pool state   | Pool account address     | To build proofs for private transactions                       |

---

### Jupiter (token swap service)

Jupiter finds the best swap rates across all Solana exchanges. We use it when you swap one token for another.

| What happens                  | What we send                                                            | Why                                                                                                       |
| ----------------------------- | ----------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| Getting a swap quote          | Which tokens you want to swap, the amount, and your slippage preference | To find the best rate across all Solana exchanges                                                         |
| Building the swap transaction | The quote + your wallet address                                         | To create a ready-to-sign transaction. Your address is needed so the transaction is built for your wallet |

---

### DexScreener (price feed)

| What happens       | What we send                                          | Why                                                                                     |
| ------------------ | ----------------------------------------------------- | --------------------------------------------------------------------------------------- |
| Fetching SOL price | Nothing about you — just asks for the SOL token price | To display your portfolio value in USD. No wallet address or personal data is ever sent |

---

## 5. Browser Permissions

| Permission                     | Why we need it                                                                                                     |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------ |
| Storage                        | To save your encrypted wallet data locally on your device                                                          |
| Access to all websites (host)  | To connect to the Solana network, our server, Jupiter, and DexScreener. Without this, the extension can't function |
| Content script on all websites | To let apps like Raydium, Jupiter, and other Solana apps detect and connect to your Veilo wallet                   |

We do NOT request access to your tabs, browsing history, cookies, location, camera, microphone, or any other sensitive browser data.

---

## 6. What We Will Never Do

- No tracking. We don't use Google Analytics, Mixpanel, Sentry, or any analytics tool.
- No data sales. We never sell, share, or monetize your data.
- No browsing surveillance. We don't monitor what websites you visit.
- No remote code. Everything the extension runs is included at install time. We never download or run code from the internet.
- No keylogging. We only read what you type inside the Veilo popup — never on other websites or tabs.

---

## 7. Connecting to Apps (DApps)

When you connect Veilo to a Solana app (like a DEX or NFT marketplace):

- The app only gets your wallet address — and only after you approve the connection.
- Your private key never leaves the extension. Transactions are signed inside Veilo.
- You have to approve every transaction before it's sent.
- Transactions are simulated first so you can see estimated fees and catch errors before approving.

---

## 8. How Long We Keep Data

- On your device: Your data stays until you uninstall the extension or clear your browser data.
- Session: Cleared when you close the browser or lock the wallet.
- On our server: We store your wallet address, username, and encrypted note blobs. We never store your private key, recovery phrase, or password.

---

## 9. Liability

Veilo is provided "as is" without warranties. We are not liable for any loss of funds, data, or damages from using the extension, third-party services, or unexpected failures.

---

## 10. Contact

Questions? Reach out:

- Twitter: @VeiloWallet
- Email: support@veilo.network
- Website: https://wallet.veilo.network/

---

## 11. Chrome Web Store Compliance

- We follow the Chrome Web Store User Data Policy, including Limited Use requirements.
- We only share your data with third parties when it's essential for the wallet to work (blockchain transactions, token swaps).
- We don't use your data for anything unrelated to the wallet.
- We don't use your data for advertising, credit scoring, or lending.

---

## 12. Changes to This Policy

We may update this policy from time to time. If we make significant changes, we'll let you know through extension update notes or on our website. Continuing to use Veilo after changes means you accept the updated policy.

---

Built with zero-knowledge proofs on Solana
