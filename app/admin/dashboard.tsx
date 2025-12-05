/**
 * Admin Dashboard
 * Stats overview for court owners
 */

import React, { useCallback, useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    RefreshControl,
    TouchableOpacity,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { colors, spacing, fontSize, fontWeight, borderRadius } from "../../constants/theme";
import { AdminService } from "../../services/admin.service";

export default function AdminDashboardScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const [refreshing, setRefreshing] = useState(false);

    const { data: stats, refetch, isLoading } = useQuery({
        queryKey: ["admin", "dashboard"],
        queryFn: async () => {
            const result = await AdminService.getDashboardStats();
            return result.data;
        },
        staleTime: 60000,
    });

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await refetch();
        setRefreshing(false);
    }, [refetch]);

    const statCards = [
        {
            label: "Doanh thu tổng",
            value: `${(stats?.totalRevenue || 0).toLocaleString()}đ`,
            icon: "cash-outline" as const,
            color: colors.success,
        },
        {
            label: "Booking hôm nay",
            value: String(stats?.todayBookings || 0),
            icon: "calendar-outline" as const,
            color: colors.primary,
        },
        {
            label: "Tổng số sân",
            value: String(stats?.totalCourts || 0),
            icon: "business-outline" as const,
            color: colors.accent,
        },
        {
            label: "Đánh giá TB",
            value: (stats?.averageRating || 0).toFixed(1),
            icon: "star-outline" as const,
            color: colors.warning,
        },
    ];

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="chevron-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Quản lý sân</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.content}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={colors.accent}
                    />
                }
                showsVerticalScrollIndicator={false}
            >
                {/* Welcome */}
                <View style={styles.welcomeCard}>
                    <Text style={styles.welcomeTitle}>Chào mừng chủ sân! 👋</Text>
                    <Text style={styles.welcomeSubtitle}>
                        Quản lý sân và theo dõi doanh thu của bạn
                    </Text>
                </View>

                {/* Stats Grid */}
                <View style={styles.statsGrid}>
                    {statCards.map((card, index) => (
                        <View key={index} style={styles.statCard}>
                            <View
                                style={[
                                    styles.statIconContainer,
                                    { backgroundColor: `${card.color}20` },
                                ]}
                            >
                                <Ionicons name={card.icon} size={24} color={card.color} />
                            </View>
                            <Text style={styles.statValue}>{card.value}</Text>
                            <Text style={styles.statLabel}>{card.label}</Text>
                        </View>
                    ))}
                </View>

                {/* Quick Actions */}
                <Text style={styles.sectionTitle}>Thao tác nhanh</Text>

                <TouchableOpacity
                    style={styles.actionCard}
                    onPress={() => router.push("/admin/courts")}
                >
                    <View style={[styles.actionIcon, { backgroundColor: `${colors.accent}20` }]}>
                        <Ionicons name="add-circle-outline" size={24} color={colors.accent} />
                    </View>
                    <View style={styles.actionInfo}>
                        <Text style={styles.actionTitle}>Thêm sân mới</Text>
                        <Text style={styles.actionDesc}>Tạo sân pickleball mới</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.actionCard}
                    onPress={() => router.push("/admin/bookings")}
                >
                    <View style={[styles.actionIcon, { backgroundColor: `${colors.primary}20` }]}>
                        <Ionicons name="time-outline" size={24} color={colors.primary} />
                    </View>
                    <View style={styles.actionInfo}>
                        <Text style={styles.actionTitle}>Xem booking chờ duyệt</Text>
                        <Text style={styles.actionDesc}>Duyệt đơn đặt sân mới</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.actionCard}
                    onPress={() => router.push("/admin/agenda")}
                >
                    <View style={[styles.actionIcon, { backgroundColor: `${colors.warning}20` }]}>
                        <Ionicons name="calendar-outline" size={24} color={colors.warning} />
                    </View>
                    <View style={styles.actionInfo}>
                        <Text style={styles.actionTitle}>Lịch đặt sân</Text>
                        <Text style={styles.actionDesc}>Xem booking theo ngày</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.actionCard}
                    onPress={() => router.push("/admin/reports")}
                >
                    <View style={[styles.actionIcon, { backgroundColor: `${colors.success}20` }]}>
                        <Ionicons name="bar-chart-outline" size={24} color={colors.success} />
                    </View>
                    <View style={styles.actionInfo}>
                        <Text style={styles.actionTitle}>Báo cáo doanh thu</Text>
                        <Text style={styles.actionDesc}>Xem và xuất báo cáo</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
                </TouchableOpacity>
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
    scrollView: {
        flex: 1,
    },
    content: {
        padding: spacing.lg,
        paddingBottom: 120,
    },
    welcomeCard: {
        backgroundColor: `${colors.accent}10`,
        borderRadius: borderRadius.lg,
        padding: spacing.xl,
        marginBottom: spacing.lg,
        borderWidth: 1,
        borderColor: `${colors.accent}30`,
    },
    welcomeTitle: {
        fontSize: fontSize.xl,
        fontWeight: fontWeight.bold,
        color: colors.text,
        marginBottom: spacing.xs,
    },
    welcomeSubtitle: {
        fontSize: fontSize.sm,
        color: colors.textSecondary,
    },
    statsGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: spacing.md,
        marginBottom: spacing.xl,
    },
    statCard: {
        width: "47%",
        backgroundColor: colors.surface,
        borderRadius: borderRadius.lg,
        padding: spacing.lg,
    },
    statIconContainer: {
        width: 48,
        height: 48,
        borderRadius: borderRadius.md,
        justifyContent: "center",
        alignItems: "center",
        marginBottom: spacing.md,
    },
    statValue: {
        fontSize: fontSize.xl,
        fontWeight: fontWeight.bold,
        color: colors.text,
        marginBottom: 4,
    },
    statLabel: {
        fontSize: fontSize.sm,
        color: colors.textMuted,
    },
    sectionTitle: {
        fontSize: fontSize.md,
        fontWeight: fontWeight.bold,
        color: colors.text,
        marginBottom: spacing.md,
    },
    actionCard: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: colors.surface,
        borderRadius: borderRadius.lg,
        padding: spacing.lg,
        marginBottom: spacing.sm,
        gap: spacing.md,
    },
    actionIcon: {
        width: 48,
        height: 48,
        borderRadius: borderRadius.md,
        justifyContent: "center",
        alignItems: "center",
    },
    actionInfo: {
        flex: 1,
    },
    actionTitle: {
        fontSize: fontSize.md,
        fontWeight: fontWeight.semibold,
        color: colors.text,
    },
    actionDesc: {
        fontSize: fontSize.sm,
        color: colors.textMuted,
        marginTop: 2,
    },
});
