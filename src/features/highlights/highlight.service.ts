import { supabase } from "@/lib/supabase";
import { Highlight, ApiResponse } from "@/types";

export const HighlightService = {
    getHighlights: async (limit = 10): Promise<ApiResponse<Highlight[]>> => {
        try {
            const { data, error } = await supabase
                .from("highlights")
                .select("*, court:courts(name), profile:profiles(name, avatar)")
                .order("created_at", { ascending: false })
                .limit(limit);

            if (error || !data) {
                return { success: false, data: [] };
            }

            const highlights: Highlight[] = data.map((h: any) => ({
                id: h.id,
                userId: h.user_id,
                courtId: h.court_id,
                thumbnailUrl:
                    h.thumbnail_url ||
                    "https://images.unsplash.com/photo-1599058945522-28d584b6f0ff?q=80&w=400",
                videoUrl: h.video_url,
                durationSec: h.duration_sec,
                createdAt: h.created_at,
                likes: h.likes,
                views: h.views,
                courtName: h.court?.name || "Sân",
                userAvatar:
                    h.profile?.avatar ||
                    `https://api.dicebear.com/7.x/avataaars/svg?seed=${h.user_id}`,
                userName: h.profile?.name || "Người chơi",
                isLiked: false,
                isPublic: h.is_public !== false,
                comments: 0,
                highlightEvents: h.highlight_events || [],
            }));

            return { success: true, data: highlights };
        } catch (e) {
            return { success: false, data: [] };
        }
    },

    getUserHighlights: async (userId: string, limit = 50): Promise<ApiResponse<Highlight[]>> => {
        try {
            const { data, error } = await supabase
                .from("highlights")
                .select("*, court:courts(name), profile:profiles(name, avatar)")
                .eq("user_id", userId)
                .order("created_at", { ascending: false })
                .limit(limit);

            if (error || !data) {
                return { success: false, data: [] };
            }

            const highlights: Highlight[] = data.map((h: any) => ({
                id: h.id,
                userId: h.user_id,
                courtId: h.court_id,
                thumbnailUrl: h.thumbnail_url || "",
                videoUrl: h.video_url,
                durationSec: h.duration_sec,
                createdAt: h.created_at,
                likes: h.likes,
                views: h.views,
                courtName: h.court?.name || "Sân",
                userAvatar: h.profile?.avatar || "",
                userName: h.profile?.name || "Người chơi",
                isLiked: false,
                isPublic: h.is_public !== false,
                comments: 0,
                highlightEvents: h.highlight_events || [],
            }));

            return { success: true, data: highlights };
        } catch (e) {
            return { success: false, data: [] };
        }
    },

    createHighlight: async (
        courtId: string,
        videoUrl?: string,
        duration?: number,
        title?: string,
        description?: string
    ): Promise<ApiResponse<Highlight>> => {
        const {
            data: { user },
        } = await supabase.auth.getUser();
        if (!user) throw new Error("Not authenticated");

        const { data, error } = await supabase
            .from("highlights")
            .insert({
                user_id: user.id,
                court_id: courtId,
                thumbnail_url: "",
                video_url: videoUrl || "",
                duration_sec: duration || 30,
                title: title || "Highlight mới",
                description: description || "",
                likes: 0,
                views: 0,
                is_public: true,
            })
            .select()
            .single();

        if (error) throw error;

        return { success: true, data: data as any };
    },

    toggleLike: async (
        highlightId: string,
        currentLikes: number,
        isLiked: boolean
    ): Promise<ApiResponse<boolean>> => {
        const newCount = isLiked ? Math.max(0, currentLikes - 1) : currentLikes + 1;

        const { error } = await supabase
            .from("highlights")
            .update({ likes: newCount })
            .eq("id", highlightId);

        if (error) return { success: false, data: false };
        return { success: true, data: true };
    },
};
