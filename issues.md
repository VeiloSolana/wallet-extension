CRITICAL Vulnerabilities (Fix Immediately)

1. XOR "Encryption" for Sensitive Data  


Location: src/utils/storage.ts:141-194,  
 src/lib/noteManager.ts:40-67

Both session passwords and notes use XOR obfuscation  
 instead of real encryption:  
 encrypted[i] = noteArray[i] ^ keyArray[i %
 keyArray.length]; // XOR is NOT encryption

- XOR with a repeating key is cryptographically broken
- No IV = deterministic, allows pattern analysis
- No authentication = undetectable tampering  


Fix: Use AES-256-GCM with random IVs (like your password
encryption in encryption.ts)

---

2. Wildcard Origin in postMessage  


Location: src/content.ts:82, 93, 102

window.postMessage(responseMessage, "\*"); // Broadcasts  
 to ALL frames

This allows malicious iframes to intercept wallet  
 responses:  
 // Attacker's iframe on ANY website can receive your  
 messages  
 window.addEventListener("message", (e) => {  
 if (e.data.source === "veilo-content")  
 console.log("Stolen:", e.data);  
 });

Fix: Use specific targetOrigin instead of "\*", validate  
 message sources

---

3. Hardcoded Relayer Public Key  


Location: src/lib/relayerApi.ts:7

const RELAYER_PUBLIC_KEY =  
 "utVxnA7zax09qJCZ7UJsa8PAOoWLRcCwOkdxg/ZGmD4=";

- Cannot be rotated without code update
- If compromised, no recovery path
- No certificate pinning  


Fix: Implement dynamic key distribution with certificate
pinning

---

4. API Key in Version Control  


Location: .env

VITE_JUPITER_API_KEY=d5e09c55-8adb-4208-a5b0-2ac7ffe0a455
This key is in your git history.

---

HIGH Severity Issues  
 Issue: No message param validation  
 Location: background.ts  
 Risk: Injection attacks via Record<string, unknown>  
 ────────────────────────────────────────  
 Issue: Weak origin validation  
 Location: background.ts:70  
 Risk: Origin extracted from sender.tab.url can be  
 manipulated  
 ────────────────────────────────────────  
 Issue: Plaintext keys in React state  
 Location: App.tsx  
 Risk: Memory dump can extract private keys  
 ────────────────────────────────────────  
 Issue: 10-minute session timeout  
 Location: storage.ts:83  
 Risk: Long window for session hijacking  
 ────────────────────────────────────────  
 Issue: Suspicious Ed25519→X25519 padding  
 Location: ECDH/helpers.ts:50-52  
 Risk: Padding with zeros is non-standard

---

Medium Severity Issues

- CSP too permissive - 'wasm-unsafe-eval' needed but no  
  other restrictions
- No transaction validation before signing - wallet.ts  
  signs anything passed to it
- Public RPC metadata leakage - Transaction simulation  
  exposes patterns
- No hardware wallet support - Keys always in browser  
  memory  


---

Threat Scenarios

1. Malicious dApp with hidden iframe → Intercepts wallet
   responses via wildcard postMessage
2. Browser storage compromise → XOR-encrypted notes  
   trivially recoverable
3. Session hijacking → XOR password obfuscation reversed
   in milliseconds
4. Relayer compromise → Hardcoded key means no way to  
   switch  


---

Recommended Priority Order

1. Replace XOR with AES-GCM for notes and session data
2. Fix postMessage to use specific origins
3. Add strict type validation for all message params
4. Remove .env from git, regenerate API key
5. Implement dynamic relayer key distribution
6. Add memory zeroing for decrypted keys on unmount
7. Shorten session timeout to 2-5 minutes  


Overall Security Score: 5.5/10 - Critical issues must be
addressed before production use with real funds.
