import { supabase } from '../lib/supabase';
import { MatchRequest, ApiResponse } from '../types';

export const MatchService = {
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
    }
};
