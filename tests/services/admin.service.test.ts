/**
 * AdminService Unit Tests
 */

import { AdminService } from "../../services/admin.service";
import { supabase } from "../../lib/supabase";

// Mock supabase
jest.mock("../../lib/supabase", () => ({
    supabase: {
        auth: {
            getUser: jest.fn(),
        },
        from: jest.fn(),
    },
}));

describe("AdminService", () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    describe("createCourtOwnerProfile", () => {
        it("should return error when not authenticated", async () => {
            (supabase.auth.getUser as jest.Mock).mockResolvedValue({
                data: { user: null },
            });

            const result = await AdminService.createCourtOwnerProfile({
                businessName: "Test Business",
                phone: "0901234567",
                email: "test@example.com",
            });

            expect(result.success).toBe(false);
            expect(result.error).toBe("Not authenticated");
        });

        it("should create court owner profile successfully", async () => {
            const mockUser = { id: "user-123" };

            (supabase.auth.getUser as jest.Mock).mockResolvedValue({
                data: { user: mockUser },
            });

            (supabase.from as jest.Mock).mockImplementation((table) => {
                if (table === "court_owners") {
                    return {
                        select: jest.fn().mockReturnThis(),
                        eq: jest.fn().mockReturnThis(),
                        maybeSingle: jest.fn().mockResolvedValue({
                            data: null, // No existing owner
                            error: null,
                        }),
                        insert: jest.fn().mockResolvedValue({
                            data: null,
                            error: null,
                        }),
                    };
                }
                if (table === "profiles") {
                    return {
                        update: jest.fn().mockReturnThis(),
                        eq: jest.fn().mockResolvedValue({
                            data: null,
                            error: null,
                        }),
                    };
                }
                return { insert: jest.fn() };
            });

            const result = await AdminService.createCourtOwnerProfile({
                businessName: "Sân Pickleball ABC",
                phone: "0901234567",
                email: "owner@example.com",
                address: "123 Đường ABC",
                taxId: "0123456789",
            });

            expect(result.success).toBe(true);
            expect(result.data).toBe(true);
        });
    });

    describe("getCourtOwnerProfile", () => {
        it("should return null when not authenticated", async () => {
            (supabase.auth.getUser as jest.Mock).mockResolvedValue({
                data: { user: null },
            });

            const result = await AdminService.getCourtOwnerProfile();

            expect(result.success).toBe(false);
            expect(result.data).toBeNull();
        });

        it("should return null when no profile exists", async () => {
            const mockUser = { id: "user-123" };

            (supabase.auth.getUser as jest.Mock).mockResolvedValue({
                data: { user: mockUser },
            });

            (supabase.from as jest.Mock).mockReturnValue({
                select: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                single: jest.fn().mockResolvedValue({
                    data: null,
                    error: { code: "PGRST116" },
                }),
            });

            const result = await AdminService.getCourtOwnerProfile();

            expect(result.success).toBe(true);
            expect(result.data).toBeNull();
        });

        it("should return profile when exists", async () => {
            const mockUser = { id: "user-123" };
            const mockProfile = {
                id: "owner-1",
                user_id: "user-123",
                business_name: "Sân ABC",
                phone: "0901234567",
                email: "owner@test.com",
                address: "123 Street",
                tax_id: "123456",
                status: "approved",
                created_at: "2024-01-01T00:00:00Z",
            };

            (supabase.auth.getUser as jest.Mock).mockResolvedValue({
                data: { user: mockUser },
            });

            (supabase.from as jest.Mock).mockReturnValue({
                select: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                single: jest.fn().mockResolvedValue({
                    data: mockProfile,
                    error: null,
                }),
            });

            const result = await AdminService.getCourtOwnerProfile();

            expect(result.success).toBe(true);
            expect(result.data?.businessName).toBe("Sân ABC");
            expect(result.data?.status).toBe("approved");
        });
    });

    describe("getDashboardStats", () => {
        it("should return empty stats when not authenticated", async () => {
            (supabase.auth.getUser as jest.Mock).mockResolvedValue({
                data: { user: null },
            });

            const result = await AdminService.getDashboardStats();

            expect(result.success).toBe(false);
            expect(result.data.totalRevenue).toBe(0);
            expect(result.data.totalCourts).toBe(0);
        });

        it("should return calculated stats", async () => {
            const mockUser = { id: "user-123" };
            const mockCourts = [
                { id: "court-1", rating: 4.5 },
                { id: "court-2", rating: 4.0 },
            ];
            const mockBookingsToday = [{ id: "booking-1" }];
            const mockRevenueData = [{ total_amount: 200000 }, { total_amount: 150000 }];

            (supabase.auth.getUser as jest.Mock).mockResolvedValue({
                data: { user: mockUser },
            });

            let callCount = 0;
            (supabase.from as jest.Mock).mockImplementation((table) => {
                if (table === "courts") {
                    return {
                        select: jest.fn().mockReturnThis(),
                        eq: jest.fn().mockResolvedValue({
                            data: mockCourts,
                            error: null,
                        }),
                    };
                }
                if (table === "bookings") {
                    callCount++;
                    // First call for today's bookings, second for revenue
                    if (callCount <= 1) {
                        return {
                            select: jest.fn().mockReturnThis(),
                            in: jest.fn().mockReturnThis(),
                            gte: jest.fn().mockReturnThis(),
                            lt: jest.fn().mockResolvedValue({
                                data: mockBookingsToday,
                                error: null,
                            }),
                        };
                    } else {
                        return {
                            select: jest.fn().mockReturnThis(),
                            in: jest.fn().mockResolvedValue({
                                data: mockRevenueData,
                                error: null,
                            }),
                        };
                    }
                }
                return { select: jest.fn() };
            });

            const result = await AdminService.getDashboardStats();

            expect(result.success).toBe(true);
            expect(result.data.totalCourts).toBe(2);
        });
    });

    describe("getOwnCourts", () => {
        it("should return empty array when not authenticated", async () => {
            (supabase.auth.getUser as jest.Mock).mockResolvedValue({
                data: { user: null },
            });

            const result = await AdminService.getOwnCourts();

            expect(result.success).toBe(false);
            expect(result.data).toEqual([]);
        });

        it("should return owner courts", async () => {
            const mockUser = { id: "user-123" };
            const mockCourts = [
                { id: "court-1", name: "Sân A", is_active: true },
                { id: "court-2", name: "Sân B", is_active: false },
            ];

            (supabase.auth.getUser as jest.Mock).mockResolvedValue({
                data: { user: mockUser },
            });

            (supabase.from as jest.Mock).mockReturnValue({
                select: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                order: jest.fn().mockResolvedValue({
                    data: mockCourts,
                    error: null,
                }),
            });

            const result = await AdminService.getOwnCourts();

            expect(result.success).toBe(true);
            expect(result.data).toHaveLength(2);
        });
    });

    describe("approveBooking", () => {
        it("should approve booking successfully", async () => {
            (supabase.from as jest.Mock).mockReturnValue({
                update: jest.fn().mockReturnThis(),
                eq: jest.fn().mockResolvedValue({
                    data: null,
                    error: null,
                }),
            });

            const result = await AdminService.approveBooking("booking-1");

            expect(result.success).toBe(true);
            expect(result.data).toBe(true);
        });

        it("should return error on failure", async () => {
            (supabase.from as jest.Mock).mockReturnValue({
                update: jest.fn().mockReturnThis(),
                eq: jest.fn().mockResolvedValue({
                    data: null,
                    error: { message: "Update failed" },
                }),
            });

            const result = await AdminService.approveBooking("booking-1");

            expect(result.success).toBe(false);
        });
    });

    describe("cancelBooking", () => {
        it("should cancel booking with reason", async () => {
            (supabase.from as jest.Mock).mockReturnValue({
                update: jest.fn().mockReturnThis(),
                eq: jest.fn().mockResolvedValue({
                    data: null,
                    error: null,
                }),
            });

            const result = await AdminService.cancelBooking("booking-1", "Court maintenance");

            expect(result.success).toBe(true);
            expect(result.data).toBe(true);
        });
    });
});
