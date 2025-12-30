import { useState, useCallback } from "react";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    FlatList,
    RefreshControl,
    TouchableOpacity,
    Dimensions,
    TextInput,
} from "react-native";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { colors, spacing, fontSize, fontWeight, borderRadius } from "@/shared/constants/theme";
import {
    useHighlights,
    useCurrentUser,
    useUnreadNotificationCount,
    useCourts,
} from "../../hooks/useApi";
import { HighlightCardSkeleton, FadeInView } from "../../components/ui";
import { HighlightCard } from "@/features/highlights";
import { AnimatedPressable } from "@/shared/components/AnimatedPressable";
import haptics from "../../lib/haptics";

const { width } = Dimensions.get("window");
const CARD_WIDTH = (width - spacing.lg * 2 - spacing.md) / 2;

export default function HomeScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [searchQuery, setSearchQuery] = useState("");
    const [refreshing, setRefreshing] = useState(false);

    // Real data from API
    const { data: highlights, isLoading, refetch } = useHighlights(20);
    const { data: currentUser } = useCurrentUser();
    const { data: unreadCount } = useUnreadNotificationCount();
    const { data: courts, isLoading: courtsLoading, refetch: refetchCourts } = useCourts();

    const onRefresh = async () => {
        setRefreshing(true);
        haptics.light();
        await Promise.all([refetch(), refetchCourts()]);
        setRefreshing(false);
    };

    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, "0")}`;
    };

    const formatCredits = (credits: number) => {
        return `${credits.toLocaleString("vi-VN")}đ`;
    };

    return (
        <View style={styles.container}>
            <ScrollView
                contentContainerStyle={[
                    styles.scrollContent,
                    { paddingTop: insets.top + spacing.md },
                ]}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={colors.accent}
                    />
                }
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.greeting}>Chào {currentUser?.name || "bạn"},</Text>
                    <View style={styles.headerRight}>
                        <TouchableOpacity
                            style={styles.notificationBtn}
                            onPress={() => router.push("/notifications")}
                        >
                            <Ionicons name="notifications-outline" size={22} color={colors.text} />
                            {(unreadCount || 0) > 0 && (
                                <View style={styles.notificationBadge}>
                                    <Text style={styles.badgeText}>{unreadCount}</Text>
                                </View>
                            )}
                        </TouchableOpacity>
                        <View style={styles.balanceBadge}>
                            <Text style={styles.balanceText}>
                                {formatCredits(currentUser?.credits || 0)}
                            </Text>
                        </View>
                        <TouchableOpacity
                            style={styles.avatarBtn}
                            onPress={() => router.push("/(tabs)/profile")}
                        >
                            {currentUser?.avatar ? (
                                <Image
                                    source={{ uri: currentUser.avatar }}
                                    style={styles.avatarImage}
                                />
                            ) : (
                                <View style={styles.avatar}>
                                    <Ionicons name="person" size={18} color={colors.textMuted} />
                                </View>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Action Cards */}
                <View style={styles.actionCards}>
                    <AnimatedPressable
                        style={[styles.actionCard, styles.actionCardGreen]}
                        onPress={() => router.push("/qr")}
                        hapticStyle="medium"
                        scaleValue={0.95}
                    >
                        <View style={styles.actionCardIcon}>
                            <Ionicons name="qr-code-outline" size={36} color="#fff" />
                        </View>
                        <Text style={styles.actionCardTitle}>QUÉT QR</Text>
                        <Text style={styles.actionCardTitle}>VÀO SÂN</Text>
                    </AnimatedPressable>

                    <AnimatedPressable
                        style={[styles.actionCard, styles.actionCardOrange]}
                        onPress={() => router.push("/record")}
                        hapticStyle="medium"
                        scaleValue={0.95}
                    >
                        <View style={styles.actionCardIconWrapper}>
                            <Ionicons name="videocam" size={36} color="#fff" />
                            <View style={styles.liveIndicator} />
                        </View>
                        <Text style={styles.actionCardTitle}>TỰ QUAY</Text>
                        <Text style={styles.actionCardTitle}>(AI VOICE)</Text>
                    </AnimatedPressable>
                </View>

                {/* My Bookings Quick Link */}
                <TouchableOpacity
                    style={styles.myBookingsLink}
                    onPress={() => router.push("/my-bookings")}
                >
                    <View style={styles.myBookingsIconContainer}>
                        <Ionicons name="calendar-outline" size={20} color={colors.accent} />
                    </View>
                    <Text style={styles.myBookingsText}>Lịch đặt sân của tôi</Text>
                    <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
                </TouchableOpacity>

                {/* Highlights Section */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <View style={styles.sectionTitleRow}>
                            <Ionicons name="flash" size={18} color={colors.accent} />
                            <Text style={styles.sectionTitle}>Highlight Gần Đây</Text>
                        </View>
                        <TouchableOpacity>
                            <Text style={styles.seeAllText}>Xem tất cả</Text>
                        </TouchableOpacity>
                    </View>

                    {isLoading ? (
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.highlightsScroll}
                        >
                            {[1, 2, 3].map((i) => (
                                <View
                                    key={i}
                                    style={{ width: CARD_WIDTH, marginRight: spacing.md }}
                                >
                                    <HighlightCardSkeleton />
                                </View>
                            ))}
                        </ScrollView>
                    ) : !highlights || highlights.length === 0 ? (
                        <View style={styles.emptyState}>
                            <Ionicons name="videocam-outline" size={48} color={colors.textMuted} />
                            <Text style={styles.emptyTitle}>Chưa có highlight nào</Text>
                            <Text style={styles.emptyText}>Hãy quay video đầu tiên!</Text>
                        </View>
                    ) : (
                        <FlatList
                            horizontal
                            data={highlights}
                            keyExtractor={(item) => item.id}
                            renderItem={({ item }) => (
                                <HighlightCard highlight={item} cardWidth={CARD_WIDTH} />
                            )}
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.highlightsScroll}
                            initialNumToRender={4}
                            maxToRenderPerBatch={3}
                            windowSize={5}
                            removeClippedSubviews={true}
                            getItemLayout={(_, index) => ({
                                length: CARD_WIDTH + spacing.md,
                                offset: (CARD_WIDTH + spacing.md) * index,
                                index,
                            })}
                        />
                    )}
                </View>

                {/* Nearby Courts Section */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <View style={styles.sectionTitleRow}>
                            <Ionicons name="location" size={18} color={colors.primary} />
                            <Text style={styles.sectionTitle}>Sân Gần Bạn</Text>
                        </View>
                        <Text style={styles.courtCount}>{courts?.length || 0} sân</Text>
                    </View>

                    <View style={styles.searchContainer}>
                        <Ionicons name="search" size={20} color={colors.textMuted} />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Tìm sân theo tên hoặc địa chỉ..."
                            placeholderTextColor={colors.textMuted}
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />
                    </View>

                    {/* Courts List */}
                    {courtsLoading ? (
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyText}>Đang tải...</Text>
                        </View>
                    ) : !courts || courts.length === 0 ? (
                        <View style={styles.emptyState}>
                            <Ionicons name="location-outline" size={48} color={colors.textMuted} />
                            <Text style={styles.emptyTitle}>Chưa có sân nào</Text>
                            <Text style={styles.emptyText}>Các sân mới sẽ hiển thị ở đây</Text>
                        </View>
                    ) : (
                        courts
                            .filter(
                                (c) =>
                                    !searchQuery ||
                                    c.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                    c.address?.toLowerCase().includes(searchQuery.toLowerCase())
                            )
                            .slice(0, 5)
                            .map((court: any) => (
                                <TouchableOpacity
                                    key={court.id}
                                    style={styles.courtCard}
                                    onPress={() => router.push(`/court/${court.id}`)}
                                >
                                    <View style={styles.courtInfo}>
                                        <Text style={styles.courtName}>{court.name}</Text>
                                        <Text style={styles.courtAddress} numberOfLines={1}>
                                            {court.address}
                                        </Text>
                                        <View style={styles.courtMeta}>
                                            <View style={styles.priceBadge}>
                                                <Text style={styles.priceText}>
                                                    {(court.price_per_hour || 0).toLocaleString()}
                                                    đ/giờ
                                                </Text>
                                            </View>
                                            {court.rating > 0 && (
                                                <View style={styles.ratingContainer}>
                                                    <Ionicons
                                                        name="star"
                                                        size={12}
                                                        color="#f59e0b"
                                                    />
                                                    <Text style={styles.ratingText}>
                                                        {court.rating.toFixed(1)}
                                                    </Text>
                                                </View>
                                            )}
                                        </View>
                                    </View>
                                    <Ionicons
                                        name="chevron-forward"
                                        size={20}
                                        color={colors.textMuted}
                                    />
                                </TouchableOpacity>
                            ))
                    )}
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
    scrollContent: {
        paddingBottom: 100,
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: spacing.lg,
        marginBottom: spacing.lg,
    },
    greeting: {
        fontSize: fontSize.lg,
        color: colors.textSecondary,
    },
    headerRight: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.sm,
    },
    notificationBtn: {
        position: "relative",
        padding: spacing.xs,
    },
    notificationBadge: {
        position: "absolute",
        top: 0,
        right: 0,
        backgroundColor: "#ef4444",
        borderRadius: 10,
        minWidth: 16,
        height: 16,
        justifyContent: "center",
        alignItems: "center",
    },
    badgeText: {
        color: "#fff",
        fontSize: 10,
        fontWeight: "700",
    },
    balanceBadge: {
        backgroundColor: colors.surface,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
        borderRadius: borderRadius.full,
        borderWidth: 1,
        borderColor: colors.border,
    },
    balanceText: {
        color: colors.text,
        fontSize: fontSize.sm,
        fontWeight: fontWeight.semibold,
    },
    avatarBtn: {
        padding: 2,
    },
    avatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: colors.surface,
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 2,
        borderColor: colors.accent,
    },
    avatarImage: {
        width: 36,
        height: 36,
        borderRadius: 18,
        borderWidth: 2,
        borderColor: colors.accent,
    },
    actionCards: {
        flexDirection: "row",
        paddingHorizontal: spacing.lg,
        gap: spacing.md,
        marginBottom: spacing.xl,
    },
    actionCard: {
        flex: 1,
        borderRadius: borderRadius.lg,
        paddingVertical: spacing.xl,
        paddingHorizontal: spacing.lg,
        alignItems: "center",
        justifyContent: "center",
        minHeight: 140,
    },
    actionCardGreen: {
        backgroundColor: "#22c55e",
    },
    actionCardOrange: {
        backgroundColor: "#f97316",
    },
    actionCardIconWrapper: {
        position: "relative",
        marginBottom: spacing.md,
    },
    actionCardIcon: {
        marginBottom: spacing.md,
    },
    liveIndicator: {
        position: "absolute",
        top: -4,
        right: -8,
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: "#ef4444",
        borderWidth: 2,
        borderColor: "#f97316",
    },
    actionCardTitle: {
        color: "#fff",
        fontSize: fontSize.md,
        fontWeight: fontWeight.bold,
        textAlign: "center",
    },
    section: {
        marginBottom: spacing.xl,
    },
    sectionHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: spacing.lg,
        marginBottom: spacing.md,
    },
    sectionTitleRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.sm,
    },
    sectionTitle: {
        fontSize: fontSize.lg,
        fontWeight: fontWeight.bold,
        color: colors.text,
    },
    seeAllText: {
        fontSize: fontSize.sm,
        color: colors.primary,
        fontWeight: fontWeight.medium,
    },
    courtCount: {
        fontSize: fontSize.sm,
        color: colors.textMuted,
    },
    loadingContainer: {
        padding: spacing.xl,
        alignItems: "center",
        gap: spacing.sm,
    },
    loadingText: {
        color: colors.textMuted,
    },
    emptyState: {
        alignItems: "center",
        paddingVertical: spacing.xl,
        paddingHorizontal: spacing.lg,
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
    highlightsScroll: {
        paddingHorizontal: spacing.lg,
    },
    highlightCard: {
        width: CARD_WIDTH,
        marginRight: spacing.md,
    },
    thumbnailContainer: {
        width: "100%",
        aspectRatio: 9 / 16,
        borderRadius: borderRadius.lg,
        overflow: "hidden",
        backgroundColor: colors.surface,
        position: "relative",
    },
    thumbnail: {
        width: "100%",
        height: "100%",
    },
    placeholderThumbnail: {
        width: "100%",
        height: "100%",
        backgroundColor: "#1a3a2a",
        justifyContent: "center",
        alignItems: "center",
    },
    userOverlay: {
        position: "absolute",
        top: spacing.sm,
        left: spacing.sm,
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.xs,
    },
    userAvatarSmall: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: colors.surface,
        justifyContent: "center",
        alignItems: "center",
    },
    userName: {
        color: "#fff",
        fontSize: fontSize.sm,
        fontWeight: fontWeight.medium,
        textShadowColor: "rgba(0,0,0,0.5)",
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    titleOverlay: {
        position: "absolute",
        bottom: 40,
        left: spacing.sm,
        right: spacing.sm,
    },
    highlightTitle: {
        color: "#fff",
        fontSize: fontSize.sm,
        fontWeight: fontWeight.semibold,
        textShadowColor: "rgba(0,0,0,0.5)",
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
        lineHeight: 18,
    },
    bottomOverlay: {
        position: "absolute",
        bottom: spacing.sm,
        left: spacing.sm,
        right: spacing.sm,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    viewsContainer: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
    },
    viewsText: {
        color: "#fff",
        fontSize: fontSize.xs,
    },
    durationBadge: {
        backgroundColor: colors.accent,
        paddingHorizontal: spacing.sm,
        paddingVertical: 2,
        borderRadius: borderRadius.sm,
    },
    durationText: {
        color: colors.background,
        fontSize: fontSize.xs,
        fontWeight: fontWeight.bold,
    },
    searchContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: colors.surface,
        marginHorizontal: spacing.lg,
        paddingHorizontal: spacing.md,
        borderRadius: borderRadius.md,
        gap: spacing.sm,
    },
    searchInput: {
        flex: 1,
        color: colors.text,
        fontSize: fontSize.md,
        paddingVertical: spacing.md,
    },
    myBookingsLink: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: colors.surface,
        marginHorizontal: spacing.lg,
        marginTop: spacing.md,
        padding: spacing.md,
        borderRadius: borderRadius.lg,
        gap: spacing.sm,
    },
    myBookingsIconContainer: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: `${colors.accent}20`,
        justifyContent: "center",
        alignItems: "center",
    },
    myBookingsText: {
        flex: 1,
        color: colors.text,
        fontSize: fontSize.md,
        fontWeight: fontWeight.medium,
    },
    // Court card styles
    courtCard: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: colors.surface,
        marginHorizontal: spacing.lg,
        marginTop: spacing.sm,
        padding: spacing.md,
        borderRadius: borderRadius.lg,
        gap: spacing.md,
    },
    courtInfo: {
        flex: 1,
    },
    courtName: {
        color: colors.text,
        fontSize: fontSize.md,
        fontWeight: fontWeight.semibold,
        marginBottom: 2,
    },
    courtAddress: {
        color: colors.textMuted,
        fontSize: fontSize.sm,
        marginBottom: spacing.xs,
    },
    courtMeta: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.sm,
    },
    priceBadge: {
        backgroundColor: `${colors.accent}20`,
        paddingHorizontal: spacing.sm,
        paddingVertical: 2,
        borderRadius: borderRadius.sm,
    },
    priceText: {
        color: colors.accent,
        fontSize: fontSize.xs,
        fontWeight: fontWeight.semibold,
    },
    ratingContainer: {
        flexDirection: "row",
        alignItems: "center",
        gap: 2,
    },
    ratingText: {
        color: "#f59e0b",
        fontSize: fontSize.xs,
        fontWeight: fontWeight.medium,
    },
});
