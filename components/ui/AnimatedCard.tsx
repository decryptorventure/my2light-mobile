/**
 * AnimatedCard - Simplified card component (temporary fix without reanimated)
 * @module components/ui/AnimatedCard
 */

import React from "react";
import { View, ViewProps, StyleProp, ViewStyle } from "react-native";
import { colors, borderRadius, spacing } from "@/shared/constants/theme";

interface AnimatedCardProps extends ViewProps {
    children: React.ReactNode;
    style?: StyleProp<ViewStyle>;
    delay?: number;
    index?: number;
}

export function AnimatedCard({
    children,
    style,
    delay = 0,
    index = 0,
    ...props
}: AnimatedCardProps) {
    return (
        <View
            style={[
                {
                    backgroundColor: colors.surface,
                    borderRadius: borderRadius.lg,
                    padding: spacing.md,
                },
                style,
            ]}
            {...props}
        >
            {children}
        </View>
    );
}

/**
 * FadeInView - Simplified without animation (temporary fix)
 */
export function FadeInView({
    children,
    delay = 0,
    style,
}: {
    children: React.ReactNode;
    delay?: number;
    style?: StyleProp<ViewStyle>;
}) {
    return <View style={style}>{children}</View>;
}

/**
 * SlideInView - Simplified without animation (temporary fix)
 */
export function SlideInView({
    children,
    delay = 0,
    distance = 20,
    style,
}: {
    children: React.ReactNode;
    delay?: number;
    distance?: number;
    style?: StyleProp<ViewStyle>;
}) {
    return <View style={style}>{children}</View>;
}
