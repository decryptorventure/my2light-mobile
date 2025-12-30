/**
 * CourtService Unit Tests
 */

import { CourtService } from "../../services/court.service";
import { supabase } from "../../lib/supabase";

// Mock supabase
jest.mock("../../lib/supabase", () => ({
    supabase: {
        from: jest.fn(),
    },
}));

describe("CourtService", () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    describe("getCourts", () => {
        it("should return empty array on error", async () => {
            (supabase.from as jest.Mock).mockReturnValue({
                select: jest.fn().mockReturnThis(),
                eq: jest.fn().mockResolvedValue({
                    data: null,
                    error: { message: "DB error" },
                }),
            });

            const result = await CourtService.getCourts();

            expect(result.success).toBe(false);
            expect(result.data).toEqual([]);
        });

        it("should return courts successfully", async () => {
            const mockCourts = [
                {
                    id: "court-1",
                    name: "Sân Pickleball A",
                    address: "123 Đường ABC",
                    status: "available",
                    price_per_hour: 200000,
                    rating: 4.5,
                    images: ["image1.jpg"],
                    facilities: ["parking", "wifi"],
                    open_time: "06:00",
                    close_time: "22:00",
                    total_reviews: 25,
                },
                {
                    id: "court-2",
                    name: "Sân Pickleball B",
                    address: "456 Đường XYZ",
                    status: "live",
                    price_per_hour: 250000,
                    rating: 4.8,
                    images: [],
                    facilities: ["parking"],
                    open_time: "07:00",
                    close_time: "21:00",
                    total_reviews: 50,
                },
            ];

            (supabase.from as jest.Mock).mockReturnValue({
                select: jest.fn().mockReturnThis(),
                eq: jest.fn().mockResolvedValue({
                    data: mockCourts,
                    error: null,
                }),
            });

            const result = await CourtService.getCourts();

            expect(result.success).toBe(true);
            expect(result.data).toHaveLength(2);
            expect(result.data[0].name).toBe("Sân Pickleball A");
            expect(result.data[0].pricePerHour).toBe(200000);
            expect(result.data[1].rating).toBe(4.8);
        });
    });

    describe("getCourtById", () => {
        it("should return error when court not found", async () => {
            (supabase.from as jest.Mock).mockReturnValue({
                select: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                single: jest.fn().mockResolvedValue({
                    data: null,
                    error: { message: "Not found" },
                }),
            });

            const result = await CourtService.getCourtById("nonexistent");

            expect(result.success).toBe(false);
            expect(result.data).toBeUndefined();
        });

        it("should return court successfully", async () => {
            const mockCourt = {
                id: "court-1",
                name: "Sân Pickleball A",
                address: "123 Đường ABC",
                status: "available",
                price_per_hour: 200000,
                rating: 4.5,
                images: ["image1.jpg", "image2.jpg"],
                facilities: ["parking", "wifi", "camera"],
                description: "Sân chất lượng cao",
                open_time: "06:00",
                close_time: "22:00",
                total_reviews: 25,
            };

            (supabase.from as jest.Mock).mockReturnValue({
                select: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                single: jest.fn().mockResolvedValue({
                    data: mockCourt,
                    error: null,
                }),
            });

            const result = await CourtService.getCourtById("court-1");

            expect(result.success).toBe(true);
            expect(result.data?.name).toBe("Sân Pickleball A");
            expect(result.data?.facilities).toContain("wifi");
            expect(result.data?.openTime).toBe("06:00");
        });
    });

    describe("getPackages", () => {
        it("should return empty array on error", async () => {
            (supabase.from as jest.Mock).mockReturnValue({
                select: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                order: jest.fn().mockResolvedValue({
                    data: null,
                    error: { message: "DB error" },
                }),
            });

            const result = await CourtService.getPackages();

            expect(result.success).toBe(false);
            expect(result.data).toEqual([]);
        });

        it("should return packages successfully", async () => {
            const mockPackages = [
                {
                    id: "pkg-1",
                    name: "Standard",
                    price: 50000,
                    duration_minutes: 60,
                    description: "Gói quay cơ bản",
                    is_best_value: false,
                    features: ["1 highlight"],
                    type: "per_booking",
                },
                {
                    id: "pkg-2",
                    name: "Premium",
                    price: 100000,
                    duration_minutes: 120,
                    description: "Gói quay cao cấp",
                    is_best_value: true,
                    features: ["5 highlights", "Full match"],
                    type: "per_booking",
                },
            ];

            (supabase.from as jest.Mock).mockReturnValue({
                select: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                order: jest.fn().mockResolvedValue({
                    data: mockPackages,
                    error: null,
                }),
            });

            const result = await CourtService.getPackages();

            expect(result.success).toBe(true);
            expect(result.data).toHaveLength(2);
            expect(result.data[0].name).toBe("Standard");
            expect(result.data[1].isBestValue).toBe(true);
        });
    });
});
