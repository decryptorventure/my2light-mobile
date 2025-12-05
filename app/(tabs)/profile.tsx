import { useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    RefreshControl,
    Image,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, fontSize, fontWeight, borderRadius } from "../../constants/theme";
import { useAuthStore } from "../../stores/authStore";
import { useCurrentUser, useUserHighlights } from "../../hooks/useApi";

type TabType = "info" | "history";

interface Achievement {
    id: string;
    name: string;
    icon: keyof typeof Ionicons.glyphMap;
    unlocked: boolean;
}

const achievements: Achievement[] = [
    { id: "1", name: "Smasher", icon: "flame", unlocked: true },
    { id: "2", name: "Early Bird", icon: "people", unlocked: true },
    { id: "3", name: "Fair Play", icon: "thumbs-up", unlocked: true },
    { id: "4", name: "Champion", icon: "trophy", unlocked: false },
    { id: "5", name: "Speed", icon: "flash", unlocked: false },
];

export default function ProfileScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { user: authUser, signOut } = useAuthStore();
    const { data: profile, isLoading, refetch } = useCurrentUser();
    const [activeTab, setActiveTab] = useState<TabType>("info");
    const [refreshing, setRefreshing] = useState(false);

    const userName = profile?.name || authUser?.email?.split("@")[0] || "User";
    const userCredits = profile?.credits || 0;
    const membershipTier = profile?.membershipTier?.toUpperCase() || "FREE";

    // Fetch user's highlights for stats only
    const { data: myHighlights, refetch: refetchHighlights } = useUserHighlights(profile?.id || "");

    const onRefresh = async () => {
        setRefreshing(true);
        await Promise.all([refetch(), refetchHighlights()]);
        setRefreshing(false);
    };

    return (
        <View style={styles.container}>
            <ScrollView
                contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + spacing.md }]}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
                }
            >
                {/* Profile Header */}
                <View style={styles.profileHeader}>
                    <View style={styles.avatarContainer}>
                        {profile?.avatar ? (
                            <Image source={{ uri: profile.avatar }} style={styles.avatar} />
                        ) : (
                            <View style={styles.avatar}>
                                <Ionicons name="person" size={48} color={colors.textMuted} />
                            </View>
                        )}
                        <View style={styles.onlineIndicator} />
                    </View>
                    <Text style={styles.userName}>{userName}</Text>
                    <View style={styles.memberBadgeRow}>
                        <View style={styles.memberBadge}>
                            <Text style={styles.memberBadgeText}>{membershipTier} MEMBER</Text>
                        </View>
                        <Text style={styles.noPhone}>{profile?.phone || "Chưa có SĐT"}</Text>
                    </View>

                    {/* Edit Profile Button */}
                    <TouchableOpacity
                        style={styles.editProfileButton}
                        onPress={() => router.push("/settings/edit-profile")}
                    >
                        <Ionicons name="pencil" size={16} color={colors.text} />
                        <Text style={styles.editProfileText}>Chỉnh sửa hồ sơ</Text>
                    </TouchableOpacity>
                </View>

                {/* Achievements */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>THÀNH TÍCH</Text>
                    <View style={styles.achievementsCard}>
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.achievementsScroll}
                        >
                            {achievements.map((achievement) => (
                                <View
                                    key={achievement.id}
                                    style={[styles.achievementItem, !achievement.unlocked && styles.achievementLocked]}
                                >
                                    <View style={[styles.achievementIcon, achievement.unlocked && styles.achievementIconActive]}>
                                        <Ionicons
                                            name={achievement.icon}
                                            size={24}
                                            color={achievement.unlocked ? colors.accent : colors.textMuted}
                                        />
                                    </View>
                                    <Text style={[styles.achievementName, !achievement.unlocked && styles.achievementNameLocked]}>
                                        {achievement.name}
                                    </Text>
                                </View>
                            ))}
                        </ScrollView>
                    </View>
                </View>

                {/* Tabs */}
                <View style={styles.tabsContainer}>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === "info" && styles.tabActive]}
                        onPress={() => setActiveTab("info")}
                    >
                        <Text style={[styles.tabText, activeTab === "info" && styles.tabTextActive]}>
                            Thông tin
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === "history" && styles.tabActive]}
                        onPress={() => setActiveTab("history")}
                    >
                        <Text style={[styles.tabText, activeTab === "history" && styles.tabTextActive]}>
                            Lịch sử đấu
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Stats */}
                <View style={styles.statsContainer}>
                    <View style={styles.statCircle}>
                        <View style={styles.statCircleInner}>
                            <Ionicons name="flash" size={24} color={colors.accent} />
                            <Text style={styles.statValue}>{myHighlights?.length || 0}</Text>
                        </View>
                        <Text style={styles.statLabel}>HIGHLIGHT</Text>
                    </View>
                    <View style={styles.statCircle}>
                        <View style={styles.statCircleInner}>
                            <Ionicons name="time-outline" size={24} color={colors.accent} />
                            <Text style={styles.statValue}>{profile?.hoursPlayed || 0}</Text>
                        </View>
                        <Text style={styles.statLabel}>GIỜ CHƠI</Text>
                    </View>
                    <View style={styles.statCircle}>
                        <View style={styles.statCircleInner}>
                            <Ionicons name="location-outline" size={24} color={colors.accent} />
                            <Text style={styles.statValue}>{profile?.courtsVisited || 0}</Text>
                        </View>
                        <Text style={styles.statLabel}>SÂN ĐÃ ĐẾN</Text>
                    </View>
                </View>

                {/* Wallet */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>VÍ CỦA TÔI</Text>
                    <TouchableOpacity style={styles.walletCard} onPress={() => router.push("/settings/wallet")} activeOpacity={0.8}>
                        <View>
                            <Text style={styles.walletLabel}>Số dư khả dụng</Text>
                            <Text style={styles.walletBalance}>{userCredits.toLocaleString()}đ</Text>
                        </View>
                        <View style={styles.topUpButton}>
                            <Text style={styles.topUpButtonText}>Nạp thêm</Text>
                        </View>
                    </TouchableOpacity>
                </View>

                {/* Court Management */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>QUẢN LÝ SÂN</Text>
                    <View style={styles.courtCard}>
                        <View style={styles.courtCardLeft}>
                            <View style={styles.courtIcon}>
                                <Ionicons name="tennisball" size={24} color={colors.primary} />
                            </View>
                            <View>
                                <Text style={styles.courtTitle}>Dashboard Chủ Sân</Text>
                                <Text style={styles.courtSubtitle}>Quản lý sân và booking</Text>
                            </View>
                        </View>
                    </View>
                    <TouchableOpacity style={styles.dashboardButton}>
                        <Text style={styles.dashboardButtonText}>Mở Dashboard</Text>
                    </TouchableOpacity>
                </View>

                {/* Sign Out */}
                <TouchableOpacity style={styles.signOutButton} onPress={signOut}>
                    <Ionicons name="log-out-outline" size={20} color={colors.error} />
                    <Text style={styles.signOutText}>Đăng xuất</Text>
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
    scrollContent: {
        paddingBottom: 120,
    },
    profileHeader: {
        alignItems: "center",
        paddingVertical: spacing.lg,
    },
    avatarContainer: {
        position: "relative",
        marginBottom: spacing.md,
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: colors.surface,
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 3,
        borderColor: colors.accent,
    },
    onlineIndicator: {
        position: "absolute",
        bottom: 8,
        right: 8,
        width: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: "#22c55e",
        borderWidth: 3,
        borderColor: colors.background,
    },
    userName: {
        fontSize: fontSize.xxl,
        fontWeight: fontWeight.bold,
        color: colors.text,
    },
    memberBadgeRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.sm,
        marginTop: spacing.sm,
    },
    memberBadge: {
        backgroundColor: colors.accent,
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs,
        borderRadius: borderRadius.sm,
    },
    memberBadgeText: {
        color: colors.background,
        fontSize: fontSize.xs,
        fontWeight: fontWeight.bold,
    },
    noPhone: {
        color: colors.textMuted,
        fontSize: fontSize.sm,
    },
    section: {
        paddingHorizontal: spacing.lg,
        marginTop: spacing.lg,
    },
    sectionTitle: {
        fontSize: fontSize.xs,
        fontWeight: fontWeight.semibold,
        color: colors.textMuted,
        letterSpacing: 1,
        marginBottom: spacing.md,
    },
    achievementsCard: {
        backgroundColor: colors.surface,
        borderRadius: borderRadius.lg,
        padding: spacing.md,
    },
    achievementsScroll: {
        gap: spacing.lg,
    },
    achievementItem: {
        alignItems: "center",
        width: 70,
    },
    achievementLocked: {
        opacity: 0.4,
    },
    achievementIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: colors.surfaceLight,
        justifyContent: "center",
        alignItems: "center",
        marginBottom: spacing.xs,
    },
    achievementIconActive: {
        backgroundColor: "rgba(163, 230, 53, 0.2)",
    },
    achievementName: {
        fontSize: fontSize.xs,
        color: colors.text,
        textAlign: "center",
    },
    achievementNameLocked: {
        color: colors.textMuted,
    },
    tabsContainer: {
        flexDirection: "row",
        marginHorizontal: spacing.lg,
        marginTop: spacing.xl,
        backgroundColor: colors.surface,
        borderRadius: borderRadius.full,
        padding: 4,
    },
    tab: {
        flex: 1,
        paddingVertical: spacing.md,
        borderRadius: borderRadius.full,
        alignItems: "center",
    },
    tabActive: {
        backgroundColor: colors.surfaceLight,
    },
    tabText: {
        fontSize: fontSize.md,
        color: colors.textMuted,
        fontWeight: fontWeight.medium,
    },
    tabTextActive: {
        color: colors.text,
    },
    statsContainer: {
        flexDirection: "row",
        justifyContent: "center",
        paddingVertical: spacing.xl,
        gap: spacing.xl,
    },
    statCircle: {
        alignItems: "center",
    },
    statCircleInner: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: colors.surface,
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 2,
        borderColor: colors.border,
        marginBottom: spacing.sm,
    },
    statValue: {
        fontSize: fontSize.xl,
        fontWeight: fontWeight.bold,
        color: colors.text,
        marginTop: spacing.xs,
    },
    statLabel: {
        fontSize: fontSize.xs,
        color: colors.textMuted,
        fontWeight: fontWeight.medium,
    },
    walletCard: {
        backgroundColor: colors.surface,
        borderRadius: borderRadius.lg,
        padding: spacing.lg,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    walletLabel: {
        fontSize: fontSize.sm,
        color: colors.textMuted,
        marginBottom: spacing.xs,
    },
    walletBalance: {
        fontSize: fontSize.xxl,
        fontWeight: fontWeight.bold,
        color: colors.accent,
    },
    topUpButton: {
        backgroundColor: colors.surfaceLight,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.md,
    },
    topUpButtonText: {
        color: colors.text,
        fontSize: fontSize.sm,
        fontWeight: fontWeight.semibold,
    },
    courtCard: {
        backgroundColor: colors.surface,
        borderRadius: borderRadius.lg,
        padding: spacing.md,
    },
    courtCardLeft: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.md,
    },
    courtIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: "rgba(8, 102, 255, 0.2)",
        justifyContent: "center",
        alignItems: "center",
    },
    courtTitle: {
        fontSize: fontSize.md,
        fontWeight: fontWeight.semibold,
        color: colors.text,
    },
    courtSubtitle: {
        fontSize: fontSize.sm,
        color: colors.textMuted,
        marginTop: 2,
    },
    dashboardButton: {
        backgroundColor: colors.accent,
        borderRadius: borderRadius.md,
        paddingVertical: spacing.md,
        alignItems: "center",
        marginTop: spacing.md,
    },
    dashboardButtonText: {
        color: colors.background,
        fontSize: fontSize.md,
        fontWeight: fontWeight.semibold,
    },
    signOutButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        marginTop: spacing.xxl,
        paddingVertical: spacing.md,
        gap: spacing.sm,
    },
    signOutText: {
        color: colors.error,
        fontSize: fontSize.md,
        fontWeight: fontWeight.medium,
    },
    editProfileButton: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: spacing.md,
        backgroundColor: colors.surface,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.full,
        gap: spacing.xs,
    },
    editProfileText: {
        color: colors.text,
        fontSize: fontSize.sm,
        fontWeight: fontWeight.medium,
    },
});
