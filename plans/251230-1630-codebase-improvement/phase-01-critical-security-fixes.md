# Phase 1: Critical Security Fixes

**Priority:** BLOCKER | **Status:** pending | **Effort:** 6h | **Date:** 2025-12-30

[← Back to Plan](plan.md)

---

## Context

Security audit revealed 3 CRITICAL and 5 HIGH priority vulnerabilities that MUST be fixed before any beta testing or production deployment. Current security posture: 5/10 (OWASP Mobile Top 10 compliance 50%).

**Source:** [Security Audit Report](../../reports/code-reviewer-251230-1621-auth-security-audit.md)

---

## Key Insights

### Critical Findings
1. **Hardcoded MMKV Encryption Key** - Defeats entire encryption purpose
2. **Unused Security Utilities** - Comprehensive utilities exist but never called
3. **Missing RLS Policies** - Core tables (profiles, highlights, bookings) unprotected
4. **Weak Input Validation** - Email regex too permissive, password min 6 chars

### Impact
- **Data Breach Risk:** Hardcoded key allows offline decryption of all stored data
- **Compliance:** OWASP M2 violation (Insecure Data Storage)
- **Auth Bypass:** Missing RLS allows anon key to query any user's data
- **Brute Force:** No rate limiting, weak password requirements

---

## Requirements

### Must Fix (BLOCKER)
- [ ] Replace hardcoded MMKV encryption key with device-derived key
- [ ] Enable RLS on profiles, highlights, bookings tables
- [ ] Implement RFC 5322 email validation
- [ ] Add password strength requirements (12+ chars, complexity)
- [ ] Activate security utilities at app initialization
- [ ] Add error masking using existing security module

### Should Fix (HIGH)
- [ ] Implement client-side rate limiting on login
- [ ] Add logout on token expiry detection
- [ ] Add auth event audit logging
- [ ] Clear session storage explicitly on logout

---

## Architecture Considerations

### MMKV Encryption Strategy
**Current (VULNERABLE):**
```typescript
// src/lib/storage.ts:10
export const storage = new MMKV({
    id: 'my2light-storage',
    encryptionKey: 'my2light-encryption-key', // ❌ HARDCODED
});
```

**Solution (SECURE):**
```typescript
import { MMKV } from 'react-native-mmkv';

let storage: MMKV | null = null;

const getEncryptionKey = (): string => {
    // Option 1: Environment variable
    if (process.env.EXPO_PUBLIC_ENCRYPTION_KEY) {
        return process.env.EXPO_PUBLIC_ENCRYPTION_KEY;
    }

    // Option 2: Device-specific derivation
    // Note: Requires react-native-device-info
    // const deviceId = getUniqueId();
    // return Buffer.from(deviceId).toString('hex').slice(0, 32);

    throw new Error('MMKV encryption key not configured');
};

export const getStorage = (): MMKV => {
    if (!storage) {
        storage = new MMKV({
            id: 'my2light-storage',
            encryptionKey: getEncryptionKey(),
        });
    }
    return storage;
};
```

### RLS Policies Structure
**Tables Requiring RLS:**
- `profiles` - User data
- `highlights` - Video metadata
- `bookings` - Court reservations
- `courts` - Public listings (read-only for users)
- `notifications` - User notifications

**Pattern:**
```sql
-- Profiles
CREATE POLICY "Users read own profile"
ON profiles FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Users update own profile"
ON profiles FOR UPDATE
USING (auth.uid() = id);

-- Highlights
CREATE POLICY "Users read public highlights"
ON highlights FOR SELECT
USING (is_public = true);

CREATE POLICY "Users CRUD own highlights"
ON highlights
USING (auth.uid() = user_id);
```

### Input Validation Architecture
**Centralized Validation Module:**
```
src/shared/utils/validation.ts
├── validateEmail(email: string): ValidationResult
├── validatePassword(password: string): ValidationResult
├── validatePhoneNumber(phone: string): ValidationResult
└── sanitizeInput(input: string): string
```

---

## Related Code Files

### Files to Modify
- `/src/lib/storage.ts` - MMKV initialization
- `/src/features/auth/screens/login.tsx` - Input validation
- `/src/features/auth/screens/register.tsx` - Password requirements
- `/src/features/auth/auth.service.ts` - Error masking
- `/src/features/auth/authStore.ts` - Logout cleanup
- `/app/_layout.tsx` - Security utilities activation

### Files to Create
- `/src/shared/utils/validation.ts` - Centralized validation
- `/migrations/enable-rls.sql` - RLS policies
- `/.env.example` - Update with EXPO_PUBLIC_ENCRYPTION_KEY

