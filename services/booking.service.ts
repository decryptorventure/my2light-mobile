import { supabase } from '../lib/supabase';
import { Booking, ApiResponse } from '../types';

export const BookingService = {
    getBookingHistory: async (): Promise<ApiResponse<Booking[]>> => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { success: false, data: [] };

        const { data, error } = await supabase
            .from('bookings')
            .select(`*, court:courts(name), package:packages(name)`)
            .eq('user_id', user.id)
            .order('start_time', { ascending: false });

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
            courtName: b.court?.name || 'Sân không xác định',
            packageName: b.package?.name || 'Gói dịch vụ',
            packageType: b.package?.name?.includes('Full') ? 'full_match' : 'standard'
        }));

        return { success: true, data: bookings };
    },

    getActiveBooking: async (): Promise<ApiResponse<Booking | null>> => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { success: false, data: null };

        const now = new Date().toISOString();
        const bufferTime = new Date(Date.now() + 15 * 60000).toISOString();

        const { data, error } = await supabase
            .from('bookings')
            .select(`*, package:packages(name)`)
            .eq('user_id', user.id)
            .eq('status', 'active')
            .lte('start_time', bufferTime)
            .gte('end_time', now)
            .order('start_time', { ascending: false })
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
                packageType: data.package?.name?.includes('Full') ? 'full_match' : 'standard'
            }
        };
    },

    createBooking: async (data: {
        courtId: string;
        startTime: number;
        durationHours: number;
        packageId?: string;
    }): Promise<ApiResponse<Booking | null>> => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { success: false, data: null, error: 'Not authenticated' };

        try {
            // Get court price
            const { data: court } = await supabase
                .from('courts')
                .select('price_per_hour')
                .eq('id', data.courtId)
                .single();

            const courtPrice = (court?.price_per_hour || 0) * data.durationHours;

            // Get package price if selected
            let packagePrice = 0;
            if (data.packageId) {
                const { data: pkg } = await supabase
                    .from('packages')
                    .select('price')
                    .eq('id', data.packageId)
                    .single();
                packagePrice = pkg?.price || 0;
            }

            const totalAmount = courtPrice + packagePrice;

            // Check user credits
            const { data: profile } = await supabase
                .from('profiles')
                .select('credits')
                .eq('id', user.id)
                .single();

            if ((profile?.credits || 0) < totalAmount) {
                return { success: false, data: null, error: 'Số dư không đủ' };
            }

            // Calculate end time
            const endTime = new Date(data.startTime + data.durationHours * 60 * 60 * 1000);

            // Create booking
            const { data: booking, error } = await supabase
                .from('bookings')
                .insert({
                    user_id: user.id,
                    court_id: data.courtId,
                    package_id: data.packageId || null,
                    start_time: new Date(data.startTime).toISOString(),
                    end_time: endTime.toISOString(),
                    status: 'active',
                    total_amount: totalAmount
                })
                .select()
                .single();

            if (error) {
                console.error('Create booking error:', error);
                return { success: false, data: null, error: error.message };
            }

            // Deduct credits
            await supabase
                .from('profiles')
                .update({ credits: (profile?.credits || 0) - totalAmount })
                .eq('id', user.id);

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
                    totalAmount: booking.total_amount
                }
            };
        } catch (e) {
            console.error('createBooking error:', e);
            return { success: false, data: null, error: 'Failed to create booking' };
        }
    },

    getAvailableSlots: async (courtId: string, date: Date): Promise<ApiResponse<string[]>> => {
        try {
            // Get court hours
            const { data: court } = await supabase
                .from('courts')
                .select('open_time, close_time')
                .eq('id', courtId)
                .single();

            const openHour = parseInt(court?.open_time?.split(':')[0] || '6');
            const closeHour = parseInt(court?.close_time?.split(':')[0] || '22');

            // Get existing bookings for that date
            const startOfDay = new Date(date);
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(date);
            endOfDay.setHours(23, 59, 59, 999);

            const { data: bookings } = await supabase
                .from('bookings')
                .select('start_time, end_time')
                .eq('court_id', courtId)
                .gte('start_time', startOfDay.toISOString())
                .lte('start_time', endOfDay.toISOString())
                .neq('status', 'cancelled');

            // Generate all slots
            const allSlots: string[] = [];
            for (let hour = openHour; hour < closeHour; hour++) {
                allSlots.push(`${hour.toString().padStart(2, '0')}:00`);
                allSlots.push(`${hour.toString().padStart(2, '0')}:30`);
            }

            // Filter out booked slots
            const bookedSlots = new Set<string>();
            bookings?.forEach(b => {
                const start = new Date(b.start_time);
                bookedSlots.add(`${start.getHours().toString().padStart(2, '0')}:${start.getMinutes().toString().padStart(2, '0')}`);
            });

            const availableSlots = allSlots.filter(slot => !bookedSlots.has(slot));

            return { success: true, data: availableSlots };
        } catch (e) {
            console.error('getAvailableSlots error:', e);
            return { success: false, data: [] };
        }
    },

    cancelBooking: async (bookingId: string): Promise<ApiResponse<boolean>> => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { success: false, data: false, error: 'Not authenticated' };

        try {
            // Get booking details
            const { data: booking } = await supabase
                .from('bookings')
                .select('total_amount, status')
                .eq('id', bookingId)
                .eq('user_id', user.id)
                .single();

            if (!booking) {
                return { success: false, data: false, error: 'Booking not found' };
            }

            if (booking.status === 'cancelled') {
                return { success: false, data: false, error: 'Booking already cancelled' };
            }

            // Update booking status
            const { error } = await supabase
                .from('bookings')
                .update({ status: 'cancelled' })
                .eq('id', bookingId);

            if (error) {
                return { success: false, data: false, error: error.message };
            }

            // Refund credits
            const { data: profile } = await supabase
                .from('profiles')
                .select('credits')
                .eq('id', user.id)
                .single();

            await supabase
                .from('profiles')
                .update({ credits: (profile?.credits || 0) + booking.total_amount })
                .eq('id', user.id);

            return { success: true, data: true };
        } catch (e) {
            console.error('cancelBooking error:', e);
            return { success: false, data: false, error: 'Failed to cancel booking' };
        }
    }
};
