/**
 * Review Form Modal
 * Allows users to rate and review a court
 */

import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    TextInput,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, fontSize, fontWeight, borderRadius } from "@/shared/constants/theme";
import { ReviewService } from "../../services/review.service";
import haptics from "../../lib/haptics";

interface ReviewFormProps {
    visible: boolean;
    onClose: () => void;
    courtId: string;
    courtName: string;
    bookingId?: string;
    existingRating?: number;
    existingComment?: string;
    onSuccess?: () => void;
}

export default function ReviewForm({
    visible,
    onClose,
    courtId,
    courtName,
    bookingId,
    existingRating,
    existingComment,
    onSuccess,
}: ReviewFormProps) {
    const [rating, setRating] = useState(existingRating || 0);
    const [comment, setComment] = useState(existingComment || "");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (visible) {
            setRating(existingRating || 0);
            setComment(existingComment || "");
            setError(null);
        }
    }, [visible, existingRating, existingComment]);

    const handleStarPress = (star: number) => {
        haptics.light();
        setRating(star);
    };

    const handleSubmit = async () => {
        if (rating === 0) {
            setError("Vui lòng chọn số sao");
            return;
        }

        setIsSubmitting(true);
        setError(null);

        const result = await ReviewService.submitReview({
            courtId,
            rating,
            comment: comment.trim() || undefined,
            bookingId,
        });

        setIsSubmitting(false);

        if (result.success) {
            haptics.success();
            onSuccess?.();
            onClose();
        } else {
            setError(result.error || "Có lỗi xảy ra");
        }
    };

    const renderStars = () => {
        return (
            <View style={styles.starsContainer}>
                {[1, 2, 3, 4, 5].map((star) => (
                    <TouchableOpacity
                        key={star}
                        onPress={() => handleStarPress(star)}
                        style={styles.starButton}
                    >
                        <Ionicons
                            name={star <= rating ? "star" : "star-outline"}
                            size={40}
                            color={star <= rating ? colors.warning : colors.textMuted}
                        />
                    </TouchableOpacity>
                ))}
            </View>
        );
    };

    const getRatingText = () => {
        switch (rating) {
            case 1:
                return "Rất tệ";
            case 2:
                return "Tệ";
            case 3:
                return "Bình thường";
            case 4:
                return "Tốt";
            case 5:
                return "Tuyệt vời";
            default:
                return "Chạm để đánh giá";
        }
    };

    return (
        <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={styles.overlay}
            >
                <View style={styles.container}>
                    {/* Header */}
                    <View style={styles.header}>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <Ionicons name="close" size={24} color={colors.text} />
                        </TouchableOpacity>
                        <Text style={styles.title}>Đánh giá sân</Text>
                        <View style={{ width: 32 }} />
                    </View>

                    {/* Court Name */}
                    <Text style={styles.courtName}>{courtName}</Text>

                    {/* Star Rating */}
                    {renderStars()}
                    <Text style={styles.ratingText}>{getRatingText()}</Text>

                    {/* Comment Input */}
                    <TextInput
                        style={styles.commentInput}
                        placeholder="Viết nhận xét của bạn (không bắt buộc)"
                        placeholderTextColor={colors.textMuted}
                        value={comment}
                        onChangeText={setComment}
                        multiline
                        numberOfLines={4}
                        maxLength={500}
                    />

                    {/* Error */}
                    {error && <Text style={styles.errorText}>{error}</Text>}

                    {/* Submit Button */}
                    <TouchableOpacity
                        style={[styles.submitButton, rating === 0 && styles.submitButtonDisabled]}
                        onPress={handleSubmit}
                        disabled={isSubmitting || rating === 0}
                    >
                        {isSubmitting ? (
                            <ActivityIndicator color={colors.background} />
                        ) : (
                            <Text style={styles.submitButtonText}>
                                {existingRating ? "Cập nhật đánh giá" : "Gửi đánh giá"}
                            </Text>
                        )}
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        justifyContent: "flex-end",
    },
    container: {
        backgroundColor: colors.surface,
        borderTopLeftRadius: borderRadius.xl,
        borderTopRightRadius: borderRadius.xl,
        padding: spacing.xl,
        paddingBottom: spacing.xl + 20,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: spacing.lg,
    },
    closeButton: {
        width: 32,
        height: 32,
        alignItems: "center",
        justifyContent: "center",
    },
    title: {
        fontSize: fontSize.lg,
        fontWeight: fontWeight.bold,
        color: colors.text,
    },
    courtName: {
        fontSize: fontSize.md,
        fontWeight: fontWeight.semibold,
        color: colors.textSecondary,
        textAlign: "center",
        marginBottom: spacing.lg,
    },
    starsContainer: {
        flexDirection: "row",
        justifyContent: "center",
        gap: spacing.sm,
        marginBottom: spacing.sm,
    },
    starButton: {
        padding: spacing.xs,
    },
    ratingText: {
        fontSize: fontSize.md,
        color: colors.textSecondary,
        textAlign: "center",
        marginBottom: spacing.lg,
    },
    commentInput: {
        backgroundColor: colors.background,
        borderRadius: borderRadius.md,
        padding: spacing.md,
        fontSize: fontSize.md,
        color: colors.text,
        minHeight: 100,
        textAlignVertical: "top",
        marginBottom: spacing.md,
    },
    errorText: {
        color: colors.error,
        fontSize: fontSize.sm,
        textAlign: "center",
        marginBottom: spacing.md,
    },
    submitButton: {
        backgroundColor: colors.accent,
        borderRadius: borderRadius.lg,
        paddingVertical: spacing.md,
        alignItems: "center",
    },
    submitButtonDisabled: {
        backgroundColor: colors.textMuted,
    },
    submitButtonText: {
        fontSize: fontSize.md,
        fontWeight: fontWeight.bold,
        color: colors.background,
    },
});
