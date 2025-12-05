/**
 * Admin Service
 * API methods for court owner management
 */

import { supabase } from "../lib/supabase";
import { ApiResponse, Booking } from "../types";

export interface CourtOwnerProfile {
    id: string;
    userId: string;
    businessName: string;
    phone: string;
    email: string;
    address: string;
    taxId: string;
    status: "pending" | "approved" | "rejected";
    createdAt: string;
}

export interface DashboardStats {
    totalRevenue: number;
    todayBookings: number;
    totalCourts: number;
    averageRating: number;
}

export interface CourtFormData {
    name: string;
    address: string;
    description?: string;
    pricePerHour: number;
    openTime: string;
    closeTime: string;
    facilities: string[];
    images: string[];
    isActive: boolean;
    autoApproveBookings: boolean;
}

export interface BookingManagement extends Booking {
    playerName: string;
    playerPhone: string;
    playerAvatar?: string;
}

export const AdminService = {
    createCourtOwnerProfile: async (data: {
        businessName: string;
        phone: string;
        email: string;
        address?: string;
        taxId?: string;
    }): Promise<ApiResponse<boolean>> => {
        const {
            data: { user },
        } = await supabase.auth.getUser();
        if (!user) return { success: false, data: false, error: "Not authenticated" };

        try {
            // First check if already registered
            const { data: existing, error: checkError } = await supabase
                .from("court_owners")
                .select("id")
                .eq("user_id", user.id)
                .maybeSingle();

            if (existing) {
                return { success: false, data: false, error: "Bạn đã đăng ký làm chủ sân rồi" };
            }

            const { error } = await supabase.from("court_owners").insert({
                user_id: user.id,
                profile_id: user.id, // Required by DB constraint
                business_name: data.businessName,
                phone: data.phone,
                email: data.email,
                address: data.address || null,
                tax_id: data.taxId || null,
                status: "pending", // Requires status column in DB
            });

            if (error) {
                console.error("Create court owner error:", error);
                return { success: false, data: false, error: error.message };
            }

            // Update user role in profiles
            await supabase
                .from("profiles")
                .update({ role: "court_owner" })
                .eq("id", user.id);

            return { success: true, data: true };
        } catch (e) {
            console.error("createCourtOwnerProfile error:", e);
            return { success: false, data: false, error: "Failed to register" };
        }
    },

    getCourtOwnerProfile: async (): Promise<ApiResponse<CourtOwnerProfile | null>> => {
        const {
            data: { user },
        } = await supabase.auth.getUser();
        if (!user) return { success: false, data: null };

        const { data, error } = await supabase
            .from("court_owners")
            .select("*")
            .eq("user_id", user.id)
            .single();

        if (error || !data) {
            return { success: true, data: null };
        }

        return {
            success: true,
            data: {
                id: data.id,
                userId: data.user_id,
                businessName: data.business_name,
                phone: data.phone,
                email: data.email,
                address: data.address,
                taxId: data.tax_id,
                status: data.status, // Uses real status column from DB
                createdAt: data.created_at,
            },
        };
    },

    getDashboardStats: async (): Promise<ApiResponse<DashboardStats>> => {
        const {
            data: { user },
        } = await supabase.auth.getUser();
        if (!user) return { success: false, data: { totalRevenue: 0, todayBookings: 0, totalCourts: 0, averageRating: 0 } };

        try {
            // Get owner's courts
            const { data: courts } = await supabase
                .from("courts")
                .select("id, rating")
                .eq("owner_id", user.id);

            const courtIds = courts?.map((c) => c.id) || [];
            const totalCourts = courtIds.length;
            const averageRating = courts?.length
                ? courts.reduce((sum, c) => sum + (c.rating || 0), 0) / courts.length
                : 0;

            // Get today's bookings
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);

            const { data: todayBookingsData } = await supabase
                .from("bookings")
                .select("id")
                .in("court_id", courtIds)
                .gte("start_time", today.toISOString())
                .lt("start_time", tomorrow.toISOString());

            const todayBookings = todayBookingsData?.length || 0;

            // Get total revenue (completed bookings)
            const { data: revenueData } = await supabase
                .from("bookings")
                .select("total_amount")
                .in("court_id", courtIds)
                .in("status", ["completed", "active"]);

            const totalRevenue = revenueData?.reduce((sum, b) => sum + (b.total_amount || 0), 0) || 0;

            return {
                success: true,
                data: { totalRevenue, todayBookings, totalCourts, averageRating },
            };
        } catch (e) {
            console.error("getDashboardStats error:", e);
            return { success: false, data: { totalRevenue: 0, todayBookings: 0, totalCourts: 0, averageRating: 0 } };
        }
    },

    getOwnCourts: async (): Promise<ApiResponse<any[]>> => {
        const {
            data: { user },
        } = await supabase.auth.getUser();
        if (!user) return { success: false, data: [] };

        const { data, error } = await supabase
            .from("courts")
            .select("*")
            .eq("owner_id", user.id)
            .order("created_at", { ascending: false });

        if (error) {
            console.error("getOwnCourts error:", error);
            return { success: false, data: [] };
        }

        return {
            success: true,
            data: data || [],
        };
    },

    getCourtBookings: async (): Promise<ApiResponse<BookingManagement[]>> => {
        const {
            data: { user },
        } = await supabase.auth.getUser();
        if (!user) return { success: false, data: [] };

        try {
            // Get owner's courts first
            const { data: courts } = await supabase
                .from("courts")
                .select("id")
                .eq("owner_id", user.id);

            const courtIds = courts?.map((c) => c.id) || [];
            if (courtIds.length === 0) return { success: true, data: [] };

            // Get bookings for those courts
            const { data: bookings, error } = await supabase
                .from("bookings")
                .select(`
                    *,
                    court:courts(name),
                    package:packages(name)
                `)
                .in("court_id", courtIds)
                .order("start_time", { ascending: false });

            if (error) {
                console.error("getCourtBookings error:", error);
                return { success: false, data: [] };
            }

            // Fetch player profiles separately
            const userIds = [...new Set((bookings || []).map((b: any) => b.user_id))];
            const { data: profiles } = await supabase
                .from("profiles")
                .select("id, name, phone, avatar")
                .in("id", userIds);

            const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]));

            const result: BookingManagement[] = (bookings || []).map((b: any) => {
                const player = profileMap.get(b.user_id);
                return {
                    id: b.id,
                    userId: b.user_id,
                    courtId: b.court_id,
                    packageId: b.package_id,
                    startTime: new Date(b.start_time).getTime(),
                    endTime: new Date(b.end_time).getTime(),
                    status: b.status,
                    totalAmount: b.total_amount,
                    courtName: b.court?.name || "Unknown",
                    packageName: b.package?.name,
                    playerName: player?.name || "Player",
                    playerPhone: player?.phone || "",
                    playerAvatar: player?.avatar,
                };
            });

            return { success: true, data: result };
        } catch (e) {
            console.error("getCourtBookings error:", e);
            return { success: false, data: [] };
        }
    },

    approveBooking: async (bookingId: string): Promise<ApiResponse<boolean>> => {
        const { error } = await supabase
            .from("bookings")
            .update({ status: "active" })
            .eq("id", bookingId);

        if (error) return { success: false, data: false, error: error.message };
        return { success: true, data: true };
    },

    cancelBooking: async (bookingId: string, reason?: string): Promise<ApiResponse<boolean>> => {
        const { error } = await supabase
            .from("bookings")
            .update({ status: "cancelled", cancel_reason: reason })
            .eq("id", bookingId);

        if (error) return { success: false, data: false, error: error.message };
        return { success: true, data: true };
    },

    createCourt: async (data: CourtFormData): Promise<ApiResponse<any>> => {
        const {
            data: { user },
        } = await supabase.auth.getUser();
        if (!user) return { success: false, data: null, error: "Not authenticated" };

        try {
            const { data: court, error } = await supabase
                .from("courts")
                .insert({
                    owner_id: user.id,
                    name: data.name,
                    address: data.address,
                    description: data.description || null,
                    price_per_hour: data.pricePerHour,
                    open_time: data.openTime,
                    close_time: data.closeTime,
                    facilities: data.facilities,
                    images: data.images,
                    is_active: data.isActive,
                    auto_approve_bookings: data.autoApproveBookings,
                    status: "available",
                    rating: 0,
                    total_reviews: 0,
                })
                .select()
                .single();

            if (error) {
                console.error("createCourt error:", error);
                return { success: false, data: null, error: error.message };
            }

            return { success: true, data: court };
        } catch (e) {
            console.error("createCourt error:", e);
            return { success: false, data: null, error: "Failed to create court" };
        }
    },

    updateCourt: async (courtId: string, data: Partial<CourtFormData>): Promise<ApiResponse<any>> => {
        const updateData: any = {};
        if (data.name !== undefined) updateData.name = data.name;
        if (data.address !== undefined) updateData.address = data.address;
        if (data.description !== undefined) updateData.description = data.description;
        if (data.pricePerHour !== undefined) updateData.price_per_hour = data.pricePerHour;
        if (data.openTime !== undefined) updateData.open_time = data.openTime;
        if (data.closeTime !== undefined) updateData.close_time = data.closeTime;
        if (data.facilities !== undefined) updateData.facilities = data.facilities;
        if (data.images !== undefined) updateData.images = data.images;
        if (data.isActive !== undefined) updateData.is_active = data.isActive;
        if (data.autoApproveBookings !== undefined) updateData.auto_approve_bookings = data.autoApproveBookings;

        try {
            const { data: court, error } = await supabase
                .from("courts")
                .update(updateData)
                .eq("id", courtId)
                .select()
                .single();

            if (error) {
                console.error("updateCourt error:", error);
                return { success: false, data: null, error: error.message };
            }

            return { success: true, data: court };
        } catch (e) {
            console.error("updateCourt error:", e);
            return { success: false, data: null, error: "Failed to update court" };
        }
    },

    deleteCourt: async (courtId: string): Promise<ApiResponse<boolean>> => {
        try {
            const { error } = await supabase.from("courts").delete().eq("id", courtId);

            if (error) {
                console.error("deleteCourt error:", error);
                return { success: false, data: false, error: error.message };
            }

            return { success: true, data: true };
        } catch (e) {
            console.error("deleteCourt error:", e);
            return { success: false, data: false, error: "Failed to delete court" };
        }
    },

    toggleCourtStatus: async (courtId: string, isActive: boolean): Promise<ApiResponse<boolean>> => {
        const { error } = await supabase
            .from("courts")
            .update({ is_active: isActive })
            .eq("id", courtId);

        if (error) return { success: false, data: false, error: error.message };
        return { success: true, data: true };
    },
};
