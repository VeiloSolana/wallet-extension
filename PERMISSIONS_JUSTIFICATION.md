# Permission Justification - Veilo Wallet

## Single-Purpose Extension Statement

**Veilo has ONE clear purpose:** To provide a non-custodial, secure cryptocurrency wallet for the Solana blockchain.

All requested permissions directly support this core functionality.

---

## Detailed Permission Justification

### 1. `storage` Permission

**Purpose:** Store encrypted wallet data locally on the user's device.

**What We Store:**

- User's encrypted private keys (encrypted with user's password using AES-256)
- User's encrypted seed phrase (encrypted with user's password using AES-256)
- Local transaction history
- User preferences (currency display, network selection)
- Username and public address (for easy transfers)

**Security:**

- ALL sensitive data is encrypted using AES-256 before storage
- Encryption key derived from user's password (never stored)
- Data stored using `chrome.storage.local` (never synced to cloud)
- We have ZERO access to this data on our servers
- Data deleted when extension is uninstalled

**Why This is Minimal/Necessary:**

- Required for non-custodial wallet functionality
- Without this, users would lose access to their funds on browser restart
- Standard practice for ALL cryptocurrency wallets

---

### 2. `host_permissions: ["<all_urls>"]` Permission

**Purpose:** Enable Web3 wallet functionality by injecting a wallet provider into websites.

**Technical Explanation:**
When a user visits a decentralized application (dApp) like Raydium, Jupiter, or Magic Eden, the dApp needs to detect if a Solana wallet is available. Veilo provides this by:

