/**
 * Realtime Service
 * Centralized Supabase Realtime subscriptions
 */

import { supabase } from "../lib/supabase";
import { RealtimeChannel, RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import { logger } from "../lib/logger";

const realtimeLogger = logger.create("Realtime");

// Booking status types
export type BookingStatus =
    | "pending"
    | "approved"
    | "active"
    | "completed"
    | "cancelled"
    | "rejected";

export interface BookingChange {
    eventType: "INSERT" | "UPDATE" | "DELETE";
    new: any;
    old: any;
}

export interface RealtimeSubscription {
    channel: RealtimeChannel;
    unsubscribe: () => void;
}

/**
 * Subscribe to booking changes for a specific user
 */
export function subscribeToUserBookings(
    userId: string,
    onBookingChange: (change: BookingChange) => void
): RealtimeSubscription {
    realtimeLogger.debug("Subscribing to user bookings", { userId: userId.slice(0, 8) });

    const channel = supabase
        .channel(`user-bookings-${userId}`)
        .on(
            "postgres_changes",
            {
                event: "*",
                schema: "public",
                table: "bookings",
                filter: `user_id=eq.${userId}`,
            },
            (payload: RealtimePostgresChangesPayload<any>) => {
                realtimeLogger.debug("User booking change", { event: payload.eventType });
                onBookingChange({
                    eventType: payload.eventType as "INSERT" | "UPDATE" | "DELETE",
                    new: payload.new,
                    old: payload.old,
                });
            }
        )
        .subscribe((status) => {
            realtimeLogger.debug("User bookings subscription status", { status });
        });

    return {
        channel,
        unsubscribe: () => {
            realtimeLogger.debug("Unsubscribing from user bookings");
            supabase.removeChannel(channel);
        },
    };
}

/**
 * Subscribe to booking changes for a specific court (for court owners)
 */
export function subscribeToCourtBookings(
    courtId: string,
    onBookingChange: (change: BookingChange) => void
): RealtimeSubscription {
    realtimeLogger.debug("Subscribing to court bookings", { courtId: courtId.slice(0, 8) });

    const channel = supabase
        .channel(`court-bookings-${courtId}`)
        .on(
            "postgres_changes",
            {
                event: "*",
                schema: "public",
                table: "bookings",
                filter: `court_id=eq.${courtId}`,
            },
            (payload: RealtimePostgresChangesPayload<any>) => {
                realtimeLogger.debug("Court booking change", { event: payload.eventType });
                onBookingChange({
                    eventType: payload.eventType as "INSERT" | "UPDATE" | "DELETE",
                    new: payload.new,
                    old: payload.old,
                });
            }
        )
        .subscribe();

    return {
        channel,
        unsubscribe: () => {
            realtimeLogger.debug("Unsubscribing from court bookings");
            supabase.removeChannel(channel);
        },
    };
}

/**
 * Subscribe to a single booking (for status tracking)
 */
export function subscribeToBooking(
    bookingId: string,
    onStatusChange: (newStatus: BookingStatus, oldStatus: BookingStatus | null) => void
): RealtimeSubscription {
    realtimeLogger.debug("Subscribing to booking", { bookingId: bookingId.slice(0, 8) });

    const channel = supabase
        .channel(`booking-${bookingId}`)
        .on(
            "postgres_changes",
            {
                event: "UPDATE",
                schema: "public",
                table: "bookings",
                filter: `id=eq.${bookingId}`,
            },
            (payload: RealtimePostgresChangesPayload<any>) => {
                const oldData = payload.old as { status?: BookingStatus } | null;
                const newData = payload.new as { status?: BookingStatus } | null;
                const oldStatus = oldData?.status || null;
                const newStatus = newData?.status || "pending";

                if (oldStatus !== newStatus) {
                    realtimeLogger.info("Booking status changed", {
                        bookingId: bookingId.slice(0, 8),
                        from: oldStatus,
                        to: newStatus,
                    });
                    onStatusChange(newStatus, oldStatus);
                }
            }
        )
        .subscribe();

    return {
        channel,
        unsubscribe: () => {
            realtimeLogger.debug("Unsubscribing from booking");
            supabase.removeChannel(channel);
        },
    };
}

/**
 * Subscribe to pending bookings for all owner's courts
 */
export function subscribeToOwnerPendingBookings(
    ownerId: string,
    onNewPending: (booking: any) => void
): RealtimeSubscription {
    realtimeLogger.debug("Subscribing to owner pending bookings");

    // Note: This requires a different approach since we can't filter by joined table
    // We'll subscribe to all bookings and filter client-side
    const channel = supabase
        .channel(`owner-pending-${ownerId}`)
        .on(
            "postgres_changes",
            {
                event: "INSERT",
                schema: "public",
                table: "bookings",
            },
            async (payload: RealtimePostgresChangesPayload<any>) => {
                // Only notify if it's a pending booking
                const newBooking = payload.new as { status?: string; court_id?: string } | null;
                if (newBooking?.status === "pending" && newBooking?.court_id) {
                    // Check if this court belongs to the owner
                    const { data: court } = await supabase
                        .from("courts")
                        .select("owner_id")
                        .eq("id", newBooking.court_id)
                        .single();

                    if (court?.owner_id === ownerId) {
                        realtimeLogger.info("New pending booking for owner");
                        onNewPending(payload.new);
                    }
                }
            }
        )
        .subscribe();

    return {
        channel,
        unsubscribe: () => {
            supabase.removeChannel(channel);
        },
    };
}

/**
 * Cleanup all realtime subscriptions
 */
export async function cleanupAllSubscriptions(): Promise<void> {
    realtimeLogger.debug("Cleaning up all realtime subscriptions");
    await supabase.removeAllChannels();
}
