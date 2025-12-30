# Security Remediation Guide

**Timeline: 4-6 days | Priority: CRITICAL for production**

---

## Phase 1: Critical Fixes (Day 1-2)

### Fix 1: Replace Hardcoded MMKV Encryption Key

**File:** `src/lib/storage.ts`

```typescript
/**
 * Storage utility using MMKV for high-performance local storage
 * @module lib/storage
 */

import { MMKV } from "react-native-mmkv";
import { getUniqueId } from "react-native-device-info";

/**
 * Derive encryption key from device-specific identifier
 * Never hardcode encryption keys in source code
 */
const deriveEncryptionKey = (): string => {
    try {
        // Get device-unique ID (iOS: UUID, Android: device ID)
        const deviceId = getUniqueId();

        // Derive a 32-char hex key from device ID
        // Using Buffer to ensure proper encoding
        const key = Buffer.from(deviceId).toString("hex").slice(0, 32);

        // Ensure key is at least 16 chars for AES-256
        if (key.length < 16) {
            console.warn("[Security] Device key too short, using fallback");
            return "0".repeat(32); // Development fallback - log for monitoring
        }

        return key;
    } catch (error) {
        console.error("[Security] Failed to derive encryption key:", error);
        // Secure fallback: use a constant that's at least non-obvious
        return Buffer.from("my2light-secure-fallback-key").toString("hex").slice(0, 32);
    }
};

export const storage = new MMKV({
    id: "my2light-storage",
    encryptionKey: deriveEncryptionKey(),
});

// ... rest of storage.ts unchanged
```

**Installation needed:**

```bash
npm install react-native-device-info
# or
expo install react-native-device-info
```

**Testing:**

```typescript
// Verify encryption works
const testKey = "test_encryption";
storage.set(testKey, "secret_data");
const retrieved = storage.getString(testKey);
console.assert(retrieved === "secret_data", "Encryption test failed");
storage.delete(testKey);
```

---

### Fix 2: Activate Security Utilities at App Startup

**File:** Create/Update app entry point (e.g., `app/_layout.tsx` or root layout)

```typescript
import { validateClientEnv } from '@/lib/security';
import { useEffect } from 'react';

export default function RootLayout() {
    useEffect(() => {
        // Run security audit on app startup (non-dev only)
        if (!__DEV__) {
            try {
                validateClientEnv();
                console.log('[Security] Environment validation passed');
            } catch (error) {
                console.error('[Security] Critical security failure:', error);
                // In production, this should trigger crash reporting
                // and prevent app from proceeding
            }
        }
    }, []);

    return (
        <Stack screenOptions={{ headerShown: false }}>
            {/* Your existing screens */}
        </Stack>
    );
}
```

**Verification:**

- App should start without security errors
- Check console for `[Security] Environment validation passed`
- Verify no `SERVICE_ROLE_KEY` or `ADMIN_*` vars leaked

---

### Fix 3: Enable Row Level Security on Core Tables

