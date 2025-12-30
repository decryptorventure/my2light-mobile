# Phase 5: Performance Optimization

**Priority:** MEDIUM | **Status:** pending | **Effort:** 6h | **Date:** 2025-12-30

[← Back to Plan](plan.md)

---

## Context

Performance issues identified in cache invalidation, FlatList rendering, and offline queue retry logic.

**Source:** [State Management Review](../../reports/code-reviewer-251230-1621-state-mgmt.md), [UI Components Review](../../reports/code-reviewer-251230-1621-ui-components.md)

**Key Issues:**

- Aggressive cache invalidation refetches entire feed on single like
- FlatList missing optimization flags
- Offline queue infinite retry loop
- Double cache fetches in apiWrapper
- No optimistic updates

---

## Key Insights

### Cache Invalidation Problem

**Current:** `toggleLike` invalidates ALL highlights → network waste
**Solution:** Optimistic updates + selective invalidation

### FlatList Performance

**Missing:** `removeClippedSubviews`, `getItemLayout`, batching config
**Impact:** Slower scrolling, higher memory usage

### Offline Queue

**Issue:** Retry loop moves failed items to back indefinitely
**Solution:** Exponential backoff, auth error detection

---

## Requirements

### Must Fix

- [ ] Implement optimistic cache updates
- [ ] Fix offline queue retry logic
- [ ] Add FlatList optimization flags
- [ ] Remove double cache fetches

### Should Add

- [ ] Exponential backoff for retries
- [ ] Cache TTL constants
- [ ] Performance monitoring

---

## Implementation Steps

### Step 1: Optimistic Cache Updates (2h)

**1.1 Update useToggleLike hook**

```typescript
// src/features/highlights/hooks/useHighlights.ts
export function useToggleLike() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (params: { highlightId: string; currentLikes: number; isLiked: boolean }) =>
            HighlightService.toggleLike(params.highlightId, params.currentLikes, params.isLiked),

        // Optimistic update
        onMutate: async (params) => {
            await queryClient.cancelQueries({ queryKey: highlightQueryKeys.all });

            const previousData = queryClient.getQueryData(highlightQueryKeys.lists());

            queryClient.setQueryData(highlightQueryKeys.lists(), (old: any) => {
                if (!old) return old;
                return old.map((h: any) =>
                    h.id === params.highlightId
                        ? {
                              ...h,
                              likes: params.isLiked ? h.likes - 1 : h.likes + 1,
                              is_liked: !params.isLiked,
                          }
                        : h
                );
            });

            return { previousData };
        },

        // Revert on error
        onError: (err, params, context) => {
            if (context?.previousData) {
                queryClient.setQueryData(highlightQueryKeys.lists(), context.previousData);
            }
        },

        // Only invalidate specific highlight
        onSettled: (data, error, params) => {
            queryClient.invalidateQueries({
                queryKey: highlightQueryKeys.detail(params.highlightId),
            });
        },
    });
}
```

**1.2 Test optimistic updates**

```bash
# User should see immediate feedback
# Network failure should revert
```

---

### Step 2: Fix Offline Queue (1.5h)

**2.1 Update network.ts**

```typescript
// src/lib/network.ts
async process() {
    if (this.processing || this.queue.length === 0) return;

    const online = await isOnline();
    if (!online) return;

    this.processing = true;

    while (this.queue.length > 0) {
        const item = this.queue[0];

        try {
            await item.action();
            this.queue.shift(); // Success
        } catch (error) {
            item.retryCount++;
            const err = error as any;

            // Don't retry auth/permission errors
            if (err.status === 401 || err.status === 403) {
                console.error('Auth error, discarding:', error);
                this.queue.shift();
                continue;
            }

            if (item.retryCount >= 3) {
                console.error('Max retries reached, discarding:', error);
                this.queue.shift();
            } else {
                // Exponential backoff
                const delay = Math.min(1000 * Math.pow(2, item.retryCount), 10000);
                await new Promise((r) => setTimeout(r, delay));
                // Don't re-queue, just retry current
            }
        }
    }

    this.processing = false;
}
```

**2.2 Add retry constants**

```typescript
// src/shared/constants/network.ts
export const NETWORK_CONFIG = {
    MAX_RETRIES: 3,
    BASE_DELAY: 1000,
    MAX_DELAY: 10000,
    NON_RETRYABLE_CODES: [401, 403, 404],
} as const;
```

---

### Step 3: FlatList Optimization (1h)

**3.1 Update chat.tsx**

```typescript
// app/match/chat.tsx
const MESSAGE_HEIGHT = 60; // Approximate message height

<FlatList
    data={messages}
    keyExtractor={(item) => item.id}
    renderItem={renderMessage}
    removeClippedSubviews={true}
    maxToRenderPerBatch={25}
    updateCellsBatchingPeriod={50}
    initialNumToRender={20}
    windowSize={10}
    getItemLayout={(data, index) => ({
        length: MESSAGE_HEIGHT,
        offset: MESSAGE_HEIGHT * index,
        index,
    })}
    inverted
    contentContainerStyle={styles.messagesList}
/>
```

