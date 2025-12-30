import React from "react";
import { View, StyleSheet, ViewStyle, TouchableOpacity } from "react-native";
import { colors, borderRadius, spacing } from "@/shared/constants/theme";

interface CardProps {
    children: React.ReactNode;
    onPress?: () => void;
    style?: ViewStyle;
    padding?: "none" | "sm" | "md" | "lg";
    variant?: "default" | "elevated" | "outlined";
}

export function Card({ children, onPress, style, padding = "md", variant = "default" }: CardProps) {
    const content = (
        <View
            style={[
                styles.base,
                styles[variant],
                padding !== "none" && styles[`padding_${padding}`],
                style,
            ]}
        >
            {children}
        </View>
    );

    if (onPress) {
        return (
            <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
                {content}
            </TouchableOpacity>
        );
    }

    return content;
}

const styles = StyleSheet.create({
    base: {
        borderRadius: borderRadius.lg,
        overflow: "hidden",
    },

    // Variants
    default: {
        backgroundColor: colors.surface,
    },
    elevated: {
        backgroundColor: colors.surface,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    outlined: {
        backgroundColor: "transparent",
        borderWidth: 1,
        borderColor: colors.border,
    },

    // Padding
    padding_sm: {
        padding: spacing.sm,
    },
    padding_md: {
        padding: spacing.md,
    },
    padding_lg: {
        padding: spacing.lg,
    },
});
