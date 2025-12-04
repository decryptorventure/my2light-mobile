/**
 * AnimatedPressable - Simplified version without reanimated (temporary fix)
 * @module components/ui/AnimatedPressable
 */

import React, { useCallback } from "react";
import { TouchableOpacity, TouchableOpacityProps, StyleProp, ViewStyle } from "react-native";
import haptics from "../../lib/haptics";

type HapticStyle = "light" | "medium" | "heavy" | "success" | "warning" | "error";

interface AnimatedPressableProps extends Omit<TouchableOpacityProps, "style"> {
    style?: StyleProp<ViewStyle>;
    scaleValue?: number;
    hapticStyle?: HapticStyle;
    hapticEnabled?: boolean;
    children: React.ReactNode;
}

export function AnimatedPressable({
    onPress,
    style,
    scaleValue = 0.96,
    hapticStyle = "light",
    hapticEnabled = true,
    children,
    ...props
}: AnimatedPressableProps) {
    const handlePress = useCallback((event: any) => {
        if (hapticEnabled) {
            haptics[hapticStyle]();
        }
        onPress?.(event);
    }, [onPress, hapticStyle, hapticEnabled]);

    return (
        <TouchableOpacity
            onPress={handlePress}
            style={style}
            activeOpacity={0.7}
            {...props}
        >
            {children}
        </TouchableOpacity>
    );
}
