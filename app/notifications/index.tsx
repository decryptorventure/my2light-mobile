import { useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, fontSize, fontWeight, borderRadius } from "../../constants/theme";

interface Notification {
    id: string;
    type: "success" | "warning" | "error" | "info";
    title: string;
    message: string;
    timestamp: number;
    read: boolean;
}

const mockNotifications: Notification[] = [
    {
        id: "1",
        type: "success",
        title: "Đặt sân thành công",
        message: "Bạn đã đặt sân Tennis Tân Bình lúc 16:00 ngày 20/12/2024",
        timestamp: Date.now() - 3600000,
        read: false,
    },
    {
        id: "2",
        type: "info",
        title: "Có kèo mới phù hợp",
        message: "Một người chơi trình độ Beginner đang tìm đối ở gần bạn",
        timestamp: Date.now() - 7200000,
        read: false,
    },
    {
        id: "3",
        type: "warning",
        title: "Sắp đến giờ chơi",
        message: "Bạn có lịch chơi tại Sân Cầu Lông City Sport trong 1 giờ nữa",
        timestamp: Date.now() - 86400000,
        read: true,
    },
];

export default function NotificationsScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [notifications, setNotifications] = useState(mockNotifications);
    const [refreshing, setRefreshing] = useState(false);

    const onRefresh = () => {
        setRefreshing(true);
        setTimeout(() => setRefreshing(false), 1000);
    };

    const markAsRead = (id: string) => {
        setNotifications((prev) =>
            prev.map((n) => (n.id === id ? { ...n, read: true } : n))
        );
    };

    const markAllAsRead = () => {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    };

    const getIcon = (type: Notification["type"]) => {
        switch (type) {
            case "success":
                return <Ionicons name="checkmark-circle" size={20} color="#22c55e" />;
            case "warning":
                return <Ionicons name="warning" size={20} color="#f59e0b" />;
            case "error":
                return <Ionicons name="close-circle" size={20} color="#ef4444" />;
            default:
                return <Ionicons name="information-circle" size={20} color="#3b82f6" />;
        }
    };

    const formatTime = (timestamp: number) => {
        const now = Date.now();
        const diff = now - timestamp;
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
                <TouchableOpacity onPress={markAllAsRead}>
                    <Text style={styles.markAllText}>Đọc tất cả</Text>
                </TouchableOpacity>
            </View>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
                }
            >
                {notifications.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Ionicons name="notifications-off-outline" size={64} color={colors.surfaceLight} />
                        <Text style={styles.emptyText}>Chưa có thông báo nào.</Text>
                    </View>
                ) : (
                    notifications.map((notification) => (
                        <TouchableOpacity
                            key={notification.id}
                            style={[
                                styles.notificationCard,
                                notification.read && styles.notificationCardRead,
                            ]}
                            onPress={() => markAsRead(notification.id)}
                            activeOpacity={0.8}
                        >
                            <View style={styles.notificationIcon}>{getIcon(notification.type)}</View>
                            <View style={styles.notificationContent}>
                                <View style={styles.notificationHeader}>
                                    <Text
                                        style={[
                                            styles.notificationTitle,
                                            notification.read && styles.notificationTitleRead,
                                        ]}
                                    >
                                        {notification.title}
                                    </Text>
                                    <Text style={styles.notificationTime}>
                                        {formatTime(notification.timestamp)}
                                    </Text>
                                </View>
                                <Text style={styles.notificationMessage}>{notification.message}</Text>
                            </View>
                            {!notification.read && <View style={styles.unreadDot} />}
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
