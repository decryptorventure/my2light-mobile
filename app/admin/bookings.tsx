/**
 * Bookings Management Screen
 * Court owners can view and manage bookings for their courts
 */

import React, { useState, useCallback } from "react";
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    RefreshControl,
    Alert,
    ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { colors, spacing, fontSize, fontWeight, borderRadius } from "../../constants/theme";
import { AdminService, BookingManagement } from "../../services/admin.service";
import haptics from "../../lib/haptics";

type FilterType = "all" | "pending" | "active" | "completed" | "cancelled";

export default function AdminBookingsScreen() {
    const insets = useSafeAreaInsets();
    const queryClient = useQueryClient();
    const [refreshing, setRefreshing] = useState(false);
    const [filter, setFilter] = useState<FilterType>("all");
    const [processingId, setProcessingId] = useState<string | null>(null);

    const { data: bookings, refetch, isLoading } = useQuery({
        queryKey: ["admin", "bookings"],
        queryFn: async () => {
            const result = await AdminService.getCourtBookings();
            return result.data;
        },
        staleTime: 30000,
    });

    const filteredBookings =
        filter === "all"
            ? bookings
            : bookings?.filter((b) => b.status === filter);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await refetch();
        setRefreshing(false);
    }, [refetch]);

    const handleApprove = async (bookingId: string) => {
        setProcessingId(bookingId);
        haptics.light();

        const result = await AdminService.approveBooking(bookingId);
        setProcessingId(null);

        if (result.success) {
            haptics.success();
            refetch();
        } else {
            Alert.alert("Lỗi", result.error || "Không thể duyệt booking");
        }
    };

    const handleCancel = (bookingId: string) => {
        Alert.alert("Huỷ booking", "Bạn có chắc muốn huỷ booking này?", [
            { text: "Không", style: "cancel" },
            {
                text: "Huỷ booking",
                style: "destructive",
                onPress: async () => {
                    setProcessingId(bookingId);
                    haptics.light();

                    const result = await AdminService.cancelBooking(bookingId, "Cancelled by owner");
                    setProcessingId(null);

                    if (result.success) {
                        haptics.success();
                        refetch();
                    } else {
                        Alert.alert("Lỗi", result.error || "Không thể huỷ booking");
                    }
                },
            },
        ]);
    };

    const formatDateTime = (timestamp: number) => {
        const date = new Date(timestamp);
        return {
            date: date.toLocaleDateString("vi-VN", { day: "numeric", month: "short" }),
            time: date.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
        };
    };

    const filters: { key: FilterType; label: string }[] = [
        { key: "all", label: "Tất cả" },
        { key: "pending", label: "Chờ duyệt" },
        { key: "active", label: "Đã duyệt" },
        { key: "completed", label: "Hoàn thành" },
    ];

    const renderBookingItem = ({ item }: { item: BookingManagement }) => {
        const { date, time } = formatDateTime(item.startTime);
        const isProcessing = processingId === item.id;
        const isPending = item.status === "pending";
        const isActive = item.status === "active";

        return (
            <View style={styles.bookingCard}>
                <View style={styles.bookingHeader}>
                    <View>
                        <Text style={styles.playerName}>{item.playerName}</Text>
                        <Text style={styles.playerPhone}>{item.playerPhone}</Text>
                    </View>
                    <View
                        style={[
                            styles.statusBadge,
                            item.status === "pending" && styles.statusPending,
                            item.status === "cancelled" && styles.statusCancelled,
                            item.status === "completed" && styles.statusCompleted,
                        ]}
                    >
                        <Text
                            style={[
                                styles.statusText,
                                item.status === "pending" && styles.statusTextPending,
                                item.status === "cancelled" && styles.statusTextCancelled,
                            ]}
                        >
                            {item.status === "pending"
                                ? "Chờ duyệt"
                                : item.status === "active"
                                    ? "Đã duyệt"
                                    : item.status === "completed"
                                        ? "Hoàn thành"
                                        : "Đã huỷ"}
                        </Text>
                    </View>
                </View>

                <View style={styles.bookingDetails}>
                    <View style={styles.detailRow}>
                        <Ionicons name="business-outline" size={16} color={colors.textMuted} />
                        <Text style={styles.detailText}>{item.courtName}</Text>
                    </View>
                    <View style={styles.detailRow}>
                        <Ionicons name="calendar-outline" size={16} color={colors.textMuted} />
                        <Text style={styles.detailText}>
                            {date} • {time}
                        </Text>
                    </View>
                    <View style={styles.detailRow}>
                        <Ionicons name="cash-outline" size={16} color={colors.accent} />
                        <Text style={[styles.detailText, { color: colors.accent }]}>
                            {item.totalAmount.toLocaleString()}đ
                        </Text>
                    </View>
                </View>

                {(isPending || isActive) && (
                    <View style={styles.actionButtons}>
                        {isPending && (
                            <TouchableOpacity
                                style={styles.approveButton}
                                onPress={() => handleApprove(item.id)}
                                disabled={isProcessing}
                            >
                                {isProcessing ? (
                                    <ActivityIndicator size="small" color={colors.background} />
                                ) : (
                                    <>
                                        <Ionicons name="checkmark" size={16} color={colors.background} />
                                        <Text style={styles.approveButtonText}>Duyệt</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        )}
                        <TouchableOpacity
                            style={styles.cancelButton}
                            onPress={() => handleCancel(item.id)}
                            disabled={isProcessing}
                        >
                            <Ionicons name="close" size={16} color={colors.error} />
                            <Text style={styles.cancelButtonText}>Huỷ</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        );
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Quản lý booking</Text>
            </View>

            {/* Filters */}
            <View style={styles.filtersContainer}>
                {filters.map((f) => (
                    <TouchableOpacity
                        key={f.key}
                        style={[styles.filterTab, filter === f.key && styles.filterTabActive]}
                        onPress={() => {
                            setFilter(f.key);
                            haptics.light();
                        }}
                    >
                        <Text
                            style={[
                                styles.filterText,
                                filter === f.key && styles.filterTextActive,
                            ]}
                        >
                            {f.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            <FlatList
                data={filteredBookings || []}
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
                        <Text style={styles.emptyTitle}>Chưa có booking nào</Text>
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
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
    },
    headerTitle: {
        fontSize: fontSize.xl,
        fontWeight: fontWeight.bold,
        color: colors.text,
    },
    filtersContainer: {
        flexDirection: "row",
        paddingHorizontal: spacing.lg,
        marginBottom: spacing.md,
        gap: spacing.xs,
    },
    filterTab: {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.full,
        backgroundColor: colors.surface,
    },
    filterTabActive: {
        backgroundColor: colors.accent,
    },
    filterText: {
        fontSize: fontSize.sm,
        fontWeight: fontWeight.medium,
        color: colors.textMuted,
    },
    filterTextActive: {
        color: colors.background,
    },
    listContent: {
        padding: spacing.lg,
        paddingBottom: 120,
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
    playerName: {
        fontSize: fontSize.md,
        fontWeight: fontWeight.bold,
        color: colors.text,
    },
    playerPhone: {
        fontSize: fontSize.sm,
        color: colors.textMuted,
        marginTop: 2,
    },
    statusBadge: {
        backgroundColor: `${colors.accent}20`,
        paddingHorizontal: spacing.sm,
        paddingVertical: 4,
        borderRadius: borderRadius.full,
    },
    statusPending: {
        backgroundColor: `${colors.warning}20`,
    },
    statusCancelled: {
        backgroundColor: `${colors.error}20`,
    },
    statusCompleted: {
        backgroundColor: `${colors.success}20`,
    },
    statusText: {
        fontSize: fontSize.xs,
        fontWeight: fontWeight.semibold,
        color: colors.accent,
    },
    statusTextPending: {
        color: colors.warning,
    },
    statusTextCancelled: {
        color: colors.error,
    },
    bookingDetails: {
        gap: spacing.xs,
        paddingTop: spacing.md,
        borderTopWidth: 1,
        borderTopColor: colors.border,
    },
    detailRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.sm,
    },
    detailText: {
        fontSize: fontSize.sm,
        color: colors.textSecondary,
    },
    actionButtons: {
        flexDirection: "row",
        gap: spacing.sm,
        marginTop: spacing.md,
        paddingTop: spacing.md,
        borderTopWidth: 1,
        borderTopColor: colors.border,
    },
    approveButton: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: spacing.xs,
        backgroundColor: colors.accent,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.md,
    },
    approveButtonText: {
        fontSize: fontSize.sm,
        fontWeight: fontWeight.semibold,
        color: colors.background,
    },
    cancelButton: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: spacing.xs,
        backgroundColor: `${colors.error}10`,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.md,
    },
    cancelButtonText: {
        fontSize: fontSize.sm,
        fontWeight: fontWeight.semibold,
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
});
