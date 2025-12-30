// Define __DEV__ for React Native compatibility in tests
(global as any).__DEV__ = true;

// Mock Supabase
jest.mock("../lib/supabase", () => ({
    supabase: {
        auth: {
            getSession: jest.fn(),
            getUser: jest.fn(),
            signInWithPassword: jest.fn(),
            signUp: jest.fn(),
            signOut: jest.fn(),
            onAuthStateChange: jest.fn(() => ({
                data: { subscription: { unsubscribe: jest.fn() } },
            })),
        },
        from: jest.fn((table) => {
            const mockChain = {
                select: jest.fn().mockReturnThis(),
                insert: jest.fn().mockReturnThis(),
                update: jest.fn().mockReturnThis(),
                delete: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                neq: jest.fn().mockReturnThis(),
                in: jest.fn().mockReturnThis(),
                gte: jest.fn().mockReturnThis(),
                lte: jest.fn().mockReturnThis(),
                lt: jest.fn().mockReturnThis(),
                gt: jest.fn().mockReturnThis(),
                or: jest.fn().mockReturnThis(),
                order: jest.fn().mockReturnThis(),
                limit: jest.fn().mockReturnThis(),
                single: jest.fn().mockResolvedValue({ data: null, error: null }),
                maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
            };
            // Make all methods return the same chain for proper chaining
            Object.keys(mockChain).forEach((key) => {
                if (
                    key !== "single" &&
                    key !== "maybeSingle" &&
                    typeof (mockChain as any)[key] === "function"
                ) {
                    (mockChain as any)[key].mockReturnValue(mockChain);
                }
            });
            return mockChain;
        }),
        storage: {
            from: jest.fn(() => ({
                upload: jest.fn(),
                remove: jest.fn(),
                getPublicUrl: jest.fn(() => ({ data: { publicUrl: "https://example.com/file" } })),
            })),
        },
    },
}));
