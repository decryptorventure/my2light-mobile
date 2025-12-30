import { useState, useCallback } from "react";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    RefreshControl,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { colors, spacing, fontSize, fontWeight, borderRadius } from "@/shared/constants/theme";
import { useCourtById } from "../../hooks/useApi";
import { ReviewService } from "../../services/review.service";
import ReviewForm from "../../components/reviews/ReviewForm";
import ReviewList from "../../components/reviews/ReviewList";
import haptics from "../../lib/haptics";

export default function CourtDetailScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { id } = useLocalSearchParams<{ id: string }>();
    const [refreshing, setRefreshing] = useState(false);
    const [showReviewForm, setShowReviewForm] = useState(false);

    const { data: court, isLoading, refetch } = useCourtById(id || "");

    // Reviews query
    const { data: reviews = [], refetch: refetchReviews } = useQuery({
        queryKey: ["reviews", id],
        queryFn: async () => {
            if (!id) return [];
            const result = await ReviewService.getCourtReviews(id);
            return result.data || [];
        },
        enabled: !!id,
    });

    // Review stats query
    const { data: reviewStats } = useQuery({
        queryKey: ["reviewStats", id],
        queryFn: async () => {
            if (!id) return undefined;
            const result = await ReviewService.getReviewStats(id);
            return result.data;
        },
        enabled: !!id,
    });

    // User's existing review
    const { data: myReview } = useQuery({
        queryKey: ["myReview", id],
        queryFn: async () => {
            if (!id) return null;
            const result = await ReviewService.getUserReview(id);
            return result.data;
        },
        enabled: !!id,
    });

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await Promise.all([refetch(), refetchReviews()]);
        setRefreshing(false);
    }, [refetch, refetchReviews]);

    const handleBook = () => {
        haptics.medium();
        if (!court) return;
        router.push({
            pathname: "/booking/[id]",
            params: { id: court.id },
        });
    };

    if (isLoading) {
        return (
            <View style={[styles.container, styles.centered]}>
                <Text style={styles.loadingText}>Đang tải...</Text>
            </View>
        );
    }

    if (!court) {
        return (
            <View style={[styles.container, styles.centered]}>
                <Ionicons name="alert-circle-outline" size={64} color={colors.textMuted} />
                <Text style={styles.errorText}>Không tìm thấy sân</Text>
                <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                    <Text style={styles.backBtnText}>Quay lại</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const formatPrice = (price: number) => {
        return `${price.toLocaleString("vi-VN")}đ`;
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
                <TouchableOpacity style={styles.headerBtn} onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle} numberOfLines={1}>
                    {court.name}
                </Text>
                <TouchableOpacity style={styles.headerBtn}>
                    <Ionicons name="heart-outline" size={24} color={colors.text} />
                </TouchableOpacity>
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={colors.accent}
                    />
                }
            >
                {/* Court Image */}
                <View style={styles.imageContainer}>
                    {court.images && court.images.length > 0 ? (
                        <Image source={{ uri: court.images[0] }} style={styles.courtImage} />
                    ) : (
                        <View style={styles.placeholderImage}>
                            <Ionicons
                                name="tennisball-outline"
                                size={64}
                                color={colors.textMuted}
                            />
                        </View>
                    )}
                    {(court as any).is_active !== false && (
                        <View style={styles.statusBadge}>
                            <Text style={styles.statusText}>Đang hoạt động</Text>
                        </View>
                    )}
                </View>

                {/* Court Info */}
                <View style={styles.infoSection}>
                    <Text style={styles.courtName}>{court.name}</Text>

                    <View style={styles.infoRow}>
                        <Ionicons name="location-outline" size={18} color={colors.textMuted} />
                        <Text style={styles.infoText}>{court.address || "Chưa có địa chỉ"}</Text>
                    </View>

                    <View style={styles.infoRow}>
                        <Ionicons name="time-outline" size={18} color={colors.textMuted} />
                        <Text style={styles.infoText}>
                            {(court as any).open_time || court.openTime || "06:00"} -{" "}
                            {(court as any).close_time || court.closeTime || "22:00"}
                        </Text>
                    </View>

                    {(court.rating || 0) > 0 && (
                        <View style={styles.infoRow}>
                            <Ionicons name="star" size={18} color="#f59e0b" />
                            <Text style={styles.infoText}>
                                {(court.rating || 0).toFixed(1)} (
                                {(court as any).total_reviews || court.totalReviews || 0} đánh giá)
                            </Text>
                        </View>
                    )}
                </View>

                {/* Price */}
                <View style={styles.priceSection}>
                    <Text style={styles.priceLabel}>Giá thuê</Text>
                    <Text style={styles.priceValue}>
                        {formatPrice((court as any).price_per_hour || court.pricePerHour || 0)}/giờ
                    </Text>
                </View>

                {/* Description */}
                {court.description && (
                    <View style={styles.descSection}>
                        <Text style={styles.sectionTitle}>Mô tả</Text>
                        <Text style={styles.descText}>{court.description}</Text>
                    </View>
                )}

                {/* Facilities */}
                {court.facilities && court.facilities.length > 0 && (
                    <View style={styles.facilitiesSection}>
                        <Text style={styles.sectionTitle}>Tiện ích</Text>
                        <View style={styles.facilitiesGrid}>
                            {court.facilities.map((facility: string, index: number) => (
                                <View key={index} style={styles.facilityBadge}>
                                    <Ionicons
                                        name="checkmark-circle"
                                        size={16}
                                        color={colors.accent}
                                    />
                                    <Text style={styles.facilityText}>{facility}</Text>
                                </View>
                            ))}
                        </View>
                    </View>
                )}

                {/* Reviews Section */}
                <View style={styles.reviewsSection}>
                    <View style={styles.reviewsHeader}>
                        <Text style={styles.sectionTitle}>Đánh giá & Nhận xét</Text>
                        <TouchableOpacity
                            style={styles.writeReviewBtn}
                            onPress={() => {
                                haptics.light();
                                setShowReviewForm(true);
                            }}
                        >
                            <Ionicons name="create-outline" size={16} color={colors.accent} />
                            <Text style={styles.writeReviewText}>
                                {myReview ? "Sửa đánh giá" : "Viết đánh giá"}
                            </Text>
                        </TouchableOpacity>
                    </View>
                    <ReviewList reviews={reviews} stats={reviewStats} />
                </View>
            </ScrollView>

            {/* Book Button */}
            <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>
                <View style={styles.footerPrice}>
                    <Text style={styles.footerPriceLabel}>Giá từ</Text>
                    <Text style={styles.footerPriceValue}>
                        {formatPrice((court as any).price_per_hour || court.pricePerHour || 0)}/giờ
                    </Text>
                </View>
                <TouchableOpacity style={styles.bookBtn} onPress={handleBook}>
                    <Text style={styles.bookBtnText}>Đặt sân ngay</Text>
                </TouchableOpacity>
            </View>

            {/* Review Form Modal */}
            <ReviewForm
                visible={showReviewForm}
                onClose={() => setShowReviewForm(false)}
                courtId={id || ""}
                courtName={court.name}
                existingRating={myReview?.rating}
                existingComment={myReview?.comment}
                onSuccess={() => {
                    refetchReviews();
                    refetch(); // Refresh court to get updated rating
                }}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    centered: {
        justifyContent: "center",
        alignItems: "center",
    },
    loadingText: {
        color: colors.textMuted,
        fontSize: fontSize.md,
    },
    errorText: {
        color: colors.textMuted,
        fontSize: fontSize.md,
        marginTop: spacing.md,
    },
    backBtn: {
        marginTop: spacing.lg,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.lg,
        backgroundColor: colors.accent,
        borderRadius: borderRadius.md,
    },
    backBtnText: {
        color: colors.background,
        fontSize: fontSize.md,
        fontWeight: fontWeight.semibold,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: spacing.md,
        paddingBottom: spacing.sm,
        backgroundColor: colors.background,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    headerBtn: {
        padding: spacing.xs,
    },
    headerTitle: {
        flex: 1,
        color: colors.text,
        fontSize: fontSize.lg,
        fontWeight: fontWeight.semibold,
        textAlign: "center",
        marginHorizontal: spacing.sm,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: spacing.xl,
    },
    imageContainer: {
        width: "100%",
        height: 250,
        backgroundColor: colors.surface,
    },
    courtImage: {
        width: "100%",
        height: "100%",
        resizeMode: "cover",
    },
    placeholderImage: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    statusBadge: {
        position: "absolute",
        bottom: spacing.md,
        left: spacing.md,
        backgroundColor: colors.success,
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs,
        borderRadius: borderRadius.sm,
    },
    statusText: {
        color: "#fff",
        fontSize: fontSize.xs,
        fontWeight: fontWeight.semibold,
    },
    infoSection: {
        padding: spacing.lg,
    },
    courtName: {
        color: colors.text,
        fontSize: fontSize.xl,
        fontWeight: fontWeight.bold,
        marginBottom: spacing.md,
    },
    infoRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.sm,
        marginBottom: spacing.sm,
    },
    infoText: {
        color: colors.textSecondary,
        fontSize: fontSize.md,
        flex: 1,
    },
    priceSection: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        backgroundColor: colors.surface,
        marginHorizontal: spacing.lg,
        borderRadius: borderRadius.lg,
    },
    priceLabel: {
        color: colors.textMuted,
        fontSize: fontSize.md,
    },
    priceValue: {
        color: colors.accent,
        fontSize: fontSize.xl,
        fontWeight: fontWeight.bold,
    },
    descSection: {
        padding: spacing.lg,
    },
    sectionTitle: {
        color: colors.text,
        fontSize: fontSize.lg,
        fontWeight: fontWeight.semibold,
        marginBottom: spacing.md,
    },
    descText: {
        color: colors.textSecondary,
        fontSize: fontSize.md,
        lineHeight: 24,
    },
    facilitiesSection: {
        paddingHorizontal: spacing.lg,
    },
    facilitiesGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: spacing.sm,
    },
    facilityBadge: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.xs,
        backgroundColor: colors.surface,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.md,
    },
    facilityText: {
        color: colors.text,
        fontSize: fontSize.sm,
    },
    footer: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.md,
        backgroundColor: colors.background,
        borderTopWidth: 1,
        borderTopColor: colors.border,
    },
    footerPrice: {},
    footerPriceLabel: {
        color: colors.textMuted,
        fontSize: fontSize.sm,
    },
    footerPriceValue: {
        color: colors.text,
        fontSize: fontSize.lg,
        fontWeight: fontWeight.bold,
    },
    bookBtn: {
        backgroundColor: colors.accent,
        paddingHorizontal: spacing.xl,
        paddingVertical: spacing.md,
        borderRadius: borderRadius.lg,
    },
    bookBtnText: {
        color: colors.background,
        fontSize: fontSize.md,
        fontWeight: fontWeight.bold,
    },
    reviewsSection: {
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.lg,
        paddingBottom: spacing.xl,
    },
    reviewsHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: spacing.md,
    },
    writeReviewBtn: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.xs,
        paddingVertical: spacing.xs,
        paddingHorizontal: spacing.sm,
    },
    writeReviewText: {
        color: colors.accent,
        fontSize: fontSize.sm,
        fontWeight: fontWeight.semibold,
    },
});
