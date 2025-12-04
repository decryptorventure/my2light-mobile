/**
 * AnimatedPressable - Animated button with scale effect on press
 * @module components/ui/AnimatedPressable
 */

import React, { useCallback } from "react";
import { Pressable, PressableProps, StyleProp, ViewStyle } from "react-native";
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withTiming,
} from "react-native-reanimated";
import haptics from "../../lib/haptics";

const AnimatedPressableComponent = Animated.createAnimatedComponent(Pressable);

type HapticStyle = "light" | "medium" | "heavy" | "success" | "warning" | "error";

interface AnimatedPressableProps extends Omit<PressableProps, "style"> {
    style?: StyleProp<ViewStyle>;
    scaleValue?: number;
    hapticStyle?: HapticStyle;
    hapticEnabled?: boolean;
    children: React.ReactNode;
}

export function AnimatedPressable({
    onPress,
    onPressIn,
    onPressOut,
    style,
    scaleValue = 0.96,
    hapticStyle = "light",
    hapticEnabled = true,
    children,
    ...props
}: AnimatedPressableProps) {
    const scale = useSharedValue(1);
    const opacity = useSharedValue(1);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
        opacity: opacity.value,
    }));

    const handlePressIn = useCallback((event: any) => {
        scale.value = withSpring(scaleValue, { damping: 15, stiffness: 400 });
        opacity.value = withTiming(0.9, { duration: 100 });
        onPressIn?.(event);
    }, [scaleValue, onPressIn]);

    const handlePressOut = useCallback((event: any) => {
        scale.value = withSpring(1, { damping: 15, stiffness: 400 });
        opacity.value = withTiming(1, { duration: 100 });
        onPressOut?.(event);
    }, [onPressOut]);

    const handlePress = useCallback((event: any) => {
        if (hapticEnabled) {
            haptics[hapticStyle]();
        }
        onPress?.(event);
    }, [onPress, hapticStyle, hapticEnabled]);

    return (
        <AnimatedPressableComponent
            onPress={handlePress}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            style={[style, animatedStyle]}
            {...props}
        >
            {children}
        </AnimatedPressableComponent>
    );
}
