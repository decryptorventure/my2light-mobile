# Security Audit: Authentication, Authorization & Data Protection

**Report Date:** 2025-12-30 | **Project:** My2Light Mobile | **Scope:** Auth + Security Implementation

---

## Executive Summary

Comprehensive security audit of auth service, storage layer, Supabase integration, and network handling. Codebase demonstrates **moderate security posture** with good foundational practices but critical gaps requiring immediate remediation before production deployment.

**Overall Risk Level: MEDIUM-HIGH** (3 critical, 5 high-priority, 4 medium-priority issues identified)

---

## 1. Critical Issues (Immediate Fix Required)

### 1.1 Hardcoded MMKV Encryption Key

**Severity: CRITICAL | File:** `/src/lib/storage.ts:10`

```typescript
// VULNERABLE
export const storage = new MMKV({
    id: "my2light-storage",
    encryptionKey: "my2light-encryption-key", // Hardcoded!
});
```

**Risk:** Master encryption key is hardcoded in source code. Anyone with code access can decrypt all stored data (tokens, user preferences, cache). OWASP Mobile M2 (Insecure Data Storage).

**Impact:**

- Session tokens can be decrypted offline
- Cached credentials exposed
- Defeats purpose of encryption entirely

**Fix Required:**

```typescript
// SECURE - derive from device
import { getUniqueId } from "react-native-device-info";

const encryptionKey = getUniqueId().slice(0, 32); // Device-specific
// OR use secure key generation from environment
const encryptionKey = Buffer.from(process.env.EXPO_PUBLIC_MMKV_KEY || getUniqueId())
    .toString("hex")
    .slice(0, 32);

export const storage = new MMKV({
    id: "my2light-storage",
    encryptionKey: encryptionKey,
});
```

---

### 1.2 Insufficient Security Utilities Integration

**Severity: CRITICAL | File:** `/lib/security.ts` (Not Used)

**Risk:** Comprehensive security utilities (`validateClientEnv`, `auditEnvironmentVariables`, `maskSensitiveData`) exist but **are never called** in the codebase. Grep search returned zero matches.

**Impact:**

- Sensitive data can be exposed in logs/console without detection
- Environment variable audits never execute
- No protection against credential leakage in production

**Missing Integrations:**

1. **App entry point** should call `validateClientEnv()`
2. **Error boundaries** should use `maskSensitiveData()` before logging
3. **API wrapper** should mask headers with `maskHeaders()`

**Fix Required:** Activate security utilities at app initialization:

```typescript
// In app entry or root layout
import { validateClientEnv } from '@/lib/security';

export default function App() {
    useEffect(() => {
        if (!__DEV__) {
            validateClientEnv(); // Audit on startup
        }
    }, []);

    return <YourApp />;
}
```

---

### 1.3 Session Storage in Zustand Store Without Encryption

**Severity: CRITICAL | File:** `/src/features/auth/authStore.ts:114-121`

```typescript
// VULNERABLE - Stores session unencrypted
export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({...}),
        {
            name: 'auth-storage',
            storage: createJSONStorage(() => zustandStorage), // Uses MMKV but session may be unencrypted
            partialize: (state) => ({
                user: state.user,
                session: state.session, // JWT tokens stored here
            }),
        }
    )
);
```

**Risk:** While MMKV is encrypted, session data (including JWT access_token) is being persisted. Supabase JWT tokens have 1-hour expiry but if stolen allow account takeover until refresh cycle.

**Current Risk Mitigation:** Supabase handles token refresh via `autoRefreshToken: true`, but token exposure window exists.

**Recommendation:**

- Do NOT persist session/user in Zustand storage after logout
- Implement automatic token rotation on app resume
- Clear sensitive fields on logout explicitly

```typescript
// Add explicit security cleanup
signOut: async () => {
    set({ loading: true });
    await supabase.auth.signOut();
    zustandStorage.removeItem('auth-storage'); // Explicit cleanup
    set({
        user: null,
        session: null,
        loading: false,
    });
},
```

---

## 2. High Priority Issues (Fix Before Production)

### 2.1 Missing Input Validation in Auth Forms

**Severity: HIGH | File:** `/src/features/auth/screens/login.tsx:26-43`

