import { useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, fontSize, fontWeight, borderRadius } from "../../constants/theme";
import { useAuthStore } from "../../stores/authStore";

type TabType = "posts" | "saved" | "liked";

export default function LibraryScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { user } = useAuthStore();
    const [activeTab, setActiveTab] = useState<TabType>("posts");
    const [refreshing, setRefreshing] = useState(false);

    const userName = user?.email?.split("@")[0] || "User";

    const onRefresh = () => {
        setRefreshing(true);
        setTimeout(() => setRefreshing(false), 1000);
    };

    const tabs: { key: TabType; icon: keyof typeof Ionicons.glyphMap }[] = [
        { key: "posts", icon: "grid-outline" },
        { key: "saved", icon: "bookmark-outline" },
        { key: "liked", icon: "heart-outline" },
    ];

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="chevron-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <TouchableOpacity>
                    <Ionicons name="settings-outline" size={24} color={colors.text} />
                </TouchableOpacity>
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
                {/* Profile Section */}
                <View style={styles.profileSection}>
                    <View style={styles.avatarContainer}>
                        <View style={styles.avatar}>
                            <Ionicons name="person" size={48} color={colors.textMuted} />
                        </View>
                        <TouchableOpacity style={styles.editAvatarButton}>
                            <Ionicons name="pencil" size={14} color="#fff" />
                        </TouchableOpacity>
                    </View>
                    <Text style={styles.userName}>@</Text>
                    <Text style={styles.bio}>Badminton Player & Enthusiast 🏸</Text>
                </View>

                {/* Stats */}
                <View style={styles.statsRow}>
                    <View style={styles.statItem}>
                        <Text style={styles.statValue}>0</Text>
                        <Text style={styles.statLabel}>Posts</Text>
                    </View>
                    <View style={styles.statItem}>
                        <Text style={styles.statValue}>0</Text>
                        <Text style={styles.statLabel}>Followers</Text>
                    </View>
                    <View style={styles.statItem}>
                        <Text style={styles.statValue}>0</Text>
                        <Text style={styles.statLabel}>Following</Text>
                    </View>
                    <View style={styles.statItem}>
                        <Text style={styles.statValue}>0</Text>
                        <Text style={styles.statLabel}>Likes</Text>
                    </View>
                </View>

                {/* Action Buttons */}
                <View style={styles.actionButtons}>
                    <TouchableOpacity style={styles.editButton}>
                        <Text style={styles.editButtonText}>Edit Profile</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.shareButton}>
                        <Text style={styles.shareButtonText}>Share Profile</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.moreButton}>
                        <Ionicons name="ellipsis-horizontal" size={20} color={colors.text} />
                    </TouchableOpacity>
                </View>

                {/* Tabs */}
                <View style={styles.tabsContainer}>
                    {tabs.map((tab) => (
                        <TouchableOpacity
                            key={tab.key}
                            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
                            onPress={() => setActiveTab(tab.key)}
                        >
                            <Ionicons
                                name={tab.icon}
                                size={24}
                                color={activeTab === tab.key ? colors.text : colors.textMuted}
                            />
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Content */}
                <View style={styles.contentSection}>
                    <View style={styles.emptyState}>
                        <Ionicons name="camera-outline" size={64} color={colors.surfaceLight} />
                        <Text style={styles.emptyTitle}>Chưa có bài đăng nào</Text>
                        <TouchableOpacity onPress={() => router.push("/record")}>
                            <Text style={styles.createLink}>Tạo highlight ngay</Text>
                        </TouchableOpacity>
                    </View>
                </View>
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
    },
    scrollContent: {
        paddingBottom: 100,
    },
    profileSection: {
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
    editAvatarButton: {
        position: "absolute",
        bottom: 4,
        right: 4,
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: colors.accent,
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 2,
        borderColor: colors.background,
    },
    userName: {
        fontSize: fontSize.xl,
        fontWeight: fontWeight.bold,
        color: colors.text,
    },
    bio: {
        fontSize: fontSize.sm,
        color: colors.textSecondary,
        marginTop: spacing.xs,
    },
    statsRow: {
        flexDirection: "row",
        justifyContent: "center",
        paddingVertical: spacing.md,
        gap: spacing.xl,
    },
    statItem: {
        alignItems: "center",
    },
    statValue: {
        fontSize: fontSize.lg,
        fontWeight: fontWeight.bold,
        color: colors.text,
    },
    statLabel: {
        fontSize: fontSize.xs,
        color: colors.textMuted,
        marginTop: 2,
    },
    actionButtons: {
        flexDirection: "row",
        paddingHorizontal: spacing.lg,
        gap: spacing.sm,
        marginTop: spacing.md,
    },
    editButton: {
        flex: 1,
        backgroundColor: colors.accent,
        paddingVertical: spacing.md,
        borderRadius: borderRadius.full,
        alignItems: "center",
    },
    editButtonText: {
        color: colors.background,
        fontSize: fontSize.md,
        fontWeight: fontWeight.semibold,
    },
    shareButton: {
        flex: 1,
        backgroundColor: colors.surface,
        paddingVertical: spacing.md,
        borderRadius: borderRadius.full,
        alignItems: "center",
    },
    shareButtonText: {
        color: colors.text,
        fontSize: fontSize.md,
        fontWeight: fontWeight.semibold,
    },
    moreButton: {
        width: 48,
        height: 48,
        backgroundColor: colors.surface,
        borderRadius: borderRadius.full,
        justifyContent: "center",
        alignItems: "center",
    },
    tabsContainer: {
        flexDirection: "row",
        marginTop: spacing.xl,
        borderTopWidth: 1,
        borderTopColor: colors.border,
    },
    tab: {
        flex: 1,
        alignItems: "center",
        paddingVertical: spacing.md,
        borderBottomWidth: 2,
        borderBottomColor: "transparent",
    },
    tabActive: {
        borderBottomColor: colors.text,
    },
    contentSection: {
        flex: 1,
        paddingTop: spacing.xl,
    },
    emptyState: {
        alignItems: "center",
        paddingVertical: spacing.xxl,
    },
    emptyTitle: {
        fontSize: fontSize.md,
        color: colors.textMuted,
        marginTop: spacing.lg,
    },
    createLink: {
        fontSize: fontSize.md,
        color: colors.text,
        fontWeight: fontWeight.semibold,
        marginTop: spacing.sm,
    },
});
