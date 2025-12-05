/**
 * Become Court Owner - Registration Screen
 * Business registration form to become a court owner
 */

import React, { useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    TextInput,
    Alert,
    ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, fontSize, fontWeight, borderRadius } from "../../constants/theme";
import { AdminService } from "../../services/admin.service";
import haptics from "../../lib/haptics";

interface FormData {
    businessName: string;
    phone: string;
    email: string;
    address: string;
    taxId: string;
}

export default function BecomeOwnerScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState<FormData>({
        businessName: "",
        phone: "",
        email: "",
        address: "",
        taxId: "",
    });

    const benefits = [
        "Quản lý booking tự động",
        "Kết nối với hàng nghìn người chơi",
        "Thống kê doanh thu chi tiết",
        "Tích hợp AI camera tự quay highlight",
    ];

    const handleSubmit = async () => {
        if (!formData.businessName || !formData.phone || !formData.email) {
            Alert.alert("Lỗi", "Vui lòng điền đầy đủ thông tin bắt buộc");
            return;
        }

        setLoading(true);
        haptics.light();

        try {
            const result = await AdminService.createCourtOwnerProfile(formData);

            if (result.success) {
                haptics.success();
                Alert.alert(
                    "Thành công! 🎉",
                    "Chào mừng bạn trở thành chủ sân. Vui lòng đợi admin duyệt tài khoản.",
                    [
                        {
                            text: "OK",
                            onPress: () => router.replace("/(tabs)"),
                        },
                    ]
                );
            } else {
                Alert.alert("Lỗi", result.error || "Đăng ký thất bại");
            }
        } catch (error) {
            Alert.alert("Lỗi", "Có lỗi xảy ra, vui lòng thử lại");
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="chevron-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <View>
                    <Text style={styles.headerTitle}>Đăng ký làm chủ sân</Text>
                    <Text style={styles.headerSubtitle}>Quản lý sân và kết nối với người chơi</Text>
                </View>
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
            >
                {/* Benefits Card */}
                <View style={styles.benefitsCard}>
                    <Text style={styles.benefitsTitle}>Lợi ích khi trở thành chủ sân</Text>
                    {benefits.map((benefit, index) => (
                        <View key={index} style={styles.benefitRow}>
                            <View style={styles.benefitDot} />
                            <Text style={styles.benefitText}>{benefit}</Text>
                        </View>
                    ))}
                </View>

                {/* Form */}
                <View style={styles.formCard}>
                    <Text style={styles.formTitle}>Thông tin doanh nghiệp</Text>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Tên doanh nghiệp *</Text>
                        <View style={styles.inputContainer}>
                            <Ionicons name="business-outline" size={20} color={colors.textMuted} />
                            <TextInput
                                style={styles.input}
                                placeholder="VD: Sân Pickleball ABC"
                                placeholderTextColor={colors.textMuted}
                                value={formData.businessName}
                                onChangeText={(text) => setFormData({ ...formData, businessName: text })}
                            />
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Số điện thoại *</Text>
                        <View style={styles.inputContainer}>
                            <Ionicons name="call-outline" size={20} color={colors.textMuted} />
                            <TextInput
                                style={styles.input}
                                placeholder="0901234567"
                                placeholderTextColor={colors.textMuted}
                                keyboardType="phone-pad"
                                value={formData.phone}
                                onChangeText={(text) => setFormData({ ...formData, phone: text })}
                            />
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Email *</Text>
                        <View style={styles.inputContainer}>
                            <Ionicons name="mail-outline" size={20} color={colors.textMuted} />
                            <TextInput
                                style={styles.input}
                                placeholder="contact@example.com"
                                placeholderTextColor={colors.textMuted}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                value={formData.email}
                                onChangeText={(text) => setFormData({ ...formData, email: text })}
                            />
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Địa chỉ</Text>
                        <View style={styles.inputContainer}>
                            <Ionicons name="location-outline" size={20} color={colors.textMuted} />
                            <TextInput
                                style={styles.input}
                                placeholder="123 Đường ABC, Quận 1, TP.HCM"
                                placeholderTextColor={colors.textMuted}
                                value={formData.address}
                                onChangeText={(text) => setFormData({ ...formData, address: text })}
                            />
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Mã số thuế</Text>
                        <View style={styles.inputContainer}>
                            <Ionicons name="document-text-outline" size={20} color={colors.textMuted} />
                            <TextInput
                                style={styles.input}
                                placeholder="0123456789"
                                placeholderTextColor={colors.textMuted}
                                value={formData.taxId}
                                onChangeText={(text) => setFormData({ ...formData, taxId: text })}
                            />
                        </View>
                    </View>
                </View>

                {/* Submit Button */}
                <TouchableOpacity
                    style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                    onPress={handleSubmit}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color={colors.background} />
                    ) : (
                        <Text style={styles.submitButtonText}>Hoàn tất đăng ký</Text>
                    )}
                </TouchableOpacity>

                <Text style={styles.disclaimer}>
                    Bằng việc đăng ký, bạn đồng ý với điều khoản dịch vụ của My2Light
                </Text>
            </ScrollView>
        </View>
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
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        gap: spacing.md,
    },
    backButton: {
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
    headerSubtitle: {
        fontSize: fontSize.sm,
        color: colors.textMuted,
    },
    scrollView: {
        flex: 1,
    },
    content: {
        padding: spacing.lg,
        paddingBottom: 100,
    },
    benefitsCard: {
        backgroundColor: `${colors.accent}10`,
        borderRadius: borderRadius.lg,
        padding: spacing.lg,
        marginBottom: spacing.lg,
        borderWidth: 1,
        borderColor: `${colors.accent}30`,
    },
    benefitsTitle: {
        fontSize: fontSize.md,
        fontWeight: fontWeight.bold,
        color: colors.text,
        marginBottom: spacing.md,
    },
    benefitRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.sm,
        marginBottom: spacing.xs,
    },
    benefitDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: colors.accent,
    },
    benefitText: {
        fontSize: fontSize.sm,
        color: colors.textSecondary,
    },
    formCard: {
        backgroundColor: colors.surface,
        borderRadius: borderRadius.lg,
        padding: spacing.lg,
        marginBottom: spacing.lg,
    },
    formTitle: {
        fontSize: fontSize.md,
        fontWeight: fontWeight.bold,
        color: colors.text,
        marginBottom: spacing.lg,
    },
    inputGroup: {
        marginBottom: spacing.md,
    },
    label: {
        fontSize: fontSize.sm,
        color: colors.textSecondary,
        marginBottom: spacing.xs,
    },
    inputContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: colors.surfaceLight,
        borderRadius: borderRadius.md,
        paddingHorizontal: spacing.md,
        gap: spacing.sm,
    },
    input: {
        flex: 1,
        color: colors.text,
        fontSize: fontSize.md,
        paddingVertical: spacing.md,
    },
    submitButton: {
        backgroundColor: colors.accent,
        paddingVertical: spacing.lg,
        borderRadius: borderRadius.md,
        alignItems: "center",
        marginBottom: spacing.md,
    },
    submitButtonDisabled: {
        opacity: 0.6,
    },
    submitButtonText: {
        fontSize: fontSize.md,
        fontWeight: fontWeight.semibold,
        color: colors.background,
    },
    disclaimer: {
        fontSize: fontSize.xs,
        color: colors.textMuted,
        textAlign: "center",
    },
});
