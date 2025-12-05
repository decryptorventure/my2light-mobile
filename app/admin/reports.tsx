/**
 * Revenue Reports Screen
 * Export and view revenue reports for court owners
 */

import React, { useState, useCallback } from "react";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    RefreshControl,
    Alert,
    Share,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { colors, spacing, fontSize, fontWeight, borderRadius } from "../../constants/theme";
import { AdminService } from "../../services/admin.service";
import haptics from "../../lib/haptics";

type PeriodType = "today" | "week" | "month" | "year";

interface RevenueData {
    total: number;
    bookings: number;
    avgPerBooking: number;
    byDay: { date: string; amount: number }[];
}

export default function ReportsScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const [refreshing, setRefreshing] = useState(false);
    const [period, setPeriod] = useState<PeriodType>("month");

    const { data: stats, refetch } = useQuery({
        queryKey: ["admin", "dashboard"],
        queryFn: async () => {
            const result = await AdminService.getDashboardStats();
            return result.data;
        },
        staleTime: 60000,
    });

    const { data: bookings } = useQuery({
        queryKey: ["admin", "bookings"],
        queryFn: async () => {
            const result = await AdminService.getCourtBookings();
            return result.data || [];
        },
        staleTime: 60000,
    });

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await refetch();
        setRefreshing(false);
    }, [refetch]);

    // Calculate revenue based on period
    const getRevenueData = (): RevenueData => {
        if (!bookings) {
            return { total: 0, bookings: 0, avgPerBooking: 0, byDay: [] };
        }

        const now = new Date();
        let startDate = new Date();

        switch (period) {
            case "today":
                startDate.setHours(0, 0, 0, 0);
                break;
            case "week":
                startDate.setDate(now.getDate() - 7);
                break;
            case "month":
                startDate.setMonth(now.getMonth() - 1);
                break;
            case "year":
                startDate.setFullYear(now.getFullYear() - 1);
                break;
        }

        const filteredBookings = bookings.filter((b) => {
            const bookingDate = new Date(b.startTime);
            return (
                bookingDate >= startDate &&
                bookingDate <= now &&
                (b.status === "completed" || b.status === "active")
            );
        });

        const total = filteredBookings.reduce((sum, b) => sum + b.totalAmount, 0);
        const count = filteredBookings.length;
        const avg = count > 0 ? total / count : 0;

        // Group by day
        const byDayMap: { [key: string]: number } = {};
        filteredBookings.forEach((b) => {
            const dateKey = new Date(b.startTime).toLocaleDateString("vi-VN");
            byDayMap[dateKey] = (byDayMap[dateKey] || 0) + b.totalAmount;
        });

        const byDay = Object.entries(byDayMap)
            .map(([date, amount]) => ({ date, amount }))
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 7);

        return { total, bookings: count, avgPerBooking: avg, byDay };
    };

    const revenueData = getRevenueData();

    const handleExport = async () => {
        haptics.medium();

        const periodLabels = {
            today: "Hôm nay",
            week: "7 ngày qua",
            month: "30 ngày qua",
            year: "1 năm qua",
        };

        const reportContent = `
📊 BÁO CÁO DOANH THU - MY2LIGHT
================================
Thời gian: ${periodLabels[period]}
Ngày xuất: ${new Date().toLocaleDateString("vi-VN")}

💰 TỔNG DOANH THU: ${revenueData.total.toLocaleString()}đ
📅 SỐ BOOKING: ${revenueData.bookings}
📈 TB/BOOKING: ${Math.round(revenueData.avgPerBooking).toLocaleString()}đ

CHI TIẾT THEO NGÀY:
${revenueData.byDay.map((d) => `  • ${d.date}: ${d.amount.toLocaleString()}đ`).join("\n")}

================================
Xuất từ ứng dụng My2Light
        `.trim();

        try {
            await Share.share({
                message: reportContent,
                title: "Báo cáo doanh thu",
            });
        } catch (error) {
            Alert.alert("Lỗi", "Không thể xuất báo cáo");
        }
    };

    const periods: { key: PeriodType; label: string }[] = [
        { key: "today", label: "Hôm nay" },
        { key: "week", label: "7 ngày" },
        { key: "month", label: "30 ngày" },
        { key: "year", label: "1 năm" },
    ];

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="chevron-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Báo cáo doanh thu</Text>
                <TouchableOpacity onPress={handleExport} style={styles.exportButton}>
                    <Ionicons name="share-outline" size={22} color={colors.accent} />
                </TouchableOpacity>
            </View>

            {/* Period Filter */}
            <View style={styles.periodFilter}>
                {periods.map((p) => (
                    <TouchableOpacity
                        key={p.key}
                        style={[styles.periodTab, period === p.key && styles.periodTabActive]}
                        onPress={() => {
                            setPeriod(p.key);
                            haptics.light();
                        }}
                    >
                        <Text
                            style={[
                                styles.periodTabText,
                                period === p.key && styles.periodTabTextActive,
                            ]}
                        >
                            {p.label}
                        </Text>
                    </TouchableOpacity>
                ))}
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
            >
                {/* Summary Cards */}
                <View style={styles.summaryCard}>
                    <Text style={styles.summaryLabel}>Tổng doanh thu</Text>
                    <Text style={styles.summaryValue}>
                        {revenueData.total.toLocaleString()}đ
                    </Text>
                </View>

                <View style={styles.statsRow}>
                    <View style={styles.statCard}>
                        <Ionicons name="calendar-outline" size={24} color={colors.primary} />
                        <Text style={styles.statValue}>{revenueData.bookings}</Text>
                        <Text style={styles.statLabel}>Booking</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Ionicons name="trending-up-outline" size={24} color={colors.success} />
                        <Text style={styles.statValue}>
                            {Math.round(revenueData.avgPerBooking).toLocaleString()}đ
                        </Text>
                        <Text style={styles.statLabel}>TB/Booking</Text>
                    </View>
                </View>

                {/* Daily Breakdown */}
                <Text style={styles.sectionTitle}>Chi tiết theo ngày</Text>

                {revenueData.byDay.length > 0 ? (
                    revenueData.byDay.map((day, index) => (
                        <View key={index} style={styles.dayRow}>
                            <Text style={styles.dayDate}>{day.date}</Text>
                            <Text style={styles.dayAmount}>
                                {day.amount.toLocaleString()}đ
                            </Text>
                        </View>
                    ))
                ) : (
                    <View style={styles.emptyState}>
                        <Ionicons name="analytics-outline" size={48} color={colors.surfaceLight} />
                        <Text style={styles.emptyText}>Chưa có dữ liệu</Text>
                    </View>
                )}

                {/* Overall Stats */}
                <Text style={styles.sectionTitle}>Tổng quan sân</Text>

                <View style={styles.overallStats}>
                    <View style={styles.overallRow}>
                        <Text style={styles.overallLabel}>Tổng sân đang quản lý</Text>
                        <Text style={styles.overallValue}>{stats?.totalCourts || 0}</Text>
                    </View>
                    <View style={styles.overallRow}>
                        <Text style={styles.overallLabel}>Đánh giá trung bình</Text>
                        <Text style={styles.overallValue}>
                            ⭐ {(stats?.averageRating || 0).toFixed(1)}
                        </Text>
                    </View>
                </View>
            </ScrollView>

            {/* Export Button */}
            <View style={styles.footer}>
                <TouchableOpacity style={styles.exportFullButton} onPress={handleExport}>
                    <Ionicons name="download-outline" size={20} color={colors.background} />
                    <Text style={styles.exportButtonText}>Xuất báo cáo</Text>
                </TouchableOpacity>
            </View>
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
    exportButton: {
        width: 40,
        height: 40,
        justifyContent: "center",
        alignItems: "center",
    },
    periodFilter: {
        flexDirection: "row",
        paddingHorizontal: spacing.md,
        marginBottom: spacing.md,
        gap: spacing.sm,
    },
    periodTab: {
        flex: 1,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.md,
        backgroundColor: colors.surface,
        alignItems: "center",
    },
    periodTabActive: {
        backgroundColor: colors.accent,
    },
    periodTabText: {
        fontSize: fontSize.sm,
        fontWeight: fontWeight.medium,
        color: colors.textMuted,
    },
    periodTabTextActive: {
        color: colors.background,
    },
    scrollView: {
        flex: 1,
    },
    content: {
        padding: spacing.lg,
        paddingBottom: 120,
    },
    summaryCard: {
        backgroundColor: `${colors.accent}15`,
        borderRadius: borderRadius.lg,
        padding: spacing.xl,
        alignItems: "center",
        marginBottom: spacing.lg,
        borderWidth: 1,
        borderColor: `${colors.accent}30`,
    },
    summaryLabel: {
        fontSize: fontSize.sm,
        color: colors.textSecondary,
        marginBottom: spacing.xs,
    },
    summaryValue: {
        fontSize: 32,
        fontWeight: fontWeight.bold,
        color: colors.accent,
    },
    statsRow: {
        flexDirection: "row",
        gap: spacing.md,
        marginBottom: spacing.xl,
    },
    statCard: {
        flex: 1,
        backgroundColor: colors.surface,
        borderRadius: borderRadius.lg,
        padding: spacing.lg,
        alignItems: "center",
    },
    statValue: {
        fontSize: fontSize.lg,
        fontWeight: fontWeight.bold,
        color: colors.text,
        marginTop: spacing.sm,
    },
    statLabel: {
        fontSize: fontSize.sm,
        color: colors.textMuted,
        marginTop: 2,
    },
    sectionTitle: {
        fontSize: fontSize.md,
        fontWeight: fontWeight.bold,
        color: colors.text,
        marginBottom: spacing.md,
    },
    dayRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    dayDate: {
        fontSize: fontSize.md,
        color: colors.text,
    },
    dayAmount: {
        fontSize: fontSize.md,
        fontWeight: fontWeight.semibold,
        color: colors.accent,
    },
    emptyState: {
        alignItems: "center",
        paddingVertical: spacing.xxl,
    },
    emptyText: {
        fontSize: fontSize.md,
        color: colors.textMuted,
        marginTop: spacing.md,
    },
    overallStats: {
        backgroundColor: colors.surface,
        borderRadius: borderRadius.lg,
        padding: spacing.lg,
    },
    overallRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: spacing.sm,
    },
    overallLabel: {
        fontSize: fontSize.md,
        color: colors.textSecondary,
    },
    overallValue: {
        fontSize: fontSize.md,
        fontWeight: fontWeight.semibold,
        color: colors.text,
    },
    footer: {
        padding: spacing.lg,
        paddingBottom: spacing.xl,
        borderTopWidth: 1,
        borderTopColor: colors.border,
    },
    exportFullButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: spacing.sm,
        backgroundColor: colors.accent,
        paddingVertical: spacing.lg,
        borderRadius: borderRadius.md,
    },
    exportButtonText: {
        fontSize: fontSize.md,
        fontWeight: fontWeight.semibold,
        color: colors.background,
    },
});
