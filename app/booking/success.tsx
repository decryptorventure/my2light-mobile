/**
 * Booking Success Screen
 * Shows confirmation after successful booking
 */

import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, fontSize, fontWeight, borderRadius } from "@/shared/constants/theme";
import haptics from "../../lib/haptics";

export default function BookingSuccessScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const params = useLocalSearchParams<{
        bookingId?: string;
        courtName: string;
        date: string;
        time: string;
        totalPrice: string;
        packageName?: string;
        status?: string;
    }>();

    const isPending = params.status === "pending";

    const handleViewBookings = () => {
        haptics.light();
        router.replace("/(tabs)/library");
    };

    const handleGoHome = () => {
        haptics.light();
        router.replace("/(tabs)");
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
            {/* Success Icon */}
            <View style={styles.iconContainer}>
                <View style={[styles.iconCircle, isPending && styles.iconCirclePending]}>
                    <Ionicons
                        name={isPending ? "time" : "checkmark"}
                        size={64}
                        color={colors.background}
                    />
                </View>
            </View>

            {/* Title */}
            <Text style={styles.title}>
                {isPending ? "Đang chờ duyệt! ⏳" : "Đặt sân thành công! 🎉"}
            </Text>
            <Text style={styles.subtitle}>
                {isPending
                    ? "Yêu cầu đặt sân của bạn đang chờ chủ sân xác nhận. Bạn sẽ nhận được thông báo khi được duyệt."
                    : "Bạn đã đặt sân thành công. Hãy đến sân đúng giờ nhé!"}
            </Text>

            {/* Pending Status Badge */}
            {isPending && (
                <View style={styles.pendingBadge}>
                    <Ionicons name="hourglass-outline" size={16} color={colors.warning} />
                    <Text style={styles.pendingText}>Chờ xác nhận từ chủ sân</Text>
                </View>
            )}

            {/* Booking Details Card */}
            <View style={styles.card}>
                <View style={styles.cardRow}>
                    <Text style={styles.cardLabel}>Sân</Text>
                    <Text style={styles.cardValue}>{params.courtName}</Text>
                </View>

                <View style={styles.divider} />

                <View style={styles.cardRow}>
                    <Text style={styles.cardLabel}>Thời gian</Text>
                    <View style={styles.cardRight}>
                        <Text style={[styles.cardValue, { color: colors.accent }]}>
                            {params.time}
                        </Text>
                        <Text style={styles.cardSubtext}>{params.date}</Text>
                    </View>
                </View>

                <View style={styles.divider} />

                {params.packageName && (
                    <>
                        <View style={styles.cardRow}>
                            <Text style={styles.cardLabel}>Gói quay</Text>
                            <Text style={styles.cardValue}>{params.packageName}</Text>
                        </View>
                        <View style={styles.divider} />
                    </>
                )}

                <View style={styles.cardRow}>
                    <Text style={styles.cardLabel}>Tổng thanh toán</Text>
                    <Text style={styles.totalPrice}>
                        {parseInt(params.totalPrice || "0").toLocaleString()}đ
                    </Text>
                </View>

                {isPending && (
                    <>
                        <View style={styles.divider} />
                        <View style={styles.cardRow}>
                            <Text style={styles.cardLabel}>Trạng thái</Text>
                            <View style={styles.statusBadge}>
                                <Text style={styles.statusText}>Chờ duyệt</Text>
                            </View>
                        </View>
                    </>
                )}
            </View>

            {/* Tips */}
            <View style={styles.tips}>
                {isPending ? (
                    <>
                        <View style={styles.tipItem}>
                            <Ionicons
                                name="notifications-outline"
                                size={20}
                                color={colors.accent}
                            />
                            <Text style={styles.tipText}>Bạn sẽ nhận thông báo khi được duyệt</Text>
                        </View>
                        <View style={styles.tipItem}>
                            <Ionicons name="wallet-outline" size={20} color={colors.accent} />
                            <Text style={styles.tipText}>Tiền sẽ được hoàn lại nếu bị từ chối</Text>
                        </View>
                    </>
                ) : (
                    <>
                        <View style={styles.tipItem}>
                            <Ionicons name="time-outline" size={20} color={colors.accent} />
                            <Text style={styles.tipText}>Đến trước 15 phút để chuẩn bị</Text>
                        </View>
                        <View style={styles.tipItem}>
                            <Ionicons name="videocam-outline" size={20} color={colors.accent} />
                            <Text style={styles.tipText}>Camera sẽ tự động bắt đầu quay</Text>
                        </View>
                    </>
                )}
            </View>

            {/* Actions */}
            <View style={styles.actions}>
                <TouchableOpacity style={styles.primaryButton} onPress={handleViewBookings}>
                    <Text style={styles.primaryButtonText}>Xem lịch đặt</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.secondaryButton} onPress={handleGoHome}>
                    <Text style={styles.secondaryButtonText}>Về trang chủ</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
        paddingHorizontal: spacing.xl,
        justifyContent: "center",
    },
    iconContainer: {
        alignItems: "center",
        marginBottom: spacing.xl,
    },
    iconCircle: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: colors.success,
        justifyContent: "center",
        alignItems: "center",
    },
    title: {
        color: colors.text,
        fontSize: fontSize.xxl,
        fontWeight: fontWeight.bold,
        textAlign: "center",
        marginBottom: spacing.sm,
    },
    subtitle: {
        color: colors.textMuted,
        fontSize: fontSize.md,
        textAlign: "center",
        marginBottom: spacing.xl,
    },
    card: {
        backgroundColor: colors.surface,
        borderRadius: borderRadius.xl,
        padding: spacing.xl,
        marginBottom: spacing.xl,
    },
    cardRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
    },
    cardLabel: {
        color: colors.textMuted,
        fontSize: fontSize.sm,
    },
    cardValue: {
        color: colors.text,
        fontSize: fontSize.sm,
        fontWeight: fontWeight.semibold,
        textAlign: "right",
        maxWidth: "60%",
    },
    cardRight: {
        alignItems: "flex-end",
    },
    cardSubtext: {
        color: colors.textMuted,
        fontSize: fontSize.xs,
        marginTop: 2,
    },
    divider: {
        height: 1,
        backgroundColor: colors.border,
        marginVertical: spacing.md,
    },
    totalPrice: {
        color: colors.accent,
        fontSize: fontSize.xl,
        fontWeight: fontWeight.bold,
    },
    tips: {
        marginBottom: spacing.xl,
        gap: spacing.sm,
    },
    tipItem: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.sm,
    },
    tipText: {
        color: colors.textSecondary,
        fontSize: fontSize.sm,
    },
    actions: {
        gap: spacing.md,
    },
    primaryButton: {
        backgroundColor: colors.accent,
        paddingVertical: spacing.lg,
        borderRadius: borderRadius.md,
        alignItems: "center",
    },
    primaryButtonText: {
        color: colors.background,
        fontSize: fontSize.md,
        fontWeight: fontWeight.semibold,
    },
    secondaryButton: {
        backgroundColor: colors.surface,
        paddingVertical: spacing.lg,
        borderRadius: borderRadius.md,
        alignItems: "center",
    },
    secondaryButtonText: {
        color: colors.text,
        fontSize: fontSize.md,
        fontWeight: fontWeight.semibold,
    },
    iconCirclePending: {
        backgroundColor: colors.warning,
    },
    pendingBadge: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: spacing.xs,
        backgroundColor: `${colors.warning}20`,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.md,
        borderRadius: borderRadius.full,
        marginBottom: spacing.lg,
    },
    pendingText: {
        color: colors.warning,
        fontSize: fontSize.sm,
        fontWeight: fontWeight.semibold,
    },
    statusBadge: {
        backgroundColor: `${colors.warning}20`,
        paddingVertical: spacing.xs,
        paddingHorizontal: spacing.sm,
        borderRadius: borderRadius.sm,
    },
    statusText: {
        color: colors.warning,
        fontSize: fontSize.xs,
        fontWeight: fontWeight.semibold,
    },
});
