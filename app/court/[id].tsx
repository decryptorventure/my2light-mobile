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
import { colors, spacing, fontSize, fontWeight, borderRadius } from "../../constants/theme";
import { useCourtById } from "../../hooks/useApi";
import haptics from "../../lib/haptics";

export default function CourtDetailScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { id } = useLocalSearchParams<{ id: string }>();
    const [refreshing, setRefreshing] = useState(false);

    const { data: court, isLoading, refetch } = useCourtById(id || "");

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await refetch();
        setRefreshing(false);
    }, [refetch]);

    const handleBook = () => {
        haptics.medium();
        if (!court) return;
        router.push({
            pathname: "/booking/[id]",
            params: { id: court.id }
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
        return price.toLocaleString("vi-VN") + "đ";
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
                <TouchableOpacity style={styles.headerBtn} onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle} numberOfLines={1}>{court.name}</Text>
                <TouchableOpacity style={styles.headerBtn}>
                    <Ionicons name="heart-outline" size={24} color={colors.text} />
                </TouchableOpacity>
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
                }
            >
                {/* Court Image */}
                <View style={styles.imageContainer}>
                    {court.images && court.images.length > 0 ? (
                        <Image source={{ uri: court.images[0] }} style={styles.courtImage} />
                    ) : (
                        <View style={styles.placeholderImage}>
                            <Ionicons name="tennisball-outline" size={64} color={colors.textMuted} />
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
                            {(court as any).open_time || court.openTime || "06:00"} - {(court as any).close_time || court.closeTime || "22:00"}
                        </Text>
                    </View>

                    {(court.rating || 0) > 0 && (
                        <View style={styles.infoRow}>
                            <Ionicons name="star" size={18} color="#f59e0b" />
                            <Text style={styles.infoText}>
                                {(court.rating || 0).toFixed(1)} ({(court as any).total_reviews || court.totalReviews || 0} đánh giá)
                            </Text>
                        </View>
                    )}
                </View>

                {/* Price */}
                <View style={styles.priceSection}>
                    <Text style={styles.priceLabel}>Giá thuê</Text>
                    <Text style={styles.priceValue}>{formatPrice((court as any).price_per_hour || court.pricePerHour || 0)}/giờ</Text>
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
                                    <Ionicons name="checkmark-circle" size={16} color={colors.accent} />
                                    <Text style={styles.facilityText}>{facility}</Text>
                                </View>
                            ))}
                        </View>
                    </View>
                )}
            </ScrollView>

            {/* Book Button */}
            <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>
                <View style={styles.footerPrice}>
                    <Text style={styles.footerPriceLabel}>Giá từ</Text>
                    <Text style={styles.footerPriceValue}>{formatPrice((court as any).price_per_hour || court.pricePerHour || 0)}/giờ</Text>
                </View>
                <TouchableOpacity style={styles.bookBtn} onPress={handleBook}>
                    <Text style={styles.bookBtnText}>Đặt sân ngay</Text>
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
});
