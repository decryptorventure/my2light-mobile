# State Management & Data Fetching Review

**Date:** 2025-12-30
**Focus:** State management, React Query hooks, API services, caching strategy
**Files Reviewed:** 8 core files, ~400 LOC

---

## Overall Assessment

Architecture demonstrates solid fundamentals with well-separated concerns (Zustand stores, React Query, service layer). However, several operational and type safety issues reduce effectiveness. Critical: TypeScript path resolution errors block compilation. High priority: Cache invalidation patterns need refinement, missing error handling in hooks, inefficient offline queue.

---

## Critical Issues

### 1. **TypeScript Import Path Resolution Failure**
**Severity:** CRITICAL
**Status:** BLOCKING BUILD

Services using relative paths with outdated structure:
```typescript
// ❌ FAILS
import { supabase } from '../lib/supabase';  // Auth service
import { Booking, ApiResponse } from '../types';
```

**Impact:** Build fails. 18+ type errors in feature screens/services.

**Fix:** Update service imports to use absolute paths from correct locations:
```typescript
// ✅ CORRECT
import { supabase } from '@/lib/supabase';
import type { Booking, ApiResponse } from '@/types';
```

**Affected Files:**
- `/Users/tommac/Desktop/Solo Builder/my2light-mobile/src/features/auth/auth.service.ts`
- `/Users/tommac/Desktop/Solo Builder/my2light-mobile/src/features/bookings/booking.service.ts`
- `/Users/tommac/Desktop/Solo Builder/my2light-mobile/src/features/courts/court.service.ts`
- `/Users/tommac/Desktop/Solo Builder/my2light-mobile/src/features/highlights/highlight.service.ts`

---

### 2. **Storage Module MMKV Initialization Bug**
**Severity:** CRITICAL
**File:** `/Users/tommac/Desktop/Solo Builder/my2light-mobile/src/lib/storage.ts:8`

```typescript
// ❌ ERROR: Cannot instantiate MMKV at module load time
export const storage = new MMKV({
    id: 'my2light-storage',
    encryptionKey: 'my2light-encryption-key', // Hardcoded key in source!
});
```

**Issues:**
- Type error: `MMKV` is type-only import, cannot instantiate
- Hardcoded encryption key violates security (should use env variable or device keychain)
- Initialization at module load may fail if MMKV native module not ready

**Fix:**
```typescript
import { MMKV } from 'react-native-mmkv';

let storage: MMKV | null = null;

export const getStorage = (): MMKV => {
    if (!storage) {
        storage = new MMKV({
            id: 'my2light-storage',
            encryptionKey: process.env.EXPO_PUBLIC_ENCRYPTION_KEY || 'default-key',
        });
    }
    return storage;
};

export const zustandStorage = {
    setItem: (name: string, value: string) => {
        getStorage().set(name, value);
    },
    getItem: (name: string) => getStorage().getString(name) ?? null,
    removeItem: (name: string) => getStorage().delete(name),
};
```

---

## High Priority Findings

### 3. **Cache Invalidation Too Aggressive**
**Severity:** HIGH
**File:** `/Users/tommac/Desktop/Solo Builder/my2light-mobile/src/features/highlights/hooks/useHighlights.ts:54,66`

```typescript
// ❌ PROBLEM: Invalidates ALL highlights on any mutation
onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: highlightQueryKeys.all });
},
```

**Impact:** Single like action refetches entire feed. Unnecessary network calls, poor UX with loading spinners.

**Fix - Use precise cache updates:**
```typescript
export function useToggleLike() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (params: { highlightId: string; currentLikes: number; isLiked: boolean }) =>
            HighlightService.toggleLike(params.highlightId, params.currentLikes, params.isLiked),

        onSuccess: (_, params) => {
            // Option A: Optimistic update
            queryClient.setQueryData(highlightQueryKeys.lists(), (old: any) => {
                return old?.map((h: any) =>
                    h.id === params.highlightId
                        ? { ...h, likes: params.isLiked ? h.likes - 1 : h.likes + 1 }
                        : h
                ) || old;
            });

            // Option B: Selective invalidation of specific highlight
            queryClient.invalidateQueries({
                queryKey: highlightQueryKeys.detail?.(params.highlightId)
            });
        },
    });
}
```

---

### 4. **Missing Error Handling in React Query Hooks**
**Severity:** HIGH
**Files:** All useBookings, useCourts, useHighlights hooks

**Pattern Issue:**
```typescript
// ❌ No error handling, no retry strategy
return useQuery({
    queryKey: bookingQueryKeys.history(),
    queryFn: async () => {
        const result = await BookingService.getBookingHistory();
        return result.data;  // Silently returns undefined on error
    },
    staleTime: 60000,
});
```

**Problems:**
- Throws if service returns error - no try/catch
- No retry configuration (defaults to 3 retries but not explicit)
- No error boundary handling
- UI gets undefined data without knowing it's an error

