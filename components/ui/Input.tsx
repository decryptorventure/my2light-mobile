import React, { useState } from "react";
import {
    View,
    TextInput as RNTextInput,
    Text,
    StyleSheet,
    TextInputProps,
    ViewStyle,
    TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, borderRadius, fontSize, fontWeight, spacing } from "../../constants/theme";

interface InputProps extends TextInputProps {
    label?: string;
    error?: string;
    leftIcon?: keyof typeof Ionicons.glyphMap;
    rightIcon?: keyof typeof Ionicons.glyphMap;
    onRightIconPress?: () => void;
    containerStyle?: ViewStyle;
}

export function Input({
    label,
    error,
    leftIcon,
    rightIcon,
    onRightIconPress,
    containerStyle,
    secureTextEntry,
    ...props
}: InputProps) {
    const [isSecure, setIsSecure] = useState(secureTextEntry);
    const [isFocused, setIsFocused] = useState(false);

    const showPasswordToggle = secureTextEntry;

    return (
        <View style={[styles.container, containerStyle]}>
            {label && <Text style={styles.label}>{label}</Text>}

            <View
                style={[
                    styles.inputWrapper,
                    isFocused && styles.inputWrapperFocused,
                    error && styles.inputWrapperError,
                ]}
            >
                {leftIcon && (
                    <Ionicons
                        name={leftIcon}
                        size={20}
                        color={colors.textMuted}
                        style={styles.leftIcon}
                    />
                )}

                <RNTextInput
                    style={[
                        styles.input,
                        leftIcon && styles.inputWithLeftIcon,
                        (rightIcon || showPasswordToggle) && styles.inputWithRightIcon,
                    ]}
                    placeholderTextColor={colors.textMuted}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    secureTextEntry={isSecure}
                    {...props}
                />

                {showPasswordToggle && (
                    <TouchableOpacity
                        onPress={() => setIsSecure(!isSecure)}
                        style={styles.rightIcon}
                    >
                        <Ionicons
                            name={isSecure ? "eye-outline" : "eye-off-outline"}
                            size={20}
                            color={colors.textMuted}
                        />
                    </TouchableOpacity>
                )}

                {rightIcon && !showPasswordToggle && (
                    <TouchableOpacity
                        onPress={onRightIconPress}
                        style={styles.rightIcon}
                        disabled={!onRightIconPress}
                    >
                        <Ionicons name={rightIcon} size={20} color={colors.textMuted} />
                    </TouchableOpacity>
                )}
            </View>

            {error && <Text style={styles.error}>{error}</Text>}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: spacing.md,
    },
    label: {
        color: colors.text,
        fontSize: fontSize.sm,
        fontWeight: fontWeight.medium,
        marginBottom: spacing.sm,
    },
    inputWrapper: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: colors.surface,
        borderRadius: borderRadius.md,
        borderWidth: 1,
        borderColor: colors.border,
    },
    inputWrapperFocused: {
        borderColor: colors.primary,
    },
    inputWrapperError: {
        borderColor: colors.error,
    },
    input: {
        flex: 1,
        color: colors.text,
        fontSize: fontSize.lg,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.md,
    },
    inputWithLeftIcon: {
        paddingLeft: 0,
    },
    inputWithRightIcon: {
        paddingRight: 0,
    },
    leftIcon: {
        paddingLeft: spacing.md,
    },
    rightIcon: {
        paddingRight: spacing.md,
        paddingLeft: spacing.sm,
    },
    error: {
        color: colors.error,
        fontSize: fontSize.sm,
        marginTop: spacing.xs,
    },
});
