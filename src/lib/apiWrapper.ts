/**
 * Network-aware wrapper for API calls with offline queue
 * @module lib/apiWrapper
 */

import { isOnline, offlineQueue } from "./network";
import { cache } from "./storage";

export interface ApiResponse<T> {
    data: T | null;
    error: string | null;
    cached?: boolean;
}

/**
 * Wrapper for API calls with offline support and caching
 */
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

    // Single cache check - avoid double fetch
    if (useCache) {
        const cached = cache.get<T>(key);
        if (cached) {
            return { data: cached, error: null, cached: true };
        }
    }

    // Check if online
    const online = await isOnline();

    if (!online) {
        // If offline and queuing enabled, add to queue
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

    // Make API call
    try {
        const result = await apiFunction();

        // Cache successful responses
        if (result.data && useCache) {
            cache.set(key, result.data, cacheTTL);
        }

        return result;
    } catch (error) {
        return { data: null, error: (error as Error).message };
    }
}
