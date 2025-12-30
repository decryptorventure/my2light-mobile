/**
 * Camera Recording Screen
 * @description Main camera view with REC timer, highlight button, and confetti effect
 * @module app/record/camera
 */

import { useState, useRef, useEffect, useCallback } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert, Animated } from "react-native";
import {
    CameraView,
    CameraType,
    useCameraPermissions,
    useMicrophonePermissions,
} from "expo-camera";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, borderRadius, fontSize, fontWeight } from "../../constants/theme";
import { useRecordingStore } from "../../stores/recordingStore";
import haptics from "../../lib/haptics";

/**
 * CameraRecordingScreen - Main recording interface
 * Features:
 * - REC indicator with elapsed time
 * - Highlight button with confetti animation
 * - Highlight counter badge
 * - Camera flip
 */
export default function CameraRecordingScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const cameraRef = useRef<CameraView>(null);

    const [facing, setFacing] = useState<CameraType>("back");
    const [cameraPermission, requestCameraPermission] = useCameraPermissions();
    const [micPermission, requestMicPermission] = useMicrophonePermissions();

    // Confetti animation
    const confettiOpacity = useRef(new Animated.Value(0)).current;
    const [showConfetti, setShowConfetti] = useState(false);

    const {
        settings,
        isRecording,
        elapsedTime,
        highlights,
        startRecording,
        stopRecording,
        addHighlight,
        updateElapsedTime,
    } = useRecordingStore();

    // Recording timer - using ref to avoid closure issues and prevent memory leak
    const elapsedTimeRef = useRef(0);

    useEffect(() => {
        if (isRecording) {
            elapsedTimeRef.current = 0;
            updateElapsedTime(0);

            const interval = setInterval(() => {
                elapsedTimeRef.current += 1;
                updateElapsedTime(elapsedTimeRef.current);
            }, 1000);

            return () => clearInterval(interval);
        }
    }, [isRecording]);

    // Format duration as MM:SS
    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    };

    // Confetti animation
    const playConfetti = useCallback(() => {
        setShowConfetti(true);
        confettiOpacity.setValue(1);
        Animated.timing(confettiOpacity, {
            toValue: 0,
            duration: 1500,
            useNativeDriver: true,
        }).start(() => setShowConfetti(false));
    }, [confettiOpacity]);

    // Handle highlight button press
    const handleHighlight = () => {
        if (!isRecording || elapsedTime < 1) return;

        haptics.success();
        addHighlight();
        playConfetti();
    };

    // Start recording
    const handleStartRecording = async () => {
        if (!cameraRef.current) return;

        try {
            startRecording();
            const video = await cameraRef.current.recordAsync({
                maxDuration: 600, // 10 minutes max
            });

            if (video) {
                stopRecording(video.uri);
                router.push({
                    pathname: "/record/preview",
                    params: { uri: video.uri },
                });
            }
        } catch (error) {
            console.error("Recording error:", error);
            Alert.alert("Lỗi", "Không thể quay video. Vui lòng thử lại.");
            stopRecording("");
        }
    };

    // Stop recording
    const handleStopRecording = () => {
        if (cameraRef.current && isRecording) {
            haptics.medium();
            cameraRef.current.stopRecording();
        }
    };

    // Toggle camera
    const toggleCameraFacing = () => {
        if (isRecording) return;
        haptics.light();
        setFacing((current) => (current === "back" ? "front" : "back"));
    };

    // Permission checks
    if (!cameraPermission || !micPermission) {
        return (
            <View style={styles.container}>
                <Text style={styles.permissionText}>Đang tải...</Text>
            </View>
        );
    }

    if (!cameraPermission.granted || !micPermission.granted) {
        return (
            <View style={[styles.container, styles.permissionContainer]}>
                <Ionicons name="videocam-off" size={64} color={colors.textMuted} />
                <Text style={styles.permissionTitle}>Cần quyền truy cập</Text>
                <Text style={styles.permissionText}>
                    Để quay video, ứng dụng cần quyền truy cập Camera và Microphone
                </Text>
                <TouchableOpacity
                    style={styles.permissionButton}
                    onPress={async () => {
                        await requestCameraPermission();
                        await requestMicPermission();
                    }}
                >
                    <Text style={styles.permissionButtonText}>Cấp quyền</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <Text style={styles.backButtonText}>Quay lại</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <CameraView ref={cameraRef} style={styles.camera} facing={facing} mode="video">
                {/* Top Controls */}
                <View style={[styles.topControls, { paddingTop: insets.top + spacing.md }]}>
                    {/* REC Indicator */}
                    {isRecording ? (
                        <View style={styles.recordingIndicator}>
                            <View style={styles.recordingDot} />
                            <Text style={styles.recordingLabel}>REC</Text>
                            <Text style={styles.recordingTime}>{formatDuration(elapsedTime)}</Text>
                        </View>
                    ) : (
                        <TouchableOpacity style={styles.iconButton} onPress={() => router.back()}>
                            <Ionicons name="close" size={28} color="#fff" />
                        </TouchableOpacity>
                    )}

                    {/* Camera Flip */}
                    <TouchableOpacity
                        style={styles.iconButton}
                        onPress={toggleCameraFacing}
                        disabled={isRecording}
                    >
                        <Ionicons name="camera-reverse" size={28} color="#fff" />
                    </TouchableOpacity>
                </View>

                {/* Confetti Overlay */}
                {showConfetti && (
                    <Animated.View style={[styles.confettiOverlay, { opacity: confettiOpacity }]}>
                        {/* Simple confetti particles */}
                        {[...Array(20)].map((_, i) => (
                            <Animated.View
                                key={i}
                                style={[
                                    styles.confettiParticle,
                                    {
                                        left: `${Math.random() * 100}%`,
                                        top: `${Math.random() * 100}%`,
                                        backgroundColor: [
                                            "#a3e635",
                                            "#f97316",
                                            "#3b82f6",
                                            "#ef4444",
                                        ][i % 4],
                                        transform: [
                                            { rotate: `${Math.random() * 360}deg` },
                                            { scale: 0.5 + Math.random() * 0.5 },
                                        ],
                                    },
                                ]}
                            />
                        ))}
                    </Animated.View>
                )}

                {/* Bottom Controls */}
                <View
                    style={[styles.bottomControls, { paddingBottom: insets.bottom + spacing.xl }]}
                >
                    {/* Highlight Counter */}
                    {isRecording && highlights.length > 0 && (
                        <View style={styles.highlightBadge}>
                            <Ionicons name="flash" size={16} color={colors.accent} />
                            <Text style={styles.highlightBadgeText}>
                                {highlights.length} Highlights
                            </Text>
                        </View>
                    )}

                    <View style={styles.controlsRow}>
                        {/* Highlight Button */}
                        {isRecording && (
                            <TouchableOpacity
                                style={styles.highlightButton}
                                onPress={handleHighlight}
                                disabled={elapsedTime < 1}
                            >
                                <Ionicons name="flash" size={28} color="#000" />
                            </TouchableOpacity>
                        )}

                        {/* Record/Stop Button */}
                        <TouchableOpacity
                            style={[styles.recordButton, isRecording && styles.recordButtonActive]}
                            onPress={isRecording ? handleStopRecording : handleStartRecording}
                        >
                            <View
                                style={[
                                    styles.recordButtonInner,
                                    isRecording && styles.recordButtonInnerActive,
                                ]}
                            />
                        </TouchableOpacity>

                        {/* Spacer for alignment */}
                        {isRecording && <View style={styles.spacer} />}
                    </View>
                </View>
            </CameraView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#000",
    },
    camera: {
        flex: 1,
    },

    // Permissions
    permissionContainer: {
        justifyContent: "center",
        alignItems: "center",
        padding: spacing.xl,
    },
    permissionTitle: {
        color: colors.text,
        fontSize: 24,
        fontWeight: "bold",
        marginTop: spacing.lg,
        marginBottom: spacing.sm,
    },
    permissionText: {
        color: colors.textMuted,
        fontSize: 16,
        textAlign: "center",
        marginBottom: spacing.lg,
    },
    permissionButton: {
        backgroundColor: colors.primary,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.xl,
        borderRadius: borderRadius.md,
    },
    permissionButtonText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "600",
    },
    backButton: {
        marginTop: spacing.md,
        padding: spacing.md,
    },
    backButtonText: {
        color: colors.primary,
        fontSize: 14,
    },

    // Top Controls
    topControls: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: spacing.lg,
    },
    iconButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: "rgba(0,0,0,0.4)",
        justifyContent: "center",
        alignItems: "center",
    },
    recordingIndicator: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "rgba(0,0,0,0.6)",
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.md,
        borderRadius: borderRadius.full,
    },
    recordingDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: "#ef4444",
        marginRight: spacing.xs,
    },
    recordingLabel: {
        color: "#ef4444",
        fontSize: fontSize.sm,
        fontWeight: fontWeight.bold,
        marginRight: spacing.sm,
    },
    recordingTime: {
        color: "#fff",
        fontSize: fontSize.sm,
        fontWeight: fontWeight.semibold,
        fontVariant: ["tabular-nums"],
    },

    // Confetti
    confettiOverlay: {
        ...StyleSheet.absoluteFillObject,
        pointerEvents: "none",
    },
    confettiParticle: {
        position: "absolute",
        width: 10,
        height: 10,
        borderRadius: 2,
    },

    // Bottom Controls
    bottomControls: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        alignItems: "center",
        paddingVertical: spacing.xl,
    },
    highlightBadge: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "rgba(0,0,0,0.6)",
        paddingVertical: spacing.xs,
        paddingHorizontal: spacing.md,
        borderRadius: borderRadius.full,
        gap: spacing.xs,
        marginBottom: spacing.md,
    },
    highlightBadgeText: {
        color: "#fff",
        fontSize: fontSize.sm,
        fontWeight: fontWeight.medium,
    },
    controlsRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.lg,
    },
    highlightButton: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: colors.accent,
        justifyContent: "center",
        alignItems: "center",
    },
    recordButton: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: "rgba(255,255,255,0.3)",
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 4,
        borderColor: "#fff",
    },
    recordButtonActive: {
        backgroundColor: "rgba(255,0,0,0.3)",
    },
    recordButtonInner: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: "#ef4444",
    },
    recordButtonInnerActive: {
        width: 28,
        height: 28,
        borderRadius: 6,
    },
    spacer: {
        width: 56,
    },
});
