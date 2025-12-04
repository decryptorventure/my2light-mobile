/**
 * Notifications Screen
 * @description Displays user notifications with real-time updates from Supabase
 * @module app/notifications
 */

import { useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    RefreshControl,
    ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, fontSize, fontWeight, borderRadius } from "../../constants/theme";
import { useNotifications, useMarkNotificationRead, useMarkAllNotificationsRead } from "../../hooks/useApi";
import haptics from "../../lib/haptics";

/**
 * NotificationsScreen - Display and manage user notifications
 * - Fetches real notifications from Supabase
 * - Supports mark as read (single/all)
 * - Pull-to-refresh functionality
 */
export default function NotificationsScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [refreshing, setRefreshing] = useState(false);

    // Real data from API
    const { data: notifications, isLoading, refetch } = useNotifications(50);
    const markAsReadMutation = useMarkNotificationRead();
    const markAllReadMutation = useMarkAllNotificationsRead();

    const onRefresh = async () => {
        setRefreshing(true);
        haptics.light();
        await refetch();
        setRefreshing(false);
    };

    const handleMarkAsRead = (id: string) => {
        haptics.light();
        markAsReadMutation.mutate(id);
    };

    const handleMarkAllAsRead = () => {
        haptics.medium();
        markAllReadMutation.mutate();
    };

    const getIcon = (type: string) => {
        switch (type) {
            case "booking_confirmed":
            case "success":
                return <Ionicons name="checkmark-circle" size={20} color="#22c55e" />;
            case "booking_reminder":
            case "warning":
                return <Ionicons name="warning" size={20} color="#f59e0b" />;
            case "match_found":
            case "info":
                return <Ionicons name="people" size={20} color="#3b82f6" />;
            case "highlight_liked":
                return <Ionicons name="heart" size={20} color="#ef4444" />;
            case "credit_added":
                return <Ionicons name="wallet" size={20} color="#a3e635" />;
            default:
                return <Ionicons name="notifications" size={20} color={colors.accent} />;
        }
    };

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        const now = Date.now();
        const diff = now - date.getTime();
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (days > 0) return `${days} ngày trước`;
        if (hours > 0) return `${hours} giờ trước`;
        return "Vừa xong";
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <Ionicons name="chevron-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={styles.title}>Thông báo</Text>
                <TouchableOpacity onPress={handleMarkAllAsRead} disabled={markAllReadMutation.isPending}>
                    <Text style={styles.markAllText}>Đọc tất cả</Text>
                </TouchableOpacity>
            </View>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
                }
            >
                {isLoading ? (
                    <View style={styles.loadingState}>
                        <ActivityIndicator size="small" color={colors.accent} />
                        <Text style={styles.loadingText}>Đang tải thông báo...</Text>
                    </View>
                ) : !notifications || notifications.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Ionicons name="notifications-off-outline" size={64} color={colors.surfaceLight} />
                        <Text style={styles.emptyText}>Chưa có thông báo nào.</Text>
                    </View>
                ) : (
                    notifications.map((notification: any) => (
                        <TouchableOpacity
                            key={notification.id}
                            style={[
                                styles.notificationCard,
                                notification.isRead && styles.notificationCardRead,
                            ]}
                            onPress={() => handleMarkAsRead(notification.id)}
                            activeOpacity={0.8}
                        >
                            <View style={styles.notificationIcon}>{getIcon(notification.type)}</View>
                            <View style={styles.notificationContent}>
                                <View style={styles.notificationHeader}>
                                    <Text
                                        style={[
                                            styles.notificationTitle,
                                            notification.isRead && styles.notificationTitleRead,
                                        ]}
                                    >
                                        {notification.title}
                                    </Text>
                                    <Text style={styles.notificationTime}>
                                        {formatTime(notification.createdAt)}
                                    </Text>
                                </View>
                                <Text style={styles.notificationMessage}>{notification.message}</Text>
                            </View>
                            {!notification.isRead && <View style={styles.unreadDot} />}
                        </TouchableOpacity>
                    ))
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.surface,
        justifyContent: "center",
        alignItems: "center",
    },
    title: {
        fontSize: fontSize.lg,
        fontWeight: fontWeight.bold,
        color: colors.text,
    },
    markAllText: {
        fontSize: fontSize.sm,
        color: colors.accent,
        fontWeight: fontWeight.medium,
    },
    scrollContent: {
        padding: spacing.lg,
        paddingBottom: 100,
    },
    loadingState: {
        alignItems: "center",
        paddingVertical: spacing.xxl,
        gap: spacing.sm,
    },
    loadingText: {
        color: colors.textMuted,
        fontSize: fontSize.sm,
    },
    emptyState: {
        alignItems: "center",
        paddingVertical: spacing.xxl * 2,
    },
    emptyText: {
        color: colors.textMuted,
        marginTop: spacing.md,
    },
    notificationCard: {
        flexDirection: "row",
        backgroundColor: colors.surface,
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        marginBottom: spacing.sm,
        borderWidth: 1,
        borderColor: colors.border,
    },
    notificationCardRead: {
        backgroundColor: colors.background,
        opacity: 0.6,
    },
    notificationIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.surfaceLight,
        justifyContent: "center",
        alignItems: "center",
        marginRight: spacing.md,
    },
    notificationContent: {
        flex: 1,
    },
    notificationHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: spacing.xs,
    },
    notificationTitle: {
        fontSize: fontSize.sm,
        fontWeight: fontWeight.semibold,
        color: colors.text,
        flex: 1,
    },
    notificationTitleRead: {
        color: colors.textMuted,
    },
    notificationTime: {
        fontSize: 10,
        color: colors.textMuted,
        marginLeft: spacing.sm,
    },
    notificationMessage: {
        fontSize: fontSize.xs,
        color: colors.textMuted,
        lineHeight: 16,
    },
    unreadDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: colors.accent,
        marginLeft: spacing.sm,
        marginTop: spacing.xs,
    },
});
