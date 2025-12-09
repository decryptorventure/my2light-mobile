/**
 * Conversations List Screen
 * Shows all matched conversations
 */

import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Image,
    RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '../../constants/theme';
import { MatchService, MatchConversation } from '../../services/match.service';

export default function ConversationsScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();

    const { data: conversations = [], isLoading, refetch } = useQuery({
        queryKey: ['conversations'],
        queryFn: async () => {
            const result = await MatchService.getConversations();
            return result.data;
        },
    });

    const formatTime = (dateString?: string) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        const now = new Date();
        const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays === 0) {
            return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
        } else if (diffDays === 1) {
            return 'Hôm qua';
        } else if (diffDays < 7) {
            return date.toLocaleDateString('vi-VN', { weekday: 'short' });
        } else {
            return date.toLocaleDateString('vi-VN', { day: 'numeric', month: 'short' });
        }
    };

    const renderConversation = ({ item }: { item: MatchConversation }) => (
        <TouchableOpacity
            style={styles.conversationItem}
            onPress={() => router.push(`/match/chat?id=${item.id}`)}
        >
            <View style={styles.avatarContainer}>
                <Image
                    source={{ uri: item.otherUserAvatar || 'https://via.placeholder.com/56' }}
                    style={styles.avatar}
                />
                {item.unreadCount > 0 && (
                    <View style={styles.unreadBadge}>
                        <Text style={styles.unreadCount}>
                            {item.unreadCount > 9 ? '9+' : item.unreadCount}
                        </Text>
                    </View>
                )}
            </View>

            <View style={styles.conversationInfo}>
                <View style={styles.topRow}>
                    <Text style={[styles.userName, item.unreadCount > 0 && styles.unreadName]} numberOfLines={1}>
                        {item.otherUserName}
                    </Text>
                    <Text style={styles.timeText}>{formatTime(item.lastMessageAt)}</Text>
                </View>
                <Text
                    style={[styles.lastMessage, item.unreadCount > 0 && styles.unreadMessage]}
                    numberOfLines={1}
                >
                    {item.lastMessage || 'Bắt đầu trò chuyện...'}
                </Text>
            </View>

            <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
        </TouchableOpacity>
    );

    const renderEmpty = () => (
        <View style={styles.emptyContainer}>
            <Ionicons name="chatbubbles-outline" size={64} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>Chưa có cuộc trò chuyện</Text>
            <Text style={styles.emptySubtitle}>
                Tìm bạn chơi và kết nối để bắt đầu trò chuyện
            </Text>
            <TouchableOpacity
                style={styles.findMatchBtn}
                onPress={() => router.push('/(tabs)/match')}
            >
                <Text style={styles.findMatchBtnText}>Tìm bạn chơi</Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Tin nhắn</Text>
                <View style={{ width: 32 }} />
            </View>

            {/* List */}
            <FlatList
                data={conversations}
                keyExtractor={(item) => item.id}
                renderItem={renderConversation}
                ListEmptyComponent={renderEmpty}
                contentContainerStyle={conversations.length === 0 ? styles.emptyList : styles.listContent}
                refreshControl={
                    <RefreshControl
                        refreshing={isLoading}
                        onRefresh={refetch}
                        tintColor={colors.accent}
                    />
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.md,
        paddingBottom: spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    backBtn: {
        padding: spacing.xs,
    },
    headerTitle: {
        fontSize: fontSize.lg,
        fontWeight: fontWeight.bold,
        color: colors.text,
    },
    listContent: {
        paddingVertical: spacing.sm,
    },
    emptyList: {
        flex: 1,
    },
    conversationItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    avatarContainer: {
        position: 'relative',
    },
    avatar: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: colors.surface,
    },
    unreadBadge: {
        position: 'absolute',
        top: -2,
        right: -2,
        minWidth: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: colors.error,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 4,
    },
    unreadCount: {
        fontSize: 11,
        fontWeight: fontWeight.bold,
        color: '#fff',
    },
    conversationInfo: {
        flex: 1,
        marginLeft: spacing.md,
    },
    topRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    userName: {
        fontSize: fontSize.md,
        fontWeight: fontWeight.semibold,
        color: colors.text,
        flex: 1,
    },
    unreadName: {
        fontWeight: fontWeight.bold,
    },
    timeText: {
        fontSize: fontSize.xs,
        color: colors.textMuted,
        marginLeft: spacing.sm,
    },
    lastMessage: {
        fontSize: fontSize.sm,
        color: colors.textMuted,
    },
    unreadMessage: {
        color: colors.textSecondary,
        fontWeight: fontWeight.medium,
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
        marginBottom: spacing.lg,
    },
    findMatchBtn: {
        backgroundColor: colors.accent,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.xl,
        borderRadius: borderRadius.lg,
    },
    findMatchBtnText: {
        fontSize: fontSize.md,
        fontWeight: fontWeight.bold,
        color: colors.background,
    },
});
