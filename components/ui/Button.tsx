import React from "react";
import {
    TouchableOpacity,
    Text,
    StyleSheet,
    ActivityIndicator,
    ViewStyle,
    TextStyle,
} from "react-native";
import { colors, borderRadius, fontSize, fontWeight, spacing } from "../../constants/theme";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "accent";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps {
    title: string;
    onPress: () => void;
    variant?: ButtonVariant;
    size?: ButtonSize;
    loading?: boolean;
    disabled?: boolean;
    fullWidth?: boolean;
    icon?: React.ReactNode;
    style?: ViewStyle;
    textStyle?: TextStyle;
}

export function Button({
    title,
    onPress,
    variant = "primary",
    size = "md",
    loading = false,
    disabled = false,
    fullWidth = false,
    icon,
    style,
    textStyle,
}: ButtonProps) {
    const isDisabled = disabled || loading;

    return (
        <TouchableOpacity
            style={[
                styles.base,
                styles[variant],
                styles[`size_${size}`],
                fullWidth && styles.fullWidth,
                isDisabled && styles.disabled,
                style,
            ]}
            onPress={onPress}
            disabled={isDisabled}
            activeOpacity={0.7}
        >
            {loading ? (
                <ActivityIndicator
                    color={variant === "ghost" ? colors.primary : colors.text}
                    size="small"
                />
            ) : (
                <>
                    {icon}
                    <Text
                        style={[
                            styles.text,
                            styles[`text_${variant}`],
                            styles[`text_${size}`],
                            icon ? { marginLeft: spacing.sm } : undefined,
                            textStyle,
                        ]}
                    >
                        {title}
                    </Text>
                </>
            )}
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    base: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: borderRadius.md,
    },

    // Variants
    primary: {
        backgroundColor: colors.primary,
    },
    secondary: {
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
    },
    ghost: {
        backgroundColor: "transparent",
    },
    danger: {
        backgroundColor: colors.error,
    },
    accent: {
        backgroundColor: colors.accent,
    },

    // Sizes
    size_sm: {
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.md,
    },
    size_md: {
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.lg,
    },
    size_lg: {
        paddingVertical: spacing.lg,
        paddingHorizontal: spacing.xl,
    },

    // Text styles
    text: {
        fontWeight: fontWeight.semibold,
    },
    text_primary: {
        color: colors.text,
    },
    text_secondary: {
        color: colors.text,
    },
    text_ghost: {
        color: colors.primary,
    },
    text_danger: {
        color: colors.text,
    },
    text_accent: {
        color: colors.background,
    },
    text_sm: {
        fontSize: fontSize.sm,
    },
    text_md: {
        fontSize: fontSize.md,
    },
    text_lg: {
        fontSize: fontSize.lg,
    },

    // States
    disabled: {
        opacity: 0.5,
    },
    fullWidth: {
        width: "100%",
    },
});
