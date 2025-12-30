/**
 * Edit Profile Screen
 * @description Allow users to update their profile information
 * @module app/settings/edit-profile
 */

import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    ScrollView,
    Alert,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { Image } from "expo-image";
import { colors, spacing, fontSize, fontWeight, borderRadius } from "@/shared/constants/theme";
import { AuthService } from "../../services/auth.service";
import { uploadAvatar } from "../../services/upload";
import haptics from "../../lib/haptics";

export default function EditProfileScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();

    // Form state
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [avatar, setAvatar] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Load current profile
    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        try {
            const result = await AuthService.getCurrentUser();
            if (result.success && result.data) {
                setName(result.data.name || "");
                setPhone(result.data.phone || "");
                setAvatar(result.data.avatar || "");
            }
        } catch (error) {
            console.error("Error loading profile:", error);
        } finally {
            setLoading(false);
        }
    };

    const pickAvatar = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });

        if (!result.canceled && result.assets[0]) {
            setSaving(true);
            try {
                const uploadResult = await uploadAvatar(result.assets[0].uri);
                if (uploadResult.success && uploadResult.data) {
                    setAvatar(uploadResult.data);
                    haptics.success();
                } else {
                    // Use local preview if upload fails
                    setAvatar(result.assets[0].uri);
                }
            } catch (error) {
                setAvatar(result.assets[0].uri);
            } finally {
                setSaving(false);
            }
        }
    };

    const handleSave = async () => {
        if (!name.trim()) {
            Alert.alert("Lỗi", "Vui lòng nhập tên hiển thị");
            return;
        }

        haptics.medium();
        setSaving(true);

        try {
            const result = await AuthService.updateUserProfile({
                name: name.trim(),
                phone: phone.trim(),
                avatar: avatar,
            });

            if (result.success) {
                haptics.success();
                Alert.alert("Thành công", "Đã cập nhật thông tin!", [
                    { text: "OK", onPress: () => router.back() },
                ]);
            } else {
                throw new Error(result.error || "Update failed");
            }
        } catch (error) {
            Alert.alert("Lỗi", "Không thể cập nhật thông tin. Vui lòng thử lại.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <View style={[styles.container, styles.loadingContainer]}>
                <ActivityIndicator size="large" color={colors.accent} />
            </View>
        );
    }

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
                    <Ionicons name="close" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Chỉnh sửa hồ sơ</Text>
                <TouchableOpacity onPress={handleSave} style={styles.headerBtn} disabled={saving}>
                    {saving ? (
                        <ActivityIndicator size="small" color={colors.accent} />
                    ) : (
                        <Text style={styles.saveText}>Lưu</Text>
                    )}
                </TouchableOpacity>
            </View>

            <ScrollView
                style={styles.content}
                contentContainerStyle={styles.contentContainer}
                showsVerticalScrollIndicator={false}
            >
                {/* Avatar */}
                <View style={styles.avatarSection}>
                    <TouchableOpacity style={styles.avatarPicker} onPress={pickAvatar}>
                        {avatar ? (
                            <Image source={{ uri: avatar }} style={styles.avatarImage} />
                        ) : (
                            <View style={styles.avatarPlaceholder}>
                                <Ionicons name="person" size={48} color={colors.textMuted} />
                            </View>
                        )}
                        <View style={styles.avatarBadge}>
                            <Ionicons name="camera" size={16} color={colors.background} />
                        </View>
                    </TouchableOpacity>
                    <Text style={styles.avatarHint}>Nhấn để thay đổi ảnh đại diện</Text>
                </View>

                {/* Name Input */}
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Tên hiển thị</Text>
                    <View style={styles.inputWrapper}>
                        <Ionicons name="person-outline" size={20} color={colors.textMuted} />
                        <TextInput
                            style={styles.input}
                            value={name}
                            onChangeText={setName}
                            placeholder="Nhập tên của bạn"
                            placeholderTextColor={colors.textMuted}
                            maxLength={30}
                        />
                    </View>
                </View>

                {/* Phone Input */}
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Số điện thoại</Text>
                    <View style={styles.inputWrapper}>
                        <Ionicons name="call-outline" size={20} color={colors.textMuted} />
                        <TextInput
                            style={styles.input}
                            value={phone}
                            onChangeText={setPhone}
                            placeholder="Nhập số điện thoại"
                            placeholderTextColor={colors.textMuted}
                            keyboardType="phone-pad"
                            maxLength={15}
                        />
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    loadingContainer: {
        justifyContent: "center",
        alignItems: "center",
    },

    // Header
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: spacing.md,
        paddingBottom: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    headerBtn: {
        width: 60,
        alignItems: "center",
    },
    headerTitle: {
        fontSize: fontSize.lg,
        fontWeight: fontWeight.bold,
        color: colors.text,
    },
    saveText: {
        color: colors.accent,
        fontSize: fontSize.md,
        fontWeight: fontWeight.semibold,
    },

    // Content
    content: {
        flex: 1,
    },
    contentContainer: {
        padding: spacing.xl,
    },

    // Avatar
    avatarSection: {
        alignItems: "center",
        marginBottom: spacing.xxl,
    },
    avatarPicker: {
        width: 120,
        height: 120,
        borderRadius: 60,
        position: "relative",
    },
    avatarImage: {
        width: "100%",
        height: "100%",
        borderRadius: 60,
        borderWidth: 3,
        borderColor: colors.accent,
    },
    avatarPlaceholder: {
        width: "100%",
        height: "100%",
        borderRadius: 60,
        backgroundColor: colors.surface,
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 3,
        borderColor: colors.border,
    },
    avatarBadge: {
        position: "absolute",
        bottom: 0,
        right: 0,
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: colors.accent,
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 3,
        borderColor: colors.background,
    },
    avatarHint: {
        marginTop: spacing.md,
        fontSize: fontSize.sm,
        color: colors.textMuted,
    },

    // Input
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
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: colors.surface,
        borderRadius: borderRadius.lg,
        paddingHorizontal: spacing.md,
        gap: spacing.sm,
        borderWidth: 1,
        borderColor: colors.border,
    },
    input: {
        flex: 1,
        paddingVertical: spacing.md,
        fontSize: fontSize.md,
        color: colors.text,
    },
});