1. **Injecting a Wallet Provider:** A small JavaScript object implementing the [Wallet Standard API](https://github.com/wallet-standard/wallet-standard)
2. **Registering the Wallet:** Makes Veilo visible to dApps via `window.veilo` and `window.solana`
3. **Responding to Connection Requests:** ONLY when user clicks "Connect Wallet" on the dApp

**What We Actually Access:**

- We inject ~100KB of JavaScript code implementing the Wallet Standard
- We listen for wallet connection events initiated by dApps
- We display a popup asking for user approval when connection is requested

**What We DO NOT Access:**

- ❌ Page content (articles, forms, user input)
- ❌ Cookies or session data
- ❌ Passwords or personal information
- ❌ Navigation history
- ❌ Data from websites the user visits
- ❌ We do NOT send any website data to our servers

**Code References:**

- `src/content.ts` - Content script that bridges extension and page
- `src/injected.ts` - Injected provider implementing Wallet Standard
- The injected code is < 100 lines and only implements wallet connection APIs

**Why `<all_urls>` is Required:**

- dApps can exist on ANY domain (not just a predefined list)
- Users expect their wallet to work on ALL Web3 websites
- This is identical to how MetaMask, Phantom, and ALL other Web3 wallets work
- Without this, the wallet would be unusable for its primary purpose

**User Control:**

- Users must explicitly click "Connect" on EACH website
- Users can view and disconnect from connected sites at any time
- No automatic connections - user approval required every time
- Popup displays domain requesting connection for user verification

**Industry Standard:**
Every major Web3 wallet uses this same permission model:

- **MetaMask:** `<all_urls>`
- **Phantom:** `<all_urls>`
- **Coinbase Wallet:** `<all_urls>`
- **Backpack:** `<all_urls>`
- **Solflare:** `<all_urls>`

---

### 3. Content Scripts (`"matches": ["<all_urls>"]`)

**Purpose:** Inject the wallet provider early so dApps can detect it.

**Technical Details:**

- **Run At:** `document_start` (before page loads)
- **Why:** dApps check for wallet providers during page load
- **Size:** ~5KB bridging script
- **Behavior:** Only sets up message passing between page and extension

**What It Does:**

```javascript
// Simplified version of content.ts
1. Inject wallet provider script into page
2. Listen for wallet events from page
3. Forward to background script
4. Return responses back to page
```

**What It Does NOT Do:**

- ❌ Does NOT read page HTML/DOM
- ❌ Does NOT access form inputs
- ❌ Does NOT track user behavior
- ❌ Does NOT collect any data from websites

**Security:**

- Content script runs in isolated context (cannot access extension storage)
- Uses `chrome.runtime.sendMessage` for secure communication
- No direct access to private keys or sensitive data

---

### 4. Web Accessible Resources

**Declaration:**

```json
"web_accessible_resources": [{
  "resources": ["injected.js"],
  "matches": ["<all_urls>"]
}]
```

**Purpose:** Allow content script to inject the wallet provider into the page context.

**Why Necessary:**

- The Wallet Standard API must run in the page's JavaScript context
- dApps access it via `window.solana` or wallet detection libraries
- Cannot work from extension's isolated context

**Security:**

- Only `injected.js` is accessible (not other extension files)
- File is read-only to web pages
- Does not expose sensitive data or APIs

---

## Data Flow Diagram

```
┌─────────────┐
│   User      │
│   Action    │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────────────┐
│  Extension Popup (index.html)               │
│  - User clicks "Send" or "Connect to dApp"  │
└──────┬──────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────┐
│  Background Service Worker (background.ts)  │
│  - Manages wallet state                     │
│  - Handles user approvals                   │
└──────┬──────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────┐
│  Content Script (content.ts)                │
│  - Forwards messages between page/extension │
│  - NO access to private keys                │
└──────┬──────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────┐
│  Injected Provider (injected.ts)            │
│  - Implements Wallet Standard               │
│  - Exposes window.solana API                │
│  - Requests user approval for actions       │
└──────┬──────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────┐
│  dApp Website (e.g., Raydium.io)           │
│  - Detects wallet                           │
│  - Requests connection/transactions         │
└─────────────────────────────────────────────┘
```

**Key Points:**

1. Private keys NEVER leave the extension's secure storage
2. Content script CANNOT access private keys or storage
3. Injected script CANNOT access private keys
4. ALL actions require explicit user approval via popup
5. NO data from websites is collected or transmitted

---

## Compliance with Chrome Web Store Policies

### ✅ Single Purpose

**Policy:** Extensions must have a single, clear purpose.

**Veilo's Purpose:** Non-custodial Solana wallet with privacy features.

**Compliance:** All permissions directly support this one purpose.

---

### ✅ User Data Privacy

**Policy:** Extensions must be transparent about data collection.

**Compliance:**

- ✅ Comprehensive Privacy Policy included
- ✅ No data collection from websites
- ✅ Local-only encrypted storage
- ✅ Clear disclosure in store listing
- ✅ Non-custodial (we cannot access user data)

---

### ✅ Permission Warnings

**Policy:** Extensions must justify broad permissions.

**Compliance:**

- ✅ Detailed justification in Privacy Policy
- ✅ Explanation in store listing
- ✅ User-facing tooltips explaining why permissions are needed
- ✅ Comparison to approved wallets (MetaMask, Phantom)

---

### ✅ Code Readability

**Policy:** Code must be readable, not obfuscated.

**Compliance:**

- ✅ All code open source on GitHub
- ✅ No code obfuscation
- ✅ Standard bundling with Vite (source maps available)
- ✅ Dependencies are popular, vetted libraries

---

### ✅ No Surprises

**Policy:** Extensions should do what users expect.

**Compliance:**

- ✅ Clear description: "Cryptocurrency wallet"
- ✅ Expected behavior: Connect to dApps, sign transactions
- ✅ User approval required for ALL actions
- ✅ No hidden features or data collection

---

### ✅ Security

**Policy:** Extensions must not compromise user security.

**Compliance:**

- ✅ Industry-standard encryption (AES-256)
- ✅ No exposure of private keys
- ✅ Secure communication channels
- ✅ Content Security Policy in manifest
- ✅ Regular security audits (open source)

---

## Remote Code Compliance

### ✅ No Remote Code Execution

**Policy:** Extensions must not download or execute remote code.

**Compliance:**

- ✅ All JavaScript/TypeScript is bundled and included in the extension package
- ✅ No dynamic code loading via `eval()`, `new Function()`, or similar
- ✅ No external `.js` files downloaded at runtime
- ✅ No remotely-hosted WebAssembly modules

**Relayer Service Clarification:**

Veilo communicates with a backend relay service ("Veilo Layer") to process privacy-preserving transactions. This is **NOT remote code** because:

1. **Remote Data, Not Remote Code:** The relayer is an API service — we send requests and receive data responses
2. **Server-Side Execution:** The relayer's code runs on our server, not in the extension
3. **Bundled Processing:** The extension uses its own bundled code to process API responses
4. **Standard API Pattern:** This is identical to how all Web3 wallets interact with RPC nodes and backend services

**What the Relayer Does:**

- Receives transaction requests from the extension
- Processes and submits transactions to the Solana blockchain
- Returns transaction status and data back to the extension

**What the Relayer Does NOT Do:**

- ❌ Does NOT send executable JavaScript to the extension
- ❌ Does NOT provide code that gets evaluated or executed
- ❌ Does NOT modify extension behavior at runtime

This pattern is standard across the Web3 ecosystem and is used by MetaMask (Infura), Phantom, and all major wallet extensions.

---

## Comparison to Approved Extensions

| Extension           | host_permissions | Purpose                | Status       |
| ------------------- | ---------------- | ---------------------- | ------------ |
| **MetaMask**        | `<all_urls>`     | Ethereum wallet        | ✅ Approved  |
| **Phantom**         | `<all_urls>`     | Solana/Ethereum wallet | ✅ Approved  |
| **Coinbase Wallet** | `<all_urls>`     | Multi-chain wallet     | ✅ Approved  |
| **Backpack**        | `<all_urls>`     | Solana wallet          | ✅ Approved  |
| **Veilo**           | `<all_urls>`     | Solana privacy wallet  | ❌ Suspended |

**All of these extensions use IDENTICAL permission models for the same reason: Web3 wallet functionality requires injecting a provider into websites.**

---

## What Would Break Without These Permissions

### Without `<all_urls>`:

- ❌ Cannot inject wallet provider
- ❌ dApps cannot detect Veilo
- ❌ Users cannot connect to any dApps
- ❌ Extension becomes completely useless
- ❌ 90% of wallet functionality lost

### Without `storage`:

- ❌ Cannot save encrypted keys
- ❌ Users lose funds on browser restart
- ❌ No transaction history
- ❌ Wallet becomes completely unusable

---

## Conclusion

Veilo's permission requests are:

1. **Necessary** for core wallet functionality
2. **Minimal** (only 2 permissions requested)
3. **Industry standard** (identical to approved wallets)
4. **Transparent** (fully documented and disclosed)
5. **Secure** (no data collection, local encryption)

We are fully committed to user privacy and security, and we have comprehensive documentation to prove it.

---

## Contact for Questions

If you have any questions about our permission usage or need clarification on any technical details, please contact:

**Email:** ezetdaniel@gmail.com  
**GitHub:** https://github.com/VeiloSolana/wallet-extension  
**Documentation:** https://docs.veilo.network
