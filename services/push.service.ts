/**
 * Push Notification Service
 * Handles Expo Push Notifications for booking alerts
 */

import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";
import Constants from "expo-constants";
import { supabase } from "../lib/supabase";
import { logger } from "../lib/logger";

const pushLogger = logger.create('Push');

// Configure notification handling
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

export const PushNotificationService = {
    /**
     * Register for push notifications and save token to profile
     */
    registerForPushNotifications: async (): Promise<string | null> => {
        // Skip on simulator/emulator
        if (!Device.isDevice) {
            pushLogger.debug("Push notifications require a physical device");
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
                pushLogger.debug("Push notification permission not granted");
                return null;
            }

            // Get project ID from Constants (works in both dev and production)
            const projectId = Constants.expoConfig?.extra?.eas?.projectId
                ?? Constants.easConfig?.projectId;

            if (!projectId) {
                pushLogger.debug("No projectId found - push notifications disabled in dev mode");
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
            pushLogger.error("Failed to register push notifications", error);
            return null;
        }
    },

    /**
     * Send local notification (for testing)
     */
    sendLocalNotification: async (title: string, body: string, data?: Record<string, unknown>) => {
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
            pushLogger.debug("Owner has no push token");
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
            pushLogger.debug("Push notification sent", { status: result.status });
            return true;
        } catch (error) {
            pushLogger.error("Failed to send push notification", error);
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

    /**
     * Notify court owner about a new pending booking
     */
    notifyBookingCreated: async (bookingData: {
        courtId: string;
        courtName: string;
        playerName: string;
        playerId: string;
        startTime: string;
        totalAmount: number;
        bookingId: string;
    }) => {
        try {
            // Get court owner
            const { data: court } = await supabase
                .from("courts")
                .select("owner_id")
                .eq("id", bookingData.courtId)
                .single();

            if (!court?.owner_id) return false;

            // Get owner's push token
            const { data: owner } = await supabase
                .from("profiles")
                .select("push_token")
                .eq("id", court.owner_id)
                .single();

            // Create in-app notification
            await PushNotificationService.createNotification(court.owner_id, {
                type: "booking_pending",
                title: "🎾 Có đặt sân mới!",
                message: `${bookingData.playerName} đặt ${bookingData.courtName} lúc ${bookingData.startTime}`,
                metadata: {
                    bookingId: bookingData.bookingId,
                    courtId: bookingData.courtId,
                    playerId: bookingData.playerId,
                },
            });

            // Send push if owner has token
            if (owner?.push_token) {
                await fetch("https://exp.host/--/api/v2/push/send", {
                    method: "POST",
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        to: owner.push_token,
                        sound: "default",
                        title: "🎾 Có đặt sân mới!",
                        body: `${bookingData.playerName} đặt ${bookingData.courtName}`,
                        data: {
                            type: "booking_pending",
                            bookingId: bookingData.bookingId,
                        },
                    }),
                });
            }

            pushLogger.info("Booking created notification sent", { bookingId: bookingData.bookingId });
            return true;
        } catch (error) {
            pushLogger.error("Failed to send booking created notification", error);
            return false;
        }
    },

    /**
     * Notify user when their booking status changes
     */
    notifyBookingStatusChanged: async (data: {
        bookingId: string;
        userId: string;
        courtName: string;
        newStatus: 'approved' | 'rejected' | 'cancelled';
        reason?: string;
    }) => {
        try {
            // Get user's push token
            const { data: user } = await supabase
                .from("profiles")
                .select("push_token")
                .eq("id", data.userId)
                .single();

            // Prepare notification content based on status
            let title = "";
            let message = "";
            let type = "";

            switch (data.newStatus) {
                case "approved":
                    title = "✅ Đặt sân được duyệt!";
                    message = `Booking ${data.courtName} đã được chủ sân xác nhận`;
                    type = "booking_approved";
                    break;
                case "rejected":
                    title = "❌ Đặt sân bị từ chối";
                    message = data.reason
                        ? `${data.courtName}: ${data.reason}. Tiền đã được hoàn lại.`
                        : `${data.courtName} đã bị từ chối. Tiền đã được hoàn lại.`;
                    type = "booking_rejected";
                    break;
                case "cancelled":
                    title = "⚠️ Đặt sân bị hủy";
                    message = data.reason
                        ? `${data.courtName}: ${data.reason}`
                        : `${data.courtName} đã bị hủy`;
                    type = "booking_cancelled";
                    break;
            }

            // Create in-app notification
            await PushNotificationService.createNotification(data.userId, {
                type,
                title,
                message,
                metadata: { bookingId: data.bookingId },
            });

            // Send push notification if user has token
            if (user?.push_token) {
                await fetch("https://exp.host/--/api/v2/push/send", {
                    method: "POST",
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        to: user.push_token,
                        sound: "default",
                        title,
                        body: message,
                        data: {
                            type,
                            bookingId: data.bookingId,
                        },
                    }),
                });
            }

            pushLogger.info("Booking status notification sent", {
                bookingId: data.bookingId,
                status: data.newStatus
            });
            return true;
        } catch (error) {
            pushLogger.error("Failed to send status notification", error);
            return false;
        }
    },

    /**
     * Notify user about upcoming booking (30 min before)
     */
    notifyUpcomingBooking: async (data: {
        bookingId: string;
        userId: string;
        courtName: string;
        startTime: string;
    }) => {
        try {
            const { data: user } = await supabase
                .from("profiles")
                .select("push_token")
                .eq("id", data.userId)
                .single();

            const title = "⏰ Sắp đến giờ đá!";
            const message = `${data.courtName} lúc ${data.startTime}. Chuẩn bị ra sân nhé!`;

            // Create in-app notification
            await PushNotificationService.createNotification(data.userId, {
                type: "booking_reminder",
                title,
                message,
                metadata: { bookingId: data.bookingId },
            });

            // Send push
            if (user?.push_token) {
                await fetch("https://exp.host/--/api/v2/push/send", {
                    method: "POST",
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        to: user.push_token,
                        sound: "default",
                        title,
                        body: message,
                        data: {
                            type: "booking_reminder",
                            bookingId: data.bookingId,
                        },
                    }),
                });
            }

            return true;
        } catch (error) {
            pushLogger.error("Failed to send reminder notification", error);
            return false;
        }
    },
};