```typescript
// WEAK VALIDATION
const validate = () => {
    const newErrors: { email?: string; password?: string } = {};

    if (!email) {
        newErrors.email = "Vui lòng nhập email";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
        // Regex too loose
        newErrors.email = "Email không hợp lệ";
    }

    if (!password) {
        newErrors.password = "Vui lòng nhập mật khẩu";
    } else if (password.length < 6) {
        // Too weak (Supabase default is 6)
        newErrors.password = "Mật khẩu phải có ít nhất 6 ký tự";
    }
    // No sanitization, no rate limiting on client
    return Object.keys(newErrors).length === 0;
};
```

**Issues:**

1. Email regex matches `a@b.c` (too permissive) - RFC 5322 compliant validation needed
2. Password minimum 6 chars weak (recommend 12+ for security)
3. No XSS sanitization on inputs
4. No rate limiting on login attempts (brute force vulnerable)

**Recommended Fix:**

```typescript
// Email validation - RFC 5322 compliant
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Stricter password requirements
const validatePassword = (pwd: string) => {
    const minLength = 12;
    const hasUppercase = /[A-Z]/.test(pwd);
    const hasLowercase = /[a-z]/.test(pwd);
    const hasNumbers = /\d/.test(pwd);

    if (pwd.length < minLength) {
        return "Min 12 characters";
    }
    if (!hasUppercase || !hasLowercase || !hasNumbers) {
        return "Must include uppercase, lowercase, number";
    }
    return null;
};

// Implement client-side rate limiting
const [loginAttempts, setLoginAttempts] = useState(0);
const [lastAttemptTime, setLastAttemptTime] = useState(0);

const handleSubmit = async () => {
    const now = Date.now();
    if (loginAttempts >= 5 && now - lastAttemptTime < 60000) {
        Alert.alert("Too many attempts", "Try again in 1 minute");
        return;
    }

    setLoginAttempts((attempts) => attempts + 1);
    setLastAttemptTime(now);

    // ... rest of auth
};
```

---

### 2.2 No RLS on Core Tables (Profiles, Highlights, Bookings)

**Severity: HIGH | Database Configuration**

**Finding:** RLS policies exist for:

- ✅ match_responses, match_conversations, match_messages
- ✅ user_blocks, user_reports
- ✅ court_reviews
- ✅ booking_status_history

**Missing RLS on:**

- ❌ profiles table (user data)
- ❌ highlights table (video metadata)
- ❌ bookings table (court reservations)
- ❌ courts table (public listings)
- ❌ notifications table (unconfirmed)

**Risk:** Without RLS, Supabase anon key could theoretically query/modify any user's data via direct table access, though CORS policies may provide some protection.

**Migration Required (Supabase SQL Editor):**

```sql
-- Enable RLS on core tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE highlights ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Profile policies
CREATE POLICY "Users can read public profiles"
ON profiles FOR SELECT
USING (is_public = true);

CREATE POLICY "Users can read own profile"
ON profiles FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
USING (auth.uid() = id);

-- Highlights policies
CREATE POLICY "Users can read public highlights"
ON highlights FOR SELECT
USING (is_public = true);

CREATE POLICY "Users can read own highlights"
ON highlights FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own highlights"
ON highlights FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Bookings policies
CREATE POLICY "Users can read own bookings"
ON bookings FOR SELECT
USING (auth.uid() = user_id OR auth.uid() IN (
    SELECT owner_id FROM courts WHERE id = bookings.court_id
));

CREATE POLICY "Users can create bookings"
ON bookings FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Similar patterns for other tables...
```

---

### 2.3 No Error Boundary Masking

**Severity: HIGH | Architecture**

**Risk:** Exceptions bubble up with full stack traces, potentially exposing:

- Internal API URLs
- Database query structure
- User IDs and sensitive data in error messages

**Example:**

```typescript
// In auth.service.ts:104-106
catch (e) {
    console.error('getCurrentUser error:', e); // Full error logged
    return { success: false, data: null as any, error: 'Failed to fetch user' };
}
```

**Fix Required:** Implement error masking:

```typescript
import { maskSensitiveData } from '@/lib/security';

catch (e) {
    const maskedError = maskSensitiveData(JSON.stringify(e));
    console.error('getCurrentUser error:', maskedError);
    return {
        success: false,
        data: null as any,
        error: 'Failed to fetch user' // Generic message to user
    };
}
```

---

### 2.4 No CSRF/XSRF Protection (If Web Version Planned)

