// Define __DEV__ for React Native compatibility in tests
(global as any).__DEV__ = true;

// Mock Supabase
jest.mock('../lib/supabase', () => ({
    supabase: {
        auth: {
            getSession: jest.fn(),
            getUser: jest.fn(),
            signInWithPassword: jest.fn(),
            signUp: jest.fn(),
            signOut: jest.fn(),
            onAuthStateChange: jest.fn(() => ({ data: { subscription: { unsubscribe: jest.fn() } } })),
        },
        from: jest.fn(() => ({
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
            order: jest.fn().mockReturnThis(),
            limit: jest.fn().mockReturnThis(),
            single: jest.fn(),
            maybeSingle: jest.fn(),
        })),
        storage: {
            from: jest.fn(() => ({
                upload: jest.fn(),
                remove: jest.fn(),
                getPublicUrl: jest.fn(() => ({ data: { publicUrl: 'https://example.com/file' } })),
            })),
        },
    },
}));
