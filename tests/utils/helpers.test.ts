/**
 * Utility Functions Unit Tests
 */

describe('Utility Functions', () => {
    describe('Date Formatting', () => {
        it('should format date for Vietnamese locale', () => {
            const date = new Date('2024-01-15T10:30:00Z');
            const formatted = date.toLocaleDateString('vi-VN', {
                weekday: 'short',
                day: 'numeric',
                month: 'short',
            });

            expect(formatted).toContain('15');
        });

        it('should format time correctly', () => {
            const date = new Date('2024-01-15T10:30:00Z');
            const timeFormatted = date.toLocaleTimeString('vi-VN', {
                hour: '2-digit',
                minute: '2-digit',
            });

            expect(timeFormatted).toBeDefined();
        });
    });

    describe('Currency Formatting', () => {
        it('should format VND currency', () => {
            const amount = 200000;
            const formatted = amount.toLocaleString('vi-VN') + 'đ';

            expect(formatted).toBe('200.000đ');
        });

        it('should handle zero amount', () => {
            const amount = 0;
            const formatted = amount.toLocaleString('vi-VN') + 'đ';

            expect(formatted).toBe('0đ');
        });

        it('should format large amounts correctly', () => {
            const amount = 1500000;
            const formatted = amount.toLocaleString('vi-VN') + 'đ';

            expect(formatted).toBe('1.500.000đ');
        });
    });

    describe('Time Slot Generation', () => {
        it('should generate 30-minute slots', () => {
            const openHour = 6;
            const closeHour = 22;
            const slots: string[] = [];

            for (let hour = openHour; hour < closeHour; hour++) {
                slots.push(`${hour.toString().padStart(2, '0')}:00`);
                slots.push(`${hour.toString().padStart(2, '0')}:30`);
            }

            expect(slots.length).toBe(32); // 16 hours * 2 slots
            expect(slots[0]).toBe('06:00');
            expect(slots[1]).toBe('06:30');
            expect(slots[slots.length - 1]).toBe('21:30');
        });

        it('should filter past time slots', () => {
            const now = new Date();
            now.setHours(10, 0, 0, 0);

            const allSlots = ['09:00', '09:30', '10:00', '10:30', '11:00'];
            const futureSlots = allSlots.filter((slot) => {
                const [hours, minutes] = slot.split(':').map(Number);
                const slotTime = new Date(now);
                slotTime.setHours(hours, minutes, 0, 0);
                return slotTime > now;
            });

            expect(futureSlots).not.toContain('09:00');
            expect(futureSlots).not.toContain('09:30');
            expect(futureSlots).toContain('10:30');
        });
    });

    describe('Duration Formatting', () => {
        it('should format seconds to mm:ss', () => {
            const formatDuration = (seconds: number): string => {
                const mins = Math.floor(seconds / 60);
                const secs = seconds % 60;
                return `${mins}:${secs.toString().padStart(2, '0')}`;
            };

            expect(formatDuration(90)).toBe('1:30');
            expect(formatDuration(60)).toBe('1:00');
            expect(formatDuration(125)).toBe('2:05');
        });
    });

    describe('Booking Status Helpers', () => {
        it('should classify booking as upcoming', () => {
            const now = Date.now();
            const booking = {
                startTime: now + 3600000, // 1 hour in future
                status: 'active',
            };

            const isUpcoming = booking.status === 'active' && booking.startTime > now;
            expect(isUpcoming).toBe(true);
        });

        it('should classify booking as past', () => {
            const now = Date.now();
            const booking = {
                endTime: now - 3600000, // 1 hour in past
                status: 'active',
            };

            const isPast = booking.endTime < now;
            expect(isPast).toBe(true);
        });

        it('should classify cancelled booking', () => {
            const booking = {
                status: 'cancelled',
            };

            const isCancelled = booking.status === 'cancelled';
            expect(isCancelled).toBe(true);
        });
    });

    describe('Validation Helpers', () => {
        it('should validate email format', () => {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

            expect(emailRegex.test('valid@email.com')).toBe(true);
            expect(emailRegex.test('invalid-email')).toBe(false);
            expect(emailRegex.test('test@domain')).toBe(false);
        });

        it('should validate phone number', () => {
            const phoneRegex = /^(0|84)[0-9]{9}$/;

            expect(phoneRegex.test('0901234567')).toBe(true);
            expect(phoneRegex.test('84901234567')).toBe(true);
            expect(phoneRegex.test('123456')).toBe(false);
        });
    });
});
