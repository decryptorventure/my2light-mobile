import { useQuery } from '@tanstack/react-query';
import { BookingService } from '../booking.service';

export const bookingQueryKeys = {
    all: ['bookings'] as const,
    history: () => [...bookingQueryKeys.all, 'history'] as const,
    active: () => [...bookingQueryKeys.all, 'active'] as const,
};

export function useBookingHistory() {
    return useQuery({
        queryKey: bookingQueryKeys.history(),
        queryFn: async () => {
            const result = await BookingService.getBookingHistory();
            return result.data;
        },
        staleTime: 60000,
    });
}

export function useActiveBooking() {
    return useQuery({
        queryKey: bookingQueryKeys.active(),
        queryFn: async () => {
            const result = await BookingService.getActiveBooking();
            return result.data;
        },
        staleTime: 30000, // 30 seconds
    });
}
