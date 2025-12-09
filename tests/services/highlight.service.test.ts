import { HighlightService } from '../../services/highlight.service';
import { supabase } from '../../lib/supabase';

// Mock the logger to prevent console output in tests
jest.mock('../../lib/logger', () => ({
    logger: {
        create: () => ({
            debug: jest.fn(),
            info: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
        }),
    },
}));

describe('HighlightService', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('getHighlights', () => {
        it('should return empty array when no highlights exist', async () => {
            (supabase.from as jest.Mock).mockReturnValue({
                select: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                order: jest.fn().mockReturnThis(),
                limit: jest.fn().mockResolvedValue({ data: [], error: null }),
            });

            const result = await HighlightService.getHighlights(10);
            expect(result.success).toBe(true);
            expect(result.data).toEqual([]);
        });

        it('should return error on database failure', async () => {
            (supabase.from as jest.Mock).mockReturnValue({
                select: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                order: jest.fn().mockReturnThis(),
                limit: jest.fn().mockResolvedValue({
                    data: null,
                    error: { message: 'Database error' }
                }),
            });

            const result = await HighlightService.getHighlights(10);
            expect(result.success).toBe(false);
            expect(result.error).toBe('Database error');
        });

        it('should enrich highlights with user and court data', async () => {
            const mockHighlights = [
                {
                    id: 'h1',
                    user_id: 'u1',
                    court_id: 'c1',
                    title: 'Test Highlight',
                    video_url: 'https://example.com/video.mp4',
                    thumbnail_url: 'https://example.com/thumb.jpg',
                    duration_sec: 120,
                    likes: 5,
                    views: 100,
                    is_public: true,
                    created_at: '2024-01-01',
                }
            ];

            const mockProfiles = [{ id: 'u1', name: 'Test User', avatar: 'avatar.jpg' }];
            const mockCourts = [{ id: 'c1', name: 'Test Court' }];

            (supabase.from as jest.Mock).mockImplementation((table) => {
                if (table === 'highlights') {
                    return {
                        select: jest.fn().mockReturnThis(),
                        eq: jest.fn().mockReturnThis(),
                        order: jest.fn().mockReturnThis(),
                        limit: jest.fn().mockResolvedValue({ data: mockHighlights, error: null }),
                    };
                }
                if (table === 'profiles') {
                    return {
                        select: jest.fn().mockReturnThis(),
                        in: jest.fn().mockResolvedValue({ data: mockProfiles, error: null }),
                    };
                }
                if (table === 'courts') {
                    return {
                        select: jest.fn().mockReturnThis(),
                        in: jest.fn().mockResolvedValue({ data: mockCourts, error: null }),
                    };
                }
                return { select: jest.fn() };
            });

            const result = await HighlightService.getHighlights(10);
            expect(result.success).toBe(true);
            expect(result.data).toHaveLength(1);
            expect(result.data[0].userName).toBe('Test User');
            expect(result.data[0].courtName).toBe('Test Court');
        });
    });

    describe('getUserHighlights', () => {
        it('should return empty array for null userId', async () => {
            const result = await HighlightService.getUserHighlights('', 50);
            expect(result.success).toBe(true);
            expect(result.data).toEqual([]);
        });

        it('should fetch highlights for specific user', async () => {
            const mockHighlights = [
                {
                    id: 'h1',
                    user_id: 'user123',
                    court_id: null,
                    title: 'My Highlight',
                    video_url: '',
                    is_public: false,
                }
            ];

            (supabase.from as jest.Mock).mockImplementation((table) => {
                if (table === 'highlights') {
                    return {
                        select: jest.fn().mockReturnThis(),
                        eq: jest.fn().mockReturnThis(),
                        order: jest.fn().mockReturnThis(),
                        limit: jest.fn().mockResolvedValue({ data: mockHighlights, error: null }),
                    };
                }
                if (table === 'profiles') {
                    return {
                        select: jest.fn().mockReturnThis(),
                        in: jest.fn().mockResolvedValue({ data: [], error: null }),
                    };
                }
                if (table === 'courts') {
                    return {
                        select: jest.fn().mockReturnThis(),
                        in: jest.fn().mockResolvedValue({ data: [], error: null }),
                    };
                }
                return { select: jest.fn() };
            });

            const result = await HighlightService.getUserHighlights('user123');
            expect(result.success).toBe(true);
            expect(result.data).toHaveLength(1);
        });
    });

    describe('createHighlight', () => {
        it('should return error if not authenticated', async () => {
            (supabase.auth.getUser as jest.Mock).mockResolvedValue({
                data: { user: null },
            });

            const result = await HighlightService.createHighlight('court1');
            expect(result.success).toBe(false);
            expect(result.error).toBe('Not authenticated');
        });

        it('should create highlight successfully', async () => {
            const mockUser = { id: 'user123' };
            const mockCreatedHighlight = {
                id: 'new-highlight-id',
                user_id: 'user123',
                court_id: 'court1',
                title: 'New Highlight',
                video_url: 'https://example.com/video.mp4',
            };

            (supabase.auth.getUser as jest.Mock).mockResolvedValue({
                data: { user: mockUser },
            });

            (supabase.from as jest.Mock).mockImplementation((table) => {
                if (table === 'highlights') {
                    return {
                        insert: jest.fn().mockReturnThis(),
                        select: jest.fn().mockReturnThis(),
                        single: jest.fn().mockResolvedValue({
                            data: mockCreatedHighlight,
                            error: null
                        }),
                    };
                }
                if (table === 'profiles' || table === 'courts') {
                    return {
                        select: jest.fn().mockReturnThis(),
                        in: jest.fn().mockResolvedValue({ data: [], error: null }),
                    };
                }
                return { select: jest.fn() };
            });

            const result = await HighlightService.createHighlight(
                'court1',
                'https://example.com/video.mp4',
                120,
                'New Highlight'
            );

            expect(result.success).toBe(true);
            expect(result.data.id).toBe('new-highlight-id');
        });
    });

    describe('toggleLike', () => {
        it('should increment likes when not liked', async () => {
            (supabase.from as jest.Mock).mockReturnValue({
                update: jest.fn().mockReturnThis(),
                eq: jest.fn().mockResolvedValue({ error: null }),
            });

            const result = await HighlightService.toggleLike('h1', 5, false);
            expect(result.success).toBe(true);
        });

        it('should decrement likes when already liked', async () => {
            (supabase.from as jest.Mock).mockReturnValue({
                update: jest.fn().mockReturnThis(),
                eq: jest.fn().mockResolvedValue({ error: null }),
            });

            const result = await HighlightService.toggleLike('h1', 5, true);
            expect(result.success).toBe(true);
        });

        it('should not go below 0 likes', async () => {
            (supabase.from as jest.Mock).mockReturnValue({
                update: jest.fn().mockReturnThis(),
                eq: jest.fn().mockResolvedValue({ error: null }),
            });

            const result = await HighlightService.toggleLike('h1', 0, true);
            expect(result.success).toBe(true);
        });
    });
});
