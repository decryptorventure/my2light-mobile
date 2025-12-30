/**
 * My Bookings Screen
 * Shows user's booking history with tabs: Upcoming, Past, Cancelled
 */

import React, { useState, useCallback } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    FlatList,
    RefreshControl,
    Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, fontSize, fontWeight, borderRadius } from "@/shared/constants/theme";
import { useBookingHistory } from "../../hooks/useApi";
import { BookingService } from "../../services/booking.service";
import { Booking } from "../../types";
import haptics from "../../lib/haptics";

type TabType = "upcoming" | "past" | "cancelled";

export default function MyBookingsScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { data: allBookings, refetch, isLoading } = useBookingHistory();

    const [activeTab, setActiveTab] = useState<TabType>("upcoming");
    const [refreshing, setRefreshing] = useState(false);
    const [cancellingId, setCancellingId] = useState<string | null>(null);

    const now = Date.now();

    // Upcoming: pending, approved, or active with future start time
    const upcomingBookings =
        allBookings?.filter(
            (b) =>
                (b.status === "pending" || b.status === "approved" || b.status === "active") &&
                b.startTime > now
        ) || [];

    // Past: completed or ended bookings
    const pastBookings =
        allBookings?.filter(
            (b) =>
                b.status === "completed" ||
                ((b.status === "approved" || b.status === "active") && b.endTime < now)
        ) || [];

    // Cancelled/Rejected
    const cancelledBookings =
        allBookings?.filter((b) => b.status === "cancelled" || b.status === "rejected") || [];

    const currentBookings =
        activeTab === "upcoming"
            ? upcomingBookings
            : activeTab === "past"
              ? pastBookings
              : cancelledBookings;

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await refetch();
        setRefreshing(false);
    }, [refetch]);

    const handleCancelBooking = async (bookingId: string) => {
        Alert.alert(
            "Huỷ đặt sân",
            "Bạn có chắc muốn huỷ đặt sân này? Tiền sẽ được hoàn lại vào ví.",
            [
                { text: "Không", style: "cancel" },
                {
                    text: "Huỷ đặt",
                    style: "destructive",
                    onPress: async () => {
                        setCancellingId(bookingId);
                        haptics.light();
                        const result = await BookingService.cancelBooking(bookingId);
                        setCancellingId(null);

                        if (result.success) {
                            haptics.success();
                            Alert.alert("Thành công", "Đã huỷ đặt sân và hoàn tiền vào ví");
                            refetch();
                        } else {
                            Alert.alert("Lỗi", result.error || "Không thể huỷ đặt sân");
                        }
                    },
                },
            ]
        );
    };

    const formatDate = (timestamp: number) => {
        return new Date(timestamp).toLocaleDateString("vi-VN", {
            weekday: "short",
            day: "numeric",
            month: "short",
        });
    };

    const formatTime = (timestamp: number) => {
        return new Date(timestamp).toLocaleTimeString("vi-VN", {
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const renderBookingItem = ({ item }: { item: Booking }) => {
        const isUpcoming =
            (item.status === "pending" || item.status === "approved" || item.status === "active") &&
            item.startTime > now;
        const isCancelling = cancellingId === item.id;

        // Get status display info
        const getStatusInfo = () => {
            switch (item.status) {
                case "pending":
                    return {
                        text: "Chờ duyệt",
                        style: styles.statusPending,
                        textStyle: styles.statusTextPending,
                    };
                case "approved":
                    return {
                        text: "Đã duyệt",
                        style: styles.statusApproved,
                        textStyle: styles.statusTextApproved,
                    };
                case "active":
                    return item.startTime > now
                        ? { text: "Sắp tới", style: null, textStyle: null }
                        : { text: "Đã xong", style: styles.statusCompleted, textStyle: null };
                case "completed":
                    return { text: "Hoàn thành", style: styles.statusCompleted, textStyle: null };
                case "cancelled":
                    return {
                        text: "Đã huỷ",
                        style: styles.statusCancelled,
                        textStyle: styles.statusTextCancelled,
                    };
                case "rejected":
                    return {
                        text: "Bị từ chối",
                        style: styles.statusCancelled,
                        textStyle: styles.statusTextCancelled,
                    };
                default:
                    return { text: item.status, style: null, textStyle: null };
            }
        };

        const statusInfo = getStatusInfo();

        return (
            <View style={styles.bookingCard}>
                <View style={styles.bookingHeader}>
                    <View style={styles.bookingInfo}>
                        <Text style={styles.courtName}>{item.courtName}</Text>
                        <View style={styles.dateTime}>
                            <Ionicons name="calendar-outline" size={14} color={colors.textMuted} />
                            <Text style={styles.dateText}>{formatDate(item.startTime)}</Text>
                            <Text style={styles.timeText}>
                                {formatTime(item.startTime)} - {formatTime(item.endTime)}
                            </Text>
                        </View>
                    </View>
                    <View style={[styles.statusBadge, statusInfo.style]}>
                        <Text style={[styles.statusText, statusInfo.textStyle]}>
                            {statusInfo.text}
                        </Text>
                    </View>
                </View>

                <View style={styles.bookingDetails}>
                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Gói dịch vụ</Text>
                        <Text style={styles.detailValue}>{item.packageName || "Tiêu chuẩn"}</Text>
                    </View>
                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Tổng tiền</Text>
                        <Text style={[styles.detailValue, { color: colors.accent }]}>
                            {item.totalAmount.toLocaleString()}đ
                        </Text>
                    </View>
                </View>

                {isUpcoming && (
                    <View style={styles.actionButtons}>
                        <TouchableOpacity
                            style={styles.cancelButton}
                            onPress={() => handleCancelBooking(item.id)}
                            disabled={isCancelling}
                        >
                            <Ionicons name="close-circle-outline" size={18} color={colors.error} />
                            <Text style={styles.cancelButtonText}>
                                {isCancelling ? "Đang huỷ..." : "Huỷ đặt"}
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        );
    };

    const tabs: { key: TabType; label: string; count: number }[] = [
        { key: "upcoming", label: "Sắp tới", count: upcomingBookings.length },
        { key: "past", label: "Đã qua", count: pastBookings.length },
        { key: "cancelled", label: "Đã huỷ", count: cancelledBookings.length },
    ];

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="chevron-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Lịch đặt sân</Text>
                <View style={{ width: 40 }} />
            </View>

            {/* Tabs */}
            <View style={styles.tabsContainer}>
                {tabs.map((tab) => (
                    <TouchableOpacity
                        key={tab.key}
                        style={[styles.tab, activeTab === tab.key && styles.tabActive]}
                        onPress={() => {
                            setActiveTab(tab.key);
                            haptics.light();
                        }}
                    >
                        <Text
                            style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}
                        >
                            {tab.label}
                        </Text>
                        {tab.count > 0 && (
                            <View
                                style={[
                                    styles.tabBadge,
                                    activeTab === tab.key && styles.tabBadgeActive,
                                ]}
                            >
                                <Text
                                    style={[
                                        styles.tabBadgeText,
                                        activeTab === tab.key && styles.tabBadgeTextActive,
                                    ]}
                                >
                                    {tab.count}
                                </Text>
                            </View>
                        )}
                    </TouchableOpacity>
                ))}
            </View>

            {/* Bookings List */}
            <FlatList
                data={currentBookings}
                keyExtractor={(item) => item.id}
                renderItem={renderBookingItem}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={colors.accent}
                    />
                }
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Ionicons name="calendar-outline" size={64} color={colors.surfaceLight} />
                        <Text style={styles.emptyTitle}>
                            {activeTab === "upcoming"
                                ? "Chưa có lịch đặt sân"
                                : activeTab === "past"
                                  ? "Chưa có lịch sử"
                                  : "Chưa huỷ đặt sân nào"}
                        </Text>
                        {activeTab === "upcoming" && (
                            <TouchableOpacity
                                style={styles.bookNowButton}
                                onPress={() => router.push("/(tabs)")}
                            >
                                <Text style={styles.bookNowText}>Đặt sân ngay</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                }
            />
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
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: "center",
        alignItems: "center",
    },
    headerTitle: {
        fontSize: fontSize.lg,
        fontWeight: fontWeight.bold,
        color: colors.text,
    },
    tabsContainer: {
        flexDirection: "row",
        paddingHorizontal: spacing.md,
        marginBottom: spacing.md,
        gap: spacing.sm,
    },
    tab: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: spacing.xs,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.full,
        backgroundColor: colors.surface,
    },
    tabActive: {
        backgroundColor: colors.accent,
    },
    tabText: {
        fontSize: fontSize.sm,
        fontWeight: fontWeight.medium,
        color: colors.textMuted,
    },
    tabTextActive: {
        color: colors.background,
    },
    tabBadge: {
        backgroundColor: colors.surfaceLight,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 10,
    },
    tabBadgeActive: {
        backgroundColor: `rgba(0,0,0,0.2)`,
    },
    tabBadgeText: {
        fontSize: 10,
        fontWeight: fontWeight.bold,
        color: colors.textMuted,
    },
    tabBadgeTextActive: {
        color: colors.background,
    },
    listContent: {
        paddingHorizontal: spacing.md,
        paddingBottom: 100,
    },
    bookingCard: {
        backgroundColor: colors.surface,
        borderRadius: borderRadius.lg,
        padding: spacing.lg,
        marginBottom: spacing.md,
    },
    bookingHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: spacing.md,
    },
    bookingInfo: {
        flex: 1,
    },
    courtName: {
        fontSize: fontSize.md,
        fontWeight: fontWeight.bold,
        color: colors.text,
        marginBottom: spacing.xs,
    },
    dateTime: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.xs,
    },
    dateText: {
        fontSize: fontSize.sm,
        color: colors.textMuted,
    },
    timeText: {
        fontSize: fontSize.sm,
        color: colors.accent,
        fontWeight: fontWeight.medium,
    },
    statusBadge: {
        backgroundColor: `${colors.accent}20`,
        paddingHorizontal: spacing.sm,
        paddingVertical: 4,
        borderRadius: borderRadius.full,
    },
    statusCancelled: {
        backgroundColor: `${colors.error}20`,
    },
    statusCompleted: {
        backgroundColor: `${colors.success}20`,
    },
    statusPending: {
        backgroundColor: `${colors.warning}20`,
    },
    statusApproved: {
        backgroundColor: `${colors.success}20`,
    },
    statusText: {
        fontSize: fontSize.xs,
        fontWeight: fontWeight.semibold,
        color: colors.accent,
    },
    statusTextCancelled: {
        color: colors.error,
    },
    statusTextPending: {
        color: colors.warning,
    },
    statusTextApproved: {
        color: colors.success,
    },
    bookingDetails: {
        paddingTop: spacing.md,
        borderTopWidth: 1,
        borderTopColor: colors.border,
        gap: spacing.xs,
    },
    detailRow: {
        flexDirection: "row",
        justifyContent: "space-between",
    },
    detailLabel: {
        fontSize: fontSize.sm,
        color: colors.textMuted,
    },
    detailValue: {
        fontSize: fontSize.sm,
        fontWeight: fontWeight.medium,
        color: colors.text,
    },
    actionButtons: {
        marginTop: spacing.md,
        paddingTop: spacing.md,
        borderTopWidth: 1,
        borderTopColor: colors.border,
    },
    cancelButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: spacing.xs,
        paddingVertical: spacing.sm,
        backgroundColor: `${colors.error}10`,
        borderRadius: borderRadius.md,
    },
    cancelButtonText: {
        fontSize: fontSize.sm,
        fontWeight: fontWeight.medium,
        color: colors.error,
    },
    emptyState: {
        alignItems: "center",
        paddingVertical: spacing.xxl * 2,
    },
    emptyTitle: {
        fontSize: fontSize.md,
        color: colors.textMuted,
        marginTop: spacing.lg,
    },
    bookNowButton: {
        marginTop: spacing.lg,
        backgroundColor: colors.accent,
        paddingHorizontal: spacing.xl,
        paddingVertical: spacing.md,
        borderRadius: borderRadius.full,
    },
    bookNowText: {
        fontSize: fontSize.md,
        fontWeight: fontWeight.semibold,
        color: colors.background,
    },
});