### Dependencies to Check
- `react-native-mmkv` - Version compatible with encryption
- `@supabase/supabase-js` - RLS support

---

## Implementation Steps

### Step 1: Fix MMKV Encryption Key (2h)

**1.1 Update environment configuration**
```bash
# .env.example
EXPO_PUBLIC_ENCRYPTION_KEY=generate-32-char-key-here
```

**1.2 Modify storage.ts**
- Replace hardcoded key with environment variable
- Add lazy initialization pattern
- Update zustandStorage adapter to use getStorage()
- Add error handling for missing key

**1.3 Update all storage imports**
- Find all imports: `grep -r "from '@/lib/storage'" src/`
- Replace `storage` with `getStorage()`
- Test MMKV persistence still works

**1.4 Verification**
```bash
# Test storage encryption
npm test -- storage.test.ts
# Verify no hardcoded keys remain
grep -r "my2light-encryption-key" src/
```

---

### Step 2: Enable RLS Policies (1.5h)

**2.1 Create migration file**
```sql
-- migrations/20251230-enable-rls.sql

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE highlights ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "profiles_select_own"
ON profiles FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "profiles_update_own"
ON profiles FOR UPDATE
USING (auth.uid() = id);

-- Highlights policies
CREATE POLICY "highlights_select_public"
ON highlights FOR SELECT
USING (is_public = true OR auth.uid() = user_id);

CREATE POLICY "highlights_insert_own"
ON highlights FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "highlights_update_own"
ON highlights FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "highlights_delete_own"
ON highlights FOR DELETE
USING (auth.uid() = user_id);

-- Bookings policies
CREATE POLICY "bookings_select_own_or_owner"
ON bookings FOR SELECT
USING (
    auth.uid() = user_id
    OR auth.uid() IN (
        SELECT owner_id FROM courts WHERE id = bookings.court_id
    )
);

CREATE POLICY "bookings_insert_own"
ON bookings FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "bookings_update_own"
ON bookings FOR UPDATE
USING (auth.uid() = user_id);
```

**2.2 Apply migration**
- Run in Supabase SQL Editor
- Test queries with authenticated users
- Verify anon key cannot access unauthorized data

**2.3 Test RLS policies**
```typescript
// tests/integration/rls-policies.test.ts
describe('RLS Policies', () => {
    it('should prevent accessing other users profiles', async () => {
        // Test with different user sessions
    });

    it('should allow reading public highlights', async () => {
        // Test public access
    });
});
```

---

### Step 3: Implement Input Validation (1.5h)

**3.1 Create validation utilities**
```typescript
// src/shared/utils/validation.ts
export interface ValidationResult {
    valid: boolean;
    error?: string;
}

export function validateEmail(email: string): ValidationResult {
    // RFC 5322 simplified
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email) {
        return { valid: false, error: 'Email is required' };
    }

    if (!emailRegex.test(email)) {
        return { valid: false, error: 'Invalid email format' };
    }

    return { valid: true };
}

export function validatePassword(password: string): ValidationResult {
    const minLength = 12;
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if (!password) {
        return { valid: false, error: 'Password is required' };
    }

    if (password.length < minLength) {
        return { valid: false, error: `Password must be at least ${minLength} characters` };
    }

    if (!hasUppercase || !hasLowercase || !hasNumbers) {
        return { valid: false, error: 'Password must include uppercase, lowercase, and numbers' };
    }

    return { valid: true };
}

export function sanitizeInput(input: string): string {
    // Remove potential XSS vectors
    return input
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .trim();
}
```

**3.2 Update login screen**
```typescript
// src/features/auth/screens/login.tsx
import { validateEmail, validatePassword } from '@/shared/utils/validation';

const validate = () => {
    const newErrors: { email?: string; password?: string } = {};

    const emailResult = validateEmail(email);
    if (!emailResult.valid) {
        newErrors.email = emailResult.error;
    }

    const passwordResult = validatePassword(password);
    if (!passwordResult.valid) {
        newErrors.password = passwordResult.error;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
};
```

**3.3 Add rate limiting**
```typescript
// src/features/auth/screens/login.tsx
const [loginAttempts, setLoginAttempts] = useState(0);
const [lockoutTime, setLockoutTime] = useState<number | null>(null);

const handleSubmit = async () => {
    const now = Date.now();

    // Check lockout
    if (lockoutTime && now < lockoutTime) {
        const remainingSeconds = Math.ceil((lockoutTime - now) / 1000);
        Alert.alert("Too many attempts", `Try again in ${remainingSeconds} seconds`);
        return;
    }

    if (!validate()) return;

    try {
        await authStore.signIn(email, password);
        setLoginAttempts(0);
        setLockoutTime(null);
    } catch (error) {
        const newAttempts = loginAttempts + 1;
        setLoginAttempts(newAttempts);

        if (newAttempts >= 5) {
            setLockoutTime(now + 60000); // 1 minute lockout
        }
    }
};
```

