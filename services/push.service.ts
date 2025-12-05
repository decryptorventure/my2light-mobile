/**
 * Push Notification Service
 * Handles Expo Push Notifications for booking alerts
 */

import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";
import Constants from "expo-constants";
import { supabase } from "../lib/supabase";

// Configure notification handling
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
    }),
});

export const PushNotificationService = {
    /**
     * Register for push notifications and save token to profile
     */
    registerForPushNotifications: async (): Promise<string | null> => {
        // Skip on simulator/emulator
        if (!Device.isDevice) {
            console.log("Push notifications require a physical device");
            return null;
        }

        try {
            // Check existing permission
            const { status: existingStatus } = await Notifications.getPermissionsAsync();
            let finalStatus = existingStatus;

            // Request permission if not granted
            if (existingStatus !== "granted") {
                const { status } = await Notifications.requestPermissionsAsync();
                finalStatus = status;
            }

            if (finalStatus !== "granted") {
                console.log("Push notification permission not granted");
                return null;
            }

            // Get project ID from Constants (works in both dev and production)
            const projectId = Constants.expoConfig?.extra?.eas?.projectId
                ?? Constants.easConfig?.projectId;

            if (!projectId) {
                console.log("No projectId found - push notifications disabled in dev mode");
                return null;
            }

            // Get Expo push token
            const token = await Notifications.getExpoPushTokenAsync({
                projectId,
            });

            // Save token to user profile
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                await supabase
                    .from("profiles")
                    .update({ push_token: token.data })
                    .eq("id", user.id);
            }

            // Configure Android channel
            if (Platform.OS === "android") {
                await Notifications.setNotificationChannelAsync("booking", {
                    name: "Booking Notifications",
                    importance: Notifications.AndroidImportance.HIGH,
                    vibrationPattern: [0, 250, 250, 250],
                    lightColor: "#00D4AA",
                });
            }

            return token.data;
        } catch (error) {
            console.error("Failed to register push notifications:", error);
            return null;
        }
    },

    /**
     * Send local notification (for testing)
     */
    sendLocalNotification: async (title: string, body: string, data?: object) => {
        await Notifications.scheduleNotificationAsync({
            content: {
                title,
                body,
                data: data || {},
                sound: true,
            },
            trigger: null, // Immediate
        });
    },

    /**
     * Send push notification to court owner when new booking is created
     * This should be called from a backend/Supabase Edge Function
     */
    notifyCourtOwner: async (ownerId: string, bookingData: {
        courtName: string;
        playerName: string;
        startTime: string;
        totalAmount: number;
    }) => {
        // Get owner's push token
        const { data: owner } = await supabase
            .from("profiles")
            .select("push_token, name")
            .eq("id", ownerId)
            .single();

        if (!owner?.push_token) {
            console.log("Owner has no push token");
            return false;
        }

        // Send via Expo Push API
        const message = {
            to: owner.push_token,
            sound: "default",
            title: "🎾 Booking mới!",
            body: `${bookingData.playerName} đặt sân ${bookingData.courtName}`,
            data: {
                type: "new_booking",
                ...bookingData,
            },
        };

        try {
            const response = await fetch("https://exp.host/--/api/v2/push/send", {
                method: "POST",
                headers: {
                    Accept: "application/json",
                    "Accept-encoding": "gzip, deflate",
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(message),
            });

            const result = await response.json();
            console.log("Push notification sent:", result);
            return true;
        } catch (error) {
            console.error("Failed to send push notification:", error);
            return false;
        }
    },

    /**
     * Create in-app notification record
     */
    createNotification: async (userId: string, data: {
        type: string;
        title: string;
        message: string;
        metadata?: object;
    }) => {
        const { error } = await supabase.from("notifications").insert({
            user_id: userId,
            type: data.type,
            title: data.title,
            message: data.message,
            metadata: data.metadata || {},
            is_read: false,
        });

        return !error;
    },

    /**
     * Add notification listeners
     */
    addNotificationListeners: (handlers: {
        onReceive?: (notification: Notifications.Notification) => void;
        onTap?: (response: Notifications.NotificationResponse) => void;
    }) => {
        const subscriptions: Notifications.Subscription[] = [];

        if (handlers.onReceive) {
            subscriptions.push(
                Notifications.addNotificationReceivedListener(handlers.onReceive)
            );
        }

        if (handlers.onTap) {
            subscriptions.push(
                Notifications.addNotificationResponseReceivedListener(handlers.onTap)
            );
        }

        // Return cleanup function
        return () => {
            subscriptions.forEach((sub) => sub.remove());
        };
    },

    /**
     * Get badge count
     */
    getBadgeCount: async (): Promise<number> => {
        return await Notifications.getBadgeCountAsync();
    },

    /**
     * Set badge count
     */
    setBadgeCount: async (count: number): Promise<void> => {
        await Notifications.setBadgeCountAsync(count);
    },

    /**
     * Clear all notifications
     */
    clearAllNotifications: async (): Promise<void> => {
        await Notifications.dismissAllNotificationsAsync();
        await Notifications.setBadgeCountAsync(0);
    },
};
