/**
 * Onboarding Screen
 * @description 6-step onboarding flow for new users
 * @module app/onboarding/index
 */

import React, { useState, useRef } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    ScrollView,
    Alert,
    ActivityIndicator,
    Dimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { Image } from "expo-image";
import { colors, spacing, fontSize, fontWeight, borderRadius } from "../../constants/theme";
import { AuthService } from "../../services/auth.service";
import { uploadAvatar } from "../../services/upload";
import haptics from "../../lib/haptics";

const { width } = Dimensions.get("window");
const TOTAL_STEPS = 6;

// Skill levels configuration
const SKILL_LEVELS = [
    {
        id: "beginner",
        label: "Mới chơi 🌱",
        desc: "Chưa nắm rõ luật, đang học hỏi",
        color: "#10b981",
    },
    {
        id: "intermediate",
        label: "Phong trào 🎯",
        desc: "Đã chơi > 6 tháng, nắm rõ luật",
        color: "#3b82f6",
    },
    {
        id: "advanced",
        label: "Chuyên nghiệp 🏆",
        desc: "Thi đấu thường xuyên, kỹ năng cao",
        color: "#8b5cf6",
    },
];

// Play styles configuration
const PLAY_STYLES = [
    { id: "attack", label: "Tấn công ⚔️", desc: "Thích đập cầu, chơi nhanh", color: "#ef4444" },
    {
        id: "defense",
        label: "Phòng thủ 🛡️",
        desc: "Kiên nhẫn, điều cầu, phản công",
        color: "#3b82f6",
    },
    { id: "all_round", label: "Toàn diện ⚖️", desc: "Linh hoạt công thủ", color: "#8b5cf6" },
];

