/**
 * Background Upload Manager
 * Handles video uploads in background using expo-task-manager
 */

import { logger } from "./logger";
import AsyncStorage from "@react-native-async-storage/async-storage";

const bgLogger = logger.create("BackgroundUpload");

const UPLOAD_QUEUE_KEY = "@pending_uploads";
const UPLOAD_PROGRESS_KEY = "@upload_progress";

export interface PendingUpload {
    id: string;
    localUri: string;
    courtId: string;
    title: string;
    description?: string;
    highlightEvents?: any[];
    status: "pending" | "uploading" | "completed" | "failed";
    progress: number;
    createdAt: number;
    error?: string;
    retries: number;
}

/**
 * Background Upload Queue Manager
 */
export const BackgroundUploadManager = {
    /**
     * Add video to upload queue
     */
    queueUpload: async (
        upload: Omit<PendingUpload, "id" | "status" | "progress" | "createdAt" | "retries">
    ): Promise<string> => {
        const id = `upload_${Date.now()}_${Math.random().toString(36).slice(2)}`;

        const pendingUpload: PendingUpload = {
            ...upload,
            id,
            status: "pending",
            progress: 0,
            createdAt: Date.now(),
            retries: 0,
        };

        const queue = await BackgroundUploadManager.getQueue();
        queue.push(pendingUpload);
        await AsyncStorage.setItem(UPLOAD_QUEUE_KEY, JSON.stringify(queue));

        bgLogger.debug("Upload queued", { id, title: upload.title });
        return id;
    },

    /**
     * Get all pending uploads
     */
    getQueue: async (): Promise<PendingUpload[]> => {
        const data = await AsyncStorage.getItem(UPLOAD_QUEUE_KEY);
        if (!data) return [];
        try {
            return JSON.parse(data);
        } catch {
            return [];
        }
    },

    /**
     * Update upload status
     */
    updateUpload: async (id: string, updates: Partial<PendingUpload>): Promise<void> => {
        const queue = await BackgroundUploadManager.getQueue();
        const updatedQueue = queue.map((u) => (u.id === id ? { ...u, ...updates } : u));
        await AsyncStorage.setItem(UPLOAD_QUEUE_KEY, JSON.stringify(updatedQueue));
    },

    /**
     * Update upload progress
     */
    updateProgress: async (id: string, progress: number): Promise<void> => {
        await BackgroundUploadManager.updateUpload(id, { progress });
        // Also store in separate key for quick access
        await AsyncStorage.setItem(`${UPLOAD_PROGRESS_KEY}_${id}`, progress.toString());
    },

    /**
     * Get upload progress
     */
    getProgress: async (id: string): Promise<number> => {
        const progress = await AsyncStorage.getItem(`${UPLOAD_PROGRESS_KEY}_${id}`);
        return progress ? parseInt(progress, 10) : 0;
    },

    /**
     * Mark upload as completed
     */
    completeUpload: async (id: string): Promise<void> => {
        await BackgroundUploadManager.updateUpload(id, {
            status: "completed",
            progress: 100,
        });
        bgLogger.info("Upload completed", { id });
    },

    /**
     * Mark upload as failed
     */
    failUpload: async (id: string, error: string): Promise<void> => {
        const queue = await BackgroundUploadManager.getQueue();
        const upload = queue.find((u) => u.id === id);

        await BackgroundUploadManager.updateUpload(id, {
            status: "failed",
            error,
            retries: (upload?.retries || 0) + 1,
        });
        bgLogger.error("Upload failed", { id, error });
    },

    /**
     * Remove upload from queue
     */
    removeUpload: async (id: string): Promise<void> => {
        const queue = await BackgroundUploadManager.getQueue();
        const filtered = queue.filter((u) => u.id !== id);
        await AsyncStorage.setItem(UPLOAD_QUEUE_KEY, JSON.stringify(filtered));
        await AsyncStorage.removeItem(`${UPLOAD_PROGRESS_KEY}_${id}`);
    },

    /**
     * Get pending uploads count
     */
    getPendingCount: async (): Promise<number> => {
        const queue = await BackgroundUploadManager.getQueue();
        return queue.filter((u) => u.status === "pending" || u.status === "uploading").length;
    },

    /**
     * Get failed uploads for retry
     */
    getFailedUploads: async (): Promise<PendingUpload[]> => {
        const queue = await BackgroundUploadManager.getQueue();
        return queue.filter((u) => u.status === "failed" && u.retries < 3);
    },

    /**
     * Retry failed upload
     */
    retryUpload: async (id: string): Promise<void> => {
        await BackgroundUploadManager.updateUpload(id, {
            status: "pending",
            progress: 0,
            error: undefined,
        });
        bgLogger.debug("Upload queued for retry", { id });
    },

    /**
     * Clear completed uploads
     */
    clearCompleted: async (): Promise<void> => {
        const queue = await BackgroundUploadManager.getQueue();
        const pending = queue.filter((u) => u.status !== "completed");
        await AsyncStorage.setItem(UPLOAD_QUEUE_KEY, JSON.stringify(pending));
    },

    /**
     * Process next pending upload
     * Returns the upload to process, or null if none
     */
    getNextPending: async (): Promise<PendingUpload | null> => {
        const queue = await BackgroundUploadManager.getQueue();
        return queue.find((u) => u.status === "pending") || null;
    },

    /**
     * Check if any uploads are in progress
     */
    hasActiveUpload: async (): Promise<boolean> => {
        const queue = await BackgroundUploadManager.getQueue();
        return queue.some((u) => u.status === "uploading");
    },
};

/**
 * Note: For full background upload support, you need:
 *
 * 1. Install expo-task-manager and expo-background-fetch:
 *    npx expo install expo-task-manager expo-background-fetch
 *
 * 2. Register background task:
 *    TaskManager.defineTask(BACKGROUND_UPLOAD_TASK, async () => {
 *        const next = await BackgroundUploadManager.getNextPending();
 *        if (next) {
 *            await processUpload(next);
 *        }
 *        return BackgroundFetch.BackgroundFetchResult.NewData;
 *    });
 *
 * 3. Request background fetch:
 *    await BackgroundFetch.registerTaskAsync(BACKGROUND_UPLOAD_TASK, {
 *        minimumInterval: 15 * 60, // 15 minutes
 *        stopOnTerminate: false,
 *        startOnBoot: true,
 *    });
 */
