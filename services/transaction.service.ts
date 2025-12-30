import { supabase } from "../lib/supabase";
import { ApiResponse } from "../types";
import { logger } from "../lib/logger";

const txLogger = logger.create("Transaction");

export const TransactionService = {
    getTransactions: async (limit = 50): Promise<ApiResponse<any[]>> => {
        const {
            data: { user },
        } = await supabase.auth.getUser();
        if (!user) return { success: false, data: [] };

        try {
            const { data, error } = await supabase
                .from("transactions")
                .select("*")
                .eq("user_id", user.id)
                .order("created_at", { ascending: false })
                .limit(limit);

            if (error) {
                txLogger.error("getTransactions error", error);
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
                    referenceId: t.reference_id,
                })),
            };
        } catch (e) {
            txLogger.error("getTransactions exception", e);
            return { success: false, data: [] };
        }
    },

    getUserCredits: async (): Promise<ApiResponse<number>> => {
        const {
            data: { user },
        } = await supabase.auth.getUser();
        if (!user) return { success: false, data: 0 };

        const { data, error } = await supabase
            .from("profiles")
            .select("credits")
            .eq("id", user.id)
            .single();

        if (error || !data) return { success: false, data: 0 };
        return { success: true, data: data.credits || 0 };
    },

    /**
     * Quick top-up: Add credits to user account (for testing)
     */
    addCredits: async (amount: number = 100000): Promise<ApiResponse<number>> => {
        const {
            data: { user },
        } = await supabase.auth.getUser();
        if (!user) return { success: false, data: 0, error: "Not authenticated" };

        try {
            // Get current credits
            const { data: profile } = await supabase
                .from("profiles")
                .select("credits")
                .eq("id", user.id)
                .single();

            const currentCredits = profile?.credits || 0;
            const newCredits = currentCredits + amount;

            // Update credits
            const { error: updateError } = await supabase
                .from("profiles")
                .update({ credits: newCredits })
                .eq("id", user.id);

            if (updateError) {
                txLogger.error("addCredits update error", updateError);
                return { success: false, data: 0, error: updateError.message };
            }

            // Create transaction record
            await supabase.from("transactions").insert({
                user_id: user.id,
                type: "topup",
                amount: amount,
                status: "completed",
                description: `Nạp ${amount.toLocaleString()}đ (Test)`,
            });

            txLogger.info("Credits added", { amount, newCredits });
            return { success: true, data: newCredits };
        } catch (e) {
            txLogger.error("addCredits exception", e);
            return { success: false, data: 0, error: "Failed to add credits" };
        }
    },
};