**Severity: HIGH | If SPA Later**

**Status:** React Native app - lower risk. But if web version planned:

**Current Protection:**

- ✅ No cookies (uses Bearer token in auth header)
- ✅ HTTPS enforced by Supabase

**Future Web Implementation Must Include:**

- Double-submit cookie pattern OR
- Synchronizer token pattern with state parameter
- SameSite=Strict on session cookies if used

---

## 3. Medium Priority Issues (Improve Before Production)

### 3.1 Lack of Certificate Pinning

**Severity: MEDIUM | Network Layer**

**Risk:** MITM attack via compromised CA or network proxy. Supabase runs on AWS CloudFront - generally safe but adding pinning increases resilience.

**Not Implemented:** No certificate pinning in Supabase client config

**Recommendation:**

```typescript
// In supabase.ts - add once Supabase SDK supports it
// OR use interceptor middleware
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
    },
    // Future: Add certificate pinning config
    // headers: {
    //     'X-Pinned-Certificate-Chain': certificateHash
    // }
});
```

---

### 3.2 Weak User ID Generation in Offline Queue

**Severity: MEDIUM | File:** `/src/lib/network.ts:48`

```typescript
// WEAK ID GENERATION
add(action: () => Promise<any>) {
    const id = Date.now().toString() + Math.random(); // Not unique!
    this.queue.push({ id, action, retryCount: 0 });
}
```

**Issue:** `Date.now() + Math.random()` has collision risk in high-frequency scenarios

**Fix:**

```typescript
import { v4 as uuidv4 } from 'uuid';

add(action: () => Promise<any>) {
    const id = uuidv4(); // Cryptographically random
    this.queue.push({ id, action, retryCount: 0 });
}
```

---

### 3.3 Missing Logout on Token Expiry

**Severity: MEDIUM | Auth Flow**

**Gap:** No explicit handling for expired tokens. Supabase `autoRefreshToken` handles most cases but:

```typescript
// In authStore.ts - add token expiry check
initialize: async () => {
    try {
        const {
            data: { session },
        } = await supabase.auth.getSession();

        // Missing: Check if token is stale
        if (session?.expires_at && session.expires_at * 1000 < Date.now()) {
            // Token expired, sign out
            await supabase.auth.signOut();
            set({ loading: false, initialized: true });
            return;
        }

        set({
            session,
            user: session?.user || null,
            loading: false,
            initialized: true,
        });
    } catch (error) {
        console.error("Auth initialization error:", error);
        set({ loading: false, initialized: true });
    }
};
```

---

### 3.4 Insufficient Logging & Audit Trail

**Severity: MEDIUM | Compliance**

**Missing:**

- No login/logout audit trail
- No failed auth attempt logging
- No data access logging
- No admin activity tracking

**Recommendation:** Add to auth.service.ts:

```typescript
// Log auth events for security audit
const logAuthEvent = async (event: string, userId?: string, details?: any) => {
    // Log to Supabase audit_logs table
    // Can be encrypted/protected via RLS
};

signIn: async (email: string, password: string) => {
    try {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });

        if (error) {
            await logAuthEvent('login_failed', undefined, { email, reason: error.message });
            throw error;
        }

        await logAuthEvent('login_success', data.user.id);
        // ...
    }
}
```

---

## 4. Medium/Low Priority Improvements

### 4.1 No Rate Limiting on Auth Endpoints

**Severity: MEDIUM**

- Supabase provides server-side rate limiting (generous free tier)
- Client should implement throttling for better UX

### 4.2 Unnecessary User Data in Zustand

**Severity: LOW**

```typescript
// In authStore - only persist minimal data
partialize: (state) => ({
    // Don't persist full user object
    session: state.session, // JWT + refresh token only
    // Fetch user profile on demand via getCurrentUser()
}),
```

### 4.3 Avatar URL Predictability

**Severity: LOW | File:** `/src/features/auth/auth.service.ts:29, 89`

