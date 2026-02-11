# UI Text & Accuracy Audit — Changelog

**Date:** 11 February 2026  
**Scope:** Full scan of every user-facing page, modal, and layout component in the extension UI.

---

## Summary

Scanned **22 components** across auth, onboarding, wallet, dApp, and common layout directories. Found and fixed **8 issues** in **7 files**. All changes align the in-app text with the updated Privacy Policy, Chrome Web Store listing, and manifest descriptions.

---

## Issues Fixed

### 1. Onboarding Walkthrough — Flagged Phrases Removed

**File:** `src/components/pages/onboarding/OnboardingWalkthrough.tsx`

| Slide | Before                                                                           | After                                                                                                | Reason                                                                                                |
| ----- | -------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| 1     | `"magical privacy."` / `"simple, powerful, and behind the scenes"`               | `"built-in privacy."` / `"simple and powerful"`                                                      | "Magical privacy" and "behind the scenes" were removed from the Chrome listing for sounding secretive |
| 2     | `"We manage your funds across multiple wallets behind the scenes"`               | `"Your funds are managed across multiple wallets automatically"`                                     | Removes "behind the scenes" and shifts from "we" to passive voice                                     |
| 3     | `"Your SOL is pooled with other users' funds to enhance your financial privacy"` | `"Zero-knowledge proofs keep your transactions private without revealing your balances or activity"` | "Pooled with other users' funds" describes a mixing service — regulatory red flag                     |

### 2. Welcome Page — Subtitle Toned Down

**File:** `src/components/pages/auth/WelcomePage.tsx`

| Before                               | After                      | Reason                                                                                               |
| ------------------------------------ | -------------------------- | ---------------------------------------------------------------------------------------------------- |
| `"Your Privacy-First Solana Wallet"` | `"A Secure Solana Wallet"` | Aligns with the manifest description and Chrome listing tagline, which avoid "privacy-first" framing |

### 3. Secret Phrase Page — Terminology Standardized

**File:** `src/components/pages/auth/SecretPhrasePage.tsx`

| Location              | Before                             | After                                |
| --------------------- | ---------------------------------- | ------------------------------------ |
| Page header           | `"Your Secret Phrase"`             | `"Your Recovery Phrase"`             |
| Confirmation checkbox | `"I have saved my secret phrase…"` | `"I have saved my recovery phrase…"` |

**Reason:** Privacy Policy and Chrome listing standardized on "recovery phrase." "Secret phrase" is non-standard and inconsistent.

### 4. Restore Page — "Seed Phrase" → "Recovery Phrase" (×5)

**File:** `src/components/pages/auth/RestoreSeedphrasePage.tsx`

All five instances of "seed phrase" updated to "recovery phrase":

- Page heading
- Input label
- Placeholder text
- Security tip
- Validation error message

### 5. Preferences Page — Label Updated

**File:** `src/components/pages/wallet/PreferencesPage.tsx`

| Before                       | After               |
| ---------------------------- | ------------------- |
| `"Seed Phrase"` button label | `"Recovery Phrase"` |

### 6. Receive Modal — Token-Agnostic Title

**File:** `src/components/features/wallet/modals/ReceiveModal.tsx`

| Before          | After       | Reason                                                                                       |
| --------------- | ----------- | -------------------------------------------------------------------------------------------- |
| `"RECEIVE SOL"` | `"RECEIVE"` | Wallet supports SOL, USDC, USDT, USD1, and VEILO — the title was inaccurately limited to SOL |

### 7. Login Page — Inaccurate Recovery Statement

**File:** `src/components/pages/auth/LoginPage.tsx`

| Before                                  | After                                                        | Reason                                                                                                                                                                                   |
| --------------------------------------- | ------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `"Sorry, there is no recovery option."` | `"Reset your wallet and restore with your recovery phrase."` | The old text was factually wrong — users **can** recover by resetting and restoring with their 12-word recovery phrase. The Reset Wallet button already exists directly below this text. |

---

## Pages Verified Clean (No Issues)

- `CreateUsernamePage.tsx`
- `CreatePasswordPage.tsx`
- `LoginPage.tsx` (aside from fix above)
- `ActivityPage.tsx`
- `TransactionDetailsPage.tsx`
- `WithdrawPage.tsx`
- `TransferPage.tsx`
- `SwapPage.tsx`
- `DAppPage.tsx`
- `DAppApprovalPage.tsx`
- `TransactionApprovalPage.tsx`
- `WalletHeader.tsx`
- `BottomTabs.tsx`
- `BalanceDisplay.tsx`
- `ActionButtons.tsx`
- `DepositModal.tsx`
