/**
 * Performance monitoring utilities
 * @module shared/utils/performance
 */

import type { QueryClient } from "@tanstack/react-query";

/**
 * Measure component render time
 * @param componentName - Name of component for logging
 * @returns Cleanup function that logs elapsed time
 * @example
 * useEffect(() => {
 *     const measure = measureRenderTime("MyComponent");
 *     return measure;
 * }, []);
 */
export function measureRenderTime(componentName: string) {
    const start = performance.now();
    return () => {
        const end = performance.now();
        if (__DEV__) {
            console.log(`[Performance] ${componentName}: ${(end - start).toFixed(2)}ms`);
        }
    };
}

/**
 * Log React Query cache statistics
 * @param queryClient - React Query client instance
 */
export function logCacheStats(queryClient: QueryClient) {
    const cache = queryClient.getQueryCache();
    const queries = cache.getAll();

    if (__DEV__) {
        console.log("[Cache Stats]", {
            total: queries.length,
            active: queries.filter((q) => q.state.status === "success").length,
            stale: queries.filter((q) => q.isStale()).length,
        });
    }
}