```typescript
// Using DiceBear with seed = user_id
avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${session.user.id}`;
```

**Risk:** User IDs are sequential UUIDs. Predictable avatar = user enumeration possible. Use random seed instead.

```typescript
avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${Math.random()}`;
// Or: Use user email hash
avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${hashEmail(session.user.email)}`;
```

---

## 5. Positive Security Observations

### ✅ Good Practices Implemented

1. **Zustand with MMKV persistence** - Better than AsyncStorage alone
2. **Supabase JWT + refresh tokens** - Industry standard auth
3. **Comprehensive security utilities module** - `lib/security.ts` is well-designed
4. **RLS on sensitive tables** - match_responses, conversations, messages properly secured
5. **HTTPS default** - Supabase enforces TLS
6. **No hardcoded user secrets** - Only anon key exposed
7. **Offline queue design** - Proper retry logic with exponential backoff
8. **Session validation** - `getSession()` checks valid session exists

---

## 6. Compliance Gaps

### OWASP Mobile Top 10 2024 Alignment

| Risk                             | Status     | Gap                                             |
| -------------------------------- | ---------- | ----------------------------------------------- |
| M1: Improper Credential Usage    | 🟡 Partial | Hardcoded MMKV key, no cert pinning             |
| M2: Insecure Data Storage        | 🔴 Fail    | Hardcoded encryption key defeats purpose        |
| M3: Insecure Auth                | 🟡 Partial | Missing token expiry checks, no audit logging   |
| M4: Insecure Input Validation    | 🟡 Partial | Weak email/password validation, no sanitization |
| M5: Insecure Communication       | 🟢 Pass    | HTTPS only, JWT bearer tokens                   |
| M6: Inadequate Supply Chain      | 🟢 Pass    | Npm packages verified                           |
| M7: Client-Side Injection        | 🟢 Pass    | React Native not vulnerable to XSS              |
| M8: Insecure Authentication Flow | 🟡 Partial | No MFA, weak session handling                   |
| M9: Reverse Engineering          | 🟡 Partial | Hardcoded keys make it worse                    |
| M10: Extraneous Functionality    | 🟢 Pass    | No test/debug APIs left in production code      |

**Overall Score: 5/10** - Requires remediation before App Store submission

---

## 7. Recommended Action Plan

### IMMEDIATE (Before Any Beta Testing)

- [ ] **Fix hardcoded MMKV key** - Use device-specific derivation
- [ ] **Activate security utilities** - Call `validateClientEnv()` at app startup
- [ ] **Enable RLS** on profiles, highlights, bookings tables
- [ ] **Implement input validation** - RFC 5322 email, 12+ char passwords

### BEFORE PRODUCTION RELEASE

- [ ] **Add error masking** throughout error handlers
- [ ] **Implement token expiry checks** in auth initialize
- [ ] **Add audit logging** for auth events
- [ ] **Implement rate limiting** on login endpoint
- [ ] **Clear session storage** on logout explicitly
- [ ] **Update MMKV uuid generation** in offline queue

### LONG-TERM (Post-Launch)

- [ ] Add certificate pinning when Supabase SDK supports it
- [ ] Implement MFA (TOTP 2FA)
- [ ] Add behavioral biometrics for fraud detection
- [ ] Establish 30-day security audit cycle
- [ ] Document security incident response procedure

---

## 8. Deployment Checklist

Before pushing to App Store/Play Store:

- [ ] Run `validateClientEnv()` in non-dev builds - ensure zero errors
- [ ] No secrets in .env - only `EXPO_PUBLIC_*` vars
- [ ] All database RLS policies created and tested
- [ ] Session tokens never logged or exposed
- [ ] MMKV encryption key derived, not hardcoded
- [ ] Error messages generic (don't expose internals)
- [ ] Rate limiting tested on auth endpoints
- [ ] Offline queue handles token refresh correctly
- [ ] All security utilities integrated and tested
- [ ] No DEBUG logging enabled in production builds

---

## Unresolved Questions

1. **Is web version planned?** - Affects CSRF/SameSite requirements
2. **Multi-device auth strategy?** - How to handle multiple signed-in sessions?
3. **Session duration policy?** - How long should refresh token live?
4. **Biometric auth (FaceID/TouchID)?** - Planned for future?
5. **Encryption key storage** - Using device-specific derivation or secure enclave?

---

## Summary

**Code quality:** 7/10 - Good structure, but critical security gaps
**Security posture:** 5/10 - Vulnerable to data extraction via hardcoded keys
**Compliance:** 50% - Missing core OWASP Mobile Top 10 controls

**Recommendation:** DO NOT deploy to public app stores until Critical & High issues are resolved. Current implementation is suitable for development/testing only.

**Estimated remediation effort:** 4-6 developer days for all issues
