/**
 * Court Form Modal
 * Add/Edit court form for court owners
 */

import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    ScrollView,
    TextInput,
    Switch,
    Alert,
    ActivityIndicator,
    Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { colors, spacing, fontSize, fontWeight, borderRadius } from "../../constants/theme";
import haptics from "../../lib/haptics";

interface CourtFormData {
    name: string;
    address: string;
    description: string;
    pricePerHour: string;
    openTime: string;
    closeTime: string;
    facilities: string[];
    images: string[];
    isActive: boolean;
    autoApproveBookings: boolean;
}

interface CourtFormModalProps {
    visible: boolean;
    onClose: () => void;
    onSubmit: (data: CourtFormData) => Promise<void>;
    initialData?: Partial<CourtFormData>;
    mode: "create" | "edit";
}

const FACILITIES_OPTIONS = [
    { id: "parking", label: "Bãi đỗ xe", icon: "car-outline" },
    { id: "wifi", label: "WiFi", icon: "wifi-outline" },
    { id: "camera", label: "Camera AI", icon: "videocam-outline" },
    { id: "shower", label: "Phòng tắm", icon: "water-outline" },
    { id: "cafe", label: "Căng tin", icon: "cafe-outline" },
    { id: "lighting", label: "Chiếu sáng", icon: "bulb-outline" },
];

