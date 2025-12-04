import { useState, useRef, useEffect } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Alert,
    Platform,
} from "react-native";
import { CameraView, CameraType, useCameraPermissions, useMicrophonePermissions } from "expo-camera";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, borderRadius } from "../../constants/theme";

export default function RecordScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const cameraRef = useRef<CameraView>(null);

    const [facing, setFacing] = useState<CameraType>("back");
    const [isRecording, setIsRecording] = useState(false);
    const [recordingDuration, setRecordingDuration] = useState(0);

    const [cameraPermission, requestCameraPermission] = useCameraPermissions();
    const [micPermission, requestMicPermission] = useMicrophonePermissions();

    // Recording timer
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isRecording) {
            interval = setInterval(() => {
                setRecordingDuration((prev) => prev + 1);
            }, 1000);
        } else {
            setRecordingDuration(0);
        }
        return () => clearInterval(interval);
    }, [isRecording]);

    // Format duration as MM:SS
    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    };

    // Check permissions
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
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => router.back()}
                >
                    <Text style={styles.backButtonText}>Quay lại</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const toggleCameraFacing = () => {
        setFacing((current) => (current === "back" ? "front" : "back"));
    };

    const startRecording = async () => {
        if (!cameraRef.current) return;

        try {
            setIsRecording(true);
            const video = await cameraRef.current.recordAsync({
                maxDuration: 600, // 10 minutes max
            });

            if (video) {
                console.log("Video recorded:", video.uri);
                // Navigate to preview screen with video URI
                router.push({
                    pathname: "/record/preview",
                    params: { uri: video.uri }
                });
            }
        } catch (error) {
            console.error("Recording error:", error);
            Alert.alert("Lỗi", "Không thể quay video. Vui lòng thử lại.");
        } finally {
            setIsRecording(false);
        }
    };

    const stopRecording = () => {
        if (cameraRef.current && isRecording) {
            cameraRef.current.stopRecording();
        }
    };

    return (
        <View style={styles.container}>
            <CameraView
                ref={cameraRef}
                style={styles.camera}
                facing={facing}
                mode="video"
            >
                {/* Top Controls */}
                <View style={[styles.topControls, { paddingTop: insets.top + spacing.md }]}>
                    <TouchableOpacity
                        style={styles.iconButton}
                        onPress={() => router.back()}
                    >
                        <Ionicons name="close" size={28} color="#fff" />
                    </TouchableOpacity>

                    {isRecording && (
                        <View style={styles.recordingIndicator}>
                            <View style={styles.recordingDot} />
                            <Text style={styles.recordingTime}>{formatDuration(recordingDuration)}</Text>
                        </View>
                    )}

                    <TouchableOpacity
                        style={styles.iconButton}
                        onPress={toggleCameraFacing}
                        disabled={isRecording}
                    >
                        <Ionicons name="camera-reverse" size={28} color="#fff" />
                    </TouchableOpacity>
                </View>

                {/* Bottom Controls */}
                <View style={[styles.bottomControls, { paddingBottom: insets.bottom + spacing.xl }]}>
                    {/* Record Button */}
                    <TouchableOpacity
                        style={[styles.recordButton, isRecording && styles.recordButtonActive]}
                        onPress={isRecording ? stopRecording : startRecording}
                    >
                        <View style={[styles.recordButtonInner, isRecording && styles.recordButtonInnerActive]} />
                    </TouchableOpacity>
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
        marginRight: spacing.sm,
    },
    recordingTime: {
        color: "#fff",
        fontSize: 14,
        fontWeight: "600",
        fontVariant: ["tabular-nums"],
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
});
