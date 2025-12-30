import { supabase } from "../lib/supabase";
import { ApiResponse } from "../types";
import { logger } from "../lib/logger";

const notifLogger = logger.create("Notification");

export const NotificationService = {
    getNotifications: async (limit = 20): Promise<ApiResponse<any[]>> => {
        const {
            data: { user },
        } = await supabase.auth.getUser();
        if (!user) return { success: false, data: [] };

        try {
            const { data, error } = await supabase
                .from("notifications")
                .select("*")
                .eq("user_id", user.id)
                .order("created_at", { ascending: false })
                .limit(limit);

            if (error) {
                notifLogger.error("getNotifications error", error);
                return { success: false, data: [] };
            }

            return {
                success: true,
                data: (data || []).map((n: any) => ({
                    id: n.id,
                    type: n.type,
                    title: n.title,
                    message: n.message,
                    isRead: n.is_read,
                    createdAt: n.created_at,
                    metadata: n.metadata,
                })),
            };
        } catch (e) {
            notifLogger.error("getNotifications exception", e);
            return { success: false, data: [] };
        }
    },

    markNotificationRead: async (notificationId: string): Promise<ApiResponse<boolean>> => {
        const {
            data: { user },
        } = await supabase.auth.getUser();
        if (!user) return { success: false, data: false };

        const { error } = await supabase
            .from("notifications")
            .update({ is_read: true })
            .eq("id", notificationId)
            .eq("user_id", user.id);

        if (error) return { success: false, data: false };
        return { success: true, data: true };
    },

    markAllNotificationsRead: async (): Promise<ApiResponse<boolean>> => {
        const {
            data: { user },
        } = await supabase.auth.getUser();
        if (!user) return { success: false, data: false };

        const { error } = await supabase
            .from("notifications")
            .update({ is_read: true })
            .eq("user_id", user.id)
            .eq("is_read", false);

        if (error) return { success: false, data: false };
        return { success: true, data: true };
    },

    getUnreadNotificationCount: async (): Promise<ApiResponse<number>> => {
        const {
            data: { user },
        } = await supabase.auth.getUser();
        if (!user) return { success: false, data: 0 };

        const { count, error } = await supabase
            .from("notifications")
            .select("*", { count: "exact", head: true })
            .eq("user_id", user.id)
            .eq("is_read", false);

        if (error) return { success: false, data: 0 };
        return { success: true, data: count || 0 };
    },
};
