/**
 * Push Notification Hook
 * Register for push notifications and handle incoming notifications
 */

import { useEffect, useRef } from "react";
import { useRouter } from "expo-router";
import { PushNotificationService } from "../services/push.service";
import * as Notifications from "expo-notifications";

export function usePushNotifications() {
    const router = useRouter();
    const notificationListener = useRef<Notifications.Subscription>();
    const responseListener = useRef<Notifications.Subscription>();

    useEffect(() => {
        // Register for push notifications
        PushNotificationService.registerForPushNotifications();

        // Handle notification received while app is foregrounded
        notificationListener.current = Notifications.addNotificationReceivedListener(
            (notification) => {
                console.log("Notification received:", notification);
            }
        );

        // Handle notification tap
        responseListener.current = Notifications.addNotificationResponseReceivedListener(
            (response) => {
                const data = response.notification.request.content.data;
                console.log("Notification tapped:", data);

                // Navigate based on notification type
                if (data?.type === "new_booking") {
                    router.push("/admin/bookings");
                } else if (data?.type === "booking_approved") {
                    router.push("/my-bookings");
                } else if (data?.type === "highlight_ready") {
                    router.push("/(tabs)/library");
                }
            }
        );

        return () => {
            if (notificationListener.current) {
                Notifications.removeNotificationSubscription(notificationListener.current);
            }
            if (responseListener.current) {
                Notifications.removeNotificationSubscription(responseListener.current);
            }
        };
    }, [router]);
}