**Fix:**
```typescript
export function useBookingHistory() {
    return useQuery({
        queryKey: bookingQueryKeys.history(),
        queryFn: async () => {
            const result = await BookingService.getBookingHistory();
            if (!result.success || result.error) {
                throw new Error(result.error || 'Failed to fetch bookings');
            }
            return result.data;
        },
        staleTime: 60000,
        gcTime: 300000, // Cache for 5 minutes after stale
        retry: 2,
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
        throwOnError: true, // Let error boundaries catch it
    });
}
```

---

### 5. **Offline Queue Logic Flaw**
**Severity:** HIGH
**File:** `/Users/tommac/Desktop/Solo Builder/my2light-mobile/src/lib/network.ts:60-75`

```typescript
// ❌ PROBLEM: Retry mechanism moves items to back indefinitely
while (this.queue.length > 0) {
    const item = this.queue[0];
    try {
        await item.action();
        this.queue.shift(); // Remove successful action
    } catch (error) {
        item.retryCount++;
        if (item.retryCount >= 3) {
            this.queue.shift(); // Remove failed
        } else {
            // ❌ Infinite retry - moves to back and re-queues
            this.queue.push(this.queue.shift()!);
        }
    }
}
```

**Issues:**
- Retry loop can run forever if action always fails (e.g., auth error)
- Moves failed items to back creating potentially infinite queue cycling
- No exponential backoff
- No error logging persistence for debugging
- Should not retry auth/permission errors

**Fix:**
```typescript
async process() {
    if (this.processing || this.queue.length === 0) return;

    const online = await isOnline();
    if (!online) return;

    this.processing = true;

    while (this.queue.length > 0) {
        const item = this.queue[0];

        try {
            await item.action();
            this.queue.shift();
        } catch (error) {
            item.retryCount++;
            const err = error as any;

            // Don't retry auth/permission errors
            if (err.status === 401 || err.status === 403) {
                console.error('Auth error, discarding action:', error);
                this.queue.shift();
                continue;
            }

            if (item.retryCount >= 3) {
                console.error('Action failed after 3 retries, discarding:', error);
                this.queue.shift();
            } else {
                // Wait before retry (exponential backoff)
                const delay = Math.min(1000 * Math.pow(2, item.retryCount), 10000);
                await new Promise(r => setTimeout(r, delay));
                // Don't re-queue, just retry current item
            }
        }
    }

    this.processing = false;
}
```

---

### 6. **API Wrapper Caching Inconsistency**
**Severity:** HIGH
**File:** `/Users/tommac/Desktop/Solo Builder/my2light-mobile/src/lib/apiWrapper.ts`

**Problem 1: Cache key collision**
```typescript
// ❌ Same cache key for different contexts
const cached = cache.get<T>(key);  // Called twice, even in offline
```

**Problem 2: Double cache fetching**
```typescript
// ❌ Fetches cache twice when offline
if (useCache) {
    const cached = cache.get<T>(key);  // First fetch
    if (cached) return { data: cached, error: null, cached: true };
}

const online = await isOnline();
if (!online) {
    // ... queue logic ...
    const cached = cache.get<T>(key);  // Second fetch - redundant!
}
```

**Problem 3: No TTL validation in offline queue**
```typescript
// ❌ Queue stores actions but doesn't prevent stale data re-upload
offlineQueue.add(async () => {
    const result = await apiFunction();
    if (result.data && useCache) {
        cache.set(key, result.data, cacheTTL);  // Could be stale
    }
});
```

**Fix:**
```typescript
export async function apiCall<T>(
    key: string,
    apiFunction: () => Promise<ApiResponse<T>>,
    options: {
        cache?: boolean;
        cacheTTL?: number;
        offlineQueue?: boolean;
    } = {}
): Promise<ApiResponse<T>> {
    const { cache: useCache = true, cacheTTL = 300000, offlineQueue: useQueue = false } = options;

    // Single cache check
    if (useCache) {
        const cached = cache.get<T>(key);
        if (cached) {
            return { data: cached, error: null, cached: true };
        }
    }

    const online = await isOnline();

    if (!online) {
        if (useQueue) {
            offlineQueue.add(async () => {
                try {
                    const result = await apiFunction();
                    if (result.data && useCache) {
                        cache.set(key, result.data, cacheTTL);
                    }
                } catch (err) {
                    console.error(`Offline queue failed for ${key}:`, err);
                }
            });
        }

        // Return cached or error (don't fetch cache again)
        return { data: null, error: 'No internet connection' };
    }

    try {
        const result = await apiFunction();
        if (result.data && useCache) {
            cache.set(key, result.data, cacheTTL);
        }
        return result;
    } catch (error) {
        return { data: null, error: (error as Error).message };
    }
}
```

---

## Medium Priority Improvements

### 7. **Missing Type Safety in Service Responses**
**Severity:** MEDIUM
**Files:** All service files (auth, bookings, courts, highlights)

**Issue:**
```typescript
// ❌ Incomplete transformations
const bookings: Booking[] = data.map((b: any) => ({  // Using 'any'
    id: b.id,
    userId: b.user_id,
    // ...
}));
```

