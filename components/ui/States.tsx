import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, fontSize, fontWeight, borderRadius } from "../../constants/theme";

interface ErrorStateProps {
    title?: string;
    message?: string;
    onRetry?: () => void;
    icon?: keyof typeof Ionicons.glyphMap;
}

export function ErrorState({
    title = "Đã xảy ra lỗi",
    message = "Không thể tải dữ liệu. Vui lòng thử lại.",
    onRetry,
    icon = "alert-circle-outline",
}: ErrorStateProps) {
    return (
        <View style={styles.container}>
            <Ionicons name={icon} size={64} color={colors.error} />
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.message}>{message}</Text>
            {onRetry && (
                <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
                    <Ionicons name="refresh" size={18} color={colors.background} />
                    <Text style={styles.retryText}>Thử lại</Text>
                </TouchableOpacity>
            )}
        </View>
    );
}

interface EmptyStateProps {
    title?: string;
    message?: string;
    icon?: keyof typeof Ionicons.glyphMap;
    actionLabel?: string;
    onAction?: () => void;
}

export function EmptyState({
    title = "Không có dữ liệu",
    message = "Chưa có nội dung nào ở đây.",
    icon = "folder-open-outline",
    actionLabel,
    onAction,
}: EmptyStateProps) {
    return (
        <View style={styles.container}>
            <Ionicons name={icon} size={64} color={colors.textMuted} />
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.message}>{message}</Text>
            {actionLabel && onAction && (
                <TouchableOpacity style={styles.actionButton} onPress={onAction}>
                    <Text style={styles.actionText}>{actionLabel}</Text>
                </TouchableOpacity>
            )}
        </View>
    );
}

interface OfflineIndicatorProps {
    visible: boolean;
}

export function OfflineIndicator({ visible }: OfflineIndicatorProps) {
    if (!visible) return null;

    return (
        <View style={styles.offlineBar}>
            <Ionicons name="cloud-offline-outline" size={16} color="#fff" />
            <Text style={styles.offlineText}>Không có kết nối mạng</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: spacing.xl,
        minHeight: 300,
    },
    title: {
        fontSize: fontSize.lg,
        fontWeight: fontWeight.semibold,
        color: colors.text,
        marginTop: spacing.lg,
        textAlign: "center",
    },
    message: {
        fontSize: fontSize.sm,
        color: colors.textMuted,
        marginTop: spacing.sm,
        textAlign: "center",
        maxWidth: 280,
    },
    retryButton: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: colors.accent,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        borderRadius: borderRadius.md,
        marginTop: spacing.lg,
        gap: spacing.sm,
    },
    retryText: {
        color: colors.background,
        fontSize: fontSize.md,
        fontWeight: fontWeight.semibold,
    },
    actionButton: {
        borderWidth: 1,
        borderColor: colors.accent,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        borderRadius: borderRadius.md,
        marginTop: spacing.lg,
    },
    actionText: {
        color: colors.accent,
        fontSize: fontSize.md,
        fontWeight: fontWeight.medium,
    },
    offlineBar: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: colors.error,
        paddingVertical: spacing.sm,
        gap: spacing.sm,
    },
    offlineText: {
        color: "#fff",
        fontSize: fontSize.sm,
        fontWeight: fontWeight.medium,
    },
});
