/**
 * BookingService Unit Tests
 */

import { BookingService } from '../../services/booking.service';
import { supabase } from '../../lib/supabase';

// Mock supabase
jest.mock('../../lib/supabase', () => ({
    supabase: {
        auth: {
            getUser: jest.fn(),
        },
        from: jest.fn(),
    },
}));

describe('BookingService', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('getBookingHistory', () => {
        it('should return empty array when not authenticated', async () => {
            (supabase.auth.getUser as jest.Mock).mockResolvedValue({
                data: { user: null },
            });

            const result = await BookingService.getBookingHistory();

            expect(result.success).toBe(false);
            expect(result.data).toEqual([]);
        });

        it('should return bookings when authenticated', async () => {
            const mockUser = { id: 'user-123' };
            const mockBookings = [
                {
                    id: 'booking-1',
                    user_id: 'user-123',
                    court_id: 'court-1',
                    start_time: '2024-01-15T10:00:00Z',
                    end_time: '2024-01-15T11:00:00Z',
                    status: 'active',
                    total_amount: 200000,
                    court: { name: 'Sân A' },
                    package: { name: 'Gói Standard' },
                },
            ];

            (supabase.auth.getUser as jest.Mock).mockResolvedValue({
                data: { user: mockUser },
            });

            (supabase.from as jest.Mock).mockReturnValue({
                select: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                order: jest.fn().mockResolvedValue({
                    data: mockBookings,
                    error: null,
                }),
            });

            const result = await BookingService.getBookingHistory();

            expect(result.success).toBe(true);
            expect(result.data).toHaveLength(1);
            expect(result.data[0].courtName).toBe('Sân A');
            expect(result.data[0].status).toBe('active');
        });
    });

    describe('getActiveBooking', () => {
        it('should return null when no active booking', async () => {
            const mockUser = { id: 'user-123' };

            (supabase.auth.getUser as jest.Mock).mockResolvedValue({
                data: { user: mockUser },
            });

            (supabase.from as jest.Mock).mockReturnValue({
                select: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                lte: jest.fn().mockReturnThis(),
                gte: jest.fn().mockReturnThis(),
                order: jest.fn().mockReturnThis(),
                limit: jest.fn().mockReturnThis(),
                maybeSingle: jest.fn().mockResolvedValue({
                    data: null,
                    error: null,
                }),
            });

            const result = await BookingService.getActiveBooking();

            expect(result.success).toBe(true);
            expect(result.data).toBeNull();
        });

        it('should return active booking when exists', async () => {
            const mockUser = { id: 'user-123' };
            const now = new Date();
            const mockBooking = {
                id: 'booking-1',
                user_id: 'user-123',
                court_id: 'court-1',
                start_time: new Date(now.getTime() - 30 * 60000).toISOString(),
                end_time: new Date(now.getTime() + 30 * 60000).toISOString(),
                status: 'active',
                total_amount: 200000,
                package: { name: 'Full Match' },
            };

            (supabase.auth.getUser as jest.Mock).mockResolvedValue({
                data: { user: mockUser },
            });

            (supabase.from as jest.Mock).mockReturnValue({
                select: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                lte: jest.fn().mockReturnThis(),
                gte: jest.fn().mockReturnThis(),
                order: jest.fn().mockReturnThis(),
                limit: jest.fn().mockReturnThis(),
                maybeSingle: jest.fn().mockResolvedValue({
                    data: mockBooking,
                    error: null,
                }),
            });

            const result = await BookingService.getActiveBooking();

            expect(result.success).toBe(true);
            expect(result.data).not.toBeNull();
            expect(result.data?.id).toBe('booking-1');
            expect(result.data?.packageType).toBe('full_match');
        });
    });

    describe('createBooking', () => {
        it('should return error when not authenticated', async () => {
            (supabase.auth.getUser as jest.Mock).mockResolvedValue({
                data: { user: null },
            });

            const result = await BookingService.createBooking({
                courtId: 'court-1',
                startTime: Date.now(),
                durationHours: 1,
            });

            expect(result.success).toBe(false);
            expect(result.error).toBe('Not authenticated');
        });

        it('should return error when insufficient credits', async () => {
            const mockUser = { id: 'user-123' };

            (supabase.auth.getUser as jest.Mock).mockResolvedValue({
                data: { user: mockUser },
            });

            // Mock court price
            const courtMock = { data: { price_per_hour: 200000 }, error: null };
            const profileMock = { data: { credits: 50000 }, error: null }; // Not enough

            (supabase.from as jest.Mock).mockImplementation((table) => {
                if (table === 'courts') {
                    return {
                        select: jest.fn().mockReturnThis(),
                        eq: jest.fn().mockReturnThis(),
                        single: jest.fn().mockResolvedValue(courtMock),
                    };
                }
                if (table === 'profiles') {
                    return {
                        select: jest.fn().mockReturnThis(),
                        eq: jest.fn().mockReturnThis(),
                        single: jest.fn().mockResolvedValue(profileMock),
                    };
                }
                return { select: jest.fn() };
            });

            const result = await BookingService.createBooking({
                courtId: 'court-1',
                startTime: Date.now(),
                durationHours: 1,
            });

            expect(result.success).toBe(false);
            expect(result.error).toBe('Số dư không đủ');
        });
    });

    describe('cancelBooking', () => {
        it('should return error when not authenticated', async () => {
            (supabase.auth.getUser as jest.Mock).mockResolvedValue({
                data: { user: null },
            });

            const result = await BookingService.cancelBooking('booking-1');

            expect(result.success).toBe(false);
            expect(result.error).toBe('Not authenticated');
        });

        it('should return error when booking not found', async () => {
            const mockUser = { id: 'user-123' };

            (supabase.auth.getUser as jest.Mock).mockResolvedValue({
                data: { user: mockUser },
            });

            (supabase.from as jest.Mock).mockReturnValue({
                select: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                single: jest.fn().mockResolvedValue({
                    data: null,
                    error: null,
                }),
            });

            const result = await BookingService.cancelBooking('nonexistent-booking');

            expect(result.success).toBe(false);
            expect(result.error).toBe('Booking not found');
        });
    });
});