---

### Step 4: Activate Security Utilities (0.5h)

**4.1 Update app layout**
```typescript
// app/_layout.tsx
import { validateClientEnv } from '@/lib/security';
import { useEffect } from 'react';

export default function RootLayout() {
    useEffect(() => {
        if (!__DEV__) {
            validateClientEnv();
        }
    }, []);

    return <Stack />;
}
```

**4.2 Add error masking**
```typescript
// src/features/auth/auth.service.ts
import { maskSensitiveData } from '@/lib/security';

catch (e) {
    const maskedError = maskSensitiveData(JSON.stringify(e));
    console.error('Auth error:', maskedError);
    return {
        success: false,
        data: null as any,
        error: 'Authentication failed'
    };
}
```

---

### Step 5: Implement Logout Cleanup (0.5h)

**5.1 Update authStore**
```typescript
// src/features/auth/authStore.ts
signOut: async () => {
    set({ loading: true });

    try {
        await supabase.auth.signOut();

        // Explicit cleanup
        zustandStorage.removeItem('auth-storage');

        // Clear sensitive fields
        set({
            user: null,
            session: null,
            loading: false,
        });
    } catch (error) {
        console.error('Logout error:', error);
        set({ loading: false });
    }
},
```

**5.2 Add token expiry check**
```typescript
initialize: async () => {
    try {
        const { data: { session } } = await supabase.auth.getSession();

        // Check token expiry
        if (session?.expires_at && session.expires_at * 1000 < Date.now()) {
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
}
```

---

## Todo Checklist

### MMKV Encryption
- [ ] Add EXPO_PUBLIC_ENCRYPTION_KEY to .env
- [ ] Update storage.ts with lazy initialization
- [ ] Replace all storage imports with getStorage()
- [ ] Test MMKV persistence
- [ ] Verify no hardcoded keys remain

### RLS Policies
- [ ] Create migration file
- [ ] Apply RLS on profiles table
- [ ] Apply RLS on highlights table
- [ ] Apply RLS on bookings table
- [ ] Test policies with different users
- [ ] Document RLS patterns

### Input Validation
- [ ] Create validation.ts utilities
- [ ] Update login screen validation
- [ ] Update register screen validation
- [ ] Implement rate limiting
- [ ] Add password strength requirements
- [ ] Test validation edge cases

### Security Utilities
- [ ] Activate validateClientEnv() in app layout
- [ ] Add error masking to auth service
- [ ] Add error masking to other services
- [ ] Test security utilities in production mode

### Logout & Session
- [ ] Implement explicit storage cleanup
- [ ] Add token expiry check
- [ ] Test logout flow
- [ ] Test session initialization

---

## Success Criteria

- [ ] Zero hardcoded encryption keys in codebase
- [ ] RLS enabled and tested on all core tables
- [ ] Email validation RFC 5322 compliant
- [ ] Password requirements: 12+ chars, uppercase, lowercase, numbers
- [ ] Rate limiting prevents brute force (5 attempts max)
- [ ] Security utilities execute on app startup
- [ ] Error masking prevents data leakage
- [ ] Session cleanup verified on logout
- [ ] Token expiry detection working

---

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| MMKV re-encryption breaks existing data | Backup current storage, test migration |
| RLS blocks legitimate queries | Test all user flows before production |
| Stricter validation breaks existing users | Grandfather old users, enforce on new signups |
| Rate limiting too aggressive | Start with generous limits (5 attempts/min) |

---

## Security Considerations

### Before Deployment
- [ ] Audit all environment variables
- [ ] Verify RLS policies in Supabase dashboard
- [ ] Test with malicious inputs
- [ ] Review error messages for data leakage
- [ ] Run security scan (npm audit)

### Post-Deployment Monitoring
- [ ] Track failed login attempts
- [ ] Monitor RLS policy violations
- [ ] Alert on suspicious auth patterns
- [ ] Review audit logs weekly

---

## Next Steps

After Phase 1 completion:
1. Deploy to internal testing environment
2. Security team review
3. Proceed to Phase 2 (Code Quality Tooling)

---

## Unresolved Questions

1. Should we use react-native-device-info for device-specific encryption keys?
2. What's the strategy for existing users with data encrypted using old key?
3. Do we need audit logging for RLS policy violations?
4. Should rate limiting be IP-based or user-based?
5. MFA implementation timeline?

---

**Estimated Effort:** 6 hours
**Blocking Priority:** YES
**Must Complete Before:** Any beta testing or production deployment