export default function OnboardingScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();

    // State
    const [step, setStep] = useState(0);
    const [name, setName] = useState("");
    const [avatar, setAvatar] = useState("");
    const [skillLevel, setSkillLevel] = useState("");
    const [playStyle, setPlayStyle] = useState("");
    const [loading, setLoading] = useState(false);

    const progress = ((step + 1) / TOTAL_STEPS) * 100;

    // Validation
    const canProceed = () => {
        switch (step) {
            case 1:
                return name.trim().length >= 2;
            case 2:
                return avatar !== "";
            case 3:
                return skillLevel !== "";
            case 4:
                return playStyle !== "";
            default:
                return true;
        }
    };

    // Navigate
    const handleNext = async () => {
        haptics.light();

        if (step < TOTAL_STEPS - 1) {
            setStep(step + 1);
        } else {
            // Final step - save profile
            setLoading(true);
            try {
                await AuthService.updateUserProfile({
                    name: name.trim(),
                    avatar: avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=default",
                    has_onboarded: true,
                });
                haptics.success();
                router.replace("/(tabs)");
            } catch (error) {
                Alert.alert("Lỗi", "Không thể lưu thông tin. Vui lòng thử lại.");
            } finally {
                setLoading(false);
            }
        }
    };

    const handleBack = () => {
        haptics.light();
        if (step > 0) setStep(step - 1);
    };

    const handleSkip = async () => {
        haptics.light();
        await AuthService.updateUserProfile({ has_onboarded: true });
        router.replace("/(tabs)");
    };

    // Avatar picker
    const pickAvatar = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });

        if (!result.canceled && result.assets[0]) {
            setLoading(true);
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
                setLoading(false);
            }
        }
    };

    // Render step content
    const renderStep = () => {
        switch (step) {
            case 0:
                // Welcome
                return (
                    <View style={styles.stepContent}>
                        <View style={styles.welcomeIcon}>
                            <Ionicons name="flash" size={64} color={colors.background} />
                        </View>
                        <Text style={styles.welcomeTitle}>Chào mừng đến với my2light! 🎾</Text>
                        <Text style={styles.welcomeSubtitle}>
                            Nền tảng ghi lại khoảnh khắc tuyệt vời của bạn
                        </Text>

                        <View style={styles.featureList}>
                            {[
                                {
                                    icon: "videocam",
                                    title: "Ghi lại mọi khoảnh khắc",
                                    desc: "Quay video và tạo highlight",
                                },
                                {
                                    icon: "trophy",
                                    title: "Theo dõi tiến bộ",
                                    desc: "Thống kê chi tiết về trận đấu",
                                },
                                {
                                    icon: "people",
                                    title: "Kết nối",
                                    desc: "Tìm đối thủ và bạn chơi",
                                },
                            ].map((item, i) => (
                                <View key={i} style={styles.featureItem}>
                                    <View style={styles.featureIcon}>
                                        <Ionicons
                                            name={item.icon as any}
                                            size={20}
                                            color={colors.accent}
                                        />
                                    </View>
                                    <View style={styles.featureText}>
                                        <Text style={styles.featureTitle}>{item.title}</Text>
                                        <Text style={styles.featureDesc}>{item.desc}</Text>
                                    </View>
                                </View>
                            ))}
                        </View>
                    </View>
                );

            case 1:
                // Name input
                return (
                    <View style={styles.stepContent}>
                        <Text style={styles.stepTitle}>Tên của bạn là gì?</Text>
                        <Text style={styles.stepSubtitle}>Chọn tên hiển thị mà bạn muốn</Text>

                        <TextInput
                            style={styles.nameInput}
                            value={name}
                            onChangeText={setName}
                            placeholder="Ví dụ: Tuấn Pickleball"
                            placeholderTextColor={colors.textMuted}
                            autoFocus
                            maxLength={30}
                        />
                        <Text style={styles.hint}>Bạn có thể thay đổi tên này bất cứ lúc nào</Text>
                    </View>
                );

            case 2:
                // Avatar upload
                return (
                    <View style={styles.stepContent}>
                        <Text style={styles.stepTitle}>Chọn ảnh đại diện</Text>
                        <Text style={styles.stepSubtitle}>Giúp mọi người dễ nhận ra bạn hơn</Text>

                        <TouchableOpacity style={styles.avatarPicker} onPress={pickAvatar}>
                            {avatar ? (
                                <Image source={{ uri: avatar }} style={styles.avatarImage} />
                            ) : (
                                <View style={styles.avatarPlaceholder}>
                                    <Ionicons name="camera" size={48} color={colors.textMuted} />
                                </View>
                            )}
                            <View style={styles.avatarBadge}>
                                <Ionicons name="camera" size={16} color={colors.background} />
                            </View>
                        </TouchableOpacity>
                        <Text style={styles.hint}>Nhấn vào để chọn ảnh</Text>
                    </View>
                );

            case 3:
                // Skill level
                return (
                    <View style={styles.stepContent}>
                        <Text style={styles.stepTitle}>Trình độ của bạn?</Text>
                        <Text style={styles.stepSubtitle}>
                            Giúp chúng tôi gợi ý đối thủ phù hợp
                        </Text>

                        <View style={styles.optionList}>
                            {SKILL_LEVELS.map((level) => (
                                <TouchableOpacity
                                    key={level.id}
                                    style={[
                                        styles.optionItem,
                                        skillLevel === level.id && {
                                            borderColor: level.color,
                                            backgroundColor: `${level.color}15`,
                                        },
                                    ]}
                                    onPress={() => {
                                        setSkillLevel(level.id);
                                        haptics.light();
                                    }}
                                >
                                    <View
                                        style={[
                                            styles.optionIcon,
                                            { backgroundColor: `${level.color}20` },
                                        ]}
                                    >
                                        <Ionicons name="star" size={24} color={level.color} />
                                    </View>
                                    <View style={styles.optionText}>
                                        <Text style={styles.optionTitle}>{level.label}</Text>
                                        <Text style={styles.optionDesc}>{level.desc}</Text>
                                    </View>
                                    {skillLevel === level.id && (
                                        <View
                                            style={[
                                                styles.checkBadge,
                                                { backgroundColor: level.color },
                                            ]}
                                        >
                                            <Ionicons name="checkmark" size={16} color="#fff" />
                                        </View>
                                    )}
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                );

            case 4:
                // Play style
                return (
                    <View style={styles.stepContent}>
                        <Text style={styles.stepTitle}>Lối chơi của bạn?</Text>
                        <Text style={styles.stepSubtitle}>Để chúng tôi tìm đồng đội ăn ý</Text>

                        <View style={styles.optionList}>
                            {PLAY_STYLES.map((style) => (
                                <TouchableOpacity
                                    key={style.id}
                                    style={[
                                        styles.optionItem,
                                        playStyle === style.id && {
                                            borderColor: style.color,
                                            backgroundColor: `${style.color}15`,
                                        },
                                    ]}
                                    onPress={() => {
                                        setPlayStyle(style.id);
                                        haptics.light();
                                    }}
                                >
                                    <View
                                        style={[
                                            styles.optionIcon,
                                            { backgroundColor: `${style.color}20` },
                                        ]}
                                    >
                                        <Ionicons name="flash" size={24} color={style.color} />
                                    </View>
                                    <View style={styles.optionText}>
                                        <Text style={styles.optionTitle}>{style.label}</Text>
                                        <Text style={styles.optionDesc}>{style.desc}</Text>
                                    </View>
                                    {playStyle === style.id && (
                                        <View
                                            style={[
                                                styles.checkBadge,
                                                { backgroundColor: style.color },
                                            ]}
                                        >
                                            <Ionicons name="checkmark" size={16} color="#fff" />
                                        </View>
                                    )}
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                );

            case 5:
                // Welcome gift
                return (
                    <View style={styles.stepContent}>
                        <View style={styles.giftIcon}>
                            <Ionicons name="gift" size={64} color="#fff" />
                        </View>
                        <Text style={styles.stepTitle}>Sẵn sàng bắt đầu! 🎉</Text>
                        <Text style={styles.stepSubtitle}>Tặng bạn 200k credit để trải nghiệm</Text>

                        <View style={styles.giftCard}>
                            <Text style={styles.giftAmount}>200,000đ</Text>
                            <Text style={styles.giftText}>Đã được thêm vào ví của bạn</Text>
                        </View>

                        <View style={styles.checkList}>
                            {[
                                "Tài khoản đã được kích hoạt",
                                "Hồ sơ đã được thiết lập",
                                "200k credit miễn phí",
                            ].map((text, i) => (
                                <View key={i} style={styles.checkItem}>
                                    <View style={styles.checkCircle}>
                                        <Ionicons
                                            name="checkmark"
                                            size={12}
                                            color={colors.accent}
                                        />
                                    </View>
                                    <Text style={styles.checkText}>{text}</Text>
                                </View>
                            ))}
                        </View>
                    </View>
                );

            default:
                return null;
        }
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            {/* Progress Bar */}
            <View style={styles.progressContainer}>
                <View style={[styles.progressFill, { width: `${progress}%` }]} />
            </View>

            {/* Header */}
            <View style={styles.header}>
                {step > 0 ? (
                    <TouchableOpacity onPress={handleBack} style={styles.headerBtn}>
                        <Ionicons name="chevron-back" size={24} color={colors.text} />
                    </TouchableOpacity>
                ) : (
                    <View style={styles.headerBtn} />
                )}

                <Text style={styles.stepIndicator}>
                    {step + 1} / {TOTAL_STEPS}
                </Text>

                {step < TOTAL_STEPS - 1 ? (
                    <TouchableOpacity onPress={handleSkip} style={styles.headerBtn}>
                        <Text style={styles.skipText}>Bỏ qua</Text>
                    </TouchableOpacity>
                ) : (
                    <View style={styles.headerBtn} />
                )}
            </View>

            {/* Content */}
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {renderStep()}
            </ScrollView>

            {/* Bottom CTA */}
            <View style={[styles.bottomContainer, { paddingBottom: insets.bottom + spacing.lg }]}>
                <TouchableOpacity
                    style={[styles.nextButton, !canProceed() && styles.nextButtonDisabled]}
                    onPress={handleNext}
                    disabled={!canProceed() || loading}
                >
                    {loading ? (
                        <ActivityIndicator color={colors.background} />
                    ) : (
                        <>
                            <Text style={styles.nextButtonText}>
                                {step === TOTAL_STEPS - 1 ? "Bắt đầu ngay" : "Tiếp tục"}
                            </Text>
                            {step < TOTAL_STEPS - 1 && (
                                <Ionicons
                                    name="arrow-forward"
                                    size={20}
                                    color={colors.background}
                                />
                            )}
                        </>
                    )}
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
    progressContainer: {
        height: 3,
        backgroundColor: colors.surface,
    },
    progressFill: {
        height: "100%",
        backgroundColor: colors.accent,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.md,
    },
    headerBtn: {
        width: 60,
    },
    stepIndicator: {
        color: colors.textMuted,
        fontSize: fontSize.sm,
        fontWeight: fontWeight.medium,
    },
    skipText: {
        color: colors.textMuted,
        fontSize: fontSize.sm,
        textAlign: "right",
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: spacing.xl,
        paddingBottom: spacing.xxl,
    },
    stepContent: {
        alignItems: "center",
        paddingTop: spacing.xl,
    },

    // Welcome step
    welcomeIcon: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: colors.accent,
        justifyContent: "center",
        alignItems: "center",
        marginBottom: spacing.xl,
    },
    welcomeTitle: {
        fontSize: fontSize.xxl,
        fontWeight: fontWeight.bold,
        color: colors.text,
        textAlign: "center",
        marginBottom: spacing.sm,
    },
    welcomeSubtitle: {
        fontSize: fontSize.md,
        color: colors.textMuted,
        textAlign: "center",
        marginBottom: spacing.xl,
    },
    featureList: {
        width: "100%",
        gap: spacing.md,
    },
    featureItem: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: colors.surface,
        padding: spacing.md,
        borderRadius: borderRadius.lg,
        gap: spacing.md,
    },
    featureIcon: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: `${colors.accent}20`,
        justifyContent: "center",
        alignItems: "center",
    },
    featureText: {
        flex: 1,
    },
    featureTitle: {
        fontSize: fontSize.md,
        fontWeight: fontWeight.semibold,
        color: colors.text,
        marginBottom: 2,
    },
    featureDesc: {
        fontSize: fontSize.sm,
        color: colors.textMuted,
    },

    // Step title
    stepTitle: {
        fontSize: fontSize.xxl,
        fontWeight: fontWeight.bold,
        color: colors.text,
        textAlign: "center",
        marginBottom: spacing.sm,
    },
    stepSubtitle: {
        fontSize: fontSize.md,
        color: colors.textMuted,
        textAlign: "center",
        marginBottom: spacing.xl,
    },
    hint: {
        fontSize: fontSize.sm,
        color: colors.textMuted,
        textAlign: "center",
        marginTop: spacing.md,
    },

    // Name input
    nameInput: {
        width: "100%",
        backgroundColor: colors.surface,
        borderRadius: borderRadius.lg,
        padding: spacing.lg,
        fontSize: fontSize.lg,
        color: colors.text,
        textAlign: "center",
        fontWeight: fontWeight.semibold,
    },

    // Avatar
    avatarPicker: {
        width: 150,
        height: 150,
        borderRadius: 75,
        position: "relative",
    },
    avatarImage: {
        width: "100%",
        height: "100%",
        borderRadius: 75,
        borderWidth: 4,
        borderColor: colors.accent,
    },
    avatarPlaceholder: {
        width: "100%",
        height: "100%",
        borderRadius: 75,
        backgroundColor: colors.surface,
        borderWidth: 3,
        borderColor: colors.border,
        borderStyle: "dashed",
        justifyContent: "center",
        alignItems: "center",
    },
    avatarBadge: {
        position: "absolute",
        bottom: 0,
        right: 0,
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: colors.accent,
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 4,
        borderColor: colors.background,
    },

    // Options (skill/style)
    optionList: {
        width: "100%",
        gap: spacing.md,
    },
    optionItem: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: colors.surface,
        padding: spacing.lg,
        borderRadius: borderRadius.lg,
        borderWidth: 2,
        borderColor: colors.border,
        gap: spacing.md,
    },
    optionIcon: {
        width: 50,
        height: 50,
        borderRadius: 14,
        justifyContent: "center",
        alignItems: "center",
    },
    optionText: {
        flex: 1,
    },
    optionTitle: {
        fontSize: fontSize.md,
        fontWeight: fontWeight.semibold,
        color: colors.text,
        marginBottom: 2,
    },
    optionDesc: {
        fontSize: fontSize.sm,
        color: colors.textMuted,
    },
    checkBadge: {
        width: 28,
        height: 28,
        borderRadius: 14,
        justifyContent: "center",
        alignItems: "center",
    },

    // Gift step
    giftIcon: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: "#f59e0b",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: spacing.xl,
    },
    giftCard: {
        backgroundColor: `${colors.accent}15`,
        borderWidth: 2,
        borderColor: `${colors.accent}30`,
        borderRadius: borderRadius.xl,
        padding: spacing.xl,
        alignItems: "center",
        marginBottom: spacing.xl,
    },
    giftAmount: {
        fontSize: 40,
        fontWeight: fontWeight.bold,
        color: colors.accent,
        marginBottom: spacing.xs,
    },
    giftText: {
        fontSize: fontSize.md,
        color: colors.textSecondary,
    },
    checkList: {
        width: "100%",
        gap: spacing.md,
    },
    checkItem: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.md,
    },
    checkCircle: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: `${colors.accent}20`,
        justifyContent: "center",
        alignItems: "center",
    },
    checkText: {
        fontSize: fontSize.md,
        color: colors.textSecondary,
    },

    // Bottom
    bottomContainer: {
        paddingHorizontal: spacing.xl,
        paddingTop: spacing.md,
        backgroundColor: colors.background,
    },
    nextButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: spacing.sm,
        backgroundColor: colors.accent,
        paddingVertical: spacing.lg,
        borderRadius: borderRadius.md,
    },
    nextButtonDisabled: {
        opacity: 0.5,
    },
    nextButtonText: {
        fontSize: fontSize.md,
        fontWeight: fontWeight.semibold,
        color: colors.background,
    },
});
