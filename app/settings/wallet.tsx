/**
 * Wallet Screen
 * @description Displays user credit balance and transaction history from Supabase
 * @module app/settings/wallet
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
    Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useQueryClient } from "@tanstack/react-query";
import { colors, spacing, fontSize, fontWeight, borderRadius } from "../../constants/theme";
import { useTransactions, useUserCredits } from "../../hooks/useApi";
import { TransactionService } from "../../services/transaction.service";
import { Card } from "../../components/ui";
import haptics from "../../lib/haptics";

/**
 * WalletScreen - Display user wallet and transactions
 * Features:
 * - Real credit balance from profiles.credits
 * - Transaction history from transactions table
 * - Pull-to-refresh functionality
 */
export default function WalletScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const queryClient = useQueryClient();
    const [refreshing, setRefreshing] = useState(false);
    const [isTopUp, setIsTopUp] = useState(false);

    // Real data from API
    const { data: credits, isLoading: creditsLoading, refetch: refetchCredits } = useUserCredits();
    const { data: transactions, isLoading: txLoading, refetch: refetchTx } = useTransactions(50);

    const onRefresh = async () => {
        setRefreshing(true);
        haptics.light();
        await Promise.all([refetchCredits(), refetchTx()]);
        setRefreshing(false);
    };

    const handleTopUp = async () => {
        setIsTopUp(true);
        haptics.medium();

        const result = await TransactionService.addCredits(100000);

        if (result.success) {
            haptics.success();
            Alert.alert(
                "Nạp tiền thành công! 🎉",
                `Đã cộng 100,000đ vào tài khoản.\nSố dư mới: ${result.data.toLocaleString()}đ`
            );
            // Refresh wallet data
            await Promise.all([refetchCredits(), refetchTx()]);
            // Invalidate profile cache so Home/Profile show updated credits
            queryClient.invalidateQueries({ queryKey: ["user", "current"] });
            queryClient.invalidateQueries({ queryKey: ["user", "credits"] });
        } else {
            Alert.alert("Lỗi", result.error || "Không thể nạp tiền");
        }

        setIsTopUp(false);
    };

    // Calculate totals from transactions
    const totalTopUp = (transactions || [])
        .filter((t: any) => t.type === "topup" || t.type === "credit")
        .reduce((sum: number, t: any) => sum + Math.abs(t.amount), 0);

    const totalSpend = (transactions || [])
        .filter((t: any) => t.type === "booking" || t.type === "debit")
        .reduce((sum: number, t: any) => sum + Math.abs(t.amount), 0);

    const isLoading = creditsLoading || txLoading;

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <Ionicons name="chevron-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={styles.title}>Ví My2Light</Text>
                <View style={styles.placeholder} />
            </View>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={colors.accent}
                    />
                }
            >
                {/* Balance Card */}
                <View style={styles.balanceCard}>
                    <View style={styles.balanceHeader}>
                        <View style={styles.walletIcon}>
                            <Ionicons name="wallet" size={24} color={colors.background} />
                        </View>
                        <View>
                            <Text style={styles.balanceLabel}>Số dư khả dụng</Text>
                            {creditsLoading ? (
                                <ActivityIndicator size="small" color={colors.background} />
                            ) : (
                                <Text style={styles.balanceAmount}>
                                    {(credits || 0).toLocaleString()}đ
                                </Text>
                            )}
                        </View>
                    </View>
                    <TouchableOpacity
                        style={[styles.topUpButton, isTopUp && styles.topUpButtonDisabled]}
                        onPress={handleTopUp}
                        disabled={isTopUp}
                    >
                        {isTopUp ? (
                            <ActivityIndicator size="small" color={colors.accent} />
                        ) : (
                            <>
                                <Ionicons name="add" size={20} color={colors.accent} />
                                <Text style={styles.topUpButtonText}>Nạp 100,000đ</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>

                {/* Stats */}
                <View style={styles.statsRow}>
                    <Card style={styles.statCard}>
                        <View style={styles.statHeader}>
                            <Ionicons name="trending-up" size={16} color="#22c55e" />
                            <Text style={styles.statLabel}>Tổng nạp</Text>
                        </View>
                        <Text style={styles.statValue}>{totalTopUp.toLocaleString()}đ</Text>
                    </Card>

                    <Card style={styles.statCard}>
                        <View style={styles.statHeader}>
                            <Ionicons name="trending-down" size={16} color="#ef4444" />
                            <Text style={styles.statLabel}>Tổng chi</Text>
                        </View>
                        <Text style={styles.statValue}>{totalSpend.toLocaleString()}đ</Text>
                    </Card>
                </View>

                {/* Transactions */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Lịch sử giao dịch</Text>
                        <Text style={styles.transactionCount}>
                            {(transactions || []).length} giao dịch
                        </Text>
                    </View>

                    {isLoading ? (
                        <View style={styles.loadingState}>
                            <ActivityIndicator size="small" color={colors.accent} />
                            <Text style={styles.loadingText}>Đang tải...</Text>
                        </View>
                    ) : !transactions || transactions.length === 0 ? (
                        <Card style={styles.emptyCard}>
                            <Ionicons name="wallet-outline" size={48} color={colors.textMuted} />
                            <Text style={styles.emptyTitle}>Chưa có giao dịch</Text>
                            <Text style={styles.emptyText}>
                                Lịch sử giao dịch sẽ hiển thị ở đây
                            </Text>
                        </Card>
                    ) : (
                        transactions.map((transaction: any) => (
                            <TransactionItem key={transaction.id} transaction={transaction} />
                        ))
                    )}
                </View>
            </ScrollView>
        </View>
    );
}

/**
 * TransactionItem - Individual transaction row
 */
function TransactionItem({ transaction }: { transaction: any }) {
    const isPositive = transaction.amount > 0;
    const date = new Date(transaction.createdAt);

    const getIcon = () => {
        switch (transaction.type) {
            case "topup":
            case "credit":
                return <Ionicons name="trending-up" size={20} color="#22c55e" />;
            case "booking":
            case "debit":
                return <Ionicons name="trending-down" size={20} color="#ef4444" />;
            case "refund":
                return <Ionicons name="refresh" size={20} color="#3b82f6" />;
            default:
                return <Ionicons name="swap-horizontal" size={20} color={colors.accent} />;
        }
    };

    const getStatusStyle = () => {
        switch (transaction.status) {
            case "completed":
            case "success":
                return { bg: "rgba(34, 197, 94, 0.2)", text: "#22c55e" };
            case "pending":
                return { bg: "rgba(245, 158, 11, 0.2)", text: "#f59e0b" };
            case "failed":
                return { bg: "rgba(239, 68, 68, 0.2)", text: "#ef4444" };
            default:
                return { bg: "rgba(34, 197, 94, 0.2)", text: "#22c55e" };
        }
    };

    const statusStyle = getStatusStyle();
    const statusText =
        transaction.status === "completed" || transaction.status === "success"
            ? "Thành công"
            : transaction.status === "pending"
              ? "Chờ xử lý"
              : "Thất bại";

    return (
        <Card style={styles.transactionCard}>
            <View style={styles.transactionIcon}>{getIcon()}</View>
            <View style={styles.transactionContent}>
                <Text style={styles.transactionDesc}>{transaction.description || "Giao dịch"}</Text>
                <View style={styles.transactionMeta}>
                    <Ionicons name="calendar-outline" size={10} color={colors.textMuted} />
                    <Text style={styles.transactionDate}>
                        {date.toLocaleDateString("vi-VN")} •{" "}
                        {date.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                    </Text>
                </View>
            </View>
            <View style={styles.transactionRight}>
                <Text
                    style={[
                        styles.transactionAmount,
                        { color: isPositive ? "#22c55e" : "#ef4444" },
                    ]}
                >
                    {isPositive ? "+" : ""}
                    {transaction.amount.toLocaleString()}đ
                </Text>
                <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
                    <Text style={[styles.statusText, { color: statusStyle.text }]}>
                        {statusText}
                    </Text>
                </View>
            </View>
        </Card>
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
    placeholder: {
        width: 40,
    },
    scrollContent: {
        padding: spacing.lg,
        paddingBottom: 100,
    },
    balanceCard: {
        backgroundColor: colors.accent,
        borderRadius: borderRadius.lg,
        padding: spacing.lg,
        marginBottom: spacing.md,
    },
    balanceHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.md,
        marginBottom: spacing.lg,
    },
    walletIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: "rgba(255,255,255,0.2)",
        justifyContent: "center",
        alignItems: "center",
    },
    balanceLabel: {
        fontSize: fontSize.sm,
        color: colors.background,
        opacity: 0.8,
    },
    balanceAmount: {
        fontSize: 28,
        fontWeight: "800",
        color: colors.background,
    },
    topUpButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: colors.background,
        paddingVertical: spacing.md,
        borderRadius: borderRadius.md,
        gap: spacing.xs,
    },
    topUpButtonDisabled: {
        opacity: 0.6,
    },
    topUpButtonText: {
        color: colors.accent,
        fontSize: fontSize.md,
        fontWeight: fontWeight.semibold,
    },
    statsRow: {
        flexDirection: "row",
        gap: spacing.md,
        marginBottom: spacing.xl,
    },
    statCard: {
        flex: 1,
        padding: spacing.md,
    },
    statHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.xs,
        marginBottom: spacing.sm,
    },
    statLabel: {
        fontSize: fontSize.xs,
        color: colors.textMuted,
    },
    statValue: {
        fontSize: fontSize.xl,
        fontWeight: fontWeight.bold,
        color: colors.text,
    },
    section: {
        marginBottom: spacing.xl,
    },
    sectionHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: spacing.md,
    },
    sectionTitle: {
        fontSize: fontSize.md,
        fontWeight: fontWeight.bold,
        color: colors.text,
    },
    transactionCount: {
        fontSize: fontSize.xs,
        color: colors.textMuted,
    },
    loadingState: {
        alignItems: "center",
        paddingVertical: spacing.xl,
        gap: spacing.sm,
    },
    loadingText: {
        color: colors.textMuted,
        fontSize: fontSize.sm,
    },
    emptyCard: {
        alignItems: "center",
        padding: spacing.xl,
    },
    emptyTitle: {
        color: colors.text,
        fontSize: fontSize.md,
        fontWeight: fontWeight.semibold,
        marginTop: spacing.md,
    },
    emptyText: {
        color: colors.textMuted,
        fontSize: fontSize.sm,
        marginTop: spacing.xs,
    },
    transactionCard: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: spacing.sm,
    },
    transactionIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.surfaceLight,
        justifyContent: "center",
        alignItems: "center",
        marginRight: spacing.md,
    },
    transactionContent: {
        flex: 1,
    },
    transactionDesc: {
        fontSize: fontSize.sm,
        fontWeight: fontWeight.medium,
        color: colors.text,
    },
    transactionMeta: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.xs,
        marginTop: 2,
    },
    transactionDate: {
        fontSize: 10,
        color: colors.textMuted,
    },
    transactionRight: {
        alignItems: "flex-end",
    },
    transactionAmount: {
        fontSize: fontSize.sm,
        fontWeight: fontWeight.bold,
    },
    statusBadge: {
        paddingHorizontal: spacing.xs,
        paddingVertical: 2,
        borderRadius: borderRadius.full,
        marginTop: 4,
    },
    statusText: {
        fontSize: 10,
        fontWeight: fontWeight.semibold,
    },
});
