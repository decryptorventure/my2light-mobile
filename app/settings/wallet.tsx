import { useState, useEffect } from "react";
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
import { useAuthStore } from "../../stores/authStore";
import { Card, Button } from "../../components/ui";

interface Transaction {
    id: string;
    type: "topup" | "booking" | "refund";
    amount: number;
    description: string;
    timestamp: number;
    status: "completed" | "pending" | "failed";
}

const mockTransactions: Transaction[] = [
    {
        id: "init",
        type: "topup",
        amount: 500000,
        description: "Tặng thưởng thành viên mới",
        timestamp: Date.now() - 100000000,
        status: "completed",
    },
    {
        id: "2",
        type: "booking",
        amount: -150000,
        description: "Đặt sân Tennis Tân Bình",
        timestamp: Date.now() - 86400000,
        status: "completed",
    },
    {
        id: "3",
        type: "topup",
        amount: 200000,
        description: "Nạp tiền qua MoMo",
        timestamp: Date.now() - 172800000,
        status: "completed",
    },
];

export default function WalletScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { user } = useAuthStore();
    const [transactions, setTransactions] = useState<Transaction[]>(mockTransactions);
    const [refreshing, setRefreshing] = useState(false);
    const [balance, setBalance] = useState(200000);

    const onRefresh = () => {
        setRefreshing(true);
        setTimeout(() => setRefreshing(false), 1000);
    };

    const totalTopUp = transactions
        .filter((t) => t.type === "topup")
        .reduce((sum, t) => sum + t.amount, 0);

    const totalSpend = Math.abs(
        transactions
            .filter((t) => t.type === "booking")
            .reduce((sum, t) => sum + t.amount, 0)
    );

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
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
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
                            <Text style={styles.balanceAmount}>{balance.toLocaleString()}đ</Text>
                        </View>
                    </View>
                    <TouchableOpacity style={styles.topUpButton}>
                        <Ionicons name="add" size={20} color="#fff" />
                        <Text style={styles.topUpButtonText}>Nạp tiền</Text>
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
                        <Text style={styles.transactionCount}>{transactions.length} giao dịch</Text>
                    </View>

                    {transactions.length === 0 ? (
                        <Card style={styles.emptyCard}>
                            <Ionicons name="wallet-outline" size={48} color={colors.textMuted} />
                            <Text style={styles.emptyTitle}>Chưa có giao dịch</Text>
                            <Text style={styles.emptyText}>Lịch sử giao dịch sẽ hiển thị ở đây</Text>
                        </Card>
                    ) : (
                        transactions.map((transaction) => (
                            <TransactionItem key={transaction.id} transaction={transaction} />
                        ))
                    )}
                </View>
            </ScrollView>
        </View>
    );
}

function TransactionItem({ transaction }: { transaction: Transaction }) {
    const isPositive = transaction.amount > 0;
    const date = new Date(transaction.timestamp);

    const getIcon = () => {
        switch (transaction.type) {
            case "topup":
                return <Ionicons name="trending-up" size={20} color="#22c55e" />;
            case "booking":
                return <Ionicons name="trending-down" size={20} color="#ef4444" />;
            case "refund":
                return <Ionicons name="trending-up" size={20} color="#3b82f6" />;
        }
    };

    const getStatusStyle = () => {
        switch (transaction.status) {
            case "completed":
                return { bg: "rgba(34, 197, 94, 0.2)", text: "#22c55e" };
            case "pending":
                return { bg: "rgba(245, 158, 11, 0.2)", text: "#f59e0b" };
            case "failed":
                return { bg: "rgba(239, 68, 68, 0.2)", text: "#ef4444" };
        }
    };

    const statusStyle = getStatusStyle();
    const statusText =
        transaction.status === "completed"
            ? "Thành công"
            : transaction.status === "pending"
                ? "Chờ xử lý"
                : "Thất bại";

    return (
        <Card style={styles.transactionCard}>
            <View style={styles.transactionIcon}>{getIcon()}</View>
            <View style={styles.transactionContent}>
                <Text style={styles.transactionDesc}>{transaction.description}</Text>
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
                    <Text style={[styles.statusText, { color: statusStyle.text }]}>{statusText}</Text>
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
    topUpButtonText: {
        color: "#fff",
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