**3.2 Update feed (index.tsx)**

```typescript
// app/(tabs)/index.tsx
const HIGHLIGHT_CARD_HEIGHT = 600;

<FlatList
    data={highlights}
    keyExtractor={(item) => item.id}
    renderItem={renderHighlight}
    removeClippedSubviews={true}
    maxToRenderPerBatch={5}
    initialNumToRender={3}
    windowSize={5}
    getItemLayout={(data, index) => ({
        length: HIGHLIGHT_CARD_HEIGHT,
        offset: HIGHLIGHT_CARD_HEIGHT * index,
        index,
    })}
/>
```

---

### Step 4: Fix API Wrapper (1h)

**4.1 Remove double cache fetch**

```typescript
// src/lib/apiWrapper.ts
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
                    console.error(`Queue failed for ${key}:`, err);
                }
            });
        }
        return { data: null, error: "No internet connection" };
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

### Step 5: Standardize Cache TTL (0.5h)

**5.1 Create cache constants**

```typescript
// src/shared/constants/cache.ts
export const CACHE_TTL = {
    REAL_TIME: 10000, // 10s - Active bookings
    FREQUENT: 60000, // 1min - Highlights, user data
    NORMAL: 300000, // 5min - Courts, stable data
    LONG: 600000, // 10min - Reference data
} as const;
```

**5.2 Update query hooks**

```typescript
// src/features/highlights/hooks/useHighlights.ts
import { CACHE_TTL } from "@/shared/constants/cache";

export function useHighlights(params: { limit?: number } = {}) {
    return useQuery({
        queryKey: highlightQueryKeys.list(params),
        queryFn: async () => {
            const result = await HighlightService.getHighlights(params);
            if (!result.success) throw new Error(result.error);
            return result.data;
        },
        staleTime: CACHE_TTL.FREQUENT,
        gcTime: CACHE_TTL.FREQUENT * 2,
    });
}
```

---

### Step 6: Add Performance Monitoring (1h)

**6.1 Create performance utilities**

```typescript
// src/shared/utils/performance.ts
export function measureRenderTime(componentName: string) {
    const start = performance.now();
    return () => {
        const end = performance.now();
        if (__DEV__) {
            console.log(`[Performance] ${componentName}: ${(end - start).toFixed(2)}ms`);
        }
    };
}

export function logCacheStats(queryClient: QueryClient) {
    const cache = queryClient.getQueryCache();
    const queries = cache.getAll();

    console.log("[Cache Stats]", {
        total: queries.length,
        active: queries.filter((q) => q.state.status === "success").length,
        stale: queries.filter((q) => q.isStale()).length,
    });
}
```

**6.2 Add to components**

```typescript
// In HighlightCard
useEffect(() => {
    const measure = measureRenderTime("HighlightCard");
    return measure;
}, []);
```

---

## Todo Checklist

### Cache Optimization

- [ ] Implement optimistic toggleLike
- [ ] Add onMutate handlers
- [ ] Add error rollback
- [ ] Test optimistic updates
- [ ] Verify network savings

### Offline Queue

- [ ] Add exponential backoff
- [ ] Detect auth errors
- [ ] Add retry constants
- [ ] Test retry logic
- [ ] Test auth error handling

### FlatList

- [ ] Update chat.tsx FlatList
- [ ] Update feed FlatList
- [ ] Add getItemLayout
- [ ] Test scroll performance
- [ ] Measure memory usage

### API Wrapper

- [ ] Remove double cache fetch
- [ ] Simplify offline logic
- [ ] Test cache behavior
- [ ] Verify no regressions

### Cache TTL

- [ ] Create CACHE_TTL constants
- [ ] Update all query hooks
- [ ] Document cache strategy
- [ ] Test cache invalidation

### Performance Monitoring

- [ ] Create performance utils
- [ ] Add render time logging
- [ ] Add cache stats logging
- [ ] Test on device

---

## Success Criteria

- [ ] No full feed refetch on single like
- [ ] Offline queue handles auth errors
- [ ] Exponential backoff working
- [ ] FlatList scroll 60fps
- [ ] No double cache fetches
- [ ] Cache TTL consistent
- [ ] Performance metrics logged

---

## Risk Assessment

| Risk                     | Mitigation                          |
| ------------------------ | ----------------------------------- |
| Optimistic update bugs   | Thorough testing, rollback on error |
| FlatList layout shifts   | Test getItemLayout accuracy         |
| Cache TTL too aggressive | Conservative defaults, monitor      |
| Performance regression   | Benchmark before/after              |

---

## Next Steps

After Phase 5 completion:

1. Benchmark performance improvements
2. Document optimization patterns
3. Proceed to Phase 6 (Documentation)

---

**Estimated Effort:** 6 hours
**Depends On:** Phase 4 (imports must be fixed)
**Performance Gains:** 30-50% network reduction, smoother scrolling
