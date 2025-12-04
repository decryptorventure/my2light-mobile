import { useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    RefreshControl,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, fontSize, fontWeight, borderRadius } from "../../constants/theme";
import { useMatchRequests } from "../../hooks/useApi";
import { MatchCardSkeleton, EmptyState } from "../../components/ui";
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

    // Transform API data to UI format or use mock
    const matches: MatchRequest[] = apiMatches && apiMatches.length > 0
        ? apiMatches.map(m => ({
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
                <TouchableOpacity style={styles.createButton} onPress={() => router.push("/create-match")}>
                    <Ionicons name="add" size={20} color={colors.background} />
                    <Text style={styles.createButtonText}>Tạo kèo</Text>
                </TouchableOpacity>
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
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
                }
            >
                {mockMatches.map((match) => (
                    <View key={match.id} style={styles.matchCard}>
                        <View style={styles.matchHeader}>
                            <View style={styles.matchUserInfo}>
                                <View style={styles.matchAvatar}>
                                    <Ionicons name="person-outline" size={20} color={colors.textMuted} />
                                </View>
                                <View>
                                    <Text style={styles.matchUserName}>{match.userName}</Text>
                                    <View style={styles.matchBadges}>
                                        <View style={[styles.levelBadge, { backgroundColor: getLevelColor(match.level) }]}>
                                            <Text style={styles.levelBadgeText}>{match.level}</Text>
                                        </View>
                                        <Text style={styles.matchTypeDot}>•</Text>
                                        <Text style={styles.matchType}>{match.matchType}</Text>
                                    </View>
                                </View>
                            </View>
                            <TouchableOpacity style={styles.acceptButton}>
                                <Text style={styles.acceptButtonText}>Nhận kèo</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.matchDetails}>
                            <View style={styles.detailRow}>
                                <Ionicons name="calendar-outline" size={16} color={colors.textMuted} />
                                <Text style={styles.detailText}>{match.dateTime}</Text>
                            </View>
                            <View style={styles.detailRow}>
                                <Ionicons name="location-outline" size={16} color={colors.textMuted} />
                                <Text style={styles.detailText}>{match.location}</Text>
                            </View>
                            <View style={styles.detailRow}>
                                <Ionicons name="people-outline" size={16} color={colors.textMuted} />
                                <Text style={styles.detailText}>Giới tính: {match.gender}</Text>
                            </View>
                        </View>

                        <Text style={styles.matchNote}>{match.note}</Text>
                    </View>
                ))}
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
});
