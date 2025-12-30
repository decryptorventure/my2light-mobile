/**
 * Match Detail Screen
 * View match request details and respond
 */

import React, { useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Image,
    Alert,
    ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { colors, spacing, fontSize, fontWeight, borderRadius } from "@/shared/constants/theme";
import { MatchService } from "../../services/match.service";
import { useAuthStore } from "../../stores/authStore";
import haptics from "../../lib/haptics";

const skillLevelLabels = {
    beginner: "Mới chơi",
    intermediate: "Trung bình",
    advanced: "Nâng cao",
    pro: "Chuyên nghiệp",
};

const matchTypeLabels = {
    singles: "Đơn (1v1)",
    doubles: "Đôi (2v2)",
    any: "Không giới hạn",
};

const genderLabels = {
    male: "Nam",
    female: "Nữ",
    mixed: "Hỗn hợp",
    any: "Không giới hạn",
};

export default function MatchDetailScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { id } = useLocalSearchParams<{ id: string }>();
    const queryClient = useQueryClient();
    const { user } = useAuthStore();

    const [showResponseForm, setShowResponseForm] = useState(false);
    const [message, setMessage] = useState("");

    // Fetch match request
    const { data: matchRequests } = useQuery({
        queryKey: ["matchRequests"],
        queryFn: async () => {
            const result = await MatchService.getMatchRequests();
            return result.data;
        },
    });

    const matchRequest = matchRequests?.find((m) => m.id === id);
    const isOwner = matchRequest?.userId === user?.id;

    // Fetch responses if owner
    const { data: responses = [], isLoading: loadingResponses } = useQuery({
        queryKey: ["matchResponses", id],
        queryFn: async () => {
            if (!id) return [];
            const result = await MatchService.getMatchResponses(id);
            return result.data;
        },
        enabled: isOwner && !!id,
    });

    // Respond mutation
    const respondMutation = useMutation({
        mutationFn: async () => {
            if (!id) throw new Error("No match ID");
            return MatchService.respondToMatch(id, message || undefined);
        },
        onSuccess: (result) => {
            if (result.success) {
                haptics.success();
                Alert.alert("Thành công", "Đã gửi yêu cầu tham gia!", [
                    { text: "OK", onPress: () => router.back() },
                ]);
            } else {
                Alert.alert("Lỗi", result.error || "Không thể gửi yêu cầu");
            }
        },
    });

    // Accept response mutation
    const acceptMutation = useMutation({
        mutationFn: (responseId: string) => MatchService.acceptResponse(responseId),
        onSuccess: (result) => {
            if (result.success && result.data) {
                haptics.success();
                Alert.alert("Đã kết nối!", "Bạn có thể bắt đầu trò chuyện ngay", [
                    {
                        text: "Nhắn tin",
                        onPress: () => router.push(`/match/chat?id=${result.data?.conversationId}`),
                    },
                    { text: "Để sau" },
                ]);
                queryClient.invalidateQueries({ queryKey: ["matchResponses", id] });
            }
        },
    });

    // Decline response mutation
    const declineMutation = useMutation({
        mutationFn: (responseId: string) => MatchService.declineResponse(responseId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["matchResponses", id] });
        },
    });

    // Report user
    const handleReport = (userId: string) => {
        Alert.alert("Báo cáo người dùng", "Chọn lý do báo cáo", [
            { text: "Spam", onPress: () => reportUser(userId, "spam") },
            { text: "Quấy rối", onPress: () => reportUser(userId, "harassment") },
            { text: "Nội dung không phù hợp", onPress: () => reportUser(userId, "inappropriate") },
            { text: "Hủy", style: "cancel" },
        ]);
    };

    const reportUser = async (userId: string, reason: string) => {
        const result = await MatchService.reportUser(userId, reason);
        if (result.success) {
            Alert.alert("Đã báo cáo", "Cảm ơn bạn đã giúp cộng đồng an toàn hơn");
        }
    };

    // Block user
    const handleBlock = (userId: string, userName: string) => {
        Alert.alert(
            "Chặn người dùng",
            `Bạn có chắc muốn chặn ${userName}? Họ sẽ không thể liên hệ với bạn.`,
            [
                { text: "Hủy", style: "cancel" },
                {
                    text: "Chặn",
                    style: "destructive",
                    onPress: async () => {
                        await MatchService.blockUser(userId);
                        haptics.medium();
                        router.back();
                    },
                },
            ]
        );
    };

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString("vi-VN", {
            weekday: "long",
            day: "numeric",
            month: "long",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    if (!matchRequest) {
        return (
            <View style={[styles.container, styles.centered]}>
                <ActivityIndicator color={colors.accent} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Chi tiết tìm bạn chơi</Text>
                {!isOwner && (
                    <TouchableOpacity
                        style={styles.moreBtn}
                        onPress={() => handleReport(matchRequest.userId)}
                    >
                        <Ionicons name="ellipsis-vertical" size={20} color={colors.text} />
                    </TouchableOpacity>
                )}
            </View>

            <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
                {/* User Info */}
                <View style={styles.userCard}>
                    <Image
                        source={{
                            uri: matchRequest.profile?.avatar || "https://via.placeholder.com/80",
                        }}
                        style={styles.avatar}
                    />
                    <View style={styles.userInfo}>
                        <Text style={styles.userName}>
                            {matchRequest.profile?.name || "Người chơi"}
                        </Text>
                        <Text style={styles.postedTime}>
                            Đăng {formatTime(matchRequest.createdAt)}
                        </Text>
                    </View>
                    {!isOwner && (
                        <TouchableOpacity
                            style={styles.blockBtn}
                            onPress={() =>
                                handleBlock(
                                    matchRequest.userId,
                                    matchRequest.profile?.name || "người này"
                                )
                            }
                        >
                            <Ionicons name="ban-outline" size={20} color={colors.error} />
                        </TouchableOpacity>
                    )}
                </View>

                {/* Match Details */}
                <View style={styles.detailsCard}>
                    <View style={styles.detailRow}>
                        <Ionicons name="time-outline" size={20} color={colors.textMuted} />
                        <Text style={styles.detailLabel}>Thời gian:</Text>
                        <Text style={styles.detailValue}>{matchRequest.preferredTime}</Text>
                    </View>

                    <View style={styles.detailRow}>
                        <Ionicons name="fitness-outline" size={20} color={colors.textMuted} />
                        <Text style={styles.detailLabel}>Trình độ:</Text>
                        <Text style={styles.detailValue}>
                            {skillLevelLabels[matchRequest.skillLevel] || matchRequest.skillLevel}
                        </Text>
                    </View>

                    <View style={styles.detailRow}>
                        <Ionicons name="people-outline" size={20} color={colors.textMuted} />
                        <Text style={styles.detailLabel}>Loại trận:</Text>
                        <Text style={styles.detailValue}>
                            {matchTypeLabels[matchRequest.matchType] || matchRequest.matchType}
                        </Text>
                    </View>

                    <View style={styles.detailRow}>
                        <Ionicons name="male-female-outline" size={20} color={colors.textMuted} />
                        <Text style={styles.detailLabel}>Giới tính:</Text>
                        <Text style={styles.detailValue}>
                            {genderLabels[matchRequest.gender] || matchRequest.gender}
                        </Text>
                    </View>
                </View>

                {/* Description */}
                {matchRequest.description && (
                    <View style={styles.descriptionCard}>
                        <Text style={styles.descriptionTitle}>Mô tả thêm</Text>
                        <Text style={styles.descriptionText}>{matchRequest.description}</Text>
                    </View>
                )}

                {/* Privacy Notice */}
                <View style={styles.privacyNotice}>
                    <Ionicons name="shield-checkmark-outline" size={16} color={colors.accent} />
                    <Text style={styles.privacyText}>
                        Thông tin liên hệ chỉ được chia sẻ khi cả hai đồng ý kết nối
                    </Text>
                </View>

                {/* Owner View: Show Responses */}
                {isOwner && (
                    <View style={styles.responsesSection}>
                        <Text style={styles.sectionTitle}>Người quan tâm ({responses.length})</Text>

                        {loadingResponses ? (
                            <ActivityIndicator color={colors.accent} />
                        ) : responses.length === 0 ? (
                            <Text style={styles.noResponses}>Chưa có ai đăng ký tham gia</Text>
                        ) : (
                            responses.map((response) => (
                                <View key={response.id} style={styles.responseCard}>
                                    <Image
                                        source={{
                                            uri:
                                                response.responderAvatar ||
                                                "https://via.placeholder.com/48",
                                        }}
                                        style={styles.responseAvatar}
                                    />
                                    <View style={styles.responseInfo}>
                                        <Text style={styles.responseName}>
                                            {response.responderName}
                                        </Text>
                                        {response.message && (
                                            <Text style={styles.responseMessage}>
                                                "{response.message}"
                                            </Text>
                                        )}
                                        <Text style={styles.responseStatus}>
                                            {response.status === "pending" && "⏳ Đang chờ"}
                                            {response.status === "accepted" && "✅ Đã chấp nhận"}
                                            {response.status === "declined" && "❌ Đã từ chối"}
                                        </Text>
                                    </View>
                                    {response.status === "pending" && (
                                        <View style={styles.responseActions}>
                                            <TouchableOpacity
                                                style={styles.acceptBtn}
                                                onPress={() => acceptMutation.mutate(response.id)}
                                                disabled={acceptMutation.isPending}
                                            >
                                                <Ionicons name="checkmark" size={20} color="#fff" />
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                style={styles.declineBtn}
                                                onPress={() => declineMutation.mutate(response.id)}
                                            >
                                                <Ionicons name="close" size={20} color="#fff" />
                                            </TouchableOpacity>
                                        </View>
                                    )}
                                </View>
                            ))
                        )}
                    </View>
                )}

                {/* Response Form for Non-Owner */}
                {!isOwner && showResponseForm && (
                    <View style={styles.responseForm}>
                        <Text style={styles.formLabel}>Lời nhắn giới thiệu (không bắt buộc)</Text>
                        <TextInput
                            style={styles.messageInput}
                            placeholder="Chào bạn, mình muốn tham gia..."
                            placeholderTextColor={colors.textMuted}
                            value={message}
                            onChangeText={setMessage}
                            multiline
                            maxLength={200}
                        />
                        <Text style={styles.charCount}>{message.length}/200</Text>
                    </View>
                )}
            </ScrollView>

            {/* Bottom Action */}
            {!isOwner && (
                <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>
                    {showResponseForm ? (
                        <View style={styles.footerButtons}>
                            <TouchableOpacity
                                style={styles.cancelBtn}
                                onPress={() => setShowResponseForm(false)}
                            >
                                <Text style={styles.cancelBtnText}>Hủy</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.submitBtn}
                                onPress={() => respondMutation.mutate()}
                                disabled={respondMutation.isPending}
                            >
                                {respondMutation.isPending ? (
                                    <ActivityIndicator color={colors.background} />
                                ) : (
                                    <Text style={styles.submitBtnText}>Gửi yêu cầu</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <TouchableOpacity
                            style={styles.respondBtn}
                            onPress={() => {
                                haptics.light();
                                setShowResponseForm(true);
                            }}
                        >
                            <Ionicons
                                name="hand-right-outline"
                                size={20}
                                color={colors.background}
                            />
                            <Text style={styles.respondBtnText}>Tôi muốn tham gia</Text>
                        </TouchableOpacity>
                    )}
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    centered: {
        justifyContent: "center",
        alignItems: "center",
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: spacing.md,
        paddingBottom: spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    backBtn: {
        padding: spacing.xs,
    },
    headerTitle: {
        flex: 1,
        fontSize: fontSize.lg,
        fontWeight: fontWeight.semibold,
        color: colors.text,
        marginLeft: spacing.sm,
    },
    moreBtn: {
        padding: spacing.xs,
    },
    scrollView: {
        flex: 1,
    },
    content: {
        padding: spacing.lg,
        paddingBottom: 100,
    },
    userCard: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: colors.surface,
        borderRadius: borderRadius.lg,
        padding: spacing.lg,
        marginBottom: spacing.md,
    },
    avatar: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: colors.background,
    },
    userInfo: {
        flex: 1,
        marginLeft: spacing.md,
    },
    userName: {
        fontSize: fontSize.lg,
        fontWeight: fontWeight.bold,
        color: colors.text,
    },
    postedTime: {
        fontSize: fontSize.sm,
        color: colors.textMuted,
        marginTop: 4,
    },
    blockBtn: {
        padding: spacing.sm,
    },
    detailsCard: {
        backgroundColor: colors.surface,
        borderRadius: borderRadius.lg,
        padding: spacing.lg,
        marginBottom: spacing.md,
        gap: spacing.md,
    },
    detailRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.sm,
    },
    detailLabel: {
        fontSize: fontSize.md,
        color: colors.textMuted,
        width: 80,
    },
    detailValue: {
        flex: 1,
        fontSize: fontSize.md,
        fontWeight: fontWeight.semibold,
        color: colors.text,
    },
    descriptionCard: {
        backgroundColor: colors.surface,
        borderRadius: borderRadius.lg,
        padding: spacing.lg,
        marginBottom: spacing.md,
    },
    descriptionTitle: {
        fontSize: fontSize.md,
        fontWeight: fontWeight.semibold,
        color: colors.text,
        marginBottom: spacing.sm,
    },
    descriptionText: {
        fontSize: fontSize.md,
        color: colors.textSecondary,
        lineHeight: 22,
    },
    privacyNotice: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.sm,
        backgroundColor: `${colors.accent}15`,
        padding: spacing.md,
        borderRadius: borderRadius.md,
        marginBottom: spacing.lg,
    },
    privacyText: {
        flex: 1,
        fontSize: fontSize.sm,
        color: colors.textSecondary,
    },
    responsesSection: {
        marginTop: spacing.md,
    },
    sectionTitle: {
        fontSize: fontSize.lg,
        fontWeight: fontWeight.bold,
        color: colors.text,
        marginBottom: spacing.md,
    },
    noResponses: {
        color: colors.textMuted,
        textAlign: "center",
        paddingVertical: spacing.xl,
    },
    responseCard: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: colors.surface,
        borderRadius: borderRadius.md,
        padding: spacing.md,
        marginBottom: spacing.sm,
    },
    responseAvatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
    },
    responseInfo: {
        flex: 1,
        marginLeft: spacing.md,
    },
    responseName: {
        fontSize: fontSize.md,
        fontWeight: fontWeight.semibold,
        color: colors.text,
    },
    responseMessage: {
        fontSize: fontSize.sm,
        color: colors.textSecondary,
        fontStyle: "italic",
        marginTop: 2,
    },
    responseStatus: {
        fontSize: fontSize.xs,
        color: colors.textMuted,
        marginTop: 4,
    },
    responseActions: {
        flexDirection: "row",
        gap: spacing.sm,
    },
    acceptBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: colors.success,
        justifyContent: "center",
        alignItems: "center",
    },
    declineBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: colors.error,
        justifyContent: "center",
        alignItems: "center",
    },
    responseForm: {
        backgroundColor: colors.surface,
        borderRadius: borderRadius.lg,
        padding: spacing.lg,
        marginTop: spacing.md,
    },
    formLabel: {
        fontSize: fontSize.md,
        fontWeight: fontWeight.semibold,
        color: colors.text,
        marginBottom: spacing.sm,
    },
    messageInput: {
        backgroundColor: colors.background,
        borderRadius: borderRadius.md,
        padding: spacing.md,
        fontSize: fontSize.md,
        color: colors.text,
        minHeight: 80,
        textAlignVertical: "top",
    },
    charCount: {
        fontSize: fontSize.xs,
        color: colors.textMuted,
        textAlign: "right",
        marginTop: spacing.xs,
    },
    footer: {
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.md,
        borderTopWidth: 1,
        borderTopColor: colors.border,
        backgroundColor: colors.background,
    },
    footerButtons: {
        flexDirection: "row",
        gap: spacing.md,
    },
    cancelBtn: {
        flex: 1,
        paddingVertical: spacing.md,
        borderRadius: borderRadius.lg,
        borderWidth: 1,
        borderColor: colors.border,
        alignItems: "center",
    },
    cancelBtnText: {
        fontSize: fontSize.md,
        color: colors.textSecondary,
    },
    submitBtn: {
        flex: 2,
        backgroundColor: colors.accent,
        paddingVertical: spacing.md,
        borderRadius: borderRadius.lg,
        alignItems: "center",
    },
    submitBtnText: {
        fontSize: fontSize.md,
        fontWeight: fontWeight.bold,
        color: colors.background,
    },
    respondBtn: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: spacing.sm,
        backgroundColor: colors.accent,
        paddingVertical: spacing.md,
        borderRadius: borderRadius.lg,
    },
    respondBtnText: {
        fontSize: fontSize.md,
        fontWeight: fontWeight.bold,
        color: colors.background,
    },
});