export default function CourtFormModal({
    visible,
    onClose,
    onSubmit,
    initialData,
    mode,
}: CourtFormModalProps) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState<CourtFormData>({
        name: "",
        address: "",
        description: "",
        pricePerHour: "",
        openTime: "06:00",
        closeTime: "22:00",
        facilities: [],
        images: [],
        isActive: true,
        autoApproveBookings: true,
    });

    useEffect(() => {
        if (initialData) {
            setFormData({
                name: initialData.name || "",
                address: initialData.address || "",
                description: initialData.description || "",
                pricePerHour: initialData.pricePerHour || "",
                openTime: initialData.openTime || "06:00",
                closeTime: initialData.closeTime || "22:00",
                facilities: initialData.facilities || [],
                images: initialData.images || [],
                isActive: initialData.isActive ?? true,
                autoApproveBookings: initialData.autoApproveBookings ?? true,
            });
        }
    }, [initialData]);

    const toggleFacility = (facilityId: string) => {
        haptics.light();
        setFormData((prev) => ({
            ...prev,
            facilities: prev.facilities.includes(facilityId)
                ? prev.facilities.filter((f) => f !== facilityId)
                : [...prev.facilities, facilityId],
        }));
    };

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsMultipleSelection: true,
            quality: 0.8,
        });

        if (!result.canceled) {
            const newImages = result.assets.map((asset) => asset.uri);
            setFormData((prev) => ({
                ...prev,
                images: [...prev.images, ...newImages].slice(0, 5),
            }));
        }
    };

    const removeImage = (index: number) => {
        setFormData((prev) => ({
            ...prev,
            images: prev.images.filter((_, i) => i !== index),
        }));
    };

    const handleSubmit = async () => {
        if (!formData.name || !formData.address || !formData.pricePerHour) {
            Alert.alert("Lỗi", "Vui lòng điền đầy đủ các trường bắt buộc");
            return;
        }

        setLoading(true);
        haptics.light();

        try {
            await onSubmit(formData);
            haptics.success();
            onClose();
        } catch (error) {
            Alert.alert("Lỗi", "Không thể lưu thông tin sân");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={onClose}
        >
            <View style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                        <Ionicons name="close" size={24} color={colors.text} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>
                        {mode === "create" ? "Thêm sân mới" : "Chỉnh sửa sân"}
                    </Text>
                    <View style={{ width: 40 }} />
                </View>

                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.content}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Basic Info */}
                    <Text style={styles.sectionTitle}>Thông tin cơ bản</Text>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Tên sân *</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="VD: Sân Pickleball ABC"
                            placeholderTextColor={colors.textMuted}
                            value={formData.name}
                            onChangeText={(text) => setFormData({ ...formData, name: text })}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Địa chỉ *</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="123 Đường ABC, Quận 1"
                            placeholderTextColor={colors.textMuted}
                            value={formData.address}
                            onChangeText={(text) => setFormData({ ...formData, address: text })}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Mô tả</Text>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            placeholder="Mô tả về sân..."
                            placeholderTextColor={colors.textMuted}
                            multiline
                            numberOfLines={3}
                            value={formData.description}
                            onChangeText={(text) => setFormData({ ...formData, description: text })}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Giá/giờ (VNĐ) *</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="200000"
                            placeholderTextColor={colors.textMuted}
                            keyboardType="numeric"
                            value={formData.pricePerHour}
                            onChangeText={(text) => setFormData({ ...formData, pricePerHour: text })}
                        />
                    </View>

                    <View style={styles.row}>
                        <View style={[styles.inputGroup, { flex: 1 }]}>
                            <Text style={styles.label}>Giờ mở cửa</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="06:00"
                                placeholderTextColor={colors.textMuted}
                                value={formData.openTime}
                                onChangeText={(text) => setFormData({ ...formData, openTime: text })}
                            />
                        </View>
                        <View style={{ width: spacing.md }} />
                        <View style={[styles.inputGroup, { flex: 1 }]}>
                            <Text style={styles.label}>Giờ đóng cửa</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="22:00"
                                placeholderTextColor={colors.textMuted}
                                value={formData.closeTime}
                                onChangeText={(text) => setFormData({ ...formData, closeTime: text })}
                            />
                        </View>
                    </View>

                    {/* Facilities */}
                    <Text style={styles.sectionTitle}>Tiện ích</Text>
                    <View style={styles.facilitiesGrid}>
                        {FACILITIES_OPTIONS.map((facility) => (
                            <TouchableOpacity
                                key={facility.id}
                                style={[
                                    styles.facilityChip,
                                    formData.facilities.includes(facility.id) && styles.facilityChipActive,
                                ]}
                                onPress={() => toggleFacility(facility.id)}
                            >
                                <Ionicons
                                    name={facility.icon as any}
                                    size={18}
                                    color={
                                        formData.facilities.includes(facility.id)
                                            ? colors.background
                                            : colors.textSecondary
                                    }
                                />
                                <Text
                                    style={[
                                        styles.facilityLabel,
                                        formData.facilities.includes(facility.id) &&
                                        styles.facilityLabelActive,
                                    ]}
                                >
                                    {facility.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Images */}
                    <Text style={styles.sectionTitle}>Hình ảnh (tối đa 5)</Text>
                    <View style={styles.imagesGrid}>
                        {formData.images.map((uri, index) => (
                            <View key={index} style={styles.imageWrapper}>
                                <Image source={{ uri }} style={styles.imagePreview} />
                                <TouchableOpacity
                                    style={styles.removeImageBtn}
                                    onPress={() => removeImage(index)}
                                >
                                    <Ionicons name="close-circle" size={24} color={colors.error} />
                                </TouchableOpacity>
                            </View>
                        ))}
                        {formData.images.length < 5 && (
                            <TouchableOpacity style={styles.addImageBtn} onPress={pickImage}>
                                <Ionicons name="add" size={32} color={colors.textMuted} />
                            </TouchableOpacity>
                        )}
                    </View>

                    {/* Settings */}
                    <Text style={styles.sectionTitle}>Cài đặt</Text>

                    <View style={styles.settingRow}>
                        <View>
                            <Text style={styles.settingLabel}>Sân đang hoạt động</Text>
                            <Text style={styles.settingDesc}>Hiển thị sân trong danh sách tìm kiếm</Text>
                        </View>
                        <Switch
                            value={formData.isActive}
                            onValueChange={(val) => setFormData({ ...formData, isActive: val })}
                            trackColor={{ false: colors.border, true: colors.accent }}
                        />
                    </View>

                    <View style={styles.settingRow}>
                        <View>
                            <Text style={styles.settingLabel}>Tự động duyệt booking</Text>
                            <Text style={styles.settingDesc}>Không cần xác nhận thủ công</Text>
                        </View>
                        <Switch
                            value={formData.autoApproveBookings}
                            onValueChange={(val) =>
                                setFormData({ ...formData, autoApproveBookings: val })
                            }
                            trackColor={{ false: colors.border, true: colors.accent }}
                        />
                    </View>
                </ScrollView>

                {/* Submit Button */}
                <View style={styles.footer}>
                    <TouchableOpacity
                        style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                        onPress={handleSubmit}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color={colors.background} />
                        ) : (
                            <Text style={styles.submitButtonText}>
                                {mode === "create" ? "Thêm sân" : "Lưu thay đổi"}
                            </Text>
                        )}
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    closeButton: {
        width: 40,
        height: 40,
        justifyContent: "center",
        alignItems: "center",
    },
    headerTitle: {
        fontSize: fontSize.lg,
        fontWeight: fontWeight.bold,
        color: colors.text,
    },
    scrollView: {
        flex: 1,
    },
    content: {
        padding: spacing.lg,
        paddingBottom: 120,
    },
    sectionTitle: {
        fontSize: fontSize.md,
        fontWeight: fontWeight.bold,
        color: colors.text,
        marginTop: spacing.lg,
        marginBottom: spacing.md,
    },
    inputGroup: {
        marginBottom: spacing.md,
    },
    label: {
        fontSize: fontSize.sm,
        color: colors.textSecondary,
        marginBottom: spacing.xs,
    },
    input: {
        backgroundColor: colors.surface,
        borderRadius: borderRadius.md,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.md,
        fontSize: fontSize.md,
        color: colors.text,
    },
    textArea: {
        height: 80,
        textAlignVertical: "top",
    },
    row: {
        flexDirection: "row",
    },
    facilitiesGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: spacing.sm,
    },
    facilityChip: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.xs,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.full,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
    },
    facilityChipActive: {
        backgroundColor: colors.accent,
        borderColor: colors.accent,
    },
    facilityLabel: {
        fontSize: fontSize.sm,
        color: colors.textSecondary,
    },
    facilityLabelActive: {
        color: colors.background,
    },
    imagesGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: spacing.sm,
    },
    imageWrapper: {
        position: "relative",
    },
    imagePreview: {
        width: 80,
        height: 80,
        borderRadius: borderRadius.md,
    },
    removeImageBtn: {
        position: "absolute",
        top: -8,
        right: -8,
    },
    addImageBtn: {
        width: 80,
        height: 80,
        borderRadius: borderRadius.md,
        backgroundColor: colors.surface,
        borderWidth: 2,
        borderColor: colors.border,
        borderStyle: "dashed",
        justifyContent: "center",
        alignItems: "center",
    },
    settingRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    settingLabel: {
        fontSize: fontSize.md,
        fontWeight: fontWeight.medium,
        color: colors.text,
    },
    settingDesc: {
        fontSize: fontSize.sm,
        color: colors.textMuted,
        marginTop: 2,
    },
    footer: {
        padding: spacing.lg,
        paddingBottom: spacing.xl,
        borderTopWidth: 1,
        borderTopColor: colors.border,
    },
    submitButton: {
        backgroundColor: colors.accent,
        paddingVertical: spacing.lg,
        borderRadius: borderRadius.md,
        alignItems: "center",
    },
    submitButtonDisabled: {
        opacity: 0.6,
    },
    submitButtonText: {
        fontSize: fontSize.md,
        fontWeight: fontWeight.semibold,
        color: colors.background,
    },
});
