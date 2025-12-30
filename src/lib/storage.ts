/**
 * Storage utility using MMKV for high-performance local storage
 * @module lib/storage
 */

import { MMKV } from "react-native-mmkv";

// Singleton storage instance
let storage: MMKV | null = null;

/**
 * Get encryption key from environment variables
 * @throws Error if encryption key not configured
 */
const getEncryptionKey = (): string => {
    const key = process.env.EXPO_PUBLIC_ENCRYPTION_KEY;

    if (!key) {
        throw new Error(
            "MMKV encryption key not configured. " +
                "Set EXPO_PUBLIC_ENCRYPTION_KEY in your .env file."
        );
    }

    return key;
};

/**
 * Get or initialize MMKV storage instance with lazy loading
 * @returns MMKV instance with encryption enabled
 */
export const getStorage = (): MMKV => {
    if (!storage) {
        storage = new MMKV({
            id: "my2light-storage",
            encryptionKey: getEncryptionKey(),
        });
    }
    return storage;
};

/**
 * Storage interface for Zustand persistence
 */
export const zustandStorage = {
    setItem: (name: string, value: string) => {
        getStorage().set(name, value);
    },
    getItem: (name: string): string | null => {
        const value = getStorage().getString(name);
        return value ?? null;
    },
    removeItem: (name: string) => {
        getStorage().delete(name);
    },
};

/**
 * Cache helpers for API responses
 */
export const cache = {
    set: (key: string, data: any, ttl?: number) => {
        const item = {
            data,
            timestamp: Date.now(),
            ttl: ttl || 300000, // Default 5 minutes
        };
        getStorage().set(key, JSON.stringify(item));
    },

    get: <T = any>(key: string): T | null => {
        const item = getStorage().getString(key);
        if (!item) return null;

        try {
            const parsed = JSON.parse(item);
            const isExpired = Date.now() - parsed.timestamp > parsed.ttl;

            if (isExpired) {
                getStorage().delete(key);
                return null;
            }

            return parsed.data as T;
        } catch {
            return null;
        }
    },

    clear: (pattern?: string) => {
        if (pattern) {
            const keys = getStorage().getAllKeys();
            keys.forEach((key: string) => {
                if (key.includes(pattern)) {
                    getStorage().delete(key);
                }
            });
        } else {
            getStorage().clearAll();
        }
    },
};
