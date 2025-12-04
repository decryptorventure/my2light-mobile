import { supabase } from '../lib/supabase';
import { User, Court, Highlight, Package, Booking, ApiResponse, MatchRequest } from '../types';

export const ApiService = {
    // ============ AUTH & USER ============
    getCurrentUser: async (): Promise<ApiResponse<User>> => {
        try {
            const { data: { session } } = await supabase.auth.getSession();

            if (!session?.user) {
                return { success: false, data: null as any, error: 'Not authenticated' };
            }

            // Try fetching profile from DB
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .single();

            // Calculate fallback display name from email
            const emailName = session.user.email?.split('@')[0] || 'User';
            const displayName = emailName.charAt(0).toUpperCase() + emailName.slice(1);

            if (error || !data) {
                // Profile doesn't exist - create it
                const newProfile = {
                    id: session.user.id,
                    name: displayName,
                    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${session.user.id}`,
                    phone: '',
                    credits: 200000,
                    membership_tier: 'free',
                    total_highlights: 0,
                    has_onboarded: false
                };

                const { error: insertError } = await supabase
                    .from('profiles')
                    .insert(newProfile);

                if (insertError) {
                    console.error('Failed to create profile:', insertError);
                    return { success: false, data: null as any, error: 'Failed to create profile' };
                }

                return {
                    success: true,
                    data: {
                        id: newProfile.id,
                        name: newProfile.name,
                        avatar: newProfile.avatar,
                        phone: newProfile.phone,
                        totalHighlights: 0,
                        hoursPlayed: 0,
                        courtsVisited: 0,
                        credits: newProfile.credits,
                        membershipTier: 'free'
                    }
                };
            }

            // Calculate stats from bookings
            const { data: bookings } = await supabase
                .from('bookings')
                .select('court_id, start_time, end_time, status')
                .eq('user_id', session.user.id)
                .eq('status', 'completed');

            let hoursPlayed = 0;
            const visitedCourts = new Set();

            if (bookings) {
                bookings.forEach((b: any) => {
                    const duration = (new Date(b.end_time).getTime() - new Date(b.start_time).getTime()) / 3600000;
                    hoursPlayed += duration;
                    visitedCourts.add(b.court_id);
                });
            }

            // Calculate total highlights
            const { count: highlightsCount } = await supabase
                .from('highlights')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', session.user.id);

            const user: User = {
                id: data.id,
                name: data.name || displayName,
                avatar: data.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.id}`,
                phone: data.phone || '',
                totalHighlights: highlightsCount || 0,
                hoursPlayed: Number(hoursPlayed.toFixed(1)),
                courtsVisited: visitedCourts.size,
                credits: data.credits || 0,
                membershipTier: (data.membership_tier as any) || 'free',
                role: (data.role as any) || 'player',
                bio: data.bio,
                isPublic: data.is_public,
                followersCount: data.followers_count || 0,
                followingCount: data.following_count || 0
            };

            return { success: true, data: user };
        } catch (e) {
            console.error('getCurrentUser error:', e);
            return { success: false, data: null as any, error: 'Failed to fetch user' };
        }
    },

    updateUserProfile: async (updates: Partial<{
        name: string;
        phone: string;
        avatar: string;
        credits: number;
        has_onboarded: boolean;
        bio: string;
        is_public: boolean;
    }>): Promise<ApiResponse<boolean>> => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { success: false, data: false };

        try {
            const { error: updateError } = await supabase
                .from('profiles')
                .update(updates)
                .eq('id', user.id);

            if (updateError) {
                console.error("Update profile error", updateError);
                return { success: false, data: false, error: updateError.message };
            }

            return { success: true, data: true };
        } catch (e) {
            console.error("Exception in updateUserProfile", e);
            return { success: false, data: false, error: 'Internal error' };
        }
    },

    // ============ COURTS ============
    getCourts: async (): Promise<ApiResponse<Court[]>> => {
        try {
            const { data, error } = await supabase
                .from('courts')
                .select('*')
                .eq('is_active', true);

            if (error || !data) {
                console.error("Error fetching courts:", error);
                return { success: false, data: [] };
            }

            const courts: Court[] = data.map((c: any) => ({
                id: c.id,
                name: c.name,
                address: c.address,
                status: c.status,
                thumbnailUrl: c.thumbnail_url || c.images?.[0] || 'https://images.unsplash.com/photo-1622163642998-1ea36b1dde3b?q=80&w=800',
                distanceKm: c.distance_km || 0,
                pricePerHour: c.price_per_hour,
                rating: c.rating || 0,
                images: c.images || [],
                facilities: c.facilities || [],
                description: c.description,
                openTime: c.open_time,
                closeTime: c.close_time,
                totalReviews: c.total_reviews || 0
            }));

            return { success: true, data: courts };
        } catch (e) {
            console.error('getCourts error:', e);
            return { success: false, data: [] };
        }
    },

    getCourtById: async (id: string): Promise<ApiResponse<Court | undefined>> => {
        const { data, error } = await supabase
            .from('courts')
            .select('*')
            .eq('id', id)
            .single();

        if (error || !data) {
            console.error('getCourtById error:', error);
            return { success: false, data: undefined, error: error?.message || 'Court not found' };
        }

        return {
            success: true,
            data: {
                id: data.id,
                name: data.name,
                address: data.address,
                status: data.status,
                thumbnailUrl: data.thumbnail_url || data.images?.[0] || '',
                distanceKm: data.distance_km || 0,
                pricePerHour: data.price_per_hour,
                rating: data.rating || 0,
                images: data.images || [],
                facilities: data.facilities || [],
                description: data.description,
                openTime: data.open_time,
                closeTime: data.close_time,
                totalReviews: data.total_reviews || 0
            }
        };
    },

    // ============ HIGHLIGHTS ============
    getHighlights: async (limit = 10): Promise<ApiResponse<Highlight[]>> => {
        try {
            const { data, error } = await supabase
                .from('highlights')
                .select('*, court:courts(name), profile:profiles(name, avatar)')
                .order('created_at', { ascending: false })
                .limit(limit);

            if (error || !data) {
                return { success: false, data: [] };
            }

            const highlights: Highlight[] = data.map((h: any) => ({
                id: h.id,
                userId: h.user_id,
                courtId: h.court_id,
                thumbnailUrl: h.thumbnail_url || 'https://images.unsplash.com/photo-1599058945522-28d584b6f0ff?q=80&w=400',
                videoUrl: h.video_url,
                durationSec: h.duration_sec,
                createdAt: h.created_at,
                likes: h.likes,
                views: h.views,
                courtName: h.court?.name || 'Sân',
                userAvatar: h.profile?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + h.user_id,
                userName: h.profile?.name || 'Người chơi',
                isLiked: false,
                isPublic: h.is_public !== false,
                comments: 0,
                highlightEvents: h.highlight_events || []
            }));

            return { success: true, data: highlights };
        } catch (e) {
            return { success: false, data: [] };
        }
    },

    getUserHighlights: async (userId: string, limit = 50): Promise<ApiResponse<Highlight[]>> => {
        try {
            const { data, error } = await supabase
                .from('highlights')
                .select('*, court:courts(name), profile:profiles(name, avatar)')
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
                .limit(limit);

            if (error || !data) {
                return { success: false, data: [] };
            }

            const highlights: Highlight[] = data.map((h: any) => ({
                id: h.id,
                userId: h.user_id,
                courtId: h.court_id,
                thumbnailUrl: h.thumbnail_url || '',
                videoUrl: h.video_url,
                durationSec: h.duration_sec,
                createdAt: h.created_at,
                likes: h.likes,
                views: h.views,
                courtName: h.court?.name || 'Sân',
                userAvatar: h.profile?.avatar || '',
                userName: h.profile?.name || 'Người chơi',
                isLiked: false,
                isPublic: h.is_public !== false,
                comments: 0,
                highlightEvents: h.highlight_events || []
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
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        const { data, error } = await supabase.from('highlights').insert({
            user_id: user.id,
            court_id: courtId,
            thumbnail_url: '',
            video_url: videoUrl || '',
            duration_sec: duration || 30,
            title: title || 'Highlight mới',
            description: description || '',
            likes: 0,
            views: 0,
            is_public: true
        }).select().single();

        if (error) throw error;

        return { success: true, data: data as any };
    },

    toggleLike: async (highlightId: string, currentLikes: number, isLiked: boolean): Promise<ApiResponse<boolean>> => {
        const newCount = isLiked ? Math.max(0, currentLikes - 1) : currentLikes + 1;

        const { error } = await supabase
            .from('highlights')
            .update({ likes: newCount })
            .eq('id', highlightId);

        if (error) return { success: false, data: false };
        return { success: true, data: true };
    },

    // ============ BOOKINGS ============
    getBookingHistory: async (): Promise<ApiResponse<Booking[]>> => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { success: false, data: [] };

        const { data, error } = await supabase
            .from('bookings')
            .select(`*, court:courts(name), package:packages(name)`)
            .eq('user_id', user.id)
            .order('start_time', { ascending: false });

        if (error || !data) return { success: false, data: [] };

        const bookings: Booking[] = data.map((b: any) => ({
            id: b.id,
            userId: b.user_id,
            courtId: b.court_id,
            packageId: b.package_id,
            startTime: new Date(b.start_time).getTime(),
            endTime: new Date(b.end_time).getTime(),
            status: b.status,
            totalAmount: b.total_amount,
            courtName: b.court?.name || 'Sân không xác định',
            packageName: b.package?.name || 'Gói dịch vụ',
            packageType: b.package?.name?.includes('Full') ? 'full_match' : 'standard'
        }));

        return { success: true, data: bookings };
    },

    getActiveBooking: async (): Promise<ApiResponse<Booking | null>> => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { success: false, data: null };

        const now = new Date().toISOString();
        const bufferTime = new Date(Date.now() + 15 * 60000).toISOString();

        const { data, error } = await supabase
            .from('bookings')
            .select(`*, package:packages(name)`)
            .eq('user_id', user.id)
            .eq('status', 'active')
            .lte('start_time', bufferTime)
            .gte('end_time', now)
            .order('start_time', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (!data) return { success: true, data: null };

        return {
            success: true,
            data: {
                id: data.id,
                userId: data.user_id,
                courtId: data.court_id,
                packageId: data.package_id,
                startTime: new Date(data.start_time).getTime(),
                endTime: new Date(data.end_time).getTime(),
                status: data.status,
                totalAmount: data.total_amount,
                packageType: data.package?.name?.includes('Full') ? 'full_match' : 'standard'
            }
        };
    },

    // ============ MATCH REQUESTS ============
    getMatchRequests: async (): Promise<ApiResponse<MatchRequest[]>> => {
        try {
            const { data, error } = await supabase
                .from('match_requests')
                .select('*, profiles(name, avatar)')
                .eq('status', 'open')
                .order('created_at', { ascending: false });

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
                profile: m.profiles
            }));

            return { success: true, data: matches };
        } catch (e) {
            return { success: false, data: [] };
        }
    },

    createMatchRequest: async (request: Omit<MatchRequest, 'id' | 'userId' | 'status' | 'createdAt'>): Promise<ApiResponse<MatchRequest>> => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        const { data, error } = await supabase.from('match_requests').insert({
            user_id: user.id,
            court_id: request.courtId,
            preferred_time: request.preferredTime,
            skill_level: request.skillLevel,
            match_type: request.matchType,
            gender: request.gender,
            description: request.description,
            status: 'open'
        }).select().single();

        if (error) throw error;

        return { success: true, data: data as any };
    },

    // ============ NOTIFICATIONS ============
    getNotifications: async (limit = 20): Promise<ApiResponse<any[]>> => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { success: false, data: [] };

        try {
            const { data, error } = await supabase
                .from('notifications')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(limit);

            if (error) {
                console.error('getNotifications error:', error);
                return { success: false, data: [] };
            }

            return {
                success: true,
                data: (data || []).map((n: any) => ({
                    id: n.id,
                    type: n.type,
                    title: n.title,
                    message: n.message,
                    isRead: n.is_read,
                    createdAt: n.created_at,
                    metadata: n.metadata
                }))
            };
        } catch (e) {
            console.error('getNotifications exception:', e);
            return { success: false, data: [] };
        }
    },

    markNotificationRead: async (notificationId: string): Promise<ApiResponse<boolean>> => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { success: false, data: false };

        const { error } = await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('id', notificationId)
            .eq('user_id', user.id);

        if (error) return { success: false, data: false };
        return { success: true, data: true };
    },

    markAllNotificationsRead: async (): Promise<ApiResponse<boolean>> => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { success: false, data: false };

        const { error } = await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('user_id', user.id)
            .eq('is_read', false);

        if (error) return { success: false, data: false };
        return { success: true, data: true };
    },

    getUnreadNotificationCount: async (): Promise<ApiResponse<number>> => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { success: false, data: 0 };

        const { count, error } = await supabase
            .from('notifications')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .eq('is_read', false);

        if (error) return { success: false, data: 0 };
        return { success: true, data: count || 0 };
    },

    // ============ TRANSACTIONS ============
    getTransactions: async (limit = 50): Promise<ApiResponse<any[]>> => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { success: false, data: [] };

        try {
            const { data, error } = await supabase
                .from('transactions')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(limit);

            if (error) {
                console.error('getTransactions error:', error);
                return { success: false, data: [] };
            }

            return {
                success: true,
                data: (data || []).map((t: any) => ({
                    id: t.id,
                    type: t.type,
                    amount: t.amount,
                    status: t.status,
                    description: t.description,
                    createdAt: t.created_at,
                    referenceId: t.reference_id
                }))
            };
        } catch (e) {
            console.error('getTransactions exception:', e);
            return { success: false, data: [] };
        }
    },

    // ============ WALLET ============
    getUserCredits: async (): Promise<ApiResponse<number>> => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { success: false, data: 0 };

        const { data, error } = await supabase
            .from('profiles')
            .select('credits')
            .eq('id', user.id)
            .single();

        if (error || !data) return { success: false, data: 0 };
        return { success: true, data: data.credits || 0 };
    }
};

// Export individual service namespaces for backward compatibility
export const authService = {
    getCurrentUser: ApiService.getCurrentUser,
    updateProfile: ApiService.updateUserProfile
};

export const courtsService = {
    getCourts: ApiService.getCourts,
    getCourtById: ApiService.getCourtById
};

export const highlightsService = {
    getHighlights: ApiService.getHighlights,
    getUserHighlights: ApiService.getUserHighlights,
    createHighlight: ApiService.createHighlight,
    toggleLike: ApiService.toggleLike
};

export const bookingsService = {
    getBookingHistory: ApiService.getBookingHistory,
    getActiveBooking: ApiService.getActiveBooking
};

export const matchService = {
    getMatchRequests: ApiService.getMatchRequests,
    createMatchRequest: ApiService.createMatchRequest
};

export const notificationsService = {
    getNotifications: ApiService.getNotifications,
    markRead: ApiService.markNotificationRead,
    markAllRead: ApiService.markAllNotificationsRead,
    getUnreadCount: ApiService.getUnreadNotificationCount
};

export const transactionsService = {
    getTransactions: ApiService.getTransactions,
    getUserCredits: ApiService.getUserCredits
};
