/**
 * Network Connectivity Hook
 * Monitors network status and provides offline handling utilities
 */

import { useState, useEffect, useCallback } from 'react';
import NetInfo, { NetInfoState, NetInfoSubscription } from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { logger } from '../lib/logger';

const networkLogger = logger.create('Network');

// Use AsyncStorage for offline queue (more compatible than MMKV for this use case)
const QUEUE_STORAGE_KEY = '@offline_queue';

interface QueuedAction {
    id: string;
    type: 'upload' | 'api_call' | 'sync';
    payload: any;
    timestamp: number;
    retries: number;
}

interface NetworkStatus {
    isConnected: boolean;
    isInternetReachable: boolean | null;
    type: string;
}

/**
 * Hook to monitor network connectivity
 */
export function useNetworkStatus() {
    const [status, setStatus] = useState<NetworkStatus>({
        isConnected: true,
        isInternetReachable: true,
        type: 'unknown',
    });

    useEffect(() => {
        let unsubscribe: NetInfoSubscription;

        const initNetworkListener = async () => {
            // Get initial state
            const state = await NetInfo.fetch();
            updateStatus(state);

            // Subscribe to changes
            unsubscribe = NetInfo.addEventListener(updateStatus);
        };

        const updateStatus = (state: NetInfoState) => {
            const newStatus: NetworkStatus = {
                isConnected: state.isConnected ?? false,
                isInternetReachable: state.isInternetReachable,
                type: state.type,
            };

            setStatus(newStatus);

            if (!newStatus.isConnected) {
                networkLogger.warn('Network disconnected');
            } else if (newStatus.isConnected && !status.isConnected) {
                networkLogger.info('Network reconnected');
            }
        };

        initNetworkListener();

        return () => {
            unsubscribe?.();
        };
    }, []);

    return status;
}

/**
 * Offline Queue Manager
 * Queues actions when offline and processes them when back online
 * Using AsyncStorage for persistence
 */
export const OfflineQueue = {
    QUEUE_KEY: QUEUE_STORAGE_KEY,

    /**
     * Add an action to the offline queue
     */
    enqueue: async (type: QueuedAction['type'], payload: any): Promise<string> => {
        const action: QueuedAction = {
            id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
            type,
            payload,
            timestamp: Date.now(),
            retries: 0,
        };

        const queue = await OfflineQueue.getQueue();
        queue.push(action);
        await AsyncStorage.setItem(OfflineQueue.QUEUE_KEY, JSON.stringify(queue));

        networkLogger.debug('Action queued for offline', { type, id: action.id });
        return action.id;
    },

    /**
     * Get all queued actions
     */
    getQueue: async (): Promise<QueuedAction[]> => {
        const data = await AsyncStorage.getItem(OfflineQueue.QUEUE_KEY);
        if (!data) return [];
        try {
            return JSON.parse(data);
        } catch {
            return [];
        }
    },

    /**
     * Remove a processed action from the queue
     */
    dequeue: async (actionId: string): Promise<void> => {
        const queue = await OfflineQueue.getQueue();
        const filtered = queue.filter(a => a.id !== actionId);
        await AsyncStorage.setItem(OfflineQueue.QUEUE_KEY, JSON.stringify(filtered));
    },

    /**
     * Update retry count for an action
     */
    updateRetries: async (actionId: string): Promise<void> => {
        const queue = await OfflineQueue.getQueue();
        const updated = queue.map(a => {
            if (a.id === actionId) {
                return { ...a, retries: a.retries + 1 };
            }
            return a;
        });
        await AsyncStorage.setItem(OfflineQueue.QUEUE_KEY, JSON.stringify(updated));
    },

    /**
     * Get pending count
     */
    getPendingCount: async (): Promise<number> => {
        const queue = await OfflineQueue.getQueue();
        return queue.length;
    },

    /**
     * Clear all queued actions
     */
    clear: async (): Promise<void> => {
        await AsyncStorage.removeItem(OfflineQueue.QUEUE_KEY);
    },
};

/**
 * Hook to use offline queue with automatic sync
 */
export function useOfflineQueue(
    processAction: (action: QueuedAction) => Promise<boolean>
) {
    const { isConnected } = useNetworkStatus();
    const [isProcessing, setIsProcessing] = useState(false);
    const [pendingCount, setPendingCount] = useState(0);

    // Update pending count on mount
    useEffect(() => {
        const loadPendingCount = async () => {
            const count = await OfflineQueue.getPendingCount();
            setPendingCount(count);
        };
        loadPendingCount();
    }, []);

    // Process queue when coming back online
    useEffect(() => {
        if (isConnected && !isProcessing) {
            processQueue();
        }
    }, [isConnected]);

    const processQueue = useCallback(async () => {
        const queue = await OfflineQueue.getQueue();
        if (queue.length === 0) return;

        setIsProcessing(true);
        networkLogger.info('Processing offline queue', { count: queue.length });

        for (const action of queue) {
            if (action.retries >= 3) {
                networkLogger.warn('Action exceeded max retries, removing', { id: action.id });
                await OfflineQueue.dequeue(action.id);
                continue;
            }

            try {
                const success = await processAction(action);
                if (success) {
                    await OfflineQueue.dequeue(action.id);
                    networkLogger.debug('Queued action processed', { id: action.id });
                } else {
                    await OfflineQueue.updateRetries(action.id);
                }
            } catch (error) {
                networkLogger.error('Failed to process queued action', error);
                await OfflineQueue.updateRetries(action.id);
            }
        }

        const count = await OfflineQueue.getPendingCount();
        setPendingCount(count);
        setIsProcessing(false);
    }, [processAction]);

    const queueAction = useCallback(async (type: QueuedAction['type'], payload: any) => {
        const id = await OfflineQueue.enqueue(type, payload);
        const count = await OfflineQueue.getPendingCount();
        setPendingCount(count);
        return id;
    }, []);

    return {
        isConnected,
        isProcessing,
        pendingCount,
        queueAction,
        processQueue,
    };
}

/**
 * Wrapper for API calls with offline support
 */
export async function withOfflineSupport<T>(
    apiCall: () => Promise<T>,
    fallback: T,
    options?: {
        queueOnFailure?: boolean;
        actionType?: QueuedAction['type'];
        payload?: any;
    }
): Promise<{ data: T; fromCache: boolean }> {
    const state = await NetInfo.fetch();

    if (!state.isConnected) {
        if (options?.queueOnFailure && options.actionType && options.payload) {
            OfflineQueue.enqueue(options.actionType, options.payload);
        }
        return { data: fallback, fromCache: true };
    }

    try {
        const data = await apiCall();
        return { data, fromCache: false };
    } catch (error) {
        networkLogger.error('API call failed', error);
        if (options?.queueOnFailure && options.actionType && options.payload) {
            OfflineQueue.enqueue(options.actionType, options.payload);
        }
        return { data: fallback, fromCache: true };
    }
}
