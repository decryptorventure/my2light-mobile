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
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, fontSize, fontWeight, borderRadius } from "../../constants/theme";
import { Card } from "../../components/ui";

type TabType = "feed" | "explore" | "friends" | "ranking";

interface Post {
    id: string;
    userName: string;
    userAvatar: string | null;
    timeAgo: string;
    thumbnailUrl: string | null;
    likes: number;
    comments: number;
}

const mockPosts: Post[] = [
    {
        id: "1",
        userName: "Tomm méo",
        userAvatar: null,
        timeAgo: "khoảng 20 giờ trước",
        thumbnailUrl: null,
        likes: 0,
        comments: 0,
    },
    {
        id: "2",
        userName: "Tomm méo",
        userAvatar: null,
        timeAgo: "khoảng 20 giờ trước",
        thumbnailUrl: null,
        likes: 0,
        comments: 0,
    },
];

export default function SocialScreen() {
    const insets = useSafeAreaInsets();
    const [activeTab, setActiveTab] = useState<TabType>("feed");
    const [refreshing, setRefreshing] = useState(false);

    const tabs: { key: TabType; label: string }[] = [
        { key: "feed", label: "Bảng tin" },
        { key: "explore", label: "Khám phá" },
        { key: "friends", label: "Bạn bè" },
        { key: "ranking", label: "Xếp hạng" },
    ];

    const onRefresh = () => {
        setRefreshing(true);
        setTimeout(() => setRefreshing(false), 1000);
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
                <Text style={styles.title}>Cộng đồng</Text>
                <TouchableOpacity style={styles.meBadge}>
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
                            <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
                                {tab.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {/* Content */}
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
                }
            >
                {activeTab === "feed" && (
                    <>
                        {mockPosts.map((post) => (
                            <PostCard key={post.id} post={post} />
                        ))}
                    </>
                )}
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
        </View>
    );
}

function PostCard({ post }: { post: Post }) {
    return (
        <View style={styles.postCard}>
            {/* Post Header */}
            <View style={styles.postHeader}>
                <View style={styles.postUserInfo}>
                    <View style={styles.postAvatar}>
                        <Ionicons name="person" size={18} color={colors.textMuted} />
                    </View>
                    <View>
                        <Text style={styles.postUserName}>{post.userName}</Text>
                        <Text style={styles.postTime}>{post.timeAgo}</Text>
                    </View>
                </View>
                <TouchableOpacity style={styles.moreButton}>
                    <Ionicons name="ellipsis-horizontal" size={20} color={colors.textMuted} />
                </TouchableOpacity>
            </View>

            {/* Video Thumbnail */}
            <TouchableOpacity style={styles.videoContainer} activeOpacity={0.9}>
                <View style={styles.videoPlaceholder}>
                    <View style={styles.playButton}>
                        <Ionicons name="play" size={32} color="#fff" />
                    </View>
                </View>
            </TouchableOpacity>

            {/* Post Actions */}
            <View style={styles.postActions}>
                <View style={styles.postActionsLeft}>
                    <TouchableOpacity style={styles.actionButton}>
                        <Ionicons name="heart-outline" size={24} color={colors.text} />
                        <Text style={styles.actionCount}>{post.likes}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionButton}>
                        <Ionicons name="chatbubble-outline" size={22} color={colors.text} />
                        <Text style={styles.actionCount}>{post.comments}</Text>
                    </TouchableOpacity>
                </View>
                <TouchableOpacity>
                    <Ionicons name="share-social-outline" size={22} color={colors.text} />
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
    },
    videoPlaceholder: {
        width: "100%",
        height: "100%",
        backgroundColor: "#3a2a1a",
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
