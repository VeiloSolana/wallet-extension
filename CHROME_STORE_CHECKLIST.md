# Chrome Web Store Submission Checklist

## ✅ Issues Fixed (January 16, 2026)

### 1. Permission Violations - RESOLVED

- ✅ **Removed `scripting` permission** - Was requested but never used
- ✅ **Removed `activeTab` permission** - Not utilizing `chrome.tabs` API
- ✅ **Kept `storage` permission** - Actively used for local wallet data storage
- ✅ **Kept `host_permissions: <all_urls>`** - Justified and necessary for dApp connectivity

### 2. Privacy Policy - ADDED

- ✅ Created comprehensive `PRIVACY_POLICY.md`
- ✅ Updated README with privacy policy link
- ✅ Documented all data collection and usage
- ✅ Explained permission requirements
- ✅ Added third-party service disclosures

## Current Manifest Permissions

```json
{
  "permissions": ["storage"],
  "host_permissions": ["<all_urls>"]
}
```

### Justification for Each Permission:

#### `storage`

**Used in:**

- `/src/background.ts` - Stores connected sites, pending requests, token balances
- `/src/lib/noteManager.ts` - Manages encrypted transaction notes
- `/src/lib/noteSync.ts` - Syncs note state
- `/src/hooks/useSolPrice.ts` - Caches price data
- `/src/App.tsx` - Retrieves pending approval requests

**Purpose:** Securely store encrypted wallet data, transaction notes, user preferences, and cache data locally.

#### `host_permissions: <all_urls>`

**Used in:**

- Content script injection on all pages (standard for Web3 wallets)
- Enables dApp connectivity like MetaMask, Phantom, etc.
- Required for wallet provider to be available on any website

**Purpose:** Allow users to connect their wallet to any decentralized application (dApp) they visit.

## External Services Accessed

1. **relayer-server.onrender.com** - Transaction relay for privacy
2. **api.dexscreener.com** - Cryptocurrency price data
3. **Solana RPC nodes** - Blockchain transactions

All documented in Privacy Policy.

## Code Quality Checks

- ✅ No `eval()` or dynamic code execution
- ✅ No minified/obfuscated code in source
- ✅ All external API calls use `fetch()` (standard)
- ✅ Content Security Policy properly configured
- ✅ No tracking or analytics code
- ✅ Open source repository available

## Chrome Web Store Submission Instructions

### Before Submitting:

1. **Build the extension:**

   ```bash
   cd /Users/admin/Projects/veilo-browser-extension/extension-ui
   npm run build
   ```

2. **Test the build:**

   - Load `dist/` folder as unpacked extension in Chrome
   - Verify all functionality works
   - Check console for errors
   - Test wallet creation, deposits, transfers

3. **Create distribution package:**
   ```bash
   cd dist
   zip -r ../veilo-extension.zip .
   ```

### Submission Form Details:

**Store Listing:**

- **Name:** Veilo - Privacy layer on Solana
- **Description:** Perform private transactions and interactions on the Solana blockchain using zero-knowledge proofs. A non-custodial wallet extension enabling shielded deposits, private transfers, and anonymous withdrawals.

**Privacy Policy URL:**

- Host `PRIVACY_POLICY.md` on GitHub Pages or your website
- Example: `https://veilosolana.github.io/wallet-extension/PRIVACY_POLICY`
- OR: `https://raw.githubusercontent.com/VeiloSolana/wallet-extension/master/extension-ui/PRIVACY_POLICY.md`

**Justification for Permissions (in submission form):**

```
STORAGE PERMISSION:
Veilo requires the 'storage' permission to securely store encrypted wallet data locally on the user's device. This includes:
- Encrypted private keys and seed phrases (encrypted with user's password)
- Transaction notes representing shielded balances
- User preferences and settings
- Connected dApp authorization list

All sensitive data is encrypted and stored locally. We do not have access to users' private keys.

HOST PERMISSIONS (<all_urls>):
Veilo requires broad host permissions to function as a Web3 wallet extension, similar to MetaMask and Phantom. This permission enables:
- Injection of the Veilo wallet provider into web pages
- Communication between decentralized applications (dApps) and the wallet
- Users to connect their wallet to any dApp they visit

This permission does NOT grant us access to view or collect users' browsing data. It only allows the wallet interface to be available when dApps request connection.

For complete transparency, our code is open source: https://github.com/VeiloSolana/wallet-extension
```

**Category:** Productivity

**Language:** English

**Screenshots Required:**

- Upload at least 1-5 screenshots showing:
  1. Wallet main interface
  2. Transaction history
  3. Deposit/withdraw flows
  4. Settings page
  5. dApp connection approval

### If Rejected Again:

1. **Check rejection reason carefully**
2. **Use the appeal form if you believe it's a mistake**
3. **Reference this checklist and privacy policy**
4. **Provide GitHub repository link for code review**

## Post-Submission Monitoring

After approval:

- Monitor user reviews and feedback
- Address any privacy concerns promptly
- Keep privacy policy up to date
- Ensure permissions remain justified and used

## Contact for Support

- **Developer Dashboard:** https://chrome.google.com/webstore/devconsole
- **Policy Help:** https://developer.chrome.com/docs/webstore/program-policies/
- **Support:** chromiumdevrelations@google.com

---

**Version:** 1.0.0  
**Last Review:** January 16, 2026  
**Status:** Ready for resubmission
