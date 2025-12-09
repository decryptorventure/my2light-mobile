/**
 * Admin Service
 * API methods for court owner management
 */

import { supabase } from "../lib/supabase";
import { ApiResponse, Booking } from "../types";
import { logger } from "../lib/logger";

const adminLogger = logger.create('Admin');

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
    pendingBookings: number;
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
        if (!user) return { success: false, data: { totalRevenue: 0, todayBookings: 0, pendingBookings: 0, totalCourts: 0, averageRating: 0 } };

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

            if (courtIds.length === 0) {
                return {
                    success: true,
                    data: { totalRevenue: 0, todayBookings: 0, pendingBookings: 0, totalCourts: 0, averageRating: 0 },
                };
            }

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

            // Get pending bookings count
            const { data: pendingData } = await supabase
                .from("bookings")
                .select("id")
                .in("court_id", courtIds)
                .eq("status", "pending");

            const pendingBookings = pendingData?.length || 0;

            // Get total revenue (completed and approved bookings)
            const { data: revenueData } = await supabase
                .from("bookings")
                .select("total_amount")
                .in("court_id", courtIds)
                .in("status", ["completed", "approved", "active"]);

            const totalRevenue = revenueData?.reduce((sum, b) => sum + (b.total_amount || 0), 0) || 0;

            return {
                success: true,
                data: { totalRevenue, todayBookings, pendingBookings, totalCourts, averageRating },
            };
        } catch (e) {
            adminLogger.error("getDashboardStats error:", e);
            return { success: false, data: { totalRevenue: 0, todayBookings: 0, pendingBookings: 0, totalCourts: 0, averageRating: 0 } };
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

    /**
     * Approve a pending booking
     * Sets status to 'approved' and records approval time
     */
    approveBooking: async (bookingId: string): Promise<ApiResponse<boolean>> => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { success: false, data: false, error: 'Not authenticated' };

        try {
            const { error } = await supabase
                .from("bookings")
                .update({
                    status: "approved",
                    approved_at: new Date().toISOString(),
                    approved_by: user.id
                })
                .eq("id", bookingId);

            if (error) {
                adminLogger.error('approveBooking error', error);
                return { success: false, data: false, error: error.message };
            }

            adminLogger.info('Booking approved', { bookingId });
            return { success: true, data: true };
        } catch (e) {
            adminLogger.error('approveBooking exception', e);
            return { success: false, data: false, error: 'Failed to approve booking' };
        }
    },

    /**
     * Reject a pending booking
     * Sets status to 'rejected' and refunds credits to user
     */
    rejectBooking: async (bookingId: string, reason?: string): Promise<ApiResponse<boolean>> => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { success: false, data: false, error: 'Not authenticated' };

        try {
            // Get booking details for refund
            const { data: booking } = await supabase
                .from('bookings')
                .select('user_id, total_amount, status')
                .eq('id', bookingId)
                .single();

            if (!booking) {
                return { success: false, data: false, error: 'Booking not found' };
            }

            if (booking.status !== 'pending') {
                return { success: false, data: false, error: 'Chỉ có thể từ chối booking đang chờ duyệt' };
            }

            // Update booking status
            const { error } = await supabase
                .from("bookings")
                .update({
                    status: "rejected",
                    cancel_reason: reason || 'Bị từ chối bởi chủ sân'
                })
                .eq("id", bookingId);

            if (error) {
                adminLogger.error('rejectBooking error', error);
                return { success: false, data: false, error: error.message };
            }

            // Refund credits to user
            const { data: userProfile } = await supabase
                .from('profiles')
                .select('credits')
                .eq('id', booking.user_id)
                .single();

            await supabase
                .from('profiles')
                .update({ credits: (userProfile?.credits || 0) + booking.total_amount })
                .eq('id', booking.user_id);

            adminLogger.info('Booking rejected', { bookingId, reason });
            return { success: true, data: true };
        } catch (e) {
            adminLogger.error('rejectBooking exception', e);
            return { success: false, data: false, error: 'Failed to reject booking' };
        }
    },

    /**
     * Cancel a booking (by owner)
     */
    cancelBooking: async (bookingId: string, reason?: string): Promise<ApiResponse<boolean>> => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { success: false, data: false, error: 'Not authenticated' };

        try {
            // Get booking details for refund
            const { data: booking } = await supabase
                .from('bookings')
                .select('user_id, total_amount')
                .eq('id', bookingId)
                .single();

            if (!booking) {
                return { success: false, data: false, error: 'Booking not found' };
            }

            const { error } = await supabase
                .from("bookings")
                .update({ status: "cancelled", cancel_reason: reason })
                .eq("id", bookingId);

            if (error) {
                adminLogger.error('cancelBooking error', error);
                return { success: false, data: false, error: error.message };
            }

            // Refund credits
            const { data: userProfile } = await supabase
                .from('profiles')
                .select('credits')
                .eq('id', booking.user_id)
                .single();

            await supabase
                .from('profiles')
                .update({ credits: (userProfile?.credits || 0) + booking.total_amount })
                .eq('id', booking.user_id);

            adminLogger.info('Booking cancelled by owner', { bookingId, reason });
            return { success: true, data: true };
        } catch (e) {
            adminLogger.error('cancelBooking exception', e);
            return { success: false, data: false, error: 'Failed to cancel booking' };
        }
    },

    /**
     * Get pending bookings count for owner's courts
     */
    getPendingBookingsCount: async (): Promise<ApiResponse<number>> => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { success: false, data: 0 };

        try {
            const { data: courts } = await supabase
                .from('courts')
                .select('id')
                .eq('owner_id', user.id);

            const courtIds = courts?.map(c => c.id) || [];
            if (courtIds.length === 0) return { success: true, data: 0 };

            const { count } = await supabase
                .from('bookings')
                .select('id', { count: 'exact', head: true })
                .in('court_id', courtIds)
                .eq('status', 'pending');

            return { success: true, data: count || 0 };
        } catch (e) {
            adminLogger.error('getPendingBookingsCount error', e);
            return { success: false, data: 0 };
        }
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
                adminLogger.error("createCourt error", error);
                return { success: false, data: null, error: error.message };
            }

            return { success: true, data: court };
        } catch (e) {
            adminLogger.error("createCourt exception", e);
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
                adminLogger.error("updateCourt error", error);
                return { success: false, data: null, error: error.message };
            }

            return { success: true, data: court };
        } catch (e) {
            adminLogger.error("updateCourt exception", e);
            return { success: false, data: null, error: "Failed to update court" };
        }
    },

    deleteCourt: async (courtId: string): Promise<ApiResponse<boolean>> => {
        try {
            const { error } = await supabase.from("courts").delete().eq("id", courtId);

            if (error) {
                adminLogger.error("deleteCourt error", error);
                return { success: false, data: false, error: error.message };
            }

            return { success: true, data: true };
        } catch (e) {
            adminLogger.error("deleteCourt exception", e);
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
