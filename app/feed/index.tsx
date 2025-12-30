import { useState, useRef, useCallback, useEffect } from "react";
import {
    View,
    Text,
    StyleSheet,
    Dimensions,
    StatusBar,
    TouchableOpacity,
    FlatList,
    ViewToken,
    Image,
} from "react-native";
import { Video, ResizeMode, AVPlaybackStatus } from "expo-av";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, fontSize, fontWeight } from "@/shared/constants/theme";
import { useHighlights, useUserHighlights } from "../../hooks/useApi";
import type { Highlight } from "../../types";

const { width, height } = Dimensions.get("window");

interface VideoItemProps {
    item: Highlight;
    isActive: boolean;
    onTogglePlay: () => void;
}

function VideoItem({ item, isActive, onTogglePlay }: VideoItemProps) {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const videoRef = useRef<Video>(null);
    const [status, setStatus] = useState<AVPlaybackStatus>();
    const [liked, setLiked] = useState(item.isLiked || false);
    const [likesCount, setLikesCount] = useState(item.likes || 0);
    const [showHighlights, setShowHighlights] = useState(false);

    const isPlaying = status?.isLoaded && status.isPlaying;
    const position = status?.isLoaded ? status.positionMillis : 0;
    const duration = status?.isLoaded ? status.durationMillis || 0 : 0;
    const progress = duration > 0 ? (position / duration) * 100 : 0;

    // Parse highlight events
    const highlightEvents = item.highlightEvents || [];
    const hasHighlights = highlightEvents.length > 0;

    useEffect(() => {
        if (isActive) {
            videoRef.current?.playAsync();
        } else {
            videoRef.current?.pauseAsync();
        }
    }, [isActive]);

    const handleLike = () => {
        setLiked(!liked);
        setLikesCount((prev) => (liked ? prev - 1 : prev + 1));
    };

    const handleSeekToHighlight = async (timestamp: number) => {
        setShowHighlights(false);
        if (!videoRef.current) return;
        const seekTime = Math.max(0, timestamp - 2) * 1000;
        await videoRef.current.setPositionAsync(seekTime);
        await videoRef.current.playAsync();
    };

    const formatTime = (ms: number) => {
        const totalSeconds = Math.floor(ms / 1000);
        const mins = Math.floor(totalSeconds / 60);
        const secs = totalSeconds % 60;
        return `${mins}:${secs.toString().padStart(2, "0")}`;
    };

    return (
        <View style={styles.videoContainer}>
            <TouchableOpacity style={styles.videoWrapper} activeOpacity={1} onPress={onTogglePlay}>
                <Video
                    ref={videoRef}
                    source={{ uri: item.videoUrl }}
                    style={styles.video}
                    resizeMode={ResizeMode.COVER}
                    shouldPlay={isActive}
                    isLooping
                    onPlaybackStatusUpdate={setStatus}
                />

                {/* Play/Pause indicator */}
                {!isPlaying && isActive && (
                    <View style={styles.playIndicator}>
                        <Ionicons name="play" size={48} color="rgba(255,255,255,0.9)" />
                    </View>
                )}

                {/* Top gradient */}
                <View style={[styles.topGradient, { paddingTop: insets.top }]}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="close" size={28} color="#fff" />
                    </TouchableOpacity>
                </View>

                {/* Right side actions */}
                <View style={[styles.rightActions, { bottom: 100 + insets.bottom }]}>
                    {/* User Avatar */}
                    <TouchableOpacity style={styles.avatarContainer}>
                        {item.userAvatar ? (
                            <Image source={{ uri: item.userAvatar }} style={styles.userAvatar} />
                        ) : (
                            <View style={styles.userAvatarPlaceholder}>
                                <Ionicons name="person" size={20} color="#fff" />
                            </View>
                        )}
                        <View style={styles.followBadge}>
                            <Ionicons name="add" size={12} color="#fff" />
                        </View>
                    </TouchableOpacity>

                    {/* Highlights */}
                    {hasHighlights && (
                        <TouchableOpacity
                            style={styles.actionButton}
                            onPress={() => setShowHighlights(!showHighlights)}
                        >
                            <View style={styles.highlightBadge}>
                                <Text style={styles.highlightBadgeText}>
                                    {highlightEvents.length}
                                </Text>
                            </View>
                            <Ionicons name="flash" size={28} color="#fff" />
                        </TouchableOpacity>
                    )}

                    {/* Like */}
                    <TouchableOpacity style={styles.actionButton} onPress={handleLike}>
                        <Ionicons
                            name={liked ? "heart" : "heart-outline"}
                            size={32}
                            color={liked ? "#ff2d55" : "#fff"}
                        />
                        <Text style={styles.actionText}>{likesCount}</Text>
                    </TouchableOpacity>

                    {/* Comment */}
                    <TouchableOpacity style={styles.actionButton}>
                        <Ionicons name="chatbubble-ellipses" size={28} color="#fff" />
                        <Text style={styles.actionText}>{item.comments || 0}</Text>
                    </TouchableOpacity>

                    {/* Share */}
                    <TouchableOpacity style={styles.actionButton}>
                        <Ionicons name="share-social" size={28} color="#fff" />
                        <Text style={styles.actionText}>Share</Text>
                    </TouchableOpacity>
                </View>

                {/* Bottom info */}
                <View style={[styles.bottomInfo, { paddingBottom: insets.bottom + spacing.lg }]}>
                    <Text style={styles.userName}>@{item.userName || "Người chơi"}</Text>
                    <Text style={styles.title} numberOfLines={1}>
                        {item.title || item.courtName || "Highlight"}
                    </Text>
                    {item.description && (
                        <Text style={styles.description} numberOfLines={2}>
                            {item.description}
                        </Text>
                    )}

                    {/* Progress bar */}
                    <View style={styles.progressBar}>
                        <View style={[styles.progressFill, { width: `${progress}%` }]} />
                        {/* Highlight markers */}
                        {highlightEvents.map((event, index) => {
                            const markerPosition =
                                duration > 0 ? ((event.timestamp * 1000) / duration) * 100 : 0;
                            return (
                                <View
                                    key={event.id || index}
                                    style={[styles.highlightMarker, { left: `${markerPosition}%` }]}
                                />
                            );
                        })}
                    </View>
                    <View style={styles.timeRow}>
                        <Text style={styles.timeText}>{formatTime(position)}</Text>
                        <Text style={styles.timeText}>{formatTime(duration)}</Text>
                    </View>
                </View>

                {/* Highlight list overlay */}
                {showHighlights && (
                    <View style={[styles.highlightOverlay, { bottom: 200 + insets.bottom }]}>
                        <View style={styles.highlightList}>
                            <Text style={styles.highlightTitle}>
                                ⚡ Highlights ({highlightEvents.length})
                            </Text>
                            {highlightEvents.map((event, index) => (
                                <TouchableOpacity
                                    key={event.id || index}
                                    style={styles.highlightItem}
                                    onPress={() => handleSeekToHighlight(event.timestamp)}
                                >
                                    <View style={styles.highlightNumber}>
                                        <Text style={styles.highlightNumberText}>{index + 1}</Text>
                                    </View>
                                    <Text style={styles.highlightTimestamp}>
                                        {Math.floor(event.timestamp / 60)}:
                                        {(event.timestamp % 60).toString().padStart(2, "0")}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                )}
            </TouchableOpacity>
        </View>
    );
}

export default function VideoFeedScreen() {
    const params = useLocalSearchParams<{
        startIndex?: string;
        userId?: string; // Optional: filter videos by user
    }>();

    // Use user-specific highlights if userId is provided, otherwise use all highlights
    const { data: allHighlights } = useHighlights(50);
    const { data: userHighlights } = useUserHighlights(params.userId || "");

    // Choose which highlights to show based on userId param
    const highlights = params.userId ? userHighlights : allHighlights;

    const [activeIndex, setActiveIndex] = useState(parseInt(params.startIndex || "0"));
    const flatListRef = useRef<FlatList>(null);

    useEffect(() => {
        StatusBar.setHidden(true);
        return () => StatusBar.setHidden(false);
    }, []);

    const onViewableItemsChanged = useCallback(
        ({ viewableItems }: { viewableItems: ViewToken[] }) => {
            if (viewableItems.length > 0) {
                const newIndex = viewableItems[0].index ?? 0;
                setActiveIndex(newIndex);
            }
        },
        []
    );

    const viewabilityConfig = {
        itemVisiblePercentThreshold: 50,
    };

    const handleTogglePlay = useCallback(() => {
        // Toggle is handled within VideoItem
    }, []);

    const getItemLayout = useCallback(
        (_: any, index: number) => ({
            length: height,
            offset: height * index,
            index,
        }),
        []
    );

    if (!highlights || highlights.length === 0) {
        return (
            <View style={styles.emptyContainer}>
                <Ionicons name="videocam-off-outline" size={64} color={colors.textMuted} />
                <Text style={styles.emptyText}>Chưa có video nào</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <FlatList
                ref={flatListRef}
                data={highlights}
                keyExtractor={(item) => item.id}
                renderItem={({ item, index }) => (
                    <VideoItem
                        item={item}
                        isActive={index === activeIndex}
                        onTogglePlay={handleTogglePlay}
                    />
                )}
                pagingEnabled
                showsVerticalScrollIndicator={false}
                snapToInterval={height}
                snapToAlignment="start"
                decelerationRate="fast"
                onViewableItemsChanged={onViewableItemsChanged}
                viewabilityConfig={viewabilityConfig}
                getItemLayout={getItemLayout}
                initialScrollIndex={parseInt(params.startIndex || "0")}
                removeClippedSubviews
                maxToRenderPerBatch={2}
                windowSize={3}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#000",
    },
    emptyContainer: {
        flex: 1,
        backgroundColor: "#000",
        justifyContent: "center",
        alignItems: "center",
    },
    emptyText: {
        color: colors.textMuted,
        fontSize: fontSize.lg,
        marginTop: spacing.md,
    },
    videoContainer: {
        width,
        height,
    },
    videoWrapper: {
        flex: 1,
    },
    video: {
        width: "100%",
        height: "100%",
    },
    playIndicator: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: "center",
        alignItems: "center",
    },
    topGradient: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing.lg,
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: "center",
        alignItems: "center",
    },
    rightActions: {
        position: "absolute",
        right: spacing.md,
        alignItems: "center",
        gap: spacing.lg,
    },
    avatarContainer: {
        position: "relative",
        marginBottom: spacing.md,
    },
    userAvatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        borderWidth: 2,
        borderColor: "#fff",
    },
    userAvatarPlaceholder: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: colors.surface,
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 2,
        borderColor: "#fff",
    },
    followBadge: {
        position: "absolute",
        bottom: -6,
        left: "50%",
        marginLeft: -10,
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: colors.accent,
        justifyContent: "center",
        alignItems: "center",
    },
    actionButton: {
        alignItems: "center",
    },
    highlightBadge: {
        position: "absolute",
        top: -4,
        right: -4,
        minWidth: 18,
        height: 18,
        borderRadius: 9,
        backgroundColor: "#ff2d55",
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 4,
        zIndex: 1,
    },
    highlightBadgeText: {
        color: "#fff",
        fontSize: 10,
        fontWeight: fontWeight.bold,
    },
    actionText: {
        color: "#fff",
        fontSize: 12,
        marginTop: 2,
    },
    bottomInfo: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 80,
        paddingHorizontal: spacing.lg,
    },
    userName: {
        color: "#fff",
        fontSize: fontSize.md,
        fontWeight: fontWeight.bold,
    },
    title: {
        color: "#fff",
        fontSize: fontSize.sm,
        marginTop: 4,
    },
    description: {
        color: "rgba(255,255,255,0.8)",
        fontSize: fontSize.sm,
        marginTop: 4,
    },
    progressBar: {
        height: 3,
        backgroundColor: "rgba(255,255,255,0.3)",
        borderRadius: 1.5,
        marginTop: spacing.md,
        position: "relative",
    },
    progressFill: {
        height: "100%",
        backgroundColor: "#fff",
        borderRadius: 1.5,
    },
    highlightMarker: {
        position: "absolute",
        top: -3,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: "#f59e0b",
        marginLeft: -4,
    },
    timeRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: 4,
    },
    timeText: {
        color: "rgba(255,255,255,0.7)",
        fontSize: 11,
    },
    highlightOverlay: {
        position: "absolute",
        left: spacing.lg,
        right: 80,
    },
    highlightList: {
        backgroundColor: "rgba(0,0,0,0.8)",
        borderRadius: 12,
        padding: spacing.md,
    },
    highlightTitle: {
        color: "#fff",
        fontSize: fontSize.md,
        fontWeight: fontWeight.bold,
        marginBottom: spacing.sm,
    },
    highlightItem: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: spacing.sm,
        gap: spacing.sm,
    },
    highlightNumber: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: colors.accent,
        justifyContent: "center",
        alignItems: "center",
    },
    highlightNumberText: {
        color: "#fff",
        fontSize: 12,
        fontWeight: fontWeight.bold,
    },
    highlightTimestamp: {
        color: "#fff",
        fontSize: fontSize.sm,
    },
});
