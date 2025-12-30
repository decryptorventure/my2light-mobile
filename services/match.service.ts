/**
 * Match Service
 * Privacy-focused match-making with in-app messaging
 */

import { supabase } from "../lib/supabase";
import { MatchRequest, ApiResponse } from "../types";
import { logger } from "../lib/logger";

const matchLogger = logger.create("Match");

// Types for match system
export interface MatchResponse {
    id: string;
    matchRequestId: string;
    responderId: string;
    status: "pending" | "accepted" | "declined" | "cancelled";
    message?: string;
    createdAt: string;
    responderName?: string;
    responderAvatar?: string;
}

export interface MatchConversation {
    id: string;
    matchRequestId?: string;
    otherUserId: string;
    otherUserName: string;
    otherUserAvatar?: string;
    status: "active" | "archived" | "blocked";
    lastMessage?: string;
    lastMessageAt?: string;
    unreadCount: number;
    createdAt: string;
}

export interface MatchMessage {
    id: string;
    conversationId: string;
    senderId: string;
    content: string;
    isRead: boolean;
    createdAt: string;
    isMine: boolean;
}

export const MatchService = {
    /**
     * Get open match requests (excludes blocked users)
     */
    getMatchRequests: async (): Promise<ApiResponse<MatchRequest[]>> => {
        const {
            data: { user },
        } = await supabase.auth.getUser();

        try {
            let query = supabase
                .from("match_requests")
                .select("*, profiles:user_id(name, avatar)")
                .eq("status", "open")
                .order("created_at", { ascending: false });

            // Exclude user's own requests
            if (user) {
                query = query.neq("user_id", user.id);
            }

            const { data, error } = await query;

            if (error || !data) {
                return { success: false, data: [] };
            }

            // Filter out blocked users
            let blockedIds: string[] = [];
            if (user) {
                const { data: blocks } = await supabase
                    .from("user_blocks")
                    .select("blocked_id")
                    .eq("blocker_id", user.id);
                blockedIds = (blocks || []).map((b) => b.blocked_id);
            }

            const matches: MatchRequest[] = data
                .filter((m: any) => !blockedIds.includes(m.user_id))
                .map((m: any) => ({
                    id: m.id,
                    userId: m.user_id,
                    courtId: m.court_id,
                    preferredTime: m.preferred_time,
                    skillLevel: m.skill_level,
                    matchType: m.match_type,
                    gender: m.gender,
                    status: m.status,
                    description: m.description,
                    createdAt: m.created_at,
                    profile: m.profiles,
                }));

            return { success: true, data: matches };
        } catch (e) {
            matchLogger.error("getMatchRequests error", e);
            return { success: false, data: [] };
        }
    },

    /**
     * Get user's own match requests
     */
    getMyMatchRequests: async (): Promise<ApiResponse<MatchRequest[]>> => {
        const {
            data: { user },
        } = await supabase.auth.getUser();
        if (!user) return { success: false, data: [] };

        try {
            const { data, error } = await supabase
                .from("match_requests")
                .select("*")
                .eq("user_id", user.id)
                .order("created_at", { ascending: false });

            if (error || !data) {
                return { success: false, data: [] };
            }

            const matches: MatchRequest[] = data.map((m: any) => ({
                id: m.id,
                userId: m.user_id,
                courtId: m.court_id,
                preferredTime: m.preferred_time,
                skillLevel: m.skill_level,
                matchType: m.match_type,
                gender: m.gender,
                status: m.status,
                description: m.description,
                createdAt: m.created_at,
            }));

            return { success: true, data: matches };
        } catch (e) {
            return { success: false, data: [] };
        }
    },

    /**
     * Create a new match request
     */
    createMatchRequest: async (
        request: Omit<MatchRequest, "id" | "userId" | "status" | "createdAt">
    ): Promise<ApiResponse<MatchRequest | null>> => {
        const {
            data: { user },
        } = await supabase.auth.getUser();
        if (!user) return { success: false, data: null, error: "Not authenticated" };

        try {
            const { data, error } = await supabase
                .from("match_requests")
                .insert({
                    user_id: user.id,
                    court_id: request.courtId || null,
                    preferred_time: request.preferredTime,
                    skill_level: request.skillLevel,
                    match_type: request.matchType,
                    gender: request.gender,
                    description: request.description,
                    status: "open",
                })
                .select()
                .single();

            if (error) {
                matchLogger.error("createMatchRequest error", error);
                return { success: false, data: null, error: error.message };
            }

            return { success: true, data: data as any };
        } catch (e) {
            return { success: false, data: null, error: "Failed to create request" };
        }
    },

    /**
     * Respond to a match request (express interest)
     */
    respondToMatch: async (
        matchRequestId: string,
        message?: string
    ): Promise<ApiResponse<MatchResponse | null>> => {
        const {
            data: { user },
        } = await supabase.auth.getUser();
        if (!user) return { success: false, data: null, error: "Not authenticated" };

        try {
            // Check if blocked
            const { data: request } = await supabase
                .from("match_requests")
                .select("user_id")
                .eq("id", matchRequestId)
                .single();

            if (!request) {
                return { success: false, data: null, error: "Match request not found" };
            }

            // Check for blocks
            const { data: block } = await supabase
                .from("user_blocks")
                .select("id")
                .or(`blocker_id.eq.${request.user_id},blocked_id.eq.${request.user_id}`)
                .eq("blocker_id", user.id)
                .maybeSingle();

            if (block) {
                return { success: false, data: null, error: "Cannot respond to this request" };
            }

            const { data, error } = await supabase
                .from("match_responses")
                .insert({
                    match_request_id: matchRequestId,
                    responder_id: user.id,
                    message: message?.substring(0, 200), // Limit intro message
                    status: "pending",
                })
                .select()
                .single();

            if (error) {
                if (error.code === "23505") {
                    // Unique constraint
                    return { success: false, data: null, error: "Bạn đã đăng ký tham gia rồi" };
                }
                return { success: false, data: null, error: error.message };
            }

            matchLogger.info("Match response created", { matchRequestId, responderId: user.id });

            return {
                success: true,
                data: {
                    id: data.id,
                    matchRequestId: data.match_request_id,
                    responderId: data.responder_id,
                    status: data.status,
                    message: data.message,
                    createdAt: data.created_at,
                },
            };
        } catch (e) {
            matchLogger.error("respondToMatch error", e);
            return { success: false, data: null, error: "Failed to respond" };
        }
    },

    /**
     * Get responses to my match request
     */
    getMatchResponses: async (matchRequestId: string): Promise<ApiResponse<MatchResponse[]>> => {
        try {
            const { data, error } = await supabase
                .from("match_responses")
                .select(
                    `
                    *,
                    profiles:responder_id(name, avatar)
                `
                )
                .eq("match_request_id", matchRequestId)
                .order("created_at", { ascending: false });

            if (error || !data) {
                return { success: false, data: [] };
            }

            const responses: MatchResponse[] = data.map((r: any) => ({
                id: r.id,
                matchRequestId: r.match_request_id,
                responderId: r.responder_id,
                status: r.status,
                message: r.message,
                createdAt: r.created_at,
                responderName: r.profiles?.name || "Ẩn danh",
                responderAvatar: r.profiles?.avatar,
            }));

            return { success: true, data: responses };
        } catch (e) {
            return { success: false, data: [] };
        }
    },

    /**
     * Accept a match response (creates conversation)
     */
    acceptResponse: async (
        responseId: string
    ): Promise<ApiResponse<{ conversationId: string } | null>> => {
        const {
            data: { user },
        } = await supabase.auth.getUser();
        if (!user) return { success: false, data: null, error: "Not authenticated" };

        try {
            // Get the response
            const { data: response } = await supabase
                .from("match_responses")
                .select("*, match_requests!inner(user_id)")
                .eq("id", responseId)
                .single();

            if (!response) {
                return { success: false, data: null, error: "Response not found" };
            }

            // Verify ownership
            if ((response.match_requests as any).user_id !== user.id) {
                return { success: false, data: null, error: "Not authorized" };
            }

            // Update response status
            await supabase
                .from("match_responses")
                .update({ status: "accepted", updated_at: new Date().toISOString() })
                .eq("id", responseId);

            // Create conversation
            const { data: conversationId, error: convError } = await supabase.rpc(
                "create_match_conversation",
                {
                    p_match_request_id: response.match_request_id,
                    p_responder_id: response.responder_id,
                }
            );

            if (convError) {
                matchLogger.error("Failed to create conversation", convError);
                return { success: false, data: null, error: "Failed to create conversation" };
            }

            matchLogger.info("Match accepted", { responseId, conversationId });

            return { success: true, data: { conversationId } };
        } catch (e) {
            matchLogger.error("acceptResponse error", e);
            return { success: false, data: null, error: "Failed to accept" };
        }
    },

    /**
     * Decline a match response
     */
    declineResponse: async (responseId: string): Promise<ApiResponse<boolean>> => {
        const {
            data: { user },
        } = await supabase.auth.getUser();
        if (!user) return { success: false, data: false, error: "Not authenticated" };

        try {
            const { error } = await supabase
                .from("match_responses")
                .update({ status: "declined", updated_at: new Date().toISOString() })
                .eq("id", responseId);

            if (error) {
                return { success: false, data: false, error: error.message };
            }

            return { success: true, data: true };
        } catch (e) {
            return { success: false, data: false, error: "Failed to decline" };
        }
    },

    /**
     * Get user's conversations
     */
    getConversations: async (): Promise<ApiResponse<MatchConversation[]>> => {
        const {
            data: { user },
        } = await supabase.auth.getUser();
        if (!user) return { success: false, data: [] };

        try {
            const { data, error } = await supabase
                .from("match_conversations")
                .select(
                    `
                    *,
                    user_a_profile:user_a(name, avatar),
                    user_b_profile:user_b(name, avatar)
                `
                )
                .or(`user_a.eq.${user.id},user_b.eq.${user.id}`)
                .neq("status", "blocked")
                .order("created_at", { ascending: false });

            if (error || !data) {
                return { success: false, data: [] };
            }

            // Get last messages and unread counts
            const conversations: MatchConversation[] = await Promise.all(
                data.map(async (c: any) => {
                    const isUserA = c.user_a === user.id;
                    const otherProfile = isUserA ? c.user_b_profile : c.user_a_profile;
                    const otherUserId = isUserA ? c.user_b : c.user_a;

                    // Get last message
                    const { data: lastMsg } = await supabase
                        .from("match_messages")
                        .select("content, created_at")
                        .eq("conversation_id", c.id)
                        .order("created_at", { ascending: false })
                        .limit(1)
                        .maybeSingle();

                    // Get unread count
                    const { count } = await supabase
                        .from("match_messages")
                        .select("*", { count: "exact", head: true })
                        .eq("conversation_id", c.id)
                        .neq("sender_id", user.id)
                        .eq("is_read", false);

                    return {
                        id: c.id,
                        matchRequestId: c.match_request_id,
                        otherUserId,
                        otherUserName: otherProfile?.name || "Người dùng",
                        otherUserAvatar: otherProfile?.avatar,
                        status: c.status,
                        lastMessage: lastMsg?.content,
                        lastMessageAt: lastMsg?.created_at,
                        unreadCount: count || 0,
                        createdAt: c.created_at,
                    };
                })
            );

            // Sort by last message
            conversations.sort((a, b) => {
                const aTime = a.lastMessageAt || a.createdAt;
                const bTime = b.lastMessageAt || b.createdAt;
                return new Date(bTime).getTime() - new Date(aTime).getTime();
            });

            return { success: true, data: conversations };
        } catch (e) {
            matchLogger.error("getConversations error", e);
            return { success: false, data: [] };
        }
    },

    /**
     * Get messages in a conversation
     */
    getMessages: async (
        conversationId: string,
        limit = 50
    ): Promise<ApiResponse<MatchMessage[]>> => {
        const {
            data: { user },
        } = await supabase.auth.getUser();
        if (!user) return { success: false, data: [] };

        try {
            const { data, error } = await supabase
                .from("match_messages")
                .select("*")
                .eq("conversation_id", conversationId)
                .order("created_at", { ascending: false })
                .limit(limit);

            if (error || !data) {
                return { success: false, data: [] };
            }

            const messages: MatchMessage[] = data.reverse().map((m: any) => ({
                id: m.id,
                conversationId: m.conversation_id,
                senderId: m.sender_id,
                content: m.content,
                isRead: m.is_read,
                createdAt: m.created_at,
                isMine: m.sender_id === user.id,
            }));

            // Mark unread messages as read
            await supabase
                .from("match_messages")
                .update({ is_read: true })
                .eq("conversation_id", conversationId)
                .neq("sender_id", user.id)
                .eq("is_read", false);

            return { success: true, data: messages };
        } catch (e) {
            return { success: false, data: [] };
        }
    },

    /**
     * Send a message
     */
    sendMessage: async (
        conversationId: string,
        content: string
    ): Promise<ApiResponse<MatchMessage | null>> => {
        const {
            data: { user },
        } = await supabase.auth.getUser();
        if (!user) return { success: false, data: null, error: "Not authenticated" };

        if (!content.trim()) {
            return { success: false, data: null, error: "Message cannot be empty" };
        }

        try {
            const { data, error } = await supabase
                .from("match_messages")
                .insert({
                    conversation_id: conversationId,
                    sender_id: user.id,
                    content: content.trim().substring(0, 1000), // Limit message length
                })
                .select()
                .single();

            if (error) {
                return { success: false, data: null, error: error.message };
            }

            return {
                success: true,
                data: {
                    id: data.id,
                    conversationId: data.conversation_id,
                    senderId: data.sender_id,
                    content: data.content,
                    isRead: data.is_read,
                    createdAt: data.created_at,
                    isMine: true,
                },
            };
        } catch (e) {
            return { success: false, data: null, error: "Failed to send message" };
        }
    },

    /**
     * Block a user
     */
    blockUser: async (userId: string, reason?: string): Promise<ApiResponse<boolean>> => {
        const {
            data: { user },
        } = await supabase.auth.getUser();
        if (!user) return { success: false, data: false, error: "Not authenticated" };

        try {
            // Create block
            await supabase.from("user_blocks").insert({
                blocker_id: user.id,
                blocked_id: userId,
                reason,
            });

            // Archive any existing conversations
            await supabase
                .from("match_conversations")
                .update({ status: "blocked" })
                .or(
                    `and(user_a.eq.${user.id},user_b.eq.${userId}),and(user_a.eq.${userId},user_b.eq.${user.id})`
                );

            matchLogger.info("User blocked", { blockedId: userId });

            return { success: true, data: true };
        } catch (e) {
            return { success: false, data: false, error: "Failed to block user" };
        }
    },

    /**
     * Unblock a user
     */
    unblockUser: async (userId: string): Promise<ApiResponse<boolean>> => {
        const {
            data: { user },
        } = await supabase.auth.getUser();
        if (!user) return { success: false, data: false };

        try {
            await supabase
                .from("user_blocks")
                .delete()
                .eq("blocker_id", user.id)
                .eq("blocked_id", userId);

            return { success: true, data: true };
        } catch (e) {
            return { success: false, data: false };
        }
    },

    /**
     * Report a user
     */
    reportUser: async (
        userId: string,
        reason: string,
        description?: string
    ): Promise<ApiResponse<boolean>> => {
        const {
            data: { user },
        } = await supabase.auth.getUser();
        if (!user) return { success: false, data: false, error: "Not authenticated" };

        try {
            await supabase.from("user_reports").insert({
                reporter_id: user.id,
                reported_id: userId,
                reason,
                description,
            });

            matchLogger.info("User reported", { reportedId: userId, reason });

            return { success: true, data: true };
        } catch (e) {
            return { success: false, data: false, error: "Failed to report user" };
        }
    },

    /**
     * Cancel my match request
     */
    cancelMatchRequest: async (requestId: string): Promise<ApiResponse<boolean>> => {
        const {
            data: { user },
        } = await supabase.auth.getUser();
        if (!user) return { success: false, data: false };

        try {
            const { error } = await supabase
                .from("match_requests")
                .update({ status: "cancelled" })
                .eq("id", requestId)
                .eq("user_id", user.id);

            if (error) {
                return { success: false, data: false, error: error.message };
            }

            return { success: true, data: true };
        } catch (e) {
            return { success: false, data: false };
        }
    },

    /**
     * Get total unread message count
     */
    getUnreadCount: async (): Promise<number> => {
        const {
            data: { user },
        } = await supabase.auth.getUser();
        if (!user) return 0;

        try {
            const { data } = await supabase.rpc("get_unread_message_count", {
                p_user_id: user.id,
            });
            return data || 0;
        } catch {
            return 0;
        }
    },
};
