import { supabase } from '../lib/supabase';
import { Highlight, ApiResponse } from '../types';

/**
 * Helper to fetch related data (profiles, courts) for highlights
 */
async function enrichHighlights(highlights: any[]): Promise<Highlight[]> {
    if (!highlights.length) return [];

    // Get unique user IDs and court IDs
    const userIds = [...new Set(highlights.map(h => h.user_id).filter(Boolean))];
    const courtIds = [...new Set(highlights.map(h => h.court_id).filter(Boolean))];

    // Fetch profiles
    let profileMap = new Map();
    if (userIds.length > 0) {
        const { data: profiles } = await supabase
            .from('profiles')
            .select('id, name, avatar')
            .in('id', userIds);
        profileMap = new Map((profiles || []).map((p: any) => [p.id, p]));
    }

    // Fetch courts
    let courtMap = new Map();
    if (courtIds.length > 0) {
        const { data: courts } = await supabase
            .from('courts')
            .select('id, name')
            .in('id', courtIds);
        courtMap = new Map((courts || []).map((c: any) => [c.id, c]));
    }

    // Map highlights with enriched data
    return highlights.map((h: any) => {
        const profile = profileMap.get(h.user_id);
        const court = courtMap.get(h.court_id);

        return {
            id: h.id,
            userId: h.user_id,
            courtId: h.court_id,
            title: h.title || 'Highlight',
            description: h.description || '',
            thumbnailUrl: h.thumbnail_url || '',
            videoUrl: h.video_url || '',
            durationSec: h.duration_sec || 0,
            createdAt: h.created_at,
            likes: h.likes || 0,
            views: h.views || 0,
            courtName: court?.name || 'Sân không xác định',
            userAvatar: profile?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${h.user_id}`,
            userName: profile?.name || 'Người chơi',
            isLiked: false,
            isPublic: h.is_public !== false,
            comments: 0,
            highlightEvents: h.highlight_events || []
        };
    });
}

export const HighlightService = {
    /**
     * Get all public highlights for feed/home
     */
    getHighlights: async (limit = 10): Promise<ApiResponse<Highlight[]>> => {
        try {
            console.log("📽️ getHighlights: Fetching public highlights, limit:", limit);

            const { data, error } = await supabase
                .from('highlights')
                .select('*')
                .eq('is_public', true)
                .order('created_at', { ascending: false })
                .limit(limit);

            if (error) {
                console.error("📽️ getHighlights error:", error.message);
                return { success: false, data: [], error: error.message };
            }

            console.log("📽️ Found", data?.length || 0, "public highlights");

            const enriched = await enrichHighlights(data || []);
            console.log("📽️ Enriched highlights:", enriched.map(h => ({
                id: h.id.slice(0, 8),
                title: h.title,
                videoUrl: h.videoUrl ? 'YES' : 'NO',
                thumbnailUrl: h.thumbnailUrl ? 'YES' : 'NO'
            })));

            return { success: true, data: enriched };
        } catch (e: any) {
            console.error("📽️ getHighlights exception:", e);
            return { success: false, data: [], error: e.message };
        }
    },

    /**
     * Get highlights for a specific user (library)
     */
    getUserHighlights: async (userId: string, limit = 50): Promise<ApiResponse<Highlight[]>> => {
        try {
            console.log("📽️ getUserHighlights: Fetching for user:", userId?.slice(0, 8) || "none");

            if (!userId) {
                return { success: true, data: [] };
            }

            const { data, error } = await supabase
                .from('highlights')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
                .limit(limit);

            if (error) {
                console.error("📽️ getUserHighlights error:", error.message);
                return { success: false, data: [], error: error.message };
            }

            console.log("📽️ Found", data?.length || 0, "user highlights");

            const enriched = await enrichHighlights(data || []);
            console.log("📽️ User highlights enriched:", enriched.map(h => ({
                id: h.id.slice(0, 8),
                title: h.title,
                videoUrl: h.videoUrl ? 'YES' : 'NO',
                thumbnailUrl: h.thumbnailUrl ? 'YES' : 'NO'
            })));

            return { success: true, data: enriched };
        } catch (e: any) {
            console.error("📽️ getUserHighlights exception:", e);
            return { success: false, data: [], error: e.message };
        }
    },

    /**
     * Create a new highlight
     */
    createHighlight: async (
        courtId: string,
        videoUrl?: string,
        duration?: number,
        title?: string,
        description?: string,
        highlightEvents?: { id: string; timestamp: number; duration: number; name: string }[],
        thumbnailUrl?: string
    ): Promise<ApiResponse<Highlight>> => {
        try {
            console.log("📽️ createHighlight:", {
                courtId: courtId?.slice(0, 8) || "none",
                videoUrl: videoUrl ? "YES" : "NO",
                thumbnailUrl: thumbnailUrl ? "YES" : "NO",
                title
            });

            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                return { success: false, data: null as any, error: 'Not authenticated' };
            }

            const insertData = {
                user_id: user.id,
                court_id: courtId || null,
                thumbnail_url: thumbnailUrl || '',
                video_url: videoUrl || '',
                duration_sec: duration || 30,
                title: title || 'Highlight mới',
                description: description || '',
                likes: 0,
                views: 0,
                is_public: true,
                highlight_events: highlightEvents || null
            };

            console.log("📽️ Inserting highlight:", {
                user_id: insertData.user_id.slice(0, 8),
                video_url: insertData.video_url ? insertData.video_url.slice(0, 50) + "..." : "EMPTY",
                thumbnail_url: insertData.thumbnail_url ? insertData.thumbnail_url.slice(0, 50) + "..." : "EMPTY"
            });

            const { data, error } = await supabase
                .from('highlights')
                .insert(insertData)
                .select()
                .single();

            if (error) {
                console.error("📽️ createHighlight error:", error.message);
                return { success: false, data: null as any, error: error.message };
            }

            console.log("📽️ Highlight created:", data.id);

            // Return enriched data
            const enriched = await enrichHighlights([data]);
            return { success: true, data: enriched[0] };
        } catch (e: any) {
            console.error("📽️ createHighlight exception:", e);
            return { success: false, data: null as any, error: e.message };
        }
    },

    /**
     * Toggle like on a highlight
     */
    toggleLike: async (highlightId: string, currentLikes: number, isLiked: boolean): Promise<ApiResponse<boolean>> => {
        try {
            const newCount = isLiked ? Math.max(0, currentLikes - 1) : currentLikes + 1;

            const { error } = await supabase
                .from('highlights')
                .update({ likes: newCount })
                .eq('id', highlightId);

            if (error) {
                console.error("📽️ toggleLike error:", error.message);
                return { success: false, data: false, error: error.message };
            }

            return { success: true, data: true };
        } catch (e: any) {
            console.error("📽️ toggleLike exception:", e);
            return { success: false, data: false, error: e.message };
        }
    }
};
