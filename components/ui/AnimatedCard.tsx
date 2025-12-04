/**
 * AnimatedCard - Card with entrance and press animations
 * @module components/ui/AnimatedCard
 */

import React, { useEffect } from "react";
import { ViewStyle, StyleProp } from "react-native";
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withDelay,
    FadeIn,
    FadeInDown,
    Layout,
} from "react-native-reanimated";
import { colors, borderRadius, spacing } from "../../constants/theme";

interface AnimatedCardProps {
    children: React.ReactNode;
    style?: StyleProp<ViewStyle>;
    delay?: number;
    index?: number;
}

export function AnimatedCard({ children, style, delay = 0, index = 0 }: AnimatedCardProps) {
    // Stagger animation based on index
    const calculatedDelay = delay + index * 50;

    return (
        <Animated.View
            entering={FadeInDown.delay(calculatedDelay).springify().damping(15)}
            layout={Layout.springify().damping(15)}
            style={[defaultStyles.card, style]}
        >
            {children}
        </Animated.View>
    );
}

const defaultStyles = {
    card: {
        backgroundColor: colors.surface,
        borderRadius: borderRadius.lg,
        padding: spacing.md,
    } as ViewStyle,
};

/**
 * FadeInView - Simple fade in animation wrapper
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
    return (
        <Animated.View
            entering={FadeIn.delay(delay).duration(300)}
            style={style}
        >
            {children}
        </Animated.View>
    );
}

/**
 * SlideInView - Slide up animation wrapper
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
    return (
        <Animated.View
            entering={FadeInDown.delay(delay).springify().damping(14)}
            style={style}
        >
            {children}
        </Animated.View>
    );
}
