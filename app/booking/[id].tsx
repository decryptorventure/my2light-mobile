/**
 * Booking Screen - 3 Step Flow
 * Step 1: Select date & time
 * Step 2: Select recording package (optional)
 * Step 3: Payment confirmation
 */

import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Alert,
    ActivityIndicator,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, fontSize, fontWeight, borderRadius } from "../../constants/theme";
import { CourtService } from "../../services/court.service";
import { BookingService } from "../../services/booking.service";
import { useAuthStore } from "../../stores/authStore";
import { Court, Package } from "../../types";
import haptics from "../../lib/haptics";

type Step = "datetime" | "package" | "payment";

export default function BookingScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { id } = useLocalSearchParams<{ id: string }>();
    const { user } = useAuthStore();

    // States
    const [step, setStep] = useState<Step>("datetime");
    const [court, setCourt] = useState<Court | null>(null);
    const [packages, setPackages] = useState<Package[]>([]);
    const [loading, setLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);

    // Selection states
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [selectedTime, setSelectedTime] = useState<string | null>(null);
    const [selectedPackage, setSelectedPackage] = useState<string | null>(null);

    const progress = step === "datetime" ? 33 : step === "package" ? 66 : 100;

    useEffect(() => {
        loadData();
    }, [id]);

    const loadData = async () => {
        if (!id) return;
        setLoading(true);
        try {
            const [courtRes, packagesRes] = await Promise.all([
                CourtService.getCourtById(id),
                CourtService.getPackages(),
            ]);

            if (courtRes.success && courtRes.data) {
                setCourt(courtRes.data);
            }
            if (packagesRes.success) {
                setPackages(packagesRes.data);
            }
        } catch (error) {
            console.error("Error loading booking data:", error);
            Alert.alert("Lỗi", "Không thể tải thông tin sân");
        } finally {
            setLoading(false);
        }
    };

    // Generate next 7 days
    const generateDates = () => {
        const dates: Date[] = [];
        const today = new Date();
        for (let i = 0; i < 7; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() + i);
            dates.push(date);
        }
        return dates;
    };

    // Generate time slots (06:00 - 22:00)
    const generateTimeSlots = () => {
        const slots: string[] = [];
        const now = new Date();
        const isToday = selectedDate.toDateString() === now.toDateString();
        const currentHour = now.getHours();

        for (let hour = 6; hour <= 22; hour++) {
            // Skip past hours for today
            if (isToday && hour <= currentHour) continue;

            slots.push(`${hour.toString().padStart(2, "0")}:00`);
            if (hour < 22) {
                slots.push(`${hour.toString().padStart(2, "0")}:30`);
            }
        }
        return slots;
    };

    const handleNext = () => {
        haptics.light();
        if (step === "datetime" && selectedTime) {
            setStep("package");
        } else if (step === "package") {
            setStep("payment");
        }
    };

    const handleBack = () => {
        haptics.light();
        if (step === "datetime") {
            router.back();
        } else if (step === "package") {
            setStep("datetime");
        } else {
            setStep("package");
        }
    };

    const handlePayment = async () => {
        if (!court || !selectedTime) return;

        setIsProcessing(true);
        try {
            // Parse start time
            const [hours, minutes] = selectedTime.split(":").map(Number);
            const startTime = new Date(selectedDate);
            startTime.setHours(hours, minutes, 0, 0);

            const result = await BookingService.createBooking({
                courtId: court.id,
                startTime: startTime.getTime(),
                durationHours: 1,
                packageId: selectedPackage || undefined,
            });

            if (result.success) {
                haptics.success();
                router.replace({
                    pathname: "/booking/success",
                    params: {
                        courtName: court.name,
                        date: selectedDate.toLocaleDateString("vi-VN", {
                            weekday: "long",
                            day: "numeric",
                            month: "long",
                        }),
                        time: selectedTime,
                        totalPrice: String(totalPrice),
                        packageName: selectedPkg?.name || "",
                    },
                });
            } else {
                Alert.alert("Lỗi", result.error || "Đặt sân thất bại");
            }
        } catch (error) {
            console.error("Booking error:", error);
            Alert.alert("Lỗi", "Có lỗi xảy ra khi đặt sân");
        } finally {
            setIsProcessing(false);
        }
    };

    // Pricing calculation
    const durationHours = 1;
    const courtPrice = (court?.pricePerHour || 0) * durationHours;
    const selectedPkg = packages.find((p) => p.id === selectedPackage);
    const packagePrice = selectedPkg?.price || 0;
    const totalPrice = courtPrice + packagePrice;
    const userCredits = user?.credits || 0;
    const canAfford = userCredits >= totalPrice;

    const canProceed = () => {
        if (step === "datetime") return !!selectedTime;
        return true;
    };

    if (loading) {
        return (
            <View style={[styles.container, styles.loadingContainer]}>
                <ActivityIndicator size="large" color={colors.accent} />
            </View>
        );
    }

    if (!court) {
        return (
            <View style={[styles.container, styles.loadingContainer]}>
                <Text style={styles.errorText}>Không tìm thấy sân</Text>
            </View>
        );
    }

    const dates = generateDates();
    const timeSlots = generateTimeSlots();

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                    <Ionicons name="chevron-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <View style={styles.headerInfo}>
                    <Text style={styles.headerTitle}>Đặt sân</Text>
                    <Text style={styles.headerSubtitle} numberOfLines={1}>
                        {court.name}
                    </Text>
                </View>
            </View>

            {/* Progress Bar */}
            <View style={styles.progressContainer}>
                <View style={[styles.progressFill, { width: `${progress}%` }]} />
            </View>

            {/* Step Indicators */}
            <View style={styles.stepIndicators}>
                {[
                    { key: "datetime", label: "Thời gian", icon: "calendar" },
                    { key: "package", label: "Gói quay", icon: "videocam" },
                    { key: "payment", label: "Thanh toán", icon: "card" },
                ].map((s, index) => {
                    const isActive = step === s.key;
                    const isPast =
                        (step === "package" && index === 0) ||
                        (step === "payment" && index <= 1);

                    return (
                        <View key={s.key} style={styles.stepItem}>
                            <View
                                style={[
                                    styles.stepCircle,
                                    (isActive || isPast) && styles.stepCircleActive,
                                ]}
                            >
                                {isPast ? (
                                    <Ionicons name="checkmark" size={14} color={colors.background} />
                                ) : (
                                    <Ionicons
                                        name={s.icon as any}
                                        size={14}
                                        color={isActive ? colors.background : colors.textMuted}
                                    />
                                )}
                            </View>
                            <Text
                                style={[
                                    styles.stepLabel,
                                    (isActive || isPast) && styles.stepLabelActive,
                                ]}
                            >
                                {s.label}
                            </Text>
                        </View>
                    );
                })}
            </View>

            <ScrollView
                style={styles.content}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Step 1: Date & Time */}
                {step === "datetime" && (
                    <View style={styles.stepContent}>
                        {/* Date Selection */}
                        <Text style={styles.sectionTitle}>
                            <Ionicons name="calendar" size={18} color={colors.accent} /> Chọn ngày
                        </Text>
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            style={styles.dateScroll}
                        >
                            {dates.map((date, i) => {
                                const isSelected =
                                    date.toDateString() === selectedDate.toDateString();
                                return (
                                    <TouchableOpacity
                                        key={i}
                                        style={[
                                            styles.dateCard,
                                            isSelected && styles.dateCardSelected,
                                        ]}
                                        onPress={() => {
                                            setSelectedDate(date);
                                            setSelectedTime(null);
                                            haptics.light();
                                        }}
                                    >
                                        <Text
                                            style={[
                                                styles.dateDay,
                                                isSelected && styles.dateDaySelected,
                                            ]}
                                        >
                                            {date.toLocaleDateString("vi-VN", { weekday: "short" })}
                                        </Text>
                                        <Text
                                            style={[
                                                styles.dateNum,
                                                isSelected && styles.dateNumSelected,
                                            ]}
                                        >
                                            {date.getDate()}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>

                        {/* Time Selection */}
                        <Text style={[styles.sectionTitle, { marginTop: spacing.xl }]}>
                            <Ionicons name="time" size={18} color={colors.info} /> Chọn giờ
                        </Text>
                        <View style={styles.timeGrid}>
                            {timeSlots.map((slot, i) => {
                                const isSelected = selectedTime === slot;
                                // Mock some disabled slots
                                const isDisabled = i % 7 === 0 && i !== 0;

                                return (
                                    <TouchableOpacity
                                        key={i}
                                        style={[
                                            styles.timeSlot,
                                            isSelected && styles.timeSlotSelected,
                                            isDisabled && styles.timeSlotDisabled,
                                        ]}
                                        disabled={isDisabled}
                                        onPress={() => {
                                            setSelectedTime(slot);
                                            haptics.light();
                                        }}
                                    >
                                        <Text
                                            style={[
                                                styles.timeText,
                                                isSelected && styles.timeTextSelected,
                                                isDisabled && styles.timeTextDisabled,
                                            ]}
                                        >
                                            {slot}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>
                )}

                {/* Step 2: Package Selection */}
                {step === "package" && (
                    <View style={styles.stepContent}>
                        <Text style={styles.sectionTitle}>Chọn gói quay (Tuỳ chọn)</Text>

                        {/* No Recording Option */}
                        <TouchableOpacity
                            style={[
                                styles.packageCard,
                                selectedPackage === null && styles.packageCardSelected,
                            ]}
                            onPress={() => {
                                setSelectedPackage(null);
                                haptics.light();
                            }}
                        >
                            <View style={styles.packageIcon}>
                                <Ionicons name="videocam-off" size={24} color={colors.textMuted} />
                            </View>
                            <View style={styles.packageInfo}>
                                <Text style={styles.packageName}>Không quay</Text>
                                <Text style={styles.packageDesc}>
                                    Chỉ đặt sân, không quay highlight
                                </Text>
                            </View>
                            <Text style={styles.packagePrice}>0đ</Text>
                            {selectedPackage === null && (
                                <View style={styles.packageCheck}>
                                    <Ionicons name="checkmark" size={14} color={colors.background} />
                                </View>
                            )}
                        </TouchableOpacity>

                        {/* Package Options */}
                        {packages.map((pkg) => (
                            <TouchableOpacity
                                key={pkg.id}
                                style={[
                                    styles.packageCard,
                                    selectedPackage === pkg.id && styles.packageCardSelected,
                                ]}
                                onPress={() => {
                                    setSelectedPackage(pkg.id);
                                    haptics.light();
                                }}
                            >
                                <View style={[styles.packageIcon, { backgroundColor: `${colors.accent}20` }]}>
                                    <Ionicons name="videocam" size={24} color={colors.accent} />
                                </View>
                                <View style={styles.packageInfo}>
                                    <Text style={styles.packageName}>{pkg.name}</Text>
                                    <Text style={styles.packageDesc}>
                                        {pkg.durationMinutes} phút • {pkg.description}
                                    </Text>
                                </View>
                                <Text style={[styles.packagePrice, { color: colors.accent }]}>
                                    {pkg.price.toLocaleString()}đ
                                </Text>
                                {selectedPackage === pkg.id && (
                                    <View style={styles.packageCheck}>
                                        <Ionicons name="checkmark" size={14} color={colors.background} />
                                    </View>
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>
                )}

                {/* Step 3: Payment */}
                {step === "payment" && (
                    <View style={styles.stepContent}>
                        <View style={styles.summaryCard}>
                            <Text style={styles.summaryTitle}>Xác nhận đặt sân</Text>

                            <View style={styles.summaryRow}>
                                <Text style={styles.summaryLabel}>Sân</Text>
                                <Text style={styles.summaryValue}>{court.name}</Text>
                            </View>

                            <View style={styles.summaryRow}>
                                <Text style={styles.summaryLabel}>Thời gian</Text>
                                <View style={styles.summaryRight}>
                                    <Text style={[styles.summaryValue, { color: colors.accent }]}>
                                        {selectedTime}
                                    </Text>
                                    <Text style={styles.summarySubtext}>
                                        {selectedDate.toLocaleDateString("vi-VN", {
                                            weekday: "long",
                                            day: "numeric",
                                            month: "long",
                                        })}
                                    </Text>
                                </View>
                            </View>

                            <View style={styles.divider} />

                            <View style={styles.summaryRow}>
                                <Text style={styles.summaryLabel}>Giá sân ({durationHours}h)</Text>
                                <Text style={styles.summaryValue}>
                                    {courtPrice.toLocaleString()}đ
                                </Text>
                            </View>

                            <View style={styles.summaryRow}>
                                <Text style={styles.summaryLabel}>Gói quay</Text>
                                <Text style={styles.summaryValue}>
                                    {selectedPkg
                                        ? `${selectedPkg.name} (+${packagePrice.toLocaleString()}đ)`
                                        : "Không chọn"}
                                </Text>
                            </View>

                            <View style={styles.divider} />

                            <View style={styles.summaryRow}>
                                <Text style={styles.summaryLabel}>Tổng cộng</Text>
                                <Text style={styles.totalPrice}>{totalPrice.toLocaleString()}đ</Text>
                            </View>
                        </View>

                        {/* Wallet Info */}
                        <View
                            style={[
                                styles.walletCard,
                                !canAfford && styles.walletCardError,
                            ]}
                        >
                            <Ionicons
                                name="wallet"
                                size={24}
                                color={canAfford ? colors.accent : colors.error}
                            />
                            <View style={styles.walletInfo}>
                                <Text style={styles.walletTitle}>Ví My2Light</Text>
                                <Text
                                    style={[
                                        styles.walletBalance,
                                        !canAfford && { color: colors.error },
                                    ]}
                                >
                                    Số dư: {userCredits.toLocaleString()}đ
                                </Text>
                                <Text style={styles.walletNote}>
                                    {canAfford
                                        ? "Số dư sẽ được trừ trực tiếp"
                                        : "Số dư không đủ. Vui lòng nạp thêm."}
                                </Text>
                            </View>
                        </View>
                    </View>
                )}
            </ScrollView>

            {/* Bottom CTA */}
            <View style={[styles.bottomBar, { paddingBottom: insets.bottom + spacing.md }]}>
                <TouchableOpacity
                    style={[
                        styles.ctaButton,
                        (!canProceed() || (step === "payment" && !canAfford)) &&
                        styles.ctaButtonDisabled,
                    ]}
                    disabled={!canProceed() || isProcessing || (step === "payment" && !canAfford)}
                    onPress={step === "payment" ? handlePayment : handleNext}
                >
                    {isProcessing ? (
                        <ActivityIndicator color={colors.background} />
                    ) : (
                        <>
                            <Text style={styles.ctaText}>
                                {step === "datetime"
                                    ? "Tiếp tục chọn gói"
                                    : step === "package"
                                        ? "Tiếp tục thanh toán"
                                        : "Xác nhận thanh toán"}
                            </Text>
                            {step !== "payment" && (
                                <Ionicons name="arrow-forward" size={20} color={colors.background} />
                            )}
                            {step === "payment" && (
                                <Ionicons name="checkmark" size={20} color={colors.background} />
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
    loadingContainer: {
        justifyContent: "center",
        alignItems: "center",
    },
    errorText: {
        color: colors.textMuted,
        fontSize: fontSize.md,
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
        borderRadius: 20,
        backgroundColor: colors.surface,
        justifyContent: "center",
        alignItems: "center",
    },
    headerInfo: {
        flex: 1,
    },
    headerTitle: {
        color: colors.text,
        fontSize: fontSize.lg,
        fontWeight: fontWeight.bold,
    },
    headerSubtitle: {
        color: colors.textMuted,
        fontSize: fontSize.sm,
    },
    progressContainer: {
        height: 3,
        backgroundColor: colors.surface,
        marginHorizontal: spacing.md,
        borderRadius: 2,
    },
    progressFill: {
        height: "100%",
        backgroundColor: colors.accent,
        borderRadius: 2,
    },
    stepIndicators: {
        flexDirection: "row",
        justifyContent: "space-around",
        paddingVertical: spacing.lg,
        paddingHorizontal: spacing.md,
    },
    stepItem: {
        alignItems: "center",
        gap: spacing.xs,
    },
    stepCircle: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: colors.surface,
        justifyContent: "center",
        alignItems: "center",
    },
    stepCircleActive: {
        backgroundColor: colors.accent,
    },
    stepLabel: {
        color: colors.textMuted,
        fontSize: fontSize.xs,
        fontWeight: fontWeight.medium,
    },
    stepLabelActive: {
        color: colors.accent,
    },
    content: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing.xxl,
    },
    stepContent: {},
    sectionTitle: {
        color: colors.text,
        fontSize: fontSize.md,
        fontWeight: fontWeight.bold,
        marginBottom: spacing.md,
    },
    dateScroll: {
        marginHorizontal: -spacing.lg,
        paddingHorizontal: spacing.lg,
    },
    dateCard: {
        width: 64,
        height: 80,
        borderRadius: borderRadius.lg,
        backgroundColor: colors.surface,
        justifyContent: "center",
        alignItems: "center",
        marginRight: spacing.sm,
        borderWidth: 2,
        borderColor: colors.border,
    },
    dateCardSelected: {
        backgroundColor: colors.accent,
        borderColor: colors.accent,
    },
    dateDay: {
        color: colors.textMuted,
        fontSize: fontSize.xs,
        fontWeight: fontWeight.medium,
        textTransform: "uppercase",
    },
    dateDaySelected: {
        color: colors.background,
    },
    dateNum: {
        color: colors.text,
        fontSize: fontSize.xl,
        fontWeight: fontWeight.bold,
        marginTop: 4,
    },
    dateNumSelected: {
        color: colors.background,
    },
    timeGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: spacing.sm,
    },
    timeSlot: {
        width: "23%",
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.md,
        backgroundColor: colors.surface,
        alignItems: "center",
        borderWidth: 2,
        borderColor: colors.border,
    },
    timeSlotSelected: {
        backgroundColor: colors.accent,
        borderColor: colors.accent,
    },
    timeSlotDisabled: {
        opacity: 0.4,
    },
    timeText: {
        color: colors.text,
        fontSize: fontSize.sm,
        fontWeight: fontWeight.semibold,
    },
    timeTextSelected: {
        color: colors.background,
    },
    timeTextDisabled: {
        textDecorationLine: "line-through",
    },
    packageCard: {
        flexDirection: "row",
        alignItems: "center",
        padding: spacing.lg,
        backgroundColor: colors.surface,
        borderRadius: borderRadius.lg,
        marginBottom: spacing.md,
        borderWidth: 2,
        borderColor: colors.border,
        gap: spacing.md,
    },
    packageCardSelected: {
        borderColor: colors.accent,
        backgroundColor: `${colors.accent}10`,
    },
    packageIcon: {
        width: 48,
        height: 48,
        borderRadius: borderRadius.md,
        backgroundColor: colors.surfaceLight,
        justifyContent: "center",
        alignItems: "center",
    },
    packageInfo: {
        flex: 1,
    },
    packageName: {
        color: colors.text,
        fontSize: fontSize.md,
        fontWeight: fontWeight.bold,
    },
    packageDesc: {
        color: colors.textMuted,
        fontSize: fontSize.sm,
        marginTop: 2,
    },
    packagePrice: {
        color: colors.textMuted,
        fontSize: fontSize.lg,
        fontWeight: fontWeight.bold,
    },
    packageCheck: {
        position: "absolute",
        top: spacing.md,
        right: spacing.md,
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: colors.accent,
        justifyContent: "center",
        alignItems: "center",
    },
    summaryCard: {
        backgroundColor: colors.surface,
        borderRadius: borderRadius.xl,
        padding: spacing.xl,
        marginBottom: spacing.lg,
    },
    summaryTitle: {
        color: colors.textMuted,
        fontSize: fontSize.xs,
        fontWeight: fontWeight.bold,
        textTransform: "uppercase",
        letterSpacing: 1,
        textAlign: "center",
        marginBottom: spacing.lg,
    },
    summaryRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: spacing.md,
    },
    summaryLabel: {
        color: colors.textMuted,
        fontSize: fontSize.sm,
    },
    summaryValue: {
        color: colors.text,
        fontSize: fontSize.sm,
        fontWeight: fontWeight.semibold,
        textAlign: "right",
        maxWidth: "60%",
    },
    summaryRight: {
        alignItems: "flex-end",
    },
    summarySubtext: {
        color: colors.textMuted,
        fontSize: fontSize.xs,
        marginTop: 2,
    },
    divider: {
        height: 1,
        backgroundColor: colors.border,
        marginVertical: spacing.md,
    },
    totalPrice: {
        color: colors.text,
        fontSize: fontSize.xxl,
        fontWeight: fontWeight.bold,
    },
    walletCard: {
        flexDirection: "row",
        alignItems: "flex-start",
        padding: spacing.lg,
        backgroundColor: colors.surface,
        borderRadius: borderRadius.lg,
        gap: spacing.md,
    },
    walletCardError: {
        backgroundColor: `${colors.error}15`,
        borderWidth: 1,
        borderColor: `${colors.error}30`,
    },
    walletInfo: {
        flex: 1,
    },
    walletTitle: {
        color: colors.text,
        fontSize: fontSize.sm,
        fontWeight: fontWeight.bold,
    },
    walletBalance: {
        color: colors.accent,
        fontSize: fontSize.sm,
        fontWeight: fontWeight.semibold,
        marginTop: 2,
    },
    walletNote: {
        color: colors.textMuted,
        fontSize: fontSize.xs,
        marginTop: 4,
    },
    bottomBar: {
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.md,
        backgroundColor: colors.background,
        borderTopWidth: 1,
        borderTopColor: colors.border,
    },
    ctaButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: spacing.sm,
        backgroundColor: colors.accent,
        paddingVertical: spacing.lg,
        borderRadius: borderRadius.md,
    },
    ctaButtonDisabled: {
        opacity: 0.5,
    },
    ctaText: {
        color: colors.background,
        fontSize: fontSize.md,
        fontWeight: fontWeight.semibold,
    },
});
