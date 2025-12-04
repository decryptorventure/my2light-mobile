import { supabase } from '../lib/supabase';
import { ApiResponse } from '../types';

export const TransactionService = {
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
