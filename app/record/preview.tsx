import { useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Alert,
    TextInput,
    ScrollView,
    ActivityIndicator,
} from "react-native";
import { Video, ResizeMode } from "expo-av";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as MediaLibrary from "expo-media-library";
import { colors, spacing, fontSize, fontWeight, borderRadius } from "../../constants/theme";

export default function VideoPreviewScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { uri } = useLocalSearchParams<{ uri: string }>();

    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [isPublic, setIsPublic] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [saving, setSaving] = useState(false);

    const handleSaveToDevice = async () => {
        if (!uri) return;

        try {
            setSaving(true);
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

    const handleUpload = async () => {
        if (!uri) return;

        try {
            setUploading(true);

            // TODO: Implement actual upload to Supabase
            // For now, simulate upload
            await new Promise(resolve => setTimeout(resolve, 2000));

            Alert.alert(
                "Thành công!",
                "Video đã được upload. Tính năng đầy đủ sẽ được thêm sau.",
                [{ text: "OK", onPress: () => router.replace("/(tabs)") }]
            );
        } catch (error) {
            console.error("Upload error:", error);
            Alert.alert("Lỗi", "Không thể upload video");
        } finally {
            setUploading(false);
        }
    };

    const handleDiscard = () => {
        Alert.alert(
            "Xác nhận",
            "Bạn có chắc muốn hủy video này?",
            [
                { text: "Không", style: "cancel" },
                { text: "Hủy video", style: "destructive", onPress: () => router.back() },
            ]
        );
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
            {/* Video Player */}
            <Video
                source={{ uri }}
                style={styles.video}
                useNativeControls
                resizeMode={ResizeMode.CONTAIN}
                isLooping
                shouldPlay
            />

            {/* Form */}
            <ScrollView
                style={[styles.form, { paddingBottom: insets.bottom + 100 }]}
                showsVerticalScrollIndicator={false}
            >
                {/* Title */}
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Tiêu đề</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Nhập tiêu đề video..."
                        placeholderTextColor={colors.textMuted}
                        value={title}
                        onChangeText={setTitle}
                        maxLength={100}
                    />
                </View>

                {/* Description */}
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Mô tả (tùy chọn)</Text>
                    <TextInput
                        style={[styles.input, styles.textArea]}
                        placeholder="Mô tả về video của bạn..."
                        placeholderTextColor={colors.textMuted}
                        value={description}
                        onChangeText={setDescription}
                        multiline
                        numberOfLines={3}
                        maxLength={500}
                    />
                </View>

                {/* Privacy Toggle */}
                <TouchableOpacity
                    style={styles.privacyRow}
                    onPress={() => setIsPublic(!isPublic)}
                >
                    <View style={styles.privacyLeft}>
                        <Ionicons
                            name={isPublic ? "globe-outline" : "lock-closed-outline"}
                            size={24}
                            color={colors.text}
                        />
                        <View>
                            <Text style={styles.privacyTitle}>{isPublic ? "Công khai" : "Riêng tư"}</Text>
                            <Text style={styles.privacyDesc}>
                                {isPublic ? "Mọi người có thể xem" : "Chỉ bạn xem được"}
                            </Text>
                        </View>
                    </View>
                    <Ionicons
                        name={isPublic ? "toggle" : "toggle-outline"}
                        size={32}
                        color={isPublic ? colors.accent : colors.textMuted}
                    />
                </TouchableOpacity>

                {/* Actions */}
                <View style={styles.actions}>
                    <TouchableOpacity
                        style={styles.saveBtn}
                        onPress={handleSaveToDevice}
                        disabled={saving}
                    >
                        {saving ? (
                            <ActivityIndicator size="small" color={colors.text} />
                        ) : (
                            <>
                                <Ionicons name="download-outline" size={20} color={colors.text} />
                                <Text style={styles.saveBtnText}>Lưu vào máy</Text>
                            </>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.uploadBtn}
                        onPress={handleUpload}
                        disabled={uploading}
                    >
                        {uploading ? (
                            <ActivityIndicator size="small" color={colors.background} />
                        ) : (
                            <>
                                <Ionicons name="cloud-upload-outline" size={20} color={colors.background} />
                                <Text style={styles.uploadBtnText}>Upload</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>

                <TouchableOpacity style={styles.discardBtn} onPress={handleDiscard}>
                    <Ionicons name="trash-outline" size={18} color={colors.error} />
                    <Text style={styles.discardBtnText}>Hủy video</Text>
                </TouchableOpacity>
            </ScrollView>

            {/* Close Button */}
            <TouchableOpacity
                style={[styles.closeBtn, { top: insets.top + spacing.md }]}
                onPress={handleDiscard}
            >
                <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
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
    video: {
        width: "100%",
        height: 300,
        backgroundColor: "#000",
    },
    closeBtn: {
        position: "absolute",
        left: spacing.lg,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "rgba(0,0,0,0.6)",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 10,
    },
    form: {
        flex: 1,
        padding: spacing.lg,
    },
    inputGroup: {
        marginBottom: spacing.lg,
    },
    label: {
        color: colors.textSecondary,
        fontSize: fontSize.sm,
        fontWeight: fontWeight.medium,
        marginBottom: spacing.sm,
    },
    input: {
        backgroundColor: colors.surface,
        borderRadius: borderRadius.md,
        padding: spacing.md,
        color: colors.text,
        fontSize: fontSize.md,
        borderWidth: 1,
        borderColor: colors.border,
    },
    textArea: {
        minHeight: 80,
        textAlignVertical: "top",
    },
    privacyRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        backgroundColor: colors.surface,
        padding: spacing.md,
        borderRadius: borderRadius.md,
        marginBottom: spacing.xl,
    },
    privacyLeft: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.md,
    },
    privacyTitle: {
        color: colors.text,
        fontSize: fontSize.md,
        fontWeight: fontWeight.medium,
    },
    privacyDesc: {
        color: colors.textMuted,
        fontSize: fontSize.xs,
        marginTop: 2,
    },
    actions: {
        flexDirection: "row",
        gap: spacing.md,
        marginBottom: spacing.lg,
    },
    saveBtn: {
        flex: 1,
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
    saveBtnText: {
        color: colors.text,
        fontSize: fontSize.md,
        fontWeight: fontWeight.medium,
    },
    uploadBtn: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: spacing.sm,
        backgroundColor: colors.accent,
        paddingVertical: spacing.md,
        borderRadius: borderRadius.md,
    },
    uploadBtnText: {
        color: colors.background,
        fontSize: fontSize.md,
        fontWeight: fontWeight.semibold,
    },
    discardBtn: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: spacing.xs,
        paddingVertical: spacing.md,
    },
    discardBtnText: {
        color: colors.error,
        fontSize: fontSize.sm,
    },
});
