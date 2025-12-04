/**
 * HighlightCard - Optimized highlight card component for FlatList
 * @module components/ui/HighlightCard
 */

import React, { memo, useCallback } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { colors, spacing, fontSize, fontWeight, borderRadius } from "@/shared/constants/theme";
import { HapticTouchable } from "@/shared/components/HapticTouchable";
import type { Highlight } from "@/features/highlights/types/highlight.types";

interface HighlightCardProps {
    highlight: Highlight;
    cardWidth: number;
}

const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
};

function HighlightCardComponent({ highlight, cardWidth }: HighlightCardProps) {
    const router = useRouter();

    const handlePress = useCallback(() => {
        router.push(`/video/${highlight.id}`);
    }, [highlight.id, router]);

    return (
        <HapticTouchable
            style={[styles.highlightCard, { width: cardWidth }]}
            onPress={handlePress}
            hapticStyle="light"
        >
            <View style={styles.thumbnailContainer}>
                {highlight.thumbnailUrl ? (
                    <Image
                        source={{ uri: highlight.thumbnailUrl }}
                        style={styles.thumbnail}
                        contentFit="cover"
                        transition={200}
                        cachePolicy="memory-disk"
                    />
                ) : (
                    <View style={styles.placeholderThumbnail}>
                        <Ionicons name="play" size={40} color="rgba(255,255,255,0.8)" />
                    </View>
                )}
                <View style={styles.userOverlay}>
                    <View style={styles.userAvatarSmall}>
                        <Ionicons name="person" size={12} color={colors.textMuted} />
                    </View>
                    <Text style={styles.userName} numberOfLines={1}>
                        {highlight.userName || "User"}
                    </Text>
                </View>
                <View style={styles.titleOverlay}>
                    <Text style={styles.highlightTitle} numberOfLines={2}>
                        {highlight.courtName || `Highlight`}
                    </Text>
                </View>
                <View style={styles.bottomOverlay}>
                    <View style={styles.viewsContainer}>
                        <Ionicons name="play" size={12} color="#fff" />
                        <Text style={styles.viewsText}>{highlight.views || 0}</Text>
                    </View>
                    <View style={styles.durationBadge}>
                        <Text style={styles.durationText}>
                            {formatDuration(highlight.durationSec || 0)}
                        </Text>
                    </View>
                </View>
            </View>
        </HapticTouchable>
    );
}

// Memoize to prevent unnecessary re-renders in FlatList
export const HighlightCard = memo(HighlightCardComponent);

const styles = StyleSheet.create({
    highlightCard: {
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
});
