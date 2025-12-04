import { useState, useRef, useEffect } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Dimensions,
    StatusBar,
} from "react-native";
import { Video, ResizeMode, AVPlaybackStatus } from "expo-av";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, fontSize, fontWeight, borderRadius } from "../../constants/theme";

const { width, height } = Dimensions.get("window");

export default function VideoPlayerScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const params = useLocalSearchParams<{
        uri?: string;
        title?: string;
        userName?: string;
    }>();

    const videoRef = useRef<Video>(null);
    const [status, setStatus] = useState<AVPlaybackStatus>();
    const [showControls, setShowControls] = useState(true);

    const isPlaying = status?.isLoaded && status.isPlaying;
    const position = status?.isLoaded ? status.positionMillis : 0;
    const duration = status?.isLoaded ? status.durationMillis || 0 : 0;

    useEffect(() => {
        StatusBar.setHidden(true);
        return () => StatusBar.setHidden(false);
    }, []);

    const togglePlayPause = async () => {
        if (!videoRef.current) return;

        if (isPlaying) {
            await videoRef.current.pauseAsync();
        } else {
            await videoRef.current.playAsync();
        }
    };

    const formatTime = (ms: number) => {
        const totalSeconds = Math.floor(ms / 1000);
        const mins = Math.floor(totalSeconds / 60);
        const secs = totalSeconds % 60;
        return `${mins}:${secs.toString().padStart(2, "0")}`;
    };

    const progress = duration > 0 ? (position / duration) * 100 : 0;

    return (
        <View style={styles.container}>
            <TouchableOpacity
                style={styles.videoWrapper}
                activeOpacity={1}
                onPress={() => setShowControls(!showControls)}
            >
                {params.uri ? (
                    <Video
                        ref={videoRef}
                        source={{ uri: params.uri }}
                        style={styles.video}
                        resizeMode={ResizeMode.CONTAIN}
                        shouldPlay
                        isLooping
                        onPlaybackStatusUpdate={setStatus}
                    />
                ) : (
                    <View style={styles.placeholder}>
                        <Ionicons name="videocam-off" size={64} color={colors.textMuted} />
                        <Text style={styles.placeholderText}>No video available</Text>
                    </View>
                )}

                {/* Overlay Controls */}
                {showControls && (
                    <>
                        {/* Top Bar */}
                        <View style={[styles.topBar, { paddingTop: insets.top + spacing.sm }]}>
                            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                                <Ionicons name="chevron-down" size={28} color="#fff" />
                            </TouchableOpacity>
                            <View style={styles.titleContainer}>
                                <Text style={styles.title} numberOfLines={1}>
                                    {params.title || "Video"}
                                </Text>
                                <Text style={styles.userName}>{params.userName || ""}</Text>
                            </View>
                            <TouchableOpacity style={styles.moreButton}>
                                <Ionicons name="ellipsis-horizontal" size={24} color="#fff" />
                            </TouchableOpacity>
                        </View>

                        {/* Center Play Button */}
                        <TouchableOpacity style={styles.playButton} onPress={togglePlayPause}>
                            <Ionicons
                                name={isPlaying ? "pause" : "play"}
                                size={48}
                                color="#fff"
                            />
                        </TouchableOpacity>

                        {/* Bottom Bar */}
                        <View style={[styles.bottomBar, { paddingBottom: insets.bottom + spacing.md }]}>
                            {/* Progress Bar */}
                            <View style={styles.progressContainer}>
                                <View style={styles.progressBar}>
                                    <View style={[styles.progressFill, { width: `${progress}%` }]} />
                                </View>
                                <View style={styles.timeContainer}>
                                    <Text style={styles.timeText}>{formatTime(position)}</Text>
                                    <Text style={styles.timeText}>{formatTime(duration)}</Text>
                                </View>
                            </View>

                            {/* Action Buttons */}
                            <View style={styles.actionButtons}>
                                <TouchableOpacity style={styles.actionBtn}>
                                    <Ionicons name="heart-outline" size={28} color="#fff" />
                                    <Text style={styles.actionText}>0</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.actionBtn}>
                                    <Ionicons name="chatbubble-outline" size={26} color="#fff" />
                                    <Text style={styles.actionText}>0</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.actionBtn}>
                                    <Ionicons name="share-social-outline" size={26} color="#fff" />
                                    <Text style={styles.actionText}>Share</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </>
                )}
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#000",
    },
    videoWrapper: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    video: {
        width: width,
        height: height,
    },
    placeholder: {
        alignItems: "center",
    },
    placeholderText: {
        color: colors.textMuted,
        marginTop: spacing.md,
    },
    topBar: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: spacing.md,
        paddingBottom: spacing.md,
        backgroundColor: "rgba(0,0,0,0.3)",
    },
    backButton: {
        padding: spacing.sm,
    },
    titleContainer: {
        flex: 1,
        marginHorizontal: spacing.md,
    },
    title: {
        color: "#fff",
        fontSize: fontSize.lg,
        fontWeight: fontWeight.semibold,
    },
    userName: {
        color: "rgba(255,255,255,0.7)",
        fontSize: fontSize.sm,
        marginTop: 2,
    },
    moreButton: {
        padding: spacing.sm,
    },
    playButton: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: "rgba(0,0,0,0.5)",
        justifyContent: "center",
        alignItems: "center",
    },
    bottomBar: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.md,
        backgroundColor: "rgba(0,0,0,0.3)",
    },
    progressContainer: {
        marginBottom: spacing.md,
    },
    progressBar: {
        height: 4,
        backgroundColor: "rgba(255,255,255,0.3)",
        borderRadius: 2,
    },
    progressFill: {
        height: "100%",
        backgroundColor: colors.accent,
        borderRadius: 2,
    },
    timeContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: spacing.xs,
    },
    timeText: {
        color: "rgba(255,255,255,0.7)",
        fontSize: fontSize.xs,
    },
    actionButtons: {
        flexDirection: "row",
        justifyContent: "space-around",
    },
    actionBtn: {
        alignItems: "center",
    },
    actionText: {
        color: "#fff",
        fontSize: fontSize.xs,
        marginTop: 4,
    },
});
