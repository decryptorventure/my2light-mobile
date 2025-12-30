import { View, StyleSheet, Animated } from "react-native";
import { useEffect, useRef } from "react";
import { colors, borderRadius, spacing } from "@/shared/constants/theme";

interface SkeletonProps {
    width?: number | string;
    height?: number;
    borderRadius?: number;
    style?: any;
}

export function Skeleton({
    width = "100%",
    height = 20,
    borderRadius: radius = borderRadius.sm,
    style,
}: SkeletonProps) {
    const opacity = useRef(new Animated.Value(0.3)).current;

    useEffect(() => {
        const animation = Animated.loop(
            Animated.sequence([
                Animated.timing(opacity, {
                    toValue: 0.7,
                    duration: 800,
                    useNativeDriver: true,
                }),
                Animated.timing(opacity, {
                    toValue: 0.3,
                    duration: 800,
                    useNativeDriver: true,
                }),
            ])
        );
        animation.start();
        return () => animation.stop();
    }, []);

    return (
        <Animated.View
            style={[
                {
                    width,
                    height,
                    borderRadius: radius,
                    backgroundColor: colors.surfaceLight,
                    opacity,
                },
                style,
            ]}
        />
    );
}

// Pre-built skeleton layouts for common use cases
export function HighlightCardSkeleton() {
    return (
        <View style={styles.highlightCard}>
            <Skeleton height={200} borderRadius={borderRadius.lg} />
            <View style={styles.highlightInfo}>
                <View style={styles.row}>
                    <Skeleton width={32} height={32} borderRadius={16} />
                    <Skeleton width={100} height={16} style={{ marginLeft: spacing.sm }} />
                </View>
                <Skeleton width="80%" height={14} style={{ marginTop: spacing.sm }} />
            </View>
        </View>
    );
}

export function ProfileSkeleton() {
    return (
        <View style={styles.profileSkeleton}>
            <Skeleton width={100} height={100} borderRadius={50} />
            <Skeleton width={150} height={24} style={{ marginTop: spacing.md }} />
            <Skeleton width={100} height={16} style={{ marginTop: spacing.sm }} />
        </View>
    );
}

export function ListItemSkeleton() {
    return (
        <View style={styles.listItem}>
            <Skeleton width={48} height={48} borderRadius={24} />
            <View style={styles.listItemContent}>
                <Skeleton width="60%" height={16} />
                <Skeleton width="40%" height={12} style={{ marginTop: spacing.xs }} />
            </View>
        </View>
    );
}

export function MatchCardSkeleton() {
    return (
        <View style={styles.matchCard}>
            <View style={styles.row}>
                <Skeleton width={44} height={44} borderRadius={22} />
                <View style={{ flex: 1, marginLeft: spacing.sm }}>
                    <Skeleton width="50%" height={16} />
                    <Skeleton width={80} height={20} style={{ marginTop: spacing.xs }} />
                </View>
                <Skeleton width={80} height={32} borderRadius={borderRadius.md} />
            </View>
            <View style={{ marginTop: spacing.md }}>
                <Skeleton width="100%" height={14} />
                <Skeleton width="70%" height={14} style={{ marginTop: spacing.xs }} />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    highlightCard: {
        marginRight: spacing.md,
        width: 160,
    },
    highlightInfo: {
        marginTop: spacing.sm,
    },
    row: {
        flexDirection: "row",
        alignItems: "center",
    },
    profileSkeleton: {
        alignItems: "center",
        paddingVertical: spacing.xl,
    },
    listItem: {
        flexDirection: "row",
        alignItems: "center",
        padding: spacing.md,
        backgroundColor: colors.surface,
        borderRadius: borderRadius.lg,
        marginBottom: spacing.sm,
    },
    listItemContent: {
        flex: 1,
        marginLeft: spacing.md,
    },
    matchCard: {
        backgroundColor: colors.surface,
        padding: spacing.md,
        borderRadius: borderRadius.lg,
        marginBottom: spacing.md,
    },
});
