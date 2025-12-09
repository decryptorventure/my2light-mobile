import { supabase } from '../lib/supabase';
import { User, ApiResponse } from '../types';
import { authLogger } from '../lib/logger';

export const AuthService = {
    getCurrentUser: async (): Promise<ApiResponse<User>> => {
        try {
            authLogger.debug("getCurrentUser called");

            const { data: { session }, error: sessionError } = await supabase.auth.getSession();

            authLogger.debug("Session check", { hasSession: !!session });
            if (sessionError) authLogger.error("Session error", sessionError);

            if (!session?.user) {
                authLogger.debug("No session - returning not authenticated");
                return { success: false, data: null as any, error: 'Not authenticated' };
            }

            authLogger.debug("Fetching profile");

            // Try fetching profile from DB
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .single();

            authLogger.debug("Profile fetch result", { found: !!data });

            // Calculate fallback display name from email
            const emailName = session.user.email?.split('@')[0] || 'User';
            const displayName = emailName.charAt(0).toUpperCase() + emailName.slice(1);

            if (error || !data) {
                authLogger.debug("Creating new profile");
                // Profile doesn't exist - create it
                const newProfile = {
                    id: session.user.id,
                    email: session.user.email,
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
                    authLogger.error('Failed to create profile', {
                        message: insertError.message,
                        code: insertError.code
                    });
                    return { success: false, data: null as any, error: 'Failed to create profile: ' + insertError.message };
                }

                authLogger.debug("Profile created successfully");

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
                        membershipTier: 'free',
                        hasOnboarded: false
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
                followingCount: data.following_count || 0,
                hasOnboarded: data.has_onboarded ?? false
            };

            authLogger.debug("User loaded successfully", { name: user.name });
            return { success: true, data: user };
        } catch (e) {
            authLogger.error('getCurrentUser error', e);
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
        authLogger.debug("updateUserProfile called", { fields: Object.keys(updates) });

        const { data: { user }, error: authError } = await supabase.auth.getUser();

        authLogger.debug("Auth check", { authenticated: !!user });
        if (authError) authLogger.error("Auth error", authError);

        if (!user) {
            authLogger.debug("Not authenticated for update");
            return { success: false, data: false, error: 'Not authenticated' };
        }

        try {
            authLogger.debug("Updating profile");

            const { error: updateError } = await supabase
                .from('profiles')
                .update(updates)
                .eq('id', user.id);

            if (updateError) {
                authLogger.error("Update profile error", {
                    message: updateError.message,
                    code: updateError.code
                });
                return { success: false, data: false, error: updateError.message };
            }

            authLogger.debug("Profile updated successfully");
            return { success: true, data: true };
        } catch (e) {
            authLogger.error("Exception in updateUserProfile", e);
            return { success: false, data: false, error: 'Internal error' };
        }
    }
};