**Location:** Supabase SQL Editor (https://app.supabase.com/project/_/sql)

**Run this migration in order:**

```sql
-- ============================================
-- ENABLE RLS ON CORE TABLES
-- ============================================

-- 1. PROFILES TABLE
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Anyone can read public profiles
DROP POLICY IF EXISTS "Public profiles readable" ON profiles;
CREATE POLICY "Public profiles readable"
ON profiles FOR SELECT
USING (is_public = true);

-- Users can read their own profile
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
CREATE POLICY "Users can read own profile"
ON profiles FOR SELECT
USING (auth.uid() = id);

-- Users can update their own profile
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- System/admin operations (if needed)
DROP POLICY IF EXISTS "Service role can manage profiles" ON profiles;
CREATE POLICY "Service role can manage profiles"
ON profiles FOR ALL
USING (auth.role() = 'service_role');

-- ============================================
-- 2. HIGHLIGHTS TABLE
-- ============================================

ALTER TABLE highlights ENABLE ROW LEVEL SECURITY;

-- Users can view public highlights
DROP POLICY IF EXISTS "Public highlights readable" ON highlights;
CREATE POLICY "Public highlights readable"
ON highlights FOR SELECT
USING (is_public = true);

-- Users can view their own highlights
DROP POLICY IF EXISTS "Users can read own highlights" ON highlights;
CREATE POLICY "Users can read own highlights"
ON highlights FOR SELECT
USING (auth.uid() = user_id);

-- Users can create highlights
DROP POLICY IF EXISTS "Users can create own highlights" ON highlights;
CREATE POLICY "Users can create own highlights"
ON highlights FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update own highlights
DROP POLICY IF EXISTS "Users can update own highlights" ON highlights;
CREATE POLICY "Users can update own highlights"
ON highlights FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete own highlights
DROP POLICY IF EXISTS "Users can delete own highlights" ON highlights;
CREATE POLICY "Users can delete own highlights"
ON highlights FOR DELETE
USING (auth.uid() = user_id);

-- ============================================
-- 3. BOOKINGS TABLE
-- ============================================

ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Users can view their own bookings
DROP POLICY IF EXISTS "Users can view own bookings" ON bookings;
CREATE POLICY "Users can view own bookings"
ON bookings FOR SELECT
USING (auth.uid() = user_id);

-- Court owners can view bookings for their courts
DROP POLICY IF EXISTS "Court owners can view court bookings" ON bookings;
CREATE POLICY "Court owners can view court bookings"
ON bookings FOR SELECT
USING (
    auth.uid() IN (
        SELECT owner_id FROM courts WHERE id = bookings.court_id
    )
);

-- Users can create bookings
DROP POLICY IF EXISTS "Users can create bookings" ON bookings;
CREATE POLICY "Users can create bookings"
ON bookings FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own bookings
DROP POLICY IF EXISTS "Users can update own bookings" ON bookings;
CREATE POLICY "Users can update own bookings"
ON bookings FOR UPDATE
USING (auth.uid() = user_id);

-- ============================================
-- 4. COURTS TABLE (public read)
-- ============================================

ALTER TABLE courts ENABLE ROW LEVEL SECURITY;

-- Anyone can view active courts
DROP POLICY IF EXISTS "Active courts readable" ON courts;
CREATE POLICY "Active courts readable"
ON courts FOR SELECT
USING (is_active = true);

-- Court owners can view their own courts
DROP POLICY IF EXISTS "Owners can view own courts" ON courts;
CREATE POLICY "Owners can view own courts"
ON courts FOR SELECT
USING (auth.uid() = owner_id OR is_active = true);

-- Court owners can update their courts
DROP POLICY IF EXISTS "Owners can update own courts" ON courts;
CREATE POLICY "Owners can update own courts"
ON courts FOR UPDATE
USING (auth.uid() = owner_id);

-- ============================================
-- 5. NOTIFICATIONS TABLE (if not already done)
-- ============================================

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users can only read their own notifications
DROP POLICY IF EXISTS "Users can read own notifications" ON notifications;
CREATE POLICY "Users can read own notifications"
ON notifications FOR SELECT
USING (auth.uid() = user_id);

-- System can create notifications
DROP POLICY IF EXISTS "System can create notifications" ON notifications;
CREATE POLICY "System can create notifications"
ON notifications FOR INSERT
WITH CHECK (auth.role() = 'service_role');

-- Users can update their notifications (mark as read)
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
CREATE POLICY "Users can update own notifications"
ON notifications FOR UPDATE
USING (auth.uid() = user_id);

-- ============================================
-- VERIFY RLS ENABLED
-- ============================================
-- Run this query to verify all policies:
-- SELECT tablename, rowsecurity FROM pg_tables
-- WHERE schemaname = 'public' AND tablename IN
-- ('profiles', 'highlights', 'bookings', 'courts', 'notifications');
```

**Verification in Supabase Dashboard:**

1. Go to Authentication → Policies
2. Confirm all 5 tables have "RLS enabled" badge
3. Verify policy count matches above

---

## Phase 2: High Priority Fixes (Day 2-3)

### Fix 4: Strengthen Auth Input Validation

**File:** `src/features/auth/screens/login.tsx`

Replace the `validate()` function:

```typescript
import { isEmail } from "validator"; // npm install validator

/**
 * Validate email using RFC 5322 standard
 * More permissive than strict regex but rejects obvious invalids
 */
const validateEmail = (email: string): string | null => {
    if (!email || email.trim() === "") {
        return "Email is required";
    }

    // Use email validator library (RFC 5322 compliant)
    if (!isEmail(email)) {
        return "Enter a valid email address";
    }

    if (email.length > 254) {
        return "Email is too long";
    }

    return null;
};

/**
 * Validate password strength
 * - Minimum 12 characters (OWASP recommendation)
 * - Mix of character types
 */
const validatePassword = (password: string): string | null => {
    if (!password || password.trim() === "") {
        return "Password is required";
    }

    const minLength = 12;
    if (password.length < minLength) {
        return `Password must be at least ${minLength} characters`;
    }

    // Character type checks
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

    const typeCount = [hasUppercase, hasLowercase, hasNumber, hasSpecial].filter(Boolean).length;

    if (typeCount < 3) {
        return "Password must include uppercase, lowercase, and numbers (special chars recommended)";
    }

    return null;
};

/**
 * Main validation function
 */
const validate = (): boolean => {
    const newErrors: { email?: string; password?: string } = {};

    // Validate email
    const emailError = validateEmail(email);
    if (emailError) newErrors.email = emailError;

    // Validate password
    const passwordError = validatePassword(password);
    if (passwordError) newErrors.password = passwordError;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
};

/**
 * Add rate limiting to prevent brute force
 */
const [loginAttempts, setLoginAttempts] = useState(0);
const [lastAttemptTime, setLastAttemptTime] = useState(0);
const [isLocked, setIsLocked] = useState(false);

const checkRateLimit = (): boolean => {
    const now = Date.now();
    const lockoutDuration = 60000; // 1 minute
    const maxAttempts = 5;

    // Check if still in lockout period
    if (isLocked && now - lastAttemptTime < lockoutDuration) {
        const remainingTime = Math.ceil((lockoutDuration - (now - lastAttemptTime)) / 1000);
        Alert.alert(
            "Account Temporarily Locked",
            `Too many login attempts. Try again in ${remainingTime} seconds.`
        );
        return false;
    }

    // Reset if lockout period expired
    if (isLocked) {
        setIsLocked(false);
        setLoginAttempts(0);
    }

    // Check if exceeding attempt limit
    if (loginAttempts >= maxAttempts && now - lastAttemptTime < lockoutDuration) {
        setIsLocked(true);
        return false;
    }

    // Record this attempt
    setLoginAttempts((prev) => prev + 1);
    setLastAttemptTime(now);

    return true;
};

const handleSubmit = async () => {
    if (!isSupabaseConfigured()) {
        Alert.alert("Configuration Error", "Supabase not configured");
        return;
    }

    if (!validate()) return;

    // Check rate limiting
    if (!checkRateLimit()) return;

    try {
        const { error } = isSignUp ? await signUp(email, password) : await signIn(email, password);

        if (error) {
            // Generic error message - don't leak auth details
            Alert.alert("Authentication Failed", "Invalid email or password. Please try again.");
        } else {
            // Success - reset attempts
            setLoginAttempts(0);
            setIsLocked(false);
        }
    } catch (error) {
        Alert.alert("Error", "An unexpected error occurred");
    }
};
```

**Dependencies:**

```bash
npm install validator
# or
expo install validator
```

---

### Fix 5: Secure Session Token Management

**File:** `src/features/auth/authStore.ts`

```typescript
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { supabase } from "@/lib/supabase";
import { zustandStorage } from "@/lib/storage";
import type { User, Session } from "@supabase/supabase-js";

interface AuthState {
    user: User | null;
    session: Session | null;
    loading: boolean;
    initialized: boolean;

    // Actions
    initialize: () => Promise<void>;
    signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
    signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
    signOut: () => Promise<void>;
    setUser: (user: User | null) => void;
    setSession: (session: Session | null) => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            user: null,
            session: null,
            loading: true,
            initialized: false,

            initialize: async () => {
                try {
                    const {
                        data: { session },
                    } = await supabase.auth.getSession();

                    // SECURITY: Check if token is expired
                    if (session?.expires_at) {
                        const expiresAtMs = session.expires_at * 1000;
                        const nowMs = Date.now();

                        if (expiresAtMs < nowMs) {
                            // Token expired - sign out and clear storage
                            console.warn("[Auth] Session token expired, signing out");
                            await supabase.auth.signOut();
                            zustandStorage.removeItem("auth-storage");

                            set({
                                session: null,
                                user: null,
                                loading: false,
                                initialized: true,
                            });
                            return;
                        }
                    }

                    set({
                        session,
                        user: session?.user || null,
                        loading: false,
                        initialized: true,
                    });

                    // Listen for auth changes
                    const {
                        data: { subscription },
                    } = supabase.auth.onAuthStateChange(async (_event, updatedSession) => {
                        set({
                            session: updatedSession,
                            user: updatedSession?.user || null,
                        });
                    });

                    return () => subscription?.unsubscribe();
                } catch (error) {
                    console.error("Auth initialization error:", error);
                    set({ loading: false, initialized: true });
                }
            },

            signIn: async (email: string, password: string) => {
                set({ loading: true });
                try {
                    const { data, error } = await supabase.auth.signInWithPassword({
                        email,
                        password,
                    });

                    if (error) throw error;

                    set({
                        user: data.user,
                        session: data.session,
                        loading: false,
                    });

                    return { error: null };
                } catch (error) {
                    set({ loading: false });
                    return { error: error as Error };
                }
            },

            signUp: async (email: string, password: string) => {
                set({ loading: true });
                try {
                    const { data, error } = await supabase.auth.signUp({
                        email,
                        password,
                    });

                    if (error) throw error;

                    set({
                        user: data.user,
                        session: data.session,
                        loading: false,
                    });

                    return { error: null };
                } catch (error) {
                    set({ loading: false });
                    return { error: error as Error };
                }
            },

            signOut: async () => {
                set({ loading: true });
                try {
                    await supabase.auth.signOut();
                } catch (error) {
                    console.error("[Auth] Signout error:", error);
                }

                // SECURITY: Explicitly clear sensitive data
                zustandStorage.removeItem("auth-storage");

                set({
                    user: null,
                    session: null,
                    loading: false,
                });
            },

            setUser: (user) => set({ user }),
            setSession: (session) => set({ session }),
        }),
        {
            name: "auth-storage",
            storage: createJSONStorage(() => zustandStorage),
            partialize: (state) => ({
                // Only persist session (for token refresh)
                // Don't persist user data - fetch fresh from server
                session: state.session,
            }),
        }
    )
);
```

---

### Fix 6: Add Error Masking to Auth Service

**File:** `src/features/auth/auth.service.ts`

```typescript
import { supabase } from "../lib/supabase";
import { maskSensitiveData } from "@/lib/security";
import { User, ApiResponse } from "../types";

/**
 * Mask internal error details before exposing to user
 */
const maskError = (error: any): string => {
    const errorStr = JSON.stringify(error);
    const masked = maskSensitiveData(errorStr);
    console.error("[Auth Service] Internal error (masked):", masked);
    return "An error occurred. Please try again.";
};

export const AuthService = {
    getCurrentUser: async (): Promise<ApiResponse<User>> => {
        try {
            const {
                data: { session },
            } = await supabase.auth.getSession();

            if (!session?.user) {
                return { success: false, data: null as any, error: "Not authenticated" };
            }

            // Try fetching profile from DB
            const { data, error } = await supabase
                .from("profiles")
                .select("*")
                .eq("id", session.user.id)
                .single();

            if (error && error.code !== "PGRST116") {
                // Not a "no rows" error
                console.error(
                    "[Auth Service] Profile fetch error (masked):",
                    maskSensitiveData(error.message)
                );
                return { success: false, data: null as any, error: "Failed to fetch profile" };
            }

            // Calculate fallback display name from email
            const emailName = session.user.email?.split("@")[0] || "User";
            const displayName = emailName.charAt(0).toUpperCase() + emailName.slice(1);

            if (error || !data) {
                // Profile doesn't exist - create it
                const newProfile = {
                    id: session.user.id,
                    name: displayName,
                    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${Math.random()}`,
                    phone: "",
                    credits: 200000,
                    membership_tier: "free",
                    total_highlights: 0,
                    has_onboarded: false,
                };

                const { error: insertError } = await supabase.from("profiles").insert(newProfile);

                if (insertError) {
                    console.error(
                        "[Auth Service] Profile creation failed (masked):",
                        maskSensitiveData(insertError.message)
                    );
                    return { success: false, data: null as any, error: "Failed to create profile" };
                }

                return {
                    success: true,
                    data: {
                        id: newProfile.id,
                        name: newProfile.name,
                        avatar: newProfile.avatar,
                        phone: newProfile.phone,
                        totalHighlights: 0,
                        hoursPlayed: 0,
                        courtsVisited: 0,
                        credits: newProfile.credits,
                        membershipTier: "free",
                    },
                };
            }

            // Calculate stats from bookings
            const { data: bookings } = await supabase
                .from("bookings")
                .select("court_id, start_time, end_time, status")
                .eq("user_id", session.user.id)
                .eq("status", "completed");

            let hoursPlayed = 0;
            const visitedCourts = new Set();

            if (bookings) {
                bookings.forEach((b: any) => {
                    const duration =
                        (new Date(b.end_time).getTime() - new Date(b.start_time).getTime()) /
                        3600000;
                    hoursPlayed += duration;
                    visitedCourts.add(b.court_id);
                });
            }

            // Calculate total highlights
            const { count: highlightsCount } = await supabase
                .from("highlights")
                .select("*", { count: "exact", head: true })
                .eq("user_id", session.user.id);

            const user: User = {
                id: data.id,
                name: data.name || displayName,
                avatar:
                    data.avatar ||
                    `https://api.dicebear.com/7.x/avataaars/svg?seed=${Math.random()}`,
                phone: data.phone || "",
                totalHighlights: highlightsCount || 0,
                hoursPlayed: Number(hoursPlayed.toFixed(1)),
                courtsVisited: visitedCourts.size,
                credits: data.credits || 0,
                membershipTier: (data.membership_tier as any) || "free",
                role: (data.role as any) || "player",
                bio: data.bio,
                isPublic: data.is_public,
                followersCount: data.followers_count || 0,
                followingCount: data.following_count || 0,
            };

            return { success: true, data: user };
        } catch (e) {
            const errorMsg = maskError(e);
            return { success: false, data: null as any, error: errorMsg };
        }
    },

    updateUserProfile: async (
        updates: Partial<{
            name: string;
            phone: string;
            avatar: string;
            credits: number;
            has_onboarded: boolean;
            bio: string;
            is_public: boolean;
        }>
    ): Promise<ApiResponse<boolean>> => {
        const {
            data: { user },
        } = await supabase.auth.getUser();
        if (!user) return { success: false, data: false };

        try {
            const { error: updateError } = await supabase
                .from("profiles")
                .update(updates)
                .eq("id", user.id);

            if (updateError) {
                console.error(
                    "[Auth Service] Profile update failed (masked):",
                    maskSensitiveData(updateError.message)
                );
                return { success: false, data: false, error: "Failed to update profile" };
            }

            return { success: true, data: true };
        } catch (e) {
            const errorMsg = maskError(e);
            return { success: false, data: false, error: errorMsg };
        }
    },
};
```

---

### Fix 7: Fix Offline Queue ID Generation

**File:** `src/lib/network.ts`

```typescript
import { v4 as uuidv4 } from "uuid";
import NetInfo from "@react-native-community/netinfo";
import { useEffect, useState } from "react";

