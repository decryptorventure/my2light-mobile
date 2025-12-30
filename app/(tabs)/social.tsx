import { useState, useCallback } from "react";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    RefreshControl,
    Image,
    FlatList,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, fontSize, fontWeight, borderRadius } from "../../constants/theme";
import { useHighlights } from "../../hooks/useApi";
import type { Highlight } from "../../types";

type TabType = "feed" | "explore" | "friends" | "ranking";

export default function SocialScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<TabType>("feed");
    const [refreshing, setRefreshing] = useState(false);

    // Get real highlights from API
    const { data: highlights, refetch, isLoading } = useHighlights(50);

    const tabs: { key: TabType; label: string }[] = [
        { key: "feed", label: "Bảng tin" },
        { key: "explore", label: "Khám phá" },
        { key: "friends", label: "Bạn bè" },
        { key: "ranking", label: "Xếp hạng" },
    ];

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await refetch();
        setRefreshing(false);
    }, [refetch]);

    const handleVideoPress = (index: number) => {
        router.push({
            pathname: "/feed",
            params: {
                startIndex: String(index),
            },
        });
    };

    const formatTimeAgo = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffHours / 24);

        if (diffDays > 0) return `${diffDays} ngày trước`;
        if (diffHours > 0) return `${diffHours} giờ trước`;
        return "Vừa xong";
    };

    const renderPostItem = ({ item, index }: { item: Highlight; index: number }) => (
        <View style={styles.postCard}>
            {/* Post Header */}
            <View style={styles.postHeader}>
                <TouchableOpacity
                    style={styles.postUserInfo}
                    onPress={() => router.push(`/player/${item.userId}`)}
                >
                    {item.userAvatar ? (
                        <Image source={{ uri: item.userAvatar }} style={styles.postAvatar} />
                    ) : (
                        <View style={styles.postAvatarPlaceholder}>
                            <Ionicons name="person" size={18} color={colors.textMuted} />
                        </View>
                    )}
                    <View>
                        <Text style={styles.postUserName}>{item.userName || "Người chơi"}</Text>
                        <Text style={styles.postTime}>{formatTimeAgo(item.createdAt)}</Text>
                    </View>
                </TouchableOpacity>
                <TouchableOpacity style={styles.moreButton}>
                    <Ionicons name="ellipsis-horizontal" size={20} color={colors.textMuted} />
                </TouchableOpacity>
            </View>

            {/* Video Thumbnail */}
            <TouchableOpacity
                style={styles.videoContainer}
                activeOpacity={0.9}
                onPress={() => handleVideoPress(index)}
            >
                {item.thumbnailUrl ? (
                    <Image source={{ uri: item.thumbnailUrl }} style={styles.videoThumbnail} />
                ) : (
                    <View style={styles.videoPlaceholder}>
                        <View style={styles.playButton}>
                            <Ionicons name="play" size={32} color="#fff" />
                        </View>
                    </View>
                )}
                {/* Duration badge */}
                <View style={styles.durationBadge}>
                    <Text style={styles.durationText}>
                        {Math.floor((item.durationSec || 0) / 60)}:
                        {((item.durationSec || 0) % 60).toString().padStart(2, "0")}
                    </Text>
                </View>
            </TouchableOpacity>

            {/* Title & Description */}
            {(item.title || item.description) && (
                <View style={styles.postContent}>
                    {item.title && <Text style={styles.postTitle}>{item.title}</Text>}
                    {item.description && (
                        <Text style={styles.postDescription} numberOfLines={2}>
                            {item.description}
                        </Text>
                    )}
                </View>
            )}

            {/* Post Actions */}
            <View style={styles.postActions}>
                <View style={styles.postActionsLeft}>
                    <TouchableOpacity style={styles.actionButton}>
                        <Ionicons
                            name={item.isLiked ? "heart" : "heart-outline"}
                            size={24}
                            color={item.isLiked ? colors.error : colors.text}
                        />
                        <Text style={styles.actionCount}>{item.likes}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionButton}>
                        <Ionicons name="chatbubble-outline" size={22} color={colors.text} />
                        <Text style={styles.actionCount}>{item.comments || 0}</Text>
                    </TouchableOpacity>
                </View>
                <TouchableOpacity>
                    <Ionicons name="share-social-outline" size={22} color={colors.text} />
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
                <Text style={styles.title}>Cộng đồng</Text>
                <TouchableOpacity
                    style={styles.meBadge}
                    onPress={() => router.push("/(tabs)/library")}
                >
                    <Text style={styles.meBadgeText}>ME</Text>
                </TouchableOpacity>
            </View>

            {/* Tabs */}
            <View style={styles.tabsWrapper}>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.tabs}
                >
                    {tabs.map((tab) => (
                        <TouchableOpacity
                            key={tab.key}
                            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
                            onPress={() => setActiveTab(tab.key)}
                        >
                            <Text
                                style={[
                                    styles.tabText,
                                    activeTab === tab.key && styles.tabTextActive,
                                ]}
                            >
                                {tab.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {/* Content */}
            {activeTab === "feed" ? (
                <FlatList
                    data={highlights}
                    keyExtractor={(item) => item.id}
                    renderItem={renderPostItem}
                    contentContainerStyle={styles.scrollContent}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            tintColor={colors.accent}
                        />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <Ionicons name="videocam-outline" size={48} color={colors.textMuted} />
                            <Text style={styles.emptyTitle}>Chưa có video nào</Text>
                            <Text style={styles.emptyText}>
                                Hãy quay highlight đầu tiên của bạn!
                            </Text>
                            <TouchableOpacity
                                style={styles.createButton}
                                onPress={() => router.push("/record/settings")}
                            >
                                <Text style={styles.createButtonText}>Tạo Highlight</Text>
                            </TouchableOpacity>
                        </View>
                    }
                />
            ) : (
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
                    {activeTab === "explore" && (
                        <View style={styles.emptyState}>
                            <Ionicons name="compass-outline" size={48} color={colors.textMuted} />
                            <Text style={styles.emptyTitle}>Khám phá</Text>
                            <Text style={styles.emptyText}>Tìm kiếm highlights thú vị</Text>
                        </View>
                    )}
                    {activeTab === "friends" && (
                        <View style={styles.emptyState}>
                            <Ionicons name="people-outline" size={48} color={colors.textMuted} />
                            <Text style={styles.emptyTitle}>Bạn bè</Text>
                            <Text style={styles.emptyText}>Danh sách bạn bè của bạn</Text>
                        </View>
                    )}
                    {activeTab === "ranking" && (
                        <View style={styles.emptyState}>
                            <Ionicons name="trophy-outline" size={48} color={colors.textMuted} />
                            <Text style={styles.emptyTitle}>Xếp hạng</Text>
                            <Text style={styles.emptyText}>Bảng xếp hạng người chơi</Text>
                        </View>
                    )}
                </ScrollView>
            )}
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
    title: {
        fontSize: fontSize.xxl,
        fontWeight: fontWeight.bold,
        color: colors.accent,
    },
    meBadge: {
        backgroundColor: colors.accent,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
        borderRadius: borderRadius.sm,
    },
    meBadgeText: {
        color: colors.background,
        fontSize: fontSize.sm,
        fontWeight: fontWeight.bold,
    },
    tabsWrapper: {
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    tabs: {
        paddingHorizontal: spacing.lg,
        gap: spacing.lg,
    },
    tab: {
        paddingVertical: spacing.md,
        borderBottomWidth: 2,
        borderBottomColor: "transparent",
    },
    tabActive: {
        borderBottomColor: colors.text,
    },
    tabText: {
        fontSize: fontSize.md,
        color: colors.textMuted,
        fontWeight: fontWeight.medium,
    },
    tabTextActive: {
        color: colors.text,
    },
    scrollContent: {
        paddingBottom: 100,
    },
    emptyState: {
        alignItems: "center",
        paddingVertical: spacing.xxl * 2,
    },
    emptyTitle: {
        color: colors.text,
        fontSize: fontSize.lg,
        fontWeight: fontWeight.semibold,
        marginTop: spacing.md,
    },
    emptyText: {
        color: colors.textMuted,
        fontSize: fontSize.sm,
        marginTop: spacing.xs,
    },
    createButton: {
        marginTop: spacing.lg,
        backgroundColor: colors.accent,
        paddingHorizontal: spacing.xl,
        paddingVertical: spacing.md,
        borderRadius: borderRadius.full,
    },
    createButtonText: {
        color: colors.background,
        fontSize: fontSize.md,
        fontWeight: fontWeight.bold,
    },
    postCard: {
        paddingVertical: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    postHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: spacing.lg,
        marginBottom: spacing.md,
    },
    postUserInfo: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.sm,
    },
    postAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
    },
    postAvatarPlaceholder: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.surface,
        justifyContent: "center",
        alignItems: "center",
    },
    postUserName: {
        color: colors.text,
        fontSize: fontSize.md,
        fontWeight: fontWeight.semibold,
    },
    postTime: {
        color: colors.textMuted,
        fontSize: fontSize.xs,
        marginTop: 2,
    },
    moreButton: {
        padding: spacing.sm,
    },
    videoContainer: {
        marginHorizontal: spacing.lg,
        aspectRatio: 16 / 9,
        borderRadius: borderRadius.md,
        overflow: "hidden",
        position: "relative",
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
    playButton: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: "rgba(0,0,0,0.5)",
        justifyContent: "center",
        alignItems: "center",
    },
    durationBadge: {
        position: "absolute",
        bottom: spacing.sm,
        right: spacing.sm,
        backgroundColor: "rgba(0,0,0,0.7)",
        paddingHorizontal: spacing.sm,
        paddingVertical: 2,
        borderRadius: 4,
    },
    durationText: {
        color: "#fff",
        fontSize: 11,
        fontWeight: fontWeight.medium,
    },
    postContent: {
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.sm,
    },
    postTitle: {
        color: colors.text,
        fontSize: fontSize.md,
        fontWeight: fontWeight.semibold,
    },
    postDescription: {
        color: colors.textSecondary,
        fontSize: fontSize.sm,
        marginTop: 2,
    },
    postActions: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: spacing.lg,
        marginTop: spacing.md,
    },
    postActionsLeft: {
        flexDirection: "row",
        gap: spacing.lg,
    },
    actionButton: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.xs,
    },
    actionCount: {
        color: colors.text,
        fontSize: fontSize.sm,
    },
});
