import { useState, useCallback } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { colors, spacing, fontSize, fontWeight, borderRadius } from "@/shared/constants/theme";
import { useMatchRequests } from "../../hooks/useApi";
import { MatchService } from "../../services/match.service";
import { MatchCardSkeleton, EmptyState } from "../../components/ui";
import { AnimatedPressable } from "@/shared/components/AnimatedPressable";
import haptics from "../../lib/haptics";

interface MatchRequest {
    id: string;
    userName: string;
    level: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
    matchType: "ĐÁNH ĐƠN" | "ĐÁNH ĐÔI";
    dateTime: string;
    location: string;
    gender: string;
    note: string;
}

// Fallback mock data when API returns empty
const mockMatches: MatchRequest[] = [
    {
        id: "1",
        userName: "Người chơi ẩn danh",
        level: "BEGINNER",
        matchType: "ĐÁNH ĐƠN",
        dateTime: "16:39 Th 6, 19/12",
        location: "Sân tự do",
        gender: "Bất kỳ",
        note: '"Giao lưu"',
    },
    {
        id: "2",
        userName: "Người chơi ẩn danh",
        level: "BEGINNER",
        matchType: "ĐÁNH ĐÔI",
        dateTime: "16:39 Th 6, 19/12",
        location: "Sân tự do",
        gender: "Bất kỳ",
        note: '"Giao lưu"',
    },
    {
        id: "3",
        userName: "Người chơi ẩn danh",
        level: "INTERMEDIATE",
        matchType: "ĐÁNH ĐƠN",
        dateTime: "16:39 Th 5, 4/12",
        location: "Sân tự do",
        gender: "Bất kỳ",
        note: '"Giao lưu nhẹ"',
    },
];