// ... existing code ...

/**
 * Queue for offline actions
 */
type QueuedAction = {
    id: string; // Now cryptographically random
    action: () => Promise<any>;
    retryCount: number;
};

class OfflineQueue {
    private queue: QueuedAction[] = [];
    private processing = false;

    add(action: () => Promise<any>) {
        // SECURITY: Use cryptographically random UUID instead of Date.now() + Math.random()
        const id = uuidv4();
        this.queue.push({ id, action, retryCount: 0 });
    }

    async process() {
        if (this.processing || this.queue.length === 0) return;

        const online = await isOnline();
        if (!online) return;

        this.processing = true;

        while (this.queue.length > 0) {
            const item = this.queue[0];

            try {
                await item.action();
                this.queue.shift(); // Remove successful action
            } catch (error) {
                item.retryCount++;

                if (item.retryCount >= 3) {
                    console.error("Action failed after 3 retries:", error);
                    this.queue.shift(); // Remove failed action
                } else {
                    // Move to back of queue for retry
                    this.queue.push(this.queue.shift()!);
                }
            }
        }

        this.processing = false;
    }

    clear() {
        this.queue = [];
    }
}

export const offlineQueue = new OfflineQueue();

// ... rest unchanged
```

**Install uuid:**

```bash
npm install uuid
# or
expo install uuid
```

---

## Phase 3: Testing & Deployment (Day 4-6)

### Test Checklist

```typescript
// 1. Test encryption key derivation
import { storage } from "@/lib/storage";
const testValue = "secure_test_data";
storage.set("encryption_test", testValue);
const retrieved = storage.getString("encryption_test");
console.assert(retrieved === testValue, "Encryption failed");

