/**
 * Review List Component
 * Displays reviews for a court with stats
 */

import React from "react";
import { View, Text, StyleSheet, FlatList } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, fontSize, fontWeight, borderRadius } from "@/shared/constants/theme";
import { Review, ReviewStats } from "../../services/review.service";

interface ReviewListProps {
    reviews: Review[];
    stats?: ReviewStats;
    isLoading?: boolean;
}

const ReviewItem = ({ review }: { review: Review }) => {
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString("vi-VN", {
            day: "numeric",
            month: "short",
            year: "numeric",
        });
    };

    return (
        <View style={styles.reviewItem}>
            <View style={styles.reviewHeader}>
                <Image
                    source={{
                        uri: review.userAvatar || "https://via.placeholder.com/40",
                    }}
                    style={styles.avatar}
                />
                <View style={styles.reviewInfo}>
                    <Text style={styles.userName}>{review.userName}</Text>
                    <View style={styles.ratingRow}>
                        {[1, 2, 3, 4, 5].map((star) => (
                            <Ionicons
                                key={star}
                                name={star <= review.rating ? "star" : "star-outline"}
                                size={14}
                                color={star <= review.rating ? colors.warning : colors.textMuted}
                            />
                        ))}
                        <Text style={styles.reviewDate}>• {formatDate(review.createdAt)}</Text>
                    </View>
                </View>
            </View>
            {review.comment && <Text style={styles.comment}>{review.comment}</Text>}
        </View>
    );
};

const RatingBar = ({ stars, count, total }: { stars: number; count: number; total: number }) => {
    const percentage = total > 0 ? (count / total) * 100 : 0;

    return (
        <View style={styles.ratingBar}>
            <Text style={styles.ratingBarLabel}>{stars}</Text>
            <Ionicons name="star" size={12} color={colors.warning} />
            <View style={styles.barContainer}>
                <View style={[styles.barFill, { width: `${percentage}%` }]} />
            </View>
            <Text style={styles.ratingBarCount}>{count}</Text>
        </View>
    );
};

export default function ReviewList({ reviews, stats, isLoading }: ReviewListProps) {
    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Đang tải đánh giá...</Text>
            </View>
        );
    }

    const renderHeader = () => (
        <View style={styles.statsContainer}>
            {stats && (
                <>
                    {/* Overall Rating */}
                    <View style={styles.overallRating}>
                        <Text style={styles.ratingNumber}>{stats.averageRating.toFixed(1)}</Text>
                        <View style={styles.starsRow}>
                            {[1, 2, 3, 4, 5].map((star) => (
                                <Ionicons
                                    key={star}
                                    name={
                                        star <= Math.round(stats.averageRating)
                                            ? "star"
                                            : "star-outline"
                                    }
                                    size={16}
                                    color={colors.warning}
                                />
                            ))}
                        </View>
                        <Text style={styles.totalReviews}>{stats.totalReviews} đánh giá</Text>
                    </View>

                    {/* Rating Distribution */}
                    <View style={styles.distribution}>
                        {[5, 4, 3, 2, 1].map((star) => (
                            <RatingBar
                                key={star}
                                stars={star}
                                count={
                                    stats.ratingDistribution[
                                        star as keyof typeof stats.ratingDistribution
                                    ]
                                }
                                total={stats.totalReviews}
                            />
                        ))}
                    </View>
                </>
            )}
        </View>
    );

    const renderEmpty = () => (
        <View style={styles.emptyContainer}>
            <Ionicons name="chatbubble-outline" size={48} color={colors.textMuted} />
            <Text style={styles.emptyText}>Chưa có đánh giá nào</Text>
            <Text style={styles.emptySubtext}>Hãy là người đầu tiên đánh giá!</Text>
        </View>
    );

    return (
        <View style={styles.container}>
            <Text style={styles.sectionTitle}>Đánh giá & Nhận xét</Text>

            {stats && stats.totalReviews > 0 && renderHeader()}

            {reviews.length === 0 ? (
                renderEmpty()
            ) : (
                <FlatList
                    data={reviews}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => <ReviewItem review={item} />}
                    scrollEnabled={false}
                    contentContainerStyle={styles.listContent}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginTop: spacing.lg,
    },
    sectionTitle: {
        fontSize: fontSize.lg,
        fontWeight: fontWeight.bold,
        color: colors.text,
        marginBottom: spacing.md,
    },
    loadingContainer: {
        padding: spacing.xl,
        alignItems: "center",
    },
    loadingText: {
        color: colors.textMuted,
        fontSize: fontSize.sm,
    },
    statsContainer: {
        flexDirection: "row",
        backgroundColor: colors.surface,
        borderRadius: borderRadius.lg,
        padding: spacing.lg,
        marginBottom: spacing.lg,
        gap: spacing.lg,
    },
    overallRating: {
        alignItems: "center",
        justifyContent: "center",
        paddingRight: spacing.lg,
        borderRightWidth: 1,
        borderRightColor: colors.border,
    },
    ratingNumber: {
        fontSize: 36,
        fontWeight: fontWeight.bold,
        color: colors.text,
    },
    starsRow: {
        flexDirection: "row",
        marginVertical: spacing.xs,
    },
    totalReviews: {
        fontSize: fontSize.sm,
        color: colors.textMuted,
    },
    distribution: {
        flex: 1,
        justifyContent: "center",
        gap: 4,
    },
    ratingBar: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
    },
    ratingBarLabel: {
        width: 12,
        fontSize: fontSize.xs,
        color: colors.textMuted,
        textAlign: "right",
    },
    barContainer: {
        flex: 1,
        height: 6,
        backgroundColor: colors.background,
        borderRadius: 3,
        overflow: "hidden",
    },
    barFill: {
        height: "100%",
        backgroundColor: colors.warning,
        borderRadius: 3,
    },
    ratingBarCount: {
        width: 24,
        fontSize: fontSize.xs,
        color: colors.textMuted,
        textAlign: "right",
    },
    listContent: {
        gap: spacing.md,
    },
    reviewItem: {
        backgroundColor: colors.surface,
        borderRadius: borderRadius.md,
        padding: spacing.md,
    },
    reviewHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.sm,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.background,
    },
    reviewInfo: {
        flex: 1,
    },
    userName: {
        fontSize: fontSize.md,
        fontWeight: fontWeight.semibold,
        color: colors.text,
    },
    ratingRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 2,
        marginTop: 2,
    },
    reviewDate: {
        fontSize: fontSize.xs,
        color: colors.textMuted,
        marginLeft: spacing.xs,
    },
    comment: {
        fontSize: fontSize.sm,
        color: colors.textSecondary,
        marginTop: spacing.sm,
        lineHeight: 20,
    },
    emptyContainer: {
        alignItems: "center",
        padding: spacing.xl,
    },
    emptyText: {
        fontSize: fontSize.md,
        fontWeight: fontWeight.semibold,
        color: colors.textSecondary,
        marginTop: spacing.md,
    },
    emptySubtext: {
        fontSize: fontSize.sm,
        color: colors.textMuted,
        marginTop: spacing.xs,
    },
});
