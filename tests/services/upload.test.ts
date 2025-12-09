import { uploadVideo, uploadAvatar, deleteFile } from '../../services/upload';
import { supabase } from '../../lib/supabase';
import * as FileSystem from 'expo-file-system/legacy';
import * as VideoThumbnails from 'expo-video-thumbnails';

// Mock the logger
jest.mock('../../lib/logger', () => ({
    uploadLogger: {
        debug: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
    },
}));

// Mock expo-file-system
jest.mock('expo-file-system/legacy', () => ({
    getInfoAsync: jest.fn(),
    readAsStringAsync: jest.fn(),
    EncodingType: {
        Base64: 'base64',
    },
}));

// Mock expo-video-thumbnails
jest.mock('expo-video-thumbnails', () => ({
    getThumbnailAsync: jest.fn(),
}));

// Mock expo-av Video
jest.mock('expo-av', () => ({
    Video: {
        createAsync: jest.fn(),
    },
    AVPlaybackStatus: {},
}));

describe('Upload Service', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('uploadVideo', () => {
        it('should return error if user is not authenticated', async () => {
            (supabase.auth.getUser as jest.Mock).mockResolvedValue({
                data: { user: null },
            });

            const result = await uploadVideo('/path/to/video.mp4');

            expect(result.success).toBe(false);
            expect(result.error).toBe('Not authenticated');
        });

        it('should return error if file does not exist', async () => {
            const mockUser = { id: 'user123' };
            (supabase.auth.getUser as jest.Mock).mockResolvedValue({
                data: { user: mockUser },
            });

            (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({
                exists: false,
            });

            const result = await uploadVideo('/path/to/nonexistent.mp4');

            expect(result.success).toBe(false);
            expect(result.error).toBe('File not found');
        });

        it('should upload video successfully', async () => {
            const mockUser = { id: 'user123' };
            (supabase.auth.getUser as jest.Mock).mockResolvedValue({
                data: { user: mockUser },
            });

            (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({
                exists: true,
                size: 1024 * 1024 * 5, // 5MB
            });

            (FileSystem.readAsStringAsync as jest.Mock).mockResolvedValue(
                'base64encodedvideo'
            );

            (VideoThumbnails.getThumbnailAsync as jest.Mock).mockResolvedValue({
                uri: '/path/to/thumbnail.jpg',
            });

            // Mock storage upload
            (supabase.storage.from as jest.Mock).mockReturnValue({
                upload: jest.fn().mockResolvedValue({ data: {}, error: null }),
                getPublicUrl: jest.fn().mockReturnValue({
                    data: { publicUrl: 'https://storage.example.com/video.mp4' },
                }),
            });

            const onProgress = jest.fn();
            const result = await uploadVideo('/path/to/video.mp4', onProgress);

            expect(result.success).toBe(true);
            expect(result.data.videoUrl).toBe('https://storage.example.com/video.mp4');
            expect(onProgress).toHaveBeenCalled();
        });

        it('should handle upload error gracefully', async () => {
            const mockUser = { id: 'user123' };
            (supabase.auth.getUser as jest.Mock).mockResolvedValue({
                data: { user: mockUser },
            });

            (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({
                exists: true,
                size: 1024 * 1024,
            });

            (FileSystem.readAsStringAsync as jest.Mock).mockResolvedValue('base64');

            (VideoThumbnails.getThumbnailAsync as jest.Mock).mockResolvedValue(null);

            (supabase.storage.from as jest.Mock).mockReturnValue({
                upload: jest.fn().mockResolvedValue({
                    data: null,
                    error: { message: 'Storage quota exceeded' }
                }),
                getPublicUrl: jest.fn(),
            });

            const result = await uploadVideo('/path/to/video.mp4');

            expect(result.success).toBe(false);
            expect(result.error).toBe('Storage quota exceeded');
        });
    });

    describe('uploadAvatar', () => {
        it('should return error if not authenticated', async () => {
            (supabase.auth.getUser as jest.Mock).mockResolvedValue({
                data: { user: null },
            });

            const result = await uploadAvatar('/path/to/avatar.jpg');

            expect(result.success).toBe(false);
            expect(result.error).toBe('Not authenticated');
        });

        it('should upload avatar successfully', async () => {
            const mockUser = { id: 'user123' };
            (supabase.auth.getUser as jest.Mock).mockResolvedValue({
                data: { user: mockUser },
            });

            (FileSystem.readAsStringAsync as jest.Mock).mockResolvedValue(
                'base64encodedimage'
            );

            (supabase.storage.from as jest.Mock).mockReturnValue({
                upload: jest.fn().mockResolvedValue({ data: {}, error: null }),
                getPublicUrl: jest.fn().mockReturnValue({
                    data: { publicUrl: 'https://storage.example.com/avatar.jpg' },
                }),
            });

            const result = await uploadAvatar('/path/to/avatar.jpg');

            expect(result.success).toBe(true);
            expect(result.data).toBe('https://storage.example.com/avatar.jpg');
        });
    });

    describe('deleteFile', () => {
        it('should delete file successfully', async () => {
            (supabase.storage.from as jest.Mock).mockReturnValue({
                remove: jest.fn().mockResolvedValue({ error: null }),
            });

            const result = await deleteFile('videos', 'user123/video.mp4');

            expect(result).toBe(true);
        });

        it('should return false on delete error', async () => {
            (supabase.storage.from as jest.Mock).mockReturnValue({
                remove: jest.fn().mockResolvedValue({
                    error: { message: 'File not found' }
                }),
            });

            const result = await deleteFile('videos', 'nonexistent.mp4');

            expect(result).toBe(false);
        });
    });
});
