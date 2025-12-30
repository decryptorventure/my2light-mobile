import { supabase } from "@/lib/supabase";
import { Booking, ApiResponse } from "@/types";

export const BookingService = {
    getBookingHistory: async (): Promise<ApiResponse<Booking[]>> => {
        const {
            data: { user },
        } = await supabase.auth.getUser();
        if (!user) return { success: false, data: [] };

        const { data, error } = await supabase
            .from("bookings")
            .select(`*, court:courts(name), package:packages(name)`)
            .eq("user_id", user.id)
            .order("start_time", { ascending: false });

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
            courtName: b.court?.name || "Sân không xác định",
            packageName: b.package?.name || "Gói dịch vụ",
            packageType: b.package?.name?.includes("Full") ? "full_match" : "standard",
        }));

        return { success: true, data: bookings };
    },

    getActiveBooking: async (): Promise<ApiResponse<Booking | null>> => {
        const {
            data: { user },
        } = await supabase.auth.getUser();
        if (!user) return { success: false, data: null };

        const now = new Date().toISOString();
        const bufferTime = new Date(Date.now() + 15 * 60000).toISOString();

        const { data, error } = await supabase
            .from("bookings")
            .select(`*, package:packages(name)`)
            .eq("user_id", user.id)
            .eq("status", "active")
            .lte("start_time", bufferTime)
            .gte("end_time", now)
            .order("start_time", { ascending: false })
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
                packageType: data.package?.name?.includes("Full") ? "full_match" : "standard",
            },
        };
    },
};
