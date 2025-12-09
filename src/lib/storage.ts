/**
 * Storage utility using MMKV for high-performance local storage
 * @module lib/storage
 */

import { MMKV } from 'react-native-mmkv';

export const storage = new MMKV({
    id: 'my2light-storage',
    encryptionKey: 'my2light-encryption-key', // In production, use secure key from env
});

/**
 * Storage interface for Zustand persistence
 */
export const zustandStorage = {
    setItem: (name: string, value: string) => {
        storage.set(name, value);
    },
    getItem: (name: string): string | null => {
        const value = storage.getString(name);
        return value ?? null;
    },
    removeItem: (name: string) => {
        storage.delete(name);
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
        storage.set(key, JSON.stringify(item));
    },

    get: <T = any>(key: string): T | null => {
        const item = storage.getString(key);
        if (!item) return null;

        try {
            const parsed = JSON.parse(item);
            const isExpired = Date.now() - parsed.timestamp > parsed.ttl;

            if (isExpired) {
                storage.delete(key);
                return null;
            }

            return parsed.data as T;
        } catch {
            return null;
        }
    },

    clear: (pattern?: string) => {
        if (pattern) {
            const keys = storage.getAllKeys();
            keys.forEach((key: string) => {
                if (key.includes(pattern)) {
                    storage.delete(key);
                }
            });
        } else {
            storage.clearAll();
        }
    },
};
