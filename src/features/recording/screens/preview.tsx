/**
 * Video Preview Screen
 * @description Preview recorded video with list of marked highlights
 * @module app/record/preview
 */

import { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from "react-native";
import { Video, ResizeMode } from "expo-av";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as MediaLibrary from "expo-media-library";
import { colors, spacing, fontSize, fontWeight, borderRadius } from "../../constants/theme";
import { useRecordingStore } from "../../stores/recordingStore";
import { Card } from "../../components/ui";
import haptics from "../../lib/haptics";

/**
 * VideoPreviewScreen - Review highlights and upload
 * Features:
 * - Video player with full controls
 * - List of marked highlights with timestamps
 * - Merge highlights option
 * - Upload to library button
 */
export default function VideoPreviewScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { uri } = useLocalSearchParams<{ uri: string }>();

    const { highlights, selectedHighlightIds, toggleHighlightSelection, selectAllHighlights } =
        useRecordingStore();
    const [saving, setSaving] = useState(false);

    // Format time as MM:SS
    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    };

    // Calculate time range for highlight
    const getHighlightTimeRange = (highlight: any) => {
        const endTime = highlight.timestamp + highlight.duration;
        return `${formatTime(highlight.timestamp)} - ${formatTime(endTime)}`;
    };

    const handleClose = () => {
        Alert.alert("Xác nhận", "Bạn có chắc muốn hủy video này?", [
            { text: "Không", style: "cancel" },
            {
                text: "Hủy video",
                style: "destructive",
                onPress: () => router.replace("/(tabs)"),
            },
        ]);
    };

    const handleSaveToDevice = async () => {
        if (!uri) return;

        try {
            setSaving(true);
            haptics.light();

            const { status } = await MediaLibrary.requestPermissionsAsync();
            if (status !== "granted") {
                Alert.alert("Lỗi", "Cần quyền truy cập thư viện để lưu video");
                return;
            }

            await MediaLibrary.saveToLibraryAsync(uri);
            Alert.alert("Thành công", "Video đã được lưu vào thư viện ảnh!");
        } catch (error) {
            console.error("Save error:", error);
            Alert.alert("Lỗi", "Không thể lưu video");
        } finally {
            setSaving(false);
        }
    };

    const handleMergeHighlights = () => {
        if (highlights.length === 0) {
            Alert.alert("Thông báo", "Chưa có highlight nào được đánh dấu");
            return;
        }
        haptics.medium();
        selectAllHighlights();
        // TODO: Implement video merge logic
        Alert.alert("Thông báo", "Tính năng ghép highlight đang được phát triển");
    };

    const handleUpload = () => {
        haptics.medium();
        router.push({
            pathname: "/record/upload",
            params: { uri },
        });
    };

    const handlePlayHighlight = (highlight: any) => {
        haptics.light();
        // TODO: Seek video to highlight timestamp
        console.log("Play highlight at:", highlight.timestamp);
    };

    if (!uri) {
        return (
            <View style={[styles.container, styles.errorContainer]}>
                <Ionicons name="alert-circle" size={64} color={colors.error} />
                <Text style={styles.errorText}>Không tìm thấy video</Text>
                <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                    <Text style={styles.backBtnText}>Quay lại</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
                <TouchableOpacity style={styles.headerButton} onPress={handleClose}>
                    <Ionicons name="close" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={styles.title}>Xem lại Video</Text>
                <TouchableOpacity
                    style={styles.headerButton}
                    onPress={handleSaveToDevice}
                    disabled={saving}
                >
                    <Ionicons name="download-outline" size={24} color={colors.text} />
                </TouchableOpacity>
            </View>

            {/* Video Player */}
            <Video
                source={{ uri }}
                style={styles.video}
                useNativeControls
                resizeMode={ResizeMode.CONTAIN}
                isLooping
            />

            {/* Highlight List */}
            <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
                <Text style={styles.sectionTitle}>DANH SÁCH HIGHLIGHT ({highlights.length})</Text>

                {highlights.length === 0 ? (
                    <Card style={styles.emptyCard}>
                        <Ionicons name="flash-off-outline" size={32} color={colors.textMuted} />
                        <Text style={styles.emptyText}>Chưa có highlight nào</Text>
                        <Text style={styles.emptyHint}>
                            Bấm nút ⚡ khi quay để đánh dấu highlight
                        </Text>
                    </Card>
                ) : (
                    highlights.map((highlight, index) => (
                        <TouchableOpacity
                            key={highlight.id}
                            style={[
                                styles.highlightItem,
                                selectedHighlightIds.includes(highlight.id) &&
                                    styles.highlightItemSelected,
                            ]}
                            onPress={() => toggleHighlightSelection(highlight.id)}
                            activeOpacity={0.7}
                        >
                            <View style={styles.highlightNumber}>
                                <Text style={styles.highlightNumberText}>{index + 1}</Text>
                            </View>
                            <View style={styles.highlightInfo}>
                                <Text style={styles.highlightName}>{highlight.name}</Text>
                                <Text style={styles.highlightTime}>
                                    {getHighlightTimeRange(highlight)}
                                </Text>
                            </View>
                            <TouchableOpacity
                                style={styles.playButton}
                                onPress={() => handlePlayHighlight(highlight)}
                            >
                                <Ionicons name="play" size={20} color={colors.text} />
                            </TouchableOpacity>
                        </TouchableOpacity>
                    ))
                )}
            </ScrollView>

            {/* Bottom Actions */}
            <View style={[styles.bottomActions, { paddingBottom: insets.bottom + spacing.lg }]}>
                <TouchableOpacity style={styles.mergeButton} onPress={handleMergeHighlights}>
                    <Ionicons name="flash" size={20} color={colors.text} />
                    <Text style={styles.mergeButtonText}>Ghép {highlights.length} Highlights</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.uploadButton} onPress={handleUpload}>
                    <Ionicons name="cloud-upload-outline" size={20} color={colors.background} />
                    <Text style={styles.uploadButtonText}>Đăng lên Thư viện</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    errorContainer: {
        justifyContent: "center",
        alignItems: "center",
        gap: spacing.md,
    },
    errorText: {
        color: colors.text,
        fontSize: fontSize.lg,
    },
    backBtn: {
        marginTop: spacing.md,
        padding: spacing.md,
    },
    backBtnText: {
        color: colors.primary,
        fontSize: fontSize.md,
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
    headerButton: {
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

    // Video
    video: {
        width: "100%",
        height: 220,
        backgroundColor: "#000",
    },

    // Content
    content: {
        flex: 1,
    },
    contentContainer: {
        padding: spacing.lg,
    },
    sectionTitle: {
        fontSize: fontSize.xs,
        fontWeight: fontWeight.semibold,
        color: colors.textMuted,
        marginBottom: spacing.md,
        letterSpacing: 0.5,
    },
    emptyCard: {
        alignItems: "center",
        padding: spacing.xl,
        gap: spacing.sm,
    },
    emptyText: {
        color: colors.text,
        fontSize: fontSize.md,
        fontWeight: fontWeight.medium,
    },
    emptyHint: {
        color: colors.textMuted,
        fontSize: fontSize.sm,
        textAlign: "center",
    },

    // Highlight Item
    highlightItem: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: colors.surface,
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        marginBottom: spacing.sm,
        borderWidth: 1,
        borderColor: colors.border,
    },
    highlightItemSelected: {
        borderColor: colors.accent,
        backgroundColor: `${colors.accent}10`,
    },
    highlightNumber: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: colors.surfaceLight,
        justifyContent: "center",
        alignItems: "center",
        marginRight: spacing.md,
    },
    highlightNumberText: {
        color: colors.accent,
        fontSize: fontSize.md,
        fontWeight: fontWeight.bold,
    },
    highlightInfo: {
        flex: 1,
    },
    highlightName: {
        fontSize: fontSize.md,
        fontWeight: fontWeight.semibold,
        color: colors.text,
    },
    highlightTime: {
        fontSize: fontSize.sm,
        color: colors.textMuted,
        marginTop: 2,
    },
    playButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.surfaceLight,
        justifyContent: "center",
        alignItems: "center",
    },

    // Bottom Actions
    bottomActions: {
        padding: spacing.lg,
        gap: spacing.sm,
        borderTopWidth: 1,
        borderTopColor: colors.border,
    },
    mergeButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: spacing.sm,
        backgroundColor: colors.surface,
        paddingVertical: spacing.md,
        borderRadius: borderRadius.md,
        borderWidth: 1,
        borderColor: colors.border,
    },
    mergeButtonText: {
        color: colors.text,
        fontSize: fontSize.md,
        fontWeight: fontWeight.medium,
    },
    uploadButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: spacing.sm,
        backgroundColor: colors.accent,
        paddingVertical: spacing.lg,
        borderRadius: borderRadius.md,
    },
    uploadButtonText: {
        color: colors.background,
        fontSize: fontSize.md,
        fontWeight: fontWeight.semibold,
    },
});
