/**
 * Recording Settings Screen
 * @description Configure voice command and highlight duration before recording
 * @module app/record
 */

import { View, Text, StyleSheet, TouchableOpacity, Switch } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Slider from "@react-native-community/slider";
import { colors, spacing, fontSize, fontWeight, borderRadius } from "../../constants/theme";
import { useRecordingStore } from "../../stores/recordingStore";
import { Card } from "../../components/ui";
import haptics from "../../lib/haptics";

/**
 * RecordSettingsScreen - Configure recording settings
 * - Voice command toggle
 * - Highlight duration slider (0-60s)
 * - Start recording button
 */
export default function RecordSettingsScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();

    const { settings, setVoiceCommandEnabled, setHighlightDuration, resetSession } =
        useRecordingStore();

    const handleStartRecording = () => {
        haptics.medium();
        resetSession(); // Clear any previous session
        router.push("/record/camera");
    };

    const handleClose = () => {
        haptics.light();
        router.back();
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
                <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
                    <Ionicons name="close" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={styles.title}>Tự Quay</Text>
                <View style={styles.placeholder} />
            </View>

            {/* Content */}
            <View style={styles.content}>
                {/* Voice Command Card */}
                <Card style={styles.settingCard}>
                    <View style={styles.settingRow}>
                        <View style={styles.settingIcon}>
                            <Ionicons name="mic" size={24} color={colors.accent} />
                        </View>
                        <View style={styles.settingInfo}>
                            <Text style={styles.settingTitle}>Ra lệnh giọng nói</Text>
                            <Text style={styles.settingDescription}>
                                Nói "Highlight" để đánh dấu
                            </Text>
                        </View>
                        <Switch
                            value={settings.voiceCommandEnabled}
                            onValueChange={(value) => {
                                haptics.light();
                                setVoiceCommandEnabled(value);
                            }}
                            trackColor={{ false: colors.surfaceLight, true: colors.accent }}
                            thumbColor="#fff"
                        />
                    </View>
                </Card>

                {/* Duration Slider Card */}
                <Card style={styles.settingCard}>
                    <View style={styles.durationHeader}>
                        <View style={styles.settingIcon}>
                            <Ionicons name="options" size={24} color={colors.primary} />
                        </View>
                        <View style={styles.settingInfo}>
                            <Text style={styles.settingTitle}>Độ dài Highlight</Text>
                            <Text style={styles.settingDescription}>
                                Thời gian xem lại trước khi đánh dấu
                            </Text>
                        </View>
                    </View>

                    <View style={styles.sliderContainer}>
                        <Text style={styles.sliderLabel}>0s</Text>
                        <View style={styles.sliderValueContainer}>
                            <Text style={styles.sliderValue}>{settings.highlightDuration}s</Text>
                        </View>
                        <Text style={styles.sliderLabel}>60s</Text>
                    </View>

                    <Slider
                        style={styles.slider}
                        minimumValue={0}
                        maximumValue={60}
                        step={5}
                        value={settings.highlightDuration}
                        onValueChange={setHighlightDuration}
                        minimumTrackTintColor={colors.accent}
                        maximumTrackTintColor={colors.surfaceLight}
                        thumbTintColor={colors.accent}
                    />

                    <Text style={styles.sliderHint}>
                        Khi xem lại, video sẽ lùi lại {settings.highlightDuration} giây từ lúc bạn
                        bấm nút.
                    </Text>
                </Card>
            </View>

            {/* Start Button */}
            <View style={[styles.bottomContainer, { paddingBottom: insets.bottom + spacing.lg }]}>
                <TouchableOpacity style={styles.startButton} onPress={handleStartRecording}>
                    <Ionicons name="videocam" size={24} color={colors.background} />
                    <Text style={styles.startButtonText}>Bắt đầu quay</Text>
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
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    closeButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.surface,
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
    content: {
        flex: 1,
        padding: spacing.lg,
        gap: spacing.md,
    },
    settingCard: {
        padding: spacing.lg,
    },
    settingRow: {
        flexDirection: "row",
        alignItems: "center",
    },
    settingIcon: {
        width: 48,
        height: 48,
        borderRadius: borderRadius.md,
        backgroundColor: colors.surfaceLight,
        justifyContent: "center",
        alignItems: "center",
        marginRight: spacing.md,
    },
    settingInfo: {
        flex: 1,
    },
    settingTitle: {
        fontSize: fontSize.md,
        fontWeight: fontWeight.semibold,
        color: colors.text,
        marginBottom: 2,
    },
    settingDescription: {
        fontSize: fontSize.sm,
        color: colors.textMuted,
    },
    durationHeader: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: spacing.lg,
    },
    sliderContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: spacing.sm,
    },
    sliderLabel: {
        fontSize: fontSize.sm,
        color: colors.textMuted,
        width: 30,
    },
    sliderValueContainer: {
        flex: 1,
        alignItems: "center",
    },
    sliderValue: {
        fontSize: 32,
        fontWeight: fontWeight.bold,
        color: colors.text,
    },
    slider: {
        width: "100%",
        height: 40,
    },
    sliderHint: {
        fontSize: fontSize.xs,
        color: colors.textMuted,
        textAlign: "center",
        marginTop: spacing.sm,
    },
    bottomContainer: {
        padding: spacing.lg,
    },
    startButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: spacing.sm,
        backgroundColor: colors.accent,
        paddingVertical: spacing.lg,
        borderRadius: borderRadius.md,
    },
    startButtonText: {
        fontSize: fontSize.md,
        fontWeight: fontWeight.semibold,
        color: colors.background,
    },
});
