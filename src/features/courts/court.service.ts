import { supabase } from "../lib/supabase";
import { Court, ApiResponse } from "../types";

export const CourtService = {
    getCourts: async (): Promise<ApiResponse<Court[]>> => {
        try {
            const { data, error } = await supabase.from("courts").select("*").eq("is_active", true);

            if (error || !data) {
                console.error("Error fetching courts:", error);
                return { success: false, data: [] };
            }

            const courts: Court[] = data.map((c: any) => ({
                id: c.id,
                name: c.name,
                address: c.address,
                status: c.status,
                thumbnailUrl:
                    c.thumbnail_url ||
                    c.images?.[0] ||
                    "https://images.unsplash.com/photo-1622163642998-1ea36b1dde3b?q=80&w=800",
                distanceKm: c.distance_km || 0,
                pricePerHour: c.price_per_hour,
                rating: c.rating || 0,
                images: c.images || [],
                facilities: c.facilities || [],
                description: c.description,
                openTime: c.open_time,
                closeTime: c.close_time,
                totalReviews: c.total_reviews || 0,
            }));

            return { success: true, data: courts };
        } catch (e) {
            console.error("getCourts error:", e);
            return { success: false, data: [] };
        }
    },

    getCourtById: async (id: string): Promise<ApiResponse<Court | undefined>> => {
        const { data, error } = await supabase.from("courts").select("*").eq("id", id).single();

        if (error || !data) {
            console.error("getCourtById error:", error);
            return { success: false, data: undefined, error: error?.message || "Court not found" };
        }

        return {
            success: true,
            data: {
                id: data.id,
                name: data.name,
                address: data.address,
                status: data.status,
                thumbnailUrl: data.thumbnail_url || data.images?.[0] || "",
                distanceKm: data.distance_km || 0,
                pricePerHour: data.price_per_hour,
                rating: data.rating || 0,
                images: data.images || [],
                facilities: data.facilities || [],
                description: data.description,
                openTime: data.open_time,
                closeTime: data.close_time,
                totalReviews: data.total_reviews || 0,
            },
        };
    },
};