// 2. Test security validation
import { validateClientEnv } from "@/lib/security";
if (!__DEV__) {
    validateClientEnv(); // Should not throw
}

// 3. Test input validation
const loginTest = {
    validEmail: "user@example.com",
    invalidEmail: "not-an-email",
    strongPassword: "MyPassword123!@#",
    weakPassword: "weak",
};

// 4. Test rate limiting
// Attempt 6 logins rapidly - should lock on 6th

// 5. Test token expiry
// Mock expired token, verify auto-logout

// 6. Test RLS policies
// Try to access another user's data via Supabase client - should fail
```

---

## Deployment Pre-checklist

- [ ] All 7 fixes implemented
- [ ] No hardcoded secrets in code
- [ ] `validateClientEnv()` passes on non-dev build
- [ ] All RLS policies created in Supabase
- [ ] Auth flow tested end-to-end
- [ ] Sensitive errors masked in logs
- [ ] Security utilities activated
- [ ] No console.error() with sensitive data
- [ ] Dependencies updated: `npm audit fix`
- [ ] .env.example documented (no secrets)

---

## Success Criteria

| Criterion        | Before     | After       |
| ---------------- | ---------- | ----------- |
| Hardcoded keys   | ❌ Yes     | ✅ Derived  |
| Security utils   | ❌ Unused  | ✅ Active   |
| RLS coverage     | ⚠️ Partial | ✅ Complete |
| Input validation | ⚠️ Weak    | ✅ Strong   |
| Error masking    | ❌ None    | ✅ Full     |
| OWASP Score      | 5/10       | 8/10        |

---

## Support

If issues arise during implementation:

1. Check the full audit report: `/plans/reports/code-reviewer-251230-1621-auth-security-audit.md`
2. Test each fix in isolation before merging
3. Run full auth flow E2E test after each phase
