/**
 * Cache TTL (Time To Live) constants
 * @module shared/constants/cache
 */

export const CACHE_TTL = {
    REAL_TIME: 10000, // 10s - Active bookings, real-time data
    FREQUENT: 60000, // 1min - Highlights, user data
    NORMAL: 300000, // 5min - Courts, stable data
    LONG: 600000, // 10min - Reference data, rarely changes
} as const;
