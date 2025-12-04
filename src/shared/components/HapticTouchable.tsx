/**
 * HapticTouchable - TouchableOpacity with built-in haptic feedback
 * @module components/ui/HapticTouchable
 */

import React, { useCallback } from "react";
import { TouchableOpacity, TouchableOpacityProps } from "react-native";
import haptics from "../../lib/haptics";

type HapticStyle = "light" | "medium" | "heavy" | "success" | "warning" | "error";

interface HapticTouchableProps extends TouchableOpacityProps {
    hapticStyle?: HapticStyle;
    hapticEnabled?: boolean;
}

export function HapticTouchable({
    onPress,
    hapticStyle = "light",
    hapticEnabled = true,
    children,
    ...props
}: HapticTouchableProps) {
    const handlePress = useCallback((event: any) => {
        if (hapticEnabled) {
            haptics[hapticStyle]();
        }
        onPress?.(event);
    }, [onPress, hapticStyle, hapticEnabled]);

    return (
        <TouchableOpacity onPress={handlePress} activeOpacity={0.7} {...props}>
            {children}
        </TouchableOpacity>
    );
}
