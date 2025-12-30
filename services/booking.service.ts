import { supabase } from "../lib/supabase";
import { Booking, ApiResponse } from "../types";
import { logger } from "../lib/logger";

const bookingLogger = logger.create("Booking");

// Extended booking type with new fields
export interface BookingDetail extends Booking {
    courtAddress?: string;
    courtOwnerId?: string;
    playerName?: string;
    playerPhone?: string;
    playerAvatar?: string;
    cancelReason?: string;
    approvedAt?: string;
    notes?: string;
}

export type BookingStatus =
    | "pending"
    | "approved"
    | "active"
    | "completed"
    | "cancelled"
    | "rejected";

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

        // Include both 'approved' and 'active' status
        const { data, error } = await supabase
            .from("bookings")
            .select(`*, package:packages(name)`)
            .eq("user_id", user.id)
            .in("status", ["approved", "active"])
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

    /**
     * Get a single booking with full details
     */
    getBookingById: async (bookingId: string): Promise<ApiResponse<BookingDetail | null>> => {
        const {
            data: { user },
        } = await supabase.auth.getUser();
        if (!user) return { success: false, data: null, error: "Not authenticated" };

        const { data, error } = await supabase
            .from("bookings")
            .select(
                `
                *,
                court:courts(name, address, owner_id),
                package:packages(name),
                player:profiles!bookings_user_id_fkey(name, phone, avatar)
            `
            )
            .eq("id", bookingId)
            .single();

        if (error || !data) {
            bookingLogger.error("getBookingById error", error);
            return { success: false, data: null, error: error?.message || "Booking not found" };
        }

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
                courtName: data.court?.name || "Sân không xác định",
                courtAddress: data.court?.address,
                courtOwnerId: data.court?.owner_id,
                packageName: data.package?.name,
                playerName: data.player?.name,
                playerPhone: data.player?.phone,
                playerAvatar: data.player?.avatar,
                cancelReason: data.cancel_reason,
                approvedAt: data.approved_at,
                notes: data.notes,
            },
        };
    },

    /**
     * Check if a time slot has conflicts
     */
    checkSlotConflict: async (
        courtId: string,
        startTime: Date,
        endTime: Date,
        excludeBookingId?: string
    ): Promise<boolean> => {
        try {
            const { data, error } = await supabase
                .from("bookings")
                .select("id")
                .eq("court_id", courtId)
                .in("status", ["pending", "approved", "active"])
                .neq("id", excludeBookingId || "00000000-0000-0000-0000-000000000000")
                .or(
                    `and(start_time.lte.${startTime.toISOString()},end_time.gt.${startTime.toISOString()}),and(start_time.lt.${endTime.toISOString()},end_time.gte.${endTime.toISOString()}),and(start_time.gte.${startTime.toISOString()},end_time.lte.${endTime.toISOString()})`
                )
                .limit(1);

            if (error) {
                bookingLogger.error("checkSlotConflict error", error);
                return true; // Assume conflict on error to be safe
            }

            return (data?.length || 0) > 0;
        } catch (e) {
            bookingLogger.error("checkSlotConflict exception", e);
            return true;
        }
    },

    /**
     * Create a new booking with 'pending' status (requires owner approval)
     */
    createBooking: async (data: {
        courtId: string;
        startTime: number;
        durationHours: number;
        packageId?: string;
        notes?: string;
    }): Promise<ApiResponse<Booking | null>> => {
        const {
            data: { user },
        } = await supabase.auth.getUser();
        if (!user) return { success: false, data: null, error: "Not authenticated" };

        try {
            // Calculate end time
            const startTimeDate = new Date(data.startTime);
            const endTimeDate = new Date(data.startTime + data.durationHours * 60 * 60 * 1000);

            // Check for conflicts first
            const hasConflict = await BookingService.checkSlotConflict(
                data.courtId,
                startTimeDate,
                endTimeDate
            );

            if (hasConflict) {
                return { success: false, data: null, error: "Khung giờ này đã được đặt" };
            }

            // Get court price
            const { data: court } = await supabase
                .from("courts")
                .select("price_per_hour, owner_id")
                .eq("id", data.courtId)
                .single();

            const courtPrice = (court?.price_per_hour || 0) * data.durationHours;

            // Get package price if selected
            let packagePrice = 0;
            if (data.packageId) {
                const { data: pkg } = await supabase
                    .from("packages")
                    .select("price")
                    .eq("id", data.packageId)
                    .single();
                packagePrice = pkg?.price || 0;
            }

            const totalAmount = courtPrice + packagePrice;

            // Check user credits
            const { data: profile } = await supabase
                .from("profiles")
                .select("credits")
                .eq("id", user.id)
                .single();

            if ((profile?.credits || 0) < totalAmount) {
                return { success: false, data: null, error: "Số dư không đủ" };
            }

            // Create booking with 'pending' status
            const { data: booking, error } = await supabase
                .from("bookings")
                .insert({
                    user_id: user.id,
                    court_id: data.courtId,
                    package_id: data.packageId || null,
                    start_time: startTimeDate.toISOString(),
                    end_time: endTimeDate.toISOString(),
                    status: "pending", // Changed from 'active' to 'pending'
                    total_amount: totalAmount,
                    notes: data.notes || null,
                })
                .select()
                .single();

            if (error) {
                bookingLogger.error("Create booking error", error);
                return { success: false, data: null, error: error.message };
            }

            // Reserve credits (hold, don't deduct yet - will deduct on approval)
            // For now, we still deduct immediately but can refund if rejected
            await supabase
                .from("profiles")
                .update({ credits: (profile?.credits || 0) - totalAmount })
                .eq("id", user.id);

            bookingLogger.info("Booking created", { id: booking.id, status: "pending" });

            return {
                success: true,
                data: {
                    id: booking.id,
                    userId: booking.user_id,
                    courtId: booking.court_id,
                    packageId: booking.package_id,
                    startTime: new Date(booking.start_time).getTime(),
                    endTime: new Date(booking.end_time).getTime(),
                    status: booking.status,
                    totalAmount: booking.total_amount,
                },
            };
        } catch (e) {
            bookingLogger.error("createBooking error", e);
            return { success: false, data: null, error: "Failed to create booking" };
        }
    },

    /**
     * Get available time slots for a court on a specific date
     * Uses REAL booking data instead of mock
     */
    getAvailableSlots: async (courtId: string, date: Date): Promise<ApiResponse<string[]>> => {
        try {
            // Get court hours
            const { data: court } = await supabase
                .from("courts")
                .select("open_time, close_time")
                .eq("id", courtId)
                .single();

            const openHour = parseInt(court?.open_time?.split(":")[0] || "6");
            const closeHour = parseInt(court?.close_time?.split(":")[0] || "22");

            // Get existing bookings for that date
            const startOfDay = new Date(date);
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(date);
            endOfDay.setHours(23, 59, 59, 999);

            const { data: bookings, error } = await supabase
                .from("bookings")
                .select("start_time, end_time")
                .eq("court_id", courtId)
                .gte("start_time", startOfDay.toISOString())
                .lte("start_time", endOfDay.toISOString())
                .in("status", ["pending", "approved", "active"]); // All blocking statuses

            if (error) {
                bookingLogger.error("getAvailableSlots error", error);
            }

            // Generate all slots
            const allSlots: string[] = [];
            const now = new Date();
            const isToday = date.toDateString() === now.toDateString();
            const currentHour = now.getHours();
            const currentMinute = now.getMinutes();

            for (let hour = openHour; hour < closeHour; hour++) {
                // For today, skip past hours
                if (isToday) {
                    if (hour < currentHour) continue;
                    if (hour === currentHour && currentMinute >= 30) {
                        // Already past :30, skip both slots
                        continue;
                    }
                }

                allSlots.push(`${hour.toString().padStart(2, "0")}:00`);

                // Only add :30 slot if not past
                if (
                    !isToday ||
                    hour > currentHour ||
                    (hour === currentHour && currentMinute < 30)
                ) {
                    allSlots.push(`${hour.toString().padStart(2, "0")}:30`);
                }
            }

            // Filter out booked slots
            const bookedSlots = new Set<string>();
            bookings?.forEach((b) => {
                const start = new Date(b.start_time);
                const end = new Date(b.end_time);

                // Mark all 30-min slots within the booking as booked
                let current = new Date(start);
                while (current < end) {
                    const slotStr = `${current.getHours().toString().padStart(2, "0")}:${current.getMinutes().toString().padStart(2, "0")}`;
                    bookedSlots.add(slotStr);
                    current = new Date(current.getTime() + 30 * 60000);
                }
            });

            const availableSlots = allSlots.filter((slot) => !bookedSlots.has(slot));

            return { success: true, data: availableSlots };
        } catch (e) {
            bookingLogger.error("getAvailableSlots error", e);
            return { success: false, data: [] };
        }
    },

    /**
     * Get upcoming/pending bookings for the current user
     */
    getUpcomingBookings: async (): Promise<ApiResponse<Booking[]>> => {
        const {
            data: { user },
        } = await supabase.auth.getUser();
        if (!user) return { success: false, data: [] };

        const now = new Date().toISOString();

        const { data, error } = await supabase
            .from("bookings")
            .select(`*, court:courts(name), package:packages(name)`)
            .eq("user_id", user.id)
            .in("status", ["pending", "approved", "active"])
            .gte("start_time", now)
            .order("start_time", { ascending: true })
            .limit(10);

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
            packageName: b.package?.name,
        }));

        return { success: true, data: bookings };
    },

    cancelBooking: async (bookingId: string, reason?: string): Promise<ApiResponse<boolean>> => {
        const {
            data: { user },
        } = await supabase.auth.getUser();
        if (!user) return { success: false, data: false, error: "Not authenticated" };

        try {
            // Get booking details
            const { data: booking } = await supabase
                .from("bookings")
                .select("total_amount, status, user_id")
                .eq("id", bookingId)
                .single();

            if (!booking) {
                return { success: false, data: false, error: "Booking not found" };
            }

            // Only allow owner or booker to cancel
            if (booking.user_id !== user.id) {
                // Check if user is court owner
                const { data: court } = await supabase
                    .from("courts")
                    .select("owner_id")
                    .eq("id", bookingId)
                    .single();

                if (court?.owner_id !== user.id) {
                    return { success: false, data: false, error: "Không có quyền hủy" };
                }
            }

            if (booking.status === "cancelled" || booking.status === "completed") {
                return { success: false, data: false, error: "Không thể hủy booking này" };
            }

            // Update booking status
            const { error } = await supabase
                .from("bookings")
                .update({
                    status: "cancelled",
                    cancel_reason: reason || null,
                })
                .eq("id", bookingId);

            if (error) {
                return { success: false, data: false, error: error.message };
            }

            // Refund credits
            const { data: profile } = await supabase
                .from("profiles")
                .select("credits")
                .eq("id", booking.user_id)
                .single();

            await supabase
                .from("profiles")
                .update({ credits: (profile?.credits || 0) + booking.total_amount })
                .eq("id", booking.user_id);

            bookingLogger.info("Booking cancelled", { id: bookingId, reason });

            return { success: true, data: true };
        } catch (e) {
            bookingLogger.error("cancelBooking error", e);
            return { success: false, data: false, error: "Failed to cancel booking" };
        }
    },
};
