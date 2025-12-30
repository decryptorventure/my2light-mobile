/**
 * Network configuration constants
 * @module shared/constants/network
 */

export const NETWORK_CONFIG = {
    MAX_RETRIES: 3,
    BASE_DELAY: 1000, // 1 second
    MAX_DELAY: 10000, // 10 seconds
    NON_RETRYABLE_CODES: [401, 403, 404],
} as const;
