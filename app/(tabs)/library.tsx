import { useState, useCallback } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    RefreshControl,
    Image,
    FlatList,
    Dimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, fontSize, fontWeight, borderRadius } from "../../constants/theme";
import { useAuthStore } from "../../stores/authStore";
import { useCurrentUser, useUserHighlights } from "../../hooks/useApi";
import type { Highlight } from "../../types";

const { width } = Dimensions.get("window");
const VIDEO_CARD_SIZE = (width - spacing.lg * 2 - spacing.sm * 2) / 3;

type TabType = "posts" | "saved" | "liked";

export default function LibraryScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { user: authUser } = useAuthStore();
    const { data: profile, refetch: refetchProfile } = useCurrentUser();
    const {
        data: myHighlights,
        refetch: refetchHighlights,
        isLoading,
    } = useUserHighlights(profile?.id || "");

    const [activeTab, setActiveTab] = useState<TabType>("posts");
    const [refreshing, setRefreshing] = useState(false);

    const userName = profile?.name || authUser?.email?.split("@")[0] || "User";

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await Promise.all([refetchProfile(), refetchHighlights()]);
        setRefreshing(false);
    }, [refetchProfile, refetchHighlights]);

    const handleVideoPress = (index: number) => {
        // Navigate to feed with userId to show only user's own videos
        router.push({
            pathname: "/feed",
            params: {
                startIndex: String(index),
                userId: profile?.id || "",
            },
        });
    };

    const tabs: { key: TabType; icon: keyof typeof Ionicons.glyphMap }[] = [
        { key: "posts", icon: "grid-outline" },
        { key: "saved", icon: "bookmark-outline" },
        { key: "liked", icon: "heart-outline" },
    ];

    const totalLikes = myHighlights?.reduce((sum, h) => sum + (h.likes || 0), 0) || 0;

    const renderVideoItem = ({ item, index }: { item: Highlight; index: number }) => (
        <TouchableOpacity
            style={styles.videoCard}
            onPress={() => handleVideoPress(index)}
            activeOpacity={0.8}
        >
            {item.thumbnailUrl ? (
                <Image source={{ uri: item.thumbnailUrl }} style={styles.videoThumbnail} />
            ) : (
                <View style={styles.videoPlaceholder}>
                    <Ionicons name="play" size={24} color="rgba(255,255,255,0.8)" />
                </View>
            )}
            <View style={styles.videoOverlay}>
                <View style={styles.viewsContainer}>
                    <Ionicons name="play" size={10} color="#fff" />
                    <Text style={styles.viewsText}>{item.views || 0}</Text>
                </View>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="chevron-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Thư viện</Text>
                <TouchableOpacity onPress={() => router.push("/settings/edit-profile")}>
                    <Ionicons name="settings-outline" size={24} color={colors.text} />
                </TouchableOpacity>
            </View>

            <FlatList
                data={activeTab === "posts" ? myHighlights : []}
                keyExtractor={(item) => item.id}
                numColumns={3}
                renderItem={renderVideoItem}
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={colors.accent}
                    />
                }
                ListHeaderComponent={
                    <>
                        {/* Profile Section */}
                        <View style={styles.profileSection}>
                            <View style={styles.avatarContainer}>
                                {profile?.avatar ? (
                                    <Image source={{ uri: profile.avatar }} style={styles.avatar} />
                                ) : (
                                    <View style={styles.avatar}>
                                        <Ionicons
                                            name="person"
                                            size={48}
                                            color={colors.textMuted}
                                        />
                                    </View>
                                )}
                            </View>
                            <Text style={styles.userName}>@{userName}</Text>
                            {profile?.bio && <Text style={styles.bio}>{profile.bio}</Text>}
                        </View>

                        {/* Stats */}
                        <View style={styles.statsRow}>
                            <View style={styles.statItem}>
                                <Text style={styles.statValue}>{myHighlights?.length || 0}</Text>
                                <Text style={styles.statLabel}>Video</Text>
                            </View>
                            <View style={styles.statItem}>
                                <Text style={styles.statValue}>{profile?.followersCount || 0}</Text>
                                <Text style={styles.statLabel}>Followers</Text>
                            </View>
                            <View style={styles.statItem}>
                                <Text style={styles.statValue}>{profile?.followingCount || 0}</Text>
                                <Text style={styles.statLabel}>Following</Text>
                            </View>
                            <View style={styles.statItem}>
                                <Text style={styles.statValue}>{totalLikes}</Text>
                                <Text style={styles.statLabel}>Likes</Text>
                            </View>
                        </View>

                        {/* Action Buttons */}
                        <View style={styles.actionButtons}>
                            <TouchableOpacity
                                style={styles.editButton}
                                onPress={() => router.push("/settings/edit-profile")}
                            >
                                <Text style={styles.editButtonText}>Chỉnh sửa</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.recordButton}
                                onPress={() => router.push("/record/settings")}
                            >
                                <Ionicons name="add" size={20} color={colors.background} />
                                <Text style={styles.recordButtonText}>Quay video</Text>
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
                                        color={
                                            activeTab === tab.key ? colors.text : colors.textMuted
                                        }
                                    />
                                </TouchableOpacity>
                            ))}
                        </View>
                    </>
                }
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Ionicons name="videocam-outline" size={64} color={colors.surfaceLight} />
                        <Text style={styles.emptyTitle}>
                            {activeTab === "posts"
                                ? "Chưa có video nào"
                                : activeTab === "saved"
                                  ? "Chưa lưu video nào"
                                  : "Chưa thích video nào"}
                        </Text>
                        {activeTab === "posts" && (
                            <TouchableOpacity onPress={() => router.push("/record/settings")}>
                                <Text style={styles.createLink}>Tạo highlight ngay</Text>
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
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing.md,
    },
    headerTitle: {
        fontSize: fontSize.lg,
        fontWeight: fontWeight.bold,
        color: colors.text,
    },
    scrollContent: {
        paddingBottom: 100,
    },
    profileSection: {
        alignItems: "center",
        paddingVertical: spacing.lg,
    },
    avatarContainer: {
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
    userName: {
        fontSize: fontSize.xl,
        fontWeight: fontWeight.bold,
        color: colors.text,
    },
    bio: {
        fontSize: fontSize.sm,
        color: colors.textSecondary,
        marginTop: spacing.xs,
        textAlign: "center",
        paddingHorizontal: spacing.xl,
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
        backgroundColor: colors.surface,
        paddingVertical: spacing.md,
        borderRadius: borderRadius.full,
        alignItems: "center",
    },
    editButtonText: {
        color: colors.text,
        fontSize: fontSize.md,
        fontWeight: fontWeight.semibold,
    },
    recordButton: {
        flex: 1,
        flexDirection: "row",
        backgroundColor: colors.accent,
        paddingVertical: spacing.md,
        borderRadius: borderRadius.full,
        alignItems: "center",
        justifyContent: "center",
        gap: spacing.xs,
    },
    recordButtonText: {
        color: colors.background,
        fontSize: fontSize.md,
        fontWeight: fontWeight.semibold,
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
    // Video Grid
    videoCard: {
        width: VIDEO_CARD_SIZE,
        height: VIDEO_CARD_SIZE * 1.3,
        margin: spacing.xs,
        borderRadius: borderRadius.sm,
        overflow: "hidden",
        backgroundColor: colors.surface,
    },
    videoThumbnail: {
        width: "100%",
        height: "100%",
    },
    videoPlaceholder: {
        width: "100%",
        height: "100%",
        backgroundColor: colors.surface,
        justifyContent: "center",
        alignItems: "center",
    },
    videoOverlay: {
        position: "absolute",
        bottom: spacing.xs,
        left: spacing.xs,
    },
    viewsContainer: {
        flexDirection: "row",
        alignItems: "center",
        gap: 2,
    },
    viewsText: {
        color: "#fff",
        fontSize: 10,
        fontWeight: fontWeight.medium,
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
        color: colors.accent,
        fontWeight: fontWeight.semibold,
        marginTop: spacing.sm,
    },
});
