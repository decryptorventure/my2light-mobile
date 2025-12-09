/**
 * Match Chat Screen
 * In-app messaging between matched users
 * Privacy: No contact info sharing until users decide
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TextInput,
    TouchableOpacity,
    Image,
    KeyboardAvoidingView,
    Platform,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '../../constants/theme';
import { MatchService, MatchMessage } from '../../services/match.service';
import haptics from '../../lib/haptics';

export default function MatchChatScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { id } = useLocalSearchParams<{ id: string }>();
    const queryClient = useQueryClient();
    const flatListRef = useRef<FlatList>(null);

    const [messageText, setMessageText] = useState('');

    // Fetch conversation info
    const { data: conversations = [] } = useQuery({
        queryKey: ['conversations'],
        queryFn: async () => {
            const result = await MatchService.getConversations();
            return result.data;
        },
    });

    const conversation = conversations.find(c => c.id === id);

    // Fetch messages
    const { data: messages = [], isLoading, refetch } = useQuery({
        queryKey: ['messages', id],
        queryFn: async () => {
            if (!id) return [];
            const result = await MatchService.getMessages(id);
            return result.data;
        },
        enabled: !!id,
        refetchInterval: 5000, // Poll every 5 seconds for new messages
    });

    // Send message mutation
    const sendMutation = useMutation({
        mutationFn: async (content: string) => {
            if (!id) throw new Error('No conversation ID');
            return MatchService.sendMessage(id, content);
        },
        onSuccess: (result) => {
            if (result.success && result.data) {
                queryClient.setQueryData(['messages', id], (old: MatchMessage[] = []) => [
                    ...old,
                    result.data!
                ]);
                setMessageText('');
                haptics.light();
                // Scroll to bottom
                setTimeout(() => {
                    flatListRef.current?.scrollToEnd({ animated: true });
                }, 100);
            }
        },
    });

    // Scroll to bottom on initial load
    useEffect(() => {
        if (messages.length > 0) {
            setTimeout(() => {
                flatListRef.current?.scrollToEnd({ animated: false });
            }, 100);
        }
    }, [messages.length]);

    // Report user
    const handleReport = () => {
        if (!conversation) return;
        Alert.alert(
            'Báo cáo người dùng',
            'Chọn lý do báo cáo',
            [
                { text: 'Spam', onPress: () => reportUser('spam') },
                { text: 'Quấy rối', onPress: () => reportUser('harassment') },
                { text: 'Nội dung không phù hợp', onPress: () => reportUser('inappropriate') },
                { text: 'Hủy', style: 'cancel' },
            ]
        );
    };

    const reportUser = async (reason: string) => {
        if (!conversation) return;
        const result = await MatchService.reportUser(conversation.otherUserId, reason);
        if (result.success) {
            Alert.alert('Đã báo cáo', 'Cảm ơn bạn đã giúp cộng đồng an toàn hơn');
        }
    };

    // Block user
    const handleBlock = () => {
        if (!conversation) return;
        Alert.alert(
            'Chặn người dùng',
            `Bạn có chắc muốn chặn ${conversation.otherUserName}? Cuộc trò chuyện này sẽ bị ẩn.`,
            [
                { text: 'Hủy', style: 'cancel' },
                {
                    text: 'Chặn',
                    style: 'destructive',
                    onPress: async () => {
                        await MatchService.blockUser(conversation.otherUserId);
                        haptics.medium();
                        queryClient.invalidateQueries({ queryKey: ['conversations'] });
                        router.back();
                    }
                },
            ]
        );
    };

    // Show options menu
    const showOptions = () => {
        Alert.alert(
            'Tùy chọn',
            undefined,
            [
                { text: 'Báo cáo', onPress: handleReport },
                { text: 'Chặn người dùng', onPress: handleBlock, style: 'destructive' },
                { text: 'Hủy', style: 'cancel' },
            ]
        );
    };

    const handleSend = () => {
        const content = messageText.trim();
        if (!content) return;
        sendMutation.mutate(content);
    };

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays === 0) {
            return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
        } else if (diffDays === 1) {
            return 'Hôm qua ' + date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
        } else {
            return date.toLocaleDateString('vi-VN', { day: 'numeric', month: 'short' });
        }
    };

    const renderMessage = useCallback(({ item }: { item: MatchMessage }) => (
        <View
            style={[
                styles.messageBubble,
                item.isMine ? styles.myMessage : styles.theirMessage,
            ]}
        >
            <Text style={[styles.messageText, item.isMine && styles.myMessageText]}>
                {item.content}
            </Text>
            <Text style={[styles.messageTime, item.isMine && styles.myMessageTime]}>
                {formatTime(item.createdAt)}
            </Text>
        </View>
    ), []);

    if (!conversation && !isLoading) {
        return (
            <View style={[styles.container, styles.centered]}>
                <Text style={styles.errorText}>Không tìm thấy cuộc trò chuyện</Text>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <Text style={styles.backButtonText}>Quay lại</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={0}
        >
            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>

                <View style={styles.headerInfo}>
                    <Image
                        source={{ uri: conversation?.otherUserAvatar || 'https://via.placeholder.com/40' }}
                        style={styles.headerAvatar}
                    />
                    <Text style={styles.headerName} numberOfLines={1}>
                        {conversation?.otherUserName || 'Đang tải...'}
                    </Text>
                </View>

                <TouchableOpacity onPress={showOptions} style={styles.moreBtn}>
                    <Ionicons name="ellipsis-vertical" size={20} color={colors.text} />
                </TouchableOpacity>
            </View>

            {/* Privacy Notice */}
            <View style={styles.privacyBanner}>
                <Ionicons name="shield-checkmark-outline" size={14} color={colors.accent} />
                <Text style={styles.privacyText}>
                    Nhắn tin an toàn • Không chia sẻ thông tin nhạy cảm
                </Text>
            </View>

            {/* Messages */}
            {isLoading ? (
                <View style={styles.centered}>
                    <ActivityIndicator color={colors.accent} />
                </View>
            ) : messages.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Ionicons name="chatbubbles-outline" size={64} color={colors.textMuted} />
                    <Text style={styles.emptyTitle}>Bắt đầu cuộc trò chuyện</Text>
                    <Text style={styles.emptySubtitle}>
                        Nói xin chào và sắp xếp lịch chơi cùng nhau
                    </Text>
                </View>
            ) : (
                <FlatList
                    ref={flatListRef}
                    data={messages}
                    keyExtractor={(item) => item.id}
                    renderItem={renderMessage}
                    contentContainerStyle={styles.messagesList}
                    showsVerticalScrollIndicator={false}
                    onContentSizeChange={() => {
                        flatListRef.current?.scrollToEnd({ animated: false });
                    }}
                />
            )}

            {/* Input */}
            <View style={[styles.inputContainer, { paddingBottom: insets.bottom + spacing.sm }]}>
                <TextInput
                    style={styles.textInput}
                    placeholder="Nhập tin nhắn..."
                    placeholderTextColor={colors.textMuted}
                    value={messageText}
                    onChangeText={setMessageText}
                    multiline
                    maxLength={1000}
                />
                <TouchableOpacity
                    style={[styles.sendBtn, !messageText.trim() && styles.sendBtnDisabled]}
                    onPress={handleSend}
                    disabled={!messageText.trim() || sendMutation.isPending}
                >
                    {sendMutation.isPending ? (
                        <ActivityIndicator size="small" color={colors.background} />
                    ) : (
                        <Ionicons
                            name="send"
                            size={20}
                            color={messageText.trim() ? colors.background : colors.textMuted}
                        />
                    )}
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.md,
        paddingBottom: spacing.sm,
        backgroundColor: colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    backBtn: {
        padding: spacing.xs,
    },
    headerInfo: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: spacing.sm,
    },
    headerAvatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: colors.background,
    },
    headerName: {
        fontSize: fontSize.md,
        fontWeight: fontWeight.semibold,
        color: colors.text,
        marginLeft: spacing.sm,
        flex: 1,
    },
    moreBtn: {
        padding: spacing.xs,
    },
    privacyBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.xs,
        paddingVertical: spacing.xs,
        backgroundColor: `${colors.accent}10`,
    },
    privacyText: {
        fontSize: fontSize.xs,
        color: colors.textMuted,
    },
    errorText: {
        fontSize: fontSize.md,
        color: colors.textMuted,
        marginBottom: spacing.md,
    },
    backButton: {
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.lg,
        backgroundColor: colors.accent,
        borderRadius: borderRadius.md,
    },
    backButtonText: {
        color: colors.background,
        fontWeight: fontWeight.semibold,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.xl,
    },
    emptyTitle: {
        fontSize: fontSize.lg,
        fontWeight: fontWeight.semibold,
        color: colors.text,
        marginTop: spacing.lg,
    },
    emptySubtitle: {
        fontSize: fontSize.sm,
        color: colors.textMuted,
        textAlign: 'center',
        marginTop: spacing.sm,
    },
    messagesList: {
        padding: spacing.md,
        paddingBottom: spacing.lg,
    },
    messageBubble: {
        maxWidth: '80%',
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        marginBottom: spacing.sm,
    },
    myMessage: {
        alignSelf: 'flex-end',
        backgroundColor: colors.accent,
        borderBottomRightRadius: 4,
    },
    theirMessage: {
        alignSelf: 'flex-start',
        backgroundColor: colors.surface,
        borderBottomLeftRadius: 4,
    },
    messageText: {
        fontSize: fontSize.md,
        color: colors.text,
        lineHeight: 22,
    },
    myMessageText: {
        color: colors.background,
    },
    messageTime: {
        fontSize: fontSize.xs,
        color: colors.textMuted,
        marginTop: spacing.xs,
    },
    myMessageTime: {
        color: `${colors.background}99`,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        paddingHorizontal: spacing.md,
        paddingTop: spacing.sm,
        backgroundColor: colors.surface,
        borderTopWidth: 1,
        borderTopColor: colors.border,
        gap: spacing.sm,
    },
    textInput: {
        flex: 1,
        backgroundColor: colors.background,
        borderRadius: borderRadius.lg,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        fontSize: fontSize.md,
        color: colors.text,
        maxHeight: 100,
    },
    sendBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: colors.accent,
        justifyContent: 'center',
        alignItems: 'center',
    },
    sendBtnDisabled: {
        backgroundColor: colors.border,
    },
});
