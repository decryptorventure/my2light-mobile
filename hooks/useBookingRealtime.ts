/**
 * useBookingRealtime Hook
 * Real-time booking status monitoring
 */

import { useState, useEffect, useCallback } from "react";
import { BookingService, BookingDetail, BookingStatus } from "../services/booking.service";
import {
    subscribeToBooking,
    subscribeToUserBookings,
    RealtimeSubscription,
    BookingChange,
} from "../services/realtime.service";
import { useAuthStore } from "../stores/authStore";

export interface UseBookingRealtimeResult {
    booking: BookingDetail | null;
    status: BookingStatus | null;
    isLoading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
}

/**
 * Hook to subscribe to a single booking's real-time updates
 */
export function useBookingRealtime(bookingId: string | null): UseBookingRealtimeResult {
    const [booking, setBooking] = useState<BookingDetail | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchBooking = useCallback(async () => {
        if (!bookingId) {
            setBooking(null);
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const result = await BookingService.getBookingById(bookingId);
            if (result.success && result.data) {
                setBooking(result.data);
            } else {
                setError(result.error || "Failed to fetch booking");
            }
        } catch (e) {
            setError("Failed to fetch booking");
        } finally {
            setIsLoading(false);
        }
    }, [bookingId]);

    useEffect(() => {
        fetchBooking();
    }, [fetchBooking]);

    // Subscribe to real-time updates
    useEffect(() => {
        if (!bookingId) return;

        const subscription = subscribeToBooking(bookingId, (newStatus, oldStatus) => {
            // Update local state immediately
            setBooking((prev) => (prev ? { ...prev, status: newStatus } : null));
        });

        return () => {
            subscription.unsubscribe();
        };
    }, [bookingId]);

    return {
        booking,
        status: booking?.status as BookingStatus | null,
        isLoading,
        error,
        refetch: fetchBooking,
    };
}

export interface UseUpcomingBookingsResult {
    bookings: BookingDetail[];
    isLoading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
}

/**
 * Hook to get user's upcoming bookings with real-time updates
 */
export function useUpcomingBookings(): UseUpcomingBookingsResult {
    const { user } = useAuthStore();
    const [bookings, setBookings] = useState<BookingDetail[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchBookings = useCallback(async () => {
        if (!user?.id) {
            setBookings([]);
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        try {
            const result = await BookingService.getUpcomingBookings();
            if (result.success) {
                setBookings(result.data as BookingDetail[]);
            }
        } catch (e) {
            setError("Failed to fetch bookings");
        } finally {
            setIsLoading(false);
        }
    }, [user?.id]);

    useEffect(() => {
        fetchBookings();
    }, [fetchBookings]);

    // Subscribe to real-time updates for user's bookings
    useEffect(() => {
        if (!user?.id) return;

        const subscription = subscribeToUserBookings(user.id, (change: BookingChange) => {
            if (change.eventType === "INSERT") {
                // New booking - refetch to get full data
                fetchBookings();
            } else if (change.eventType === "UPDATE") {
                // Update the specific booking
                setBookings((prev) =>
                    prev.map((b) =>
                        b.id === change.new.id ? { ...b, status: change.new.status } : b
                    )
                );
            } else if (change.eventType === "DELETE") {
                // Remove the booking
                setBookings((prev) => prev.filter((b) => b.id !== change.old.id));
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, [user?.id, fetchBookings]);

    return {
        bookings,
        isLoading,
        error,
        refetch: fetchBookings,
    };
}

/**
 * Hook to check slot availability with real-time updates
 */
export function useSlotAvailability(courtId: string | null, date: Date | null) {
    const [slots, setSlots] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchSlots = useCallback(async () => {
        if (!courtId || !date) {
            setSlots([]);
            return;
        }

        setIsLoading(true);
        try {
            const result = await BookingService.getAvailableSlots(courtId, date);
            if (result.success) {
                setSlots(result.data);
            }
        } catch (e) {
            setError("Failed to fetch slots");
        } finally {
            setIsLoading(false);
        }
    }, [courtId, date?.toDateString()]);

    useEffect(() => {
        fetchSlots();
    }, [fetchSlots]);

    return {
        slots,
        isLoading,
        error,
        refetch: fetchSlots,
    };
}