**Fix:**
```typescript
// Define DB type
interface BookingRow {
    id: string;
    user_id: string;
    court_id: string;
    // ... all fields
}

// Transform with type safety
const bookings: Booking[] = (data as BookingRow[]).map((b) => ({
    id: b.id,
    userId: b.user_id,
    // ...
}));
```

---

### 8. **Zustand Store Pattern Inconsistency**
**Severity:** MEDIUM
**Files:** authStore.ts vs recordingStore.ts

**Issue:** Different patterns reduce maintainability
```typescript
// authStore.ts - Uses persist middleware, complex getter pattern
const { data: { session } } = await supabase.auth.getSession();
set({ session, user: session?.user || null });

// recordingStore.ts - No persistence, simpler state
export const useRecordingStore = create<RecordingState>((set, get) => ({
    // Direct state assignments
}));
```

**Recommendation:**
- Persist recordingStore if session continuity needed
- Document when/why persistence used
- Consider moving auth listener setup to useEffect in component

---

### 9. **Stale Time Configuration Inconsistent**
**Severity:** MEDIUM
**Comparison:**
- `useBookingHistory`: 60s stale
- `useActiveBooking`: 30s stale
- `useCourts`: 300s (5min) stale
- `useHighlights`: 60s stale

**Issue:** No documented rationale. Highlights change frequently but courts rarely do - these times seem backwards.

**Recommendation:**
```typescript
// Define constants
const STALE_TIME = {
    REAL_TIME: 10000,      // Active bookings
    FREQUENT: 60000,       // Highlights, user data
    NORMAL: 300000,        // Courts, stable data
    LONG: 600000,          // Reference data
} as const;

// Use consistently
export function useActiveBooking() {
    return useQuery({
        queryKey: bookingQueryKeys.active(),
        queryFn: async () => { /* ... */ },
        staleTime: STALE_TIME.REAL_TIME,
        gcTime: STALE_TIME.REAL_TIME * 2,
    });
}
```

---

### 10. **No Optimistic Updates in Mutations**
**Severity:** MEDIUM**

Mutations lack optimistic UI updates:
```typescript
// ❌ User waits for server response
useToggleLike() {
    return useMutation({
        mutationFn: HighlightService.toggleLike,
        onSuccess: () => {
            queryClient.invalidateQueries({ /* ... */ });
        },
    });
}
```

**Expected Experience:** Like button shows immediate feedback before server confirms.

---

## Low Priority Suggestions

### 11. **No Activity Logging for Debugging**
- Offline queue has no persistent logs (lost on app restart)
- API errors not tracked for analytics
- Cache hits/misses not instrumented

**Suggestion:** Add metrics tracking for monitoring cache effectiveness.

---

### 12. **Hardcoded Magic Values**
- Retry count: 3 (magic number)
- Retry delay: 1000ms base (not configurable)
- Cache TTL defaults: 300000ms (5 min)

**Suggestion:** Extract to constants file.

---

### 13. **Service Layer Missing Abort Signal Support**
- Long-running requests not cancellable
- No timeout enforcement
- Memory leak potential if component unmounts during fetch

---

## Positive Observations

✓ **Zustand architecture:** Clean, immutable patterns, minimal re-renders
✓ **Query key organization:** Hierarchical structure prevents collisions
✓ **MMKV integration:** Good choice for performance (though initialization broken)
✓ **Service separation:** Auth, Bookings, Courts, Highlights properly modularized
✓ **Offline-first mindset:** Queue system shows thoughtful architecture

---

## Recommended Actions (Priority Order)

### Phase 1 (Blocking)
1. **Fix TypeScript paths** - Update all service imports to use `@/` aliases
2. **Fix MMKV initialization** - Lazy load, fix type error, use env encryption key

### Phase 2 (High Impact)
3. **Implement precise cache invalidation** - Optimistic updates for mutations
4. **Add error handling to React Query** - Proper error states, retry config
5. **Fix offline queue retry logic** - Exponential backoff, auth error handling
6. **Remove duplicate cache fetches** - Simplify apiWrapper

### Phase 3 (Quality)
7. **Add type safety to service responses** - Remove `any` type casts
8. **Standardize stale times** - Document and use constants
9. **Add mutation error boundaries** - Catch and handle errors properly

---

## Metrics

- **Files with import errors:** 4 (auth, bookings, courts, highlights services)
- **Type safety issues:** 36+ TS errors from import paths
- **Cache invalidation patterns:** 2 (too aggressive in 2 places)
- **Missing error handlers:** 3 React Query hooks
- **Logic flaws:** 1 critical (offline queue) + 2 high priority

---

## Unresolved Questions

1. **Encryption Key Management:** Where should MMKV encryption key come from? (Keychain? Environment?)
2. **Cache Strategy per Resource:** Should courts use longer TTL than highlights? Document policy.
3. **Network Retry Behavior:** Should we retry on 400 errors (client fault) or only 5xx?
4. **Offline Queue Persistence:** Should queued actions persist across app restarts?

