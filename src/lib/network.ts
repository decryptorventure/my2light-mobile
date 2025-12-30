/**
 * Network utility for detecting online/offline status
 * @module lib/network
 */

import NetInfo from "@react-native-community/netinfo";
import { useEffect, useState } from "react";

/**
 * Check if device is currently online
 */
export const isOnline = async (): Promise<boolean> => {
    const state = await NetInfo.fetch();
    return state.isConnected ?? false;
};

/**
 * Hook to monitor network status
 */
export const useNetworkStatus = () => {
    const [isConnected, setIsConnected] = useState<boolean | null>(null);

    useEffect(() => {
        const unsubscribe = NetInfo.addEventListener((state) => {
            setIsConnected(state.isConnected ?? false);
        });

        return () => unsubscribe();
    }, []);

    return isConnected;
};

/**
 * Queue for offline actions
 */
type QueuedAction = {
    id: string;
    action: () => Promise<any>;
    retryCount: number;
};

class OfflineQueue {
    private queue: QueuedAction[] = [];
    private processing = false;

    add(action: () => Promise<any>) {
        const id = Date.now().toString() + Math.random();
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

// Auto-process queue when coming back online
NetInfo.addEventListener((state) => {
    if (state.isConnected) {
        offlineQueue.process();
    }
});
