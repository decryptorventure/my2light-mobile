# Critical Security Findings - Action Required

## Priority 1: Fix IMMEDIATELY (Production Blocker)

### 1. Hardcoded MMKV Encryption Key
**File:** `src/lib/storage.ts:10`
- Encryption key `'my2light-encryption-key'` is hardcoded
- Anyone with source code can decrypt all stored data
- **Action:** Use device-specific key derivation
```typescript
import { getUniqueId } from 'react-native-device-info';
const encryptionKey = Buffer.from(getUniqueId()).toString('hex').slice(0, 32);
```

### 2. Security Utilities Never Called
**File:** `lib/security.ts` - Exists but unused
- Environmental audit tools built but never invoked
- No protection against credential leakage
- **Action:** Initialize at app startup in root layout/entry
```typescript
import { validateClientEnv } from '@/lib/security';
useEffect(() => {
    if (!__DEV__) validateClientEnv();
}, []);
```

### 3. Missing RLS Policies on Core Tables
**Database:** profiles, highlights, bookings tables
- Without RLS, anon key could theoretically access all user data
- **Action:** Run migrations in Supabase SQL Editor (example in security audit report)

---

## Priority 2: Fix Before Production Release

### 4. Weak Input Validation
- Email regex too permissive (matches `a@b.c`)
- Password minimum 6 chars (recommend 12+)
- No XSS sanitization
- No brute-force protection
- **Action:** Implement RFC 5322 validation + rate limiting

### 5. Session Token Management
- Tokens persisted without explicit expiry checks
- No automatic cleanup on logout
- **Action:** Clear auth-storage explicitly + check token.expires_at

### 6. No Error Masking
- Stack traces may expose internals, user IDs
- Sensitive data logged unmasked
- **Action:** Use `maskSensitiveData()` in error handlers

### 7. Weak Offline Queue ID Generation
**File:** `src/lib/network.ts:48`
- Uses `Date.now() + Math.random()` - collision possible
- **Action:** Use `uuid v4` for cryptographic randomness

---

## Compliance Status: OWASP Mobile Top 10

| Category | Status | Notes |
|----------|--------|-------|
| M1: Credential Usage | ❌ FAIL | Hardcoded MMKV key |
| M2: Data Storage | ❌ FAIL | Encryption defeated by hardcoding |
| M3: Authentication | ⚠️ PARTIAL | Missing token expiry, no audit logging |
| M4: Input Validation | ⚠️ PARTIAL | Weak regex, no sanitization |
| M5: Communication | ✅ PASS | HTTPS + JWT Bearer |
| M6: Supply Chain | ✅ PASS | Dependencies OK |
| M7: Client Injection | ✅ PASS | React Native safe |
| M8: Auth Flow | ⚠️ PARTIAL | No MFA, weak session |
| M9: Reverse Engineering | ❌ FAIL | Hardcoded keys visible |
| M10: Extraneous Code | ✅ PASS | Clean |

**Score: 5/10 - DO NOT RELEASE TO APP STORE**

---

## Full Details

See: `/plans/reports/code-reviewer-251230-1621-auth-security-audit.md`

## Remediation Timeline

- **Day 1:** Fix hardcoded MMKV key + activate security utils
- **Day 2:** Implement RLS policies + input validation
- **Day 3-4:** Error masking + token management + audit logging
- **Testing:** Full auth flow end-to-end

**Estimated: 4-6 developer days**

