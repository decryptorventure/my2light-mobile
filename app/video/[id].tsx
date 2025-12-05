import { useState, useRef, useEffect } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Dimensions,
    StatusBar,
    ScrollView,
    Modal,
    Image,
} from "react-native";
import { Video, ResizeMode, AVPlaybackStatus } from "expo-av";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, fontSize, fontWeight, borderRadius } from "../../constants/theme";

const { width, height } = Dimensions.get("window");

interface HighlightEvent {
    id: string;
    timestamp: number;
    duration?: number;
    name?: string;
}

export default function VideoPlayerScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const params = useLocalSearchParams<{
        uri?: string;
        title?: string;
        userName?: string;
        description?: string;
        userAvatar?: string;
        likes?: string;
        highlightEvents?: string;
    }>();

    const videoRef = useRef<Video>(null);
    const [status, setStatus] = useState<AVPlaybackStatus>();
    const [showControls, setShowControls] = useState(true);
    const [showHighlightList, setShowHighlightList] = useState(false);
    const [liked, setLiked] = useState(false);
    const [likesCount, setLikesCount] = useState(parseInt(params.likes || "0"));

    // Parse highlight events
    const highlightEvents: HighlightEvent[] = params.highlightEvents
        ? JSON.parse(params.highlightEvents)
        : [];
    const hasHighlights = highlightEvents.length > 0;

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

    const handleSeekToHighlight = async (timestamp: number) => {
        // Close panel immediately for better UX
        setShowHighlightList(false);

        if (!videoRef.current) return;
        // Seek to 2 seconds before the highlight for context
        const seekTime = Math.max(0, timestamp - 2) * 1000;
        await videoRef.current.setPositionAsync(seekTime);
        await videoRef.current.playAsync();
    };

    const handleLike = () => {
        setLiked(!liked);
        setLikesCount(prev => liked ? prev - 1 : prev + 1);
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
                        <Text style={styles.placeholderText}>Không có video</Text>
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

                        {/* Center Play Button - positioned absolutely in center */}
                        <View style={styles.centerPlayContainer}>
                            <TouchableOpacity style={styles.playButton} onPress={togglePlayPause}>
                                <Ionicons
                                    name={isPlaying ? "pause" : "play"}
                                    size={48}
                                    color="#fff"
                                />
                            </TouchableOpacity>
                        </View>

                        {/* Right Side Actions */}
                        <View style={[styles.rightActions, { bottom: 200 + insets.bottom }]}>
                            {/* Highlight Button */}
                            {hasHighlights && (
                                <TouchableOpacity
                                    style={[
                                        styles.actionCircle,
                                        showHighlightList && styles.actionCircleActive
                                    ]}
                                    onPress={() => setShowHighlightList(!showHighlightList)}
                                >
                                    <View style={styles.highlightBadge}>
                                        <Text style={styles.highlightBadgeText}>{highlightEvents.length}</Text>
                                    </View>
                                    <Ionicons
                                        name="flash"
                                        size={24}
                                        color={showHighlightList ? "#000" : "#fff"}
                                    />
                                </TouchableOpacity>
                            )}

                            {/* Like */}
                            <TouchableOpacity
                                style={[styles.actionCircle, liked && styles.likedCircle]}
                                onPress={handleLike}
                            >
                                <Ionicons
                                    name={liked ? "heart" : "heart-outline"}
                                    size={26}
                                    color={liked ? "#fff" : "#fff"}
                                />
                                <Text style={styles.actionCount}>{likesCount}</Text>
                            </TouchableOpacity>

                            {/* Comment */}
                            <TouchableOpacity style={styles.actionCircle}>
                                <Ionicons name="chatbubble-outline" size={24} color="#fff" />
                                <Text style={styles.actionCount}>0</Text>
                            </TouchableOpacity>

                            {/* Share */}
                            <TouchableOpacity style={styles.actionCircle}>
                                <Ionicons name="share-social-outline" size={24} color="#fff" />
                                <Text style={styles.actionCount}>Share</Text>
                            </TouchableOpacity>

                            {/* Save */}
                            <TouchableOpacity style={styles.actionCircle}>
                                <Ionicons name="bookmark-outline" size={24} color="#fff" />
                            </TouchableOpacity>
                        </View>

                        {/* Bottom Bar with User Info */}
                        <View style={[styles.bottomBar, { paddingBottom: insets.bottom + spacing.md }]}>
                            {/* User Info & Description */}
                            <View style={styles.userInfoSection}>
                                <View style={styles.userRow}>
                                    <View style={styles.userAvatarContainer}>
                                        {params.userAvatar ? (
                                            <Image
                                                source={{ uri: params.userAvatar }}
                                                style={styles.userAvatarImg}
                                            />
                                        ) : (
                                            <Ionicons name="person" size={16} color="#fff" />
                                        )}
                                    </View>
                                    <Text style={styles.userNameBottom}>{params.userName || "Người chơi"}</Text>
                                </View>
                                <Text style={styles.videoTitle} numberOfLines={1}>
                                    {params.title || "Video"}
                                </Text>
                                {params.description && (
                                    <Text style={styles.videoDescription} numberOfLines={2}>
                                        {params.description}
                                    </Text>
                                )}
                            </View>

                            {/* Progress Bar */}
                            <View style={styles.progressContainer}>
                                <View style={styles.progressBar}>
                                    <View style={[styles.progressFill, { width: `${progress}%` }]} />
                                    {/* Highlight markers on progress bar */}
                                    {highlightEvents.map((event, index) => {
                                        const markerPosition = duration > 0
                                            ? (event.timestamp * 1000 / duration) * 100
                                            : 0;
                                        return (
                                            <View
                                                key={event.id || index}
                                                style={[
                                                    styles.highlightMarker,
                                                    { left: `${markerPosition}%` }
                                                ]}
                                            />
                                        );
                                    })}
                                </View>
                                <View style={styles.timeContainer}>
                                    <Text style={styles.timeText}>{formatTime(position)}</Text>
                                    <Text style={styles.timeText}>{formatTime(duration)}</Text>
                                </View>
                            </View>
                        </View>
                    </>
                )}
            </TouchableOpacity>

            {/* Highlight List Modal */}
            <Modal
                visible={showHighlightList}
                transparent
                animationType="slide"
                onRequestClose={() => setShowHighlightList(false)}
            >
                <View style={styles.modalOverlay}>
                    <TouchableOpacity
                        style={styles.modalBackdrop}
                        activeOpacity={1}
                        onPress={() => setShowHighlightList(false)}
                    />
                    <View style={[styles.highlightPanel, { paddingBottom: insets.bottom + spacing.lg }]}>
                        <View style={styles.panelHeader}>
                            <View style={styles.panelHandle} />
                            <Text style={styles.panelTitle}>
                                ⚡ Highlights ({highlightEvents.length})
                            </Text>
                        </View>
                        <ScrollView style={styles.highlightList}>
                            {highlightEvents.map((event, index) => (
                                <TouchableOpacity
                                    key={event.id || index}
                                    style={styles.highlightItem}
                                    onPress={() => handleSeekToHighlight(event.timestamp)}
                                >
                                    <View style={styles.highlightNumber}>
                                        <Text style={styles.highlightNumberText}>{index + 1}</Text>
                                    </View>
                                    <View style={styles.highlightInfo}>
                                        <Text style={styles.highlightName}>
                                            {event.name || `Pha bóng ${index + 1}`}
                                        </Text>
                                        <Text style={styles.highlightTime}>
                                            {formatTime(event.timestamp * 1000)}
                                        </Text>
                                    </View>
                                    <Ionicons name="play-circle" size={32} color={colors.accent} />
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                </View>
            </Modal>
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

    // Top bar
    topBar: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: spacing.md,
        paddingBottom: spacing.md,
        backgroundColor: "rgba(0,0,0,0.4)",
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

    // Center play button container
    centerPlayContainer: {
        position: "absolute",
        top: "40%",
        left: 0,
        right: 0,
        alignItems: "center",
        justifyContent: "center",
    },
    playButton: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: "rgba(0,0,0,0.5)",
        justifyContent: "center",
        alignItems: "center",
    },

    // Right actions (TikTok style)
    rightActions: {
        position: "absolute",
        right: spacing.md,
        alignItems: "center",
        gap: spacing.lg,
    },
    actionCircle: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: "rgba(255,255,255,0.2)",
        justifyContent: "center",
        alignItems: "center",
    },
    actionCircleActive: {
        backgroundColor: colors.accent,
    },
    likedCircle: {
        backgroundColor: "#ef4444",
    },
    actionCount: {
        color: "#fff",
        fontSize: 10,
        fontWeight: fontWeight.bold,
        marginTop: 2,
    },
    highlightBadge: {
        position: "absolute",
        top: -4,
        right: -4,
        width: 18,
        height: 18,
        borderRadius: 9,
        backgroundColor: "#ef4444",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 1,
    },
    highlightBadgeText: {
        color: "#fff",
        fontSize: 10,
        fontWeight: fontWeight.bold,
    },

    // Bottom bar
    bottomBar: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.md,
        backgroundColor: "rgba(0,0,0,0.4)",
    },
    progressContainer: {
        marginBottom: spacing.sm,
    },
    progressBar: {
        height: 4,
        backgroundColor: "rgba(255,255,255,0.3)",
        borderRadius: 2,
        position: "relative",
    },
    progressFill: {
        height: "100%",
        backgroundColor: colors.accent,
        borderRadius: 2,
    },
    highlightMarker: {
        position: "absolute",
        top: -3,
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: "#f59e0b",
        borderWidth: 2,
        borderColor: "#fff",
        marginLeft: -5,
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

    // User info section in bottom bar
    userInfoSection: {
        marginBottom: spacing.md,
    },
    userRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: spacing.xs,
    },
    userAvatarContainer: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: "rgba(255,255,255,0.2)",
        justifyContent: "center",
        alignItems: "center",
        marginRight: spacing.sm,
        overflow: "hidden",
    },
    userAvatarImg: {
        width: 32,
        height: 32,
        borderRadius: 16,
    },
    userNameBottom: {
        color: "#fff",
        fontSize: fontSize.md,
        fontWeight: fontWeight.bold,
    },
    videoTitle: {
        color: "#fff",
        fontSize: fontSize.sm,
        fontWeight: fontWeight.semibold,
        marginBottom: 2,
    },
    videoDescription: {
        color: "rgba(255,255,255,0.7)",
        fontSize: fontSize.xs,
        lineHeight: 18,
    },

    // Highlight Modal
    modalOverlay: {
        flex: 1,
        justifyContent: "flex-end",
    },
    modalBackdrop: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.5)",
    },
    highlightPanel: {
        backgroundColor: colors.surface,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: height * 0.6,
    },
    panelHeader: {
        alignItems: "center",
        paddingVertical: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    panelHandle: {
        width: 40,
        height: 4,
        borderRadius: 2,
        backgroundColor: colors.border,
        marginBottom: spacing.sm,
    },
    panelTitle: {
        fontSize: fontSize.lg,
        fontWeight: fontWeight.bold,
        color: colors.text,
    },
    highlightList: {
        padding: spacing.md,
    },
    highlightItem: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    highlightNumber: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: colors.accent + "20",
        justifyContent: "center",
        alignItems: "center",
        marginRight: spacing.md,
    },
    highlightNumberText: {
        color: colors.accent,
        fontSize: fontSize.md,
        fontWeight: fontWeight.bold,
    },
    highlightInfo: {
        flex: 1,
    },
    highlightName: {
        fontSize: fontSize.md,
        fontWeight: fontWeight.medium,
        color: colors.text,
    },
    highlightTime: {
        fontSize: fontSize.sm,
        color: colors.textMuted,
        marginTop: 2,
    },
});