export default function MatchScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { data: apiMatches, isLoading, refetch } = useMatchRequests();
    const [refreshing, setRefreshing] = useState(false);
    const [levelFilter, setLevelFilter] = useState<string | null>(null);
    const [typeFilter, setTypeFilter] = useState<string | null>(null);

    // Get unread message count
    const { data: unreadCount = 0 } = useQuery({
        queryKey: ["unreadMessages"],
        queryFn: () => MatchService.getUnreadCount(),
        refetchInterval: 30000, // Check every 30 seconds
    });

    // Transform API data to UI format or use mock
    const matches: MatchRequest[] =
        apiMatches && apiMatches.length > 0
            ? apiMatches.map((m) => ({
                  id: m.id,
                  userName: m.profile?.name || "Người chơi ẩn danh",
                  level: m.skillLevel.toUpperCase() as any,
                  matchType: m.matchType === "singles" ? "ĐÁNH ĐƠN" : "ĐÁNH ĐÔI",
                  dateTime: new Date(m.preferredTime).toLocaleString("vi-VN"),
                  location: "Sân tự do",
                  gender: m.gender === "any" ? "Bất kỳ" : m.gender === "male" ? "Nam" : "Nữ",
                  note: m.description ? `"${m.description}"` : '""',
              }))
            : mockMatches;

    const onRefresh = async () => {
        setRefreshing(true);
        haptics.light();
        await refetch();
        setRefreshing(false);
    };

    const getLevelColor = (level: MatchRequest["level"]) => {
        switch (level) {
            case "BEGINNER":
                return "#22c55e";
            case "INTERMEDIATE":
                return "#f59e0b";
            case "ADVANCED":
                return "#ef4444";
        }
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
                <View>
                    <Text style={styles.title}>Tìm Đối Thủ</Text>
                    <Text style={styles.subtitle}>Cặp kèo Pickleball nhanh chóng</Text>
                </View>
                <View style={styles.headerButtons}>
                    <TouchableOpacity
                        style={styles.messagesBtn}
                        onPress={() => router.push("/match/conversations")}
                    >
                        <Ionicons name="chatbubbles-outline" size={22} color={colors.text} />
                        {unreadCount > 0 && (
                            <View style={styles.unreadBadge}>
                                <Text style={styles.unreadText}>
                                    {unreadCount > 9 ? "9+" : unreadCount}
                                </Text>
                            </View>
                        )}
                    </TouchableOpacity>
                    <AnimatedPressable
                        style={styles.createButton}
                        onPress={() => router.push("/create-match")}
                        hapticStyle="medium"
                        scaleValue={0.95}
                    >
                        <Ionicons name="add" size={20} color={colors.background} />
                        <Text style={styles.createButtonText}>Tạo kèo</Text>
                    </AnimatedPressable>
                </View>
            </View>

            {/* Filters */}
            <View style={styles.filters}>
                <TouchableOpacity style={styles.filterButton}>
                    <Text style={styles.filterText}>Tất cả trình độ</Text>
                    <Ionicons name="chevron-down" size={16} color={colors.text} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.filterButton}>
                    <Text style={styles.filterText}>Tất cả thể loại</Text>
                    <Ionicons name="chevron-down" size={16} color={colors.text} />
                </TouchableOpacity>
            </View>

            {/* Match List */}
            <FlatList
                data={matches}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={colors.accent}
                    />
                }
                renderItem={({ item: match }) => (
                    <TouchableOpacity
                        style={styles.matchCard}
                        onPress={() => router.push(`/match/${match.id}`)}
                        activeOpacity={0.8}
                    >
                        <View style={styles.matchHeader}>
                            <View style={styles.matchUserInfo}>
                                <View style={styles.matchAvatar}>
                                    <Ionicons
                                        name="person-outline"
                                        size={20}
                                        color={colors.textMuted}
                                    />
                                </View>
                                <View>
                                    <Text style={styles.matchUserName}>{match.userName}</Text>
                                    <View style={styles.matchBadges}>
                                        <View
                                            style={[
                                                styles.levelBadge,
                                                { backgroundColor: getLevelColor(match.level) },
                                            ]}
                                        >
                                            <Text style={styles.levelBadgeText}>{match.level}</Text>
                                        </View>
                                        <Text style={styles.matchTypeDot}>•</Text>
                                        <Text style={styles.matchType}>{match.matchType}</Text>
                                    </View>
                                </View>
                            </View>
                            <View style={styles.viewDetailBtn}>
                                <Text style={styles.viewDetailText}>Xem chi tiết</Text>
                                <Ionicons name="chevron-forward" size={16} color={colors.accent} />
                            </View>
                        </View>

                        <View style={styles.matchDetails}>
                            <View style={styles.detailRow}>
                                <Ionicons
                                    name="calendar-outline"
                                    size={16}
                                    color={colors.textMuted}
                                />
                                <Text style={styles.detailText}>{match.dateTime}</Text>
                            </View>
                            <View style={styles.detailRow}>
                                <Ionicons
                                    name="location-outline"
                                    size={16}
                                    color={colors.textMuted}
                                />
                                <Text style={styles.detailText}>{match.location}</Text>
                            </View>
                            <View style={styles.detailRow}>
                                <Ionicons
                                    name="people-outline"
                                    size={16}
                                    color={colors.textMuted}
                                />
                                <Text style={styles.detailText}>Giới tính: {match.gender}</Text>
                            </View>
                        </View>

                        <Text style={styles.matchNote}>{match.note}</Text>
                    </TouchableOpacity>
                )}
                ListEmptyComponent={
                    <EmptyState
                        icon="people-outline"
                        title="Chưa có kèo nào"
                        message="Hãy tạo kèo đầu tiên!"
                    />
                }
                initialNumToRender={5}
                maxToRenderPerBatch={3}
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
        alignItems: "flex-start",
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing.md,
    },
    title: {
        fontSize: fontSize.xxl,
        fontWeight: fontWeight.bold,
        color: colors.text,
    },
    subtitle: {
        fontSize: fontSize.sm,
        color: colors.textMuted,
        marginTop: spacing.xs,
    },
    createButton: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: colors.accent,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.md,
        gap: spacing.xs,
    },
    createButtonText: {
        color: colors.background,
        fontSize: fontSize.sm,
        fontWeight: fontWeight.semibold,
    },
    filters: {
        flexDirection: "row",
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        gap: spacing.sm,
    },
    filterButton: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: colors.surface,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.sm,
        gap: spacing.xs,
    },
    filterText: {
        color: colors.text,
        fontSize: fontSize.sm,
    },
    scrollContent: {
        padding: spacing.lg,
        paddingTop: 0,
        paddingBottom: 100,
    },
    matchCard: {
        backgroundColor: colors.surface,
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        marginBottom: spacing.md,
    },
    matchHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: spacing.md,
    },
    matchUserInfo: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.sm,
        flex: 1,
    },
    matchAvatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: colors.surfaceLight,
        justifyContent: "center",
        alignItems: "center",
    },
    matchUserName: {
        color: colors.text,
        fontSize: fontSize.md,
        fontWeight: fontWeight.semibold,
    },
    matchBadges: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 4,
        gap: spacing.xs,
    },
    levelBadge: {
        paddingHorizontal: spacing.sm,
        paddingVertical: 2,
        borderRadius: borderRadius.sm,
    },
    levelBadgeText: {
        color: "#fff",
        fontSize: fontSize.xs,
        fontWeight: fontWeight.bold,
    },
    matchTypeDot: {
        color: colors.textMuted,
        fontSize: fontSize.xs,
    },
    matchType: {
        color: colors.textMuted,
        fontSize: fontSize.xs,
    },
    acceptButton: {
        borderWidth: 1,
        borderColor: colors.accent,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.md,
    },
    acceptButtonText: {
        color: colors.accent,
        fontSize: fontSize.sm,
        fontWeight: fontWeight.semibold,
    },
    matchDetails: {
        gap: spacing.sm,
        marginBottom: spacing.md,
    },
    detailRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.sm,
    },
    detailText: {
        color: colors.textSecondary,
        fontSize: fontSize.sm,
    },
    matchNote: {
        color: colors.accent,
        fontSize: fontSize.sm,
        fontStyle: "italic",
    },
    headerButtons: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.sm,
    },
    messagesBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.surface,
        justifyContent: "center",
        alignItems: "center",
        position: "relative",
    },
    unreadBadge: {
        position: "absolute",
        top: -2,
        right: -2,
        minWidth: 18,
        height: 18,
        borderRadius: 9,
        backgroundColor: colors.error,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 4,
    },
    unreadText: {
        fontSize: 10,
        fontWeight: fontWeight.bold,
        color: "#fff",
    },
    viewDetailBtn: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
    },
    viewDetailText: {
        color: colors.accent,
        fontSize: fontSize.sm,
        fontWeight: fontWeight.semibold,
    },
});
