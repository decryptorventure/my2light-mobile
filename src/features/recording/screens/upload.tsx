/**
 * Upload Info Screen
 * @description Enter video info and select court before uploading
 * @module app/record/upload
 */

import { useState, useEffect } from "react";
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, fontSize, fontWeight, borderRadius } from "../../constants/theme";
import { useCourts, useCreateHighlight } from "../../hooks/useApi";
import { Card } from "../../components/ui";
import haptics from "../../lib/haptics";

/**
 * UploadInfoScreen - Enter video details
 * Features:
 * - Auto-generated title with timestamp
 * - Description input
 * - Court selection from API
 * - Upload to Supabase
 */
export default function UploadInfoScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { uri } = useLocalSearchParams<{ uri: string }>();

    // Form state
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [selectedCourtId, setSelectedCourtId] = useState<string | null>(null);

    // API
    const { data: courts, isLoading: courtsLoading } = useCourts();
    const createHighlight = useCreateHighlight();

    // Generate default title
    useEffect(() => {
        const now = new Date();
        const timeStr = now.toLocaleTimeString("vi-VN", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit"
        });
        const dateStr = now.toLocaleDateString("vi-VN");
        setTitle(`Highlight ${timeStr} ${dateStr}`);
    }, []);

    const handleBack = () => {
        haptics.light();
        router.back();
    };

    const handleCourtSelect = (courtId: string) => {
        haptics.light();
        setSelectedCourtId(courtId === selectedCourtId ? null : courtId);
    };

    const handleSubmit = async () => {
        if (!uri) {
            Alert.alert("Lỗi", "Không tìm thấy video");
            return;
        }

        if (!title.trim()) {
            Alert.alert("Lỗi", "Vui lòng nhập tiêu đề");
            return;
        }

        haptics.medium();

        try {
            // TODO: Implement actual upload
            // For now, simulate upload
            await new Promise(resolve => setTimeout(resolve, 2000));

            Alert.alert(
                "Thành công! 🎉",
                "Video đã được đăng lên thư viện",
                [
                    {
                        text: "OK",
                        onPress: () => router.replace("/(tabs)")
                    }
                ]
            );
        } catch (error) {
            console.error("Upload error:", error);
            Alert.alert("Lỗi", "Không thể upload video. Vui lòng thử lại.");
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
                <TouchableOpacity style={styles.backButton} onPress={handleBack}>
                    <Ionicons name="chevron-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={styles.title}>Thông tin Video</Text>
                <View style={styles.placeholder} />
            </View>

            <ScrollView
                style={styles.content}
                contentContainerStyle={styles.contentContainer}
                showsVerticalScrollIndicator={false}
            >
                {/* Title Input */}
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Tiêu đề</Text>
                    <View style={styles.inputWrapper}>
                        <TextInput
                            style={styles.input}
                            placeholder="Nhập tiêu đề..."
                            placeholderTextColor={colors.textMuted}
                            value={title}
                            onChangeText={setTitle}
                            maxLength={100}
                        />
                    </View>
                </View>

                {/* Description Input */}
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Mô tả</Text>
                    <View style={styles.inputWrapper}>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            placeholder="Mô tả trận đấu..."
                            placeholderTextColor={colors.textMuted}
                            value={description}
                            onChangeText={setDescription}
                            multiline
                            numberOfLines={4}
                            maxLength={500}
                            textAlignVertical="top"
                        />
                    </View>
                </View>

                {/* Court Selection */}
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Sân đấu</Text>

                    {courtsLoading ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="small" color={colors.accent} />
                            <Text style={styles.loadingText}>Đang tải danh sách sân...</Text>
                        </View>
                    ) : (
                        <View style={styles.courtList}>
                            {courts?.map((court: any) => (
                                <TouchableOpacity
                                    key={court.id}
                                    style={[
                                        styles.courtItem,
                                        selectedCourtId === court.id && styles.courtItemSelected,
                                    ]}
                                    onPress={() => handleCourtSelect(court.id)}
                                    activeOpacity={0.7}
                                >
                                    <Ionicons
                                        name="location"
                                        size={18}
                                        color={selectedCourtId === court.id ? colors.accent : colors.textMuted}
                                    />
                                    <Text style={[
                                        styles.courtName,
                                        selectedCourtId === court.id && styles.courtNameSelected,
                                    ]}>
                                        {court.name}
                                    </Text>
                                </TouchableOpacity>
                            ))}

                            {/* Other/Unknown court option */}
                            <TouchableOpacity
                                style={[
                                    styles.courtItem,
                                    selectedCourtId === "other" && styles.courtItemSelected,
                                ]}
                                onPress={() => handleCourtSelect("other")}
                                activeOpacity={0.7}
                            >
                                <Ionicons
                                    name="location-outline"
                                    size={18}
                                    color={selectedCourtId === "other" ? colors.accent : colors.textMuted}
                                />
                                <Text style={[
                                    styles.courtName,
                                    selectedCourtId === "other" && styles.courtNameSelected,
                                ]}>
                                    Sân khác / Không xác định
                                </Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            </ScrollView>

            {/* Submit Button */}
            <View style={[styles.bottomContainer, { paddingBottom: insets.bottom + spacing.lg }]}>
                <TouchableOpacity
                    style={[
                        styles.submitButton,
                        createHighlight.isPending && styles.submitButtonDisabled,
                    ]}
                    onPress={handleSubmit}
                    disabled={createHighlight.isPending}
                >
                    {createHighlight.isPending ? (
                        <ActivityIndicator size="small" color={colors.background} />
                    ) : (
                        <>
                            <Ionicons name="cloud-upload" size={20} color={colors.background} />
                            <Text style={styles.submitButtonText}>Đăng</Text>
                        </>
                    )}
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },

    // Header
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: "center",
        alignItems: "center",
    },
    title: {
        fontSize: fontSize.lg,
        fontWeight: fontWeight.bold,
        color: colors.text,
    },
    placeholder: {
        width: 40,
    },

    // Content
    content: {
        flex: 1,
    },
    contentContainer: {
        padding: spacing.lg,
    },

    // Input Groups
    inputGroup: {
        marginBottom: spacing.xl,
    },
    label: {
        fontSize: fontSize.sm,
        fontWeight: fontWeight.medium,
        color: colors.textSecondary,
        marginBottom: spacing.sm,
    },
    inputWrapper: {
        backgroundColor: colors.surface,
        borderRadius: borderRadius.md,
        borderWidth: 1,
        borderColor: colors.border,
    },
    input: {
        padding: spacing.md,
        color: colors.text,
        fontSize: fontSize.md,
    },
    textArea: {
        minHeight: 100,
    },

    // Loading
    loadingContainer: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.sm,
        padding: spacing.md,
    },
    loadingText: {
        color: colors.textMuted,
        fontSize: fontSize.sm,
    },

    // Court List
    courtList: {
        gap: spacing.sm,
    },
    courtItem: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.md,
        backgroundColor: colors.surface,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.lg,
        borderRadius: borderRadius.md,
        borderWidth: 1,
        borderColor: colors.border,
    },
    courtItemSelected: {
        borderColor: colors.accent,
        backgroundColor: `${colors.accent}10`,
    },
    courtName: {
        fontSize: fontSize.md,
        color: colors.text,
    },
    courtNameSelected: {
        color: colors.accent,
        fontWeight: fontWeight.medium,
    },

    // Bottom
    bottomContainer: {
        padding: spacing.lg,
        borderTopWidth: 1,
        borderTopColor: colors.border,
    },
    submitButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: spacing.sm,
        backgroundColor: colors.accent,
        paddingVertical: spacing.lg,
        borderRadius: borderRadius.md,
    },
    submitButtonDisabled: {
        opacity: 0.7,
    },
    submitButtonText: {
        color: colors.background,
        fontSize: fontSize.md,
        fontWeight: fontWeight.semibold,
    },
});
