import { supabase } from '../lib/supabase';
import * as FileSystem from 'expo-file-system/legacy';
import * as VideoThumbnails from 'expo-video-thumbnails';
import { ApiResponse } from '../types';

export interface UploadProgress {
    loaded: number;
    total: number;
    percentage: number;
}

export interface UploadResult {
    videoUrl: string;
    thumbnailUrl?: string;
    durationSec?: number;
}

/**
 * Generate thumbnail from video at specific time
 */
async function generateThumbnail(videoUri: string, timeMs: number = 1000): Promise<string | null> {
    try {
        const { uri } = await VideoThumbnails.getThumbnailAsync(videoUri, {
            time: timeMs,
            quality: 0.7,
        });
        return uri;
    } catch (error) {
        console.warn('Thumbnail generation failed:', error);
        return null;
    }
}

/**
 * Upload thumbnail image to Supabase Storage
 */
async function uploadThumbnail(
    thumbnailUri: string,
    userId: string,
    timestamp: number
): Promise<string | null> {
    try {
        const base64 = await FileSystem.readAsStringAsync(thumbnailUri, {
            encoding: FileSystem.EncodingType.Base64,
        });

        const byteArray = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
        const fileName = `thumbnails/${userId}/${timestamp}.jpg`;

        const { error } = await supabase.storage
            .from('videos')
            .upload(fileName, byteArray, {
                contentType: 'image/jpeg',
                upsert: false,
            });

        if (error) {
            console.warn('Thumbnail upload failed:', error.message);
            return null;
        }

        const { data: { publicUrl } } = supabase.storage
            .from('videos')
            .getPublicUrl(fileName);

        return publicUrl;
    } catch (error) {
        console.warn('Thumbnail upload error:', error);
        return null;
    }
}

/**
 * Upload video to Supabase Storage with auto-generated thumbnail
 * iOS camera outputs MP4 which is universally compatible
 */
export async function uploadVideo(
    localUri: string,
    onProgress?: (progress: UploadProgress) => void
): Promise<ApiResponse<UploadResult>> {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return { success: false, data: {} as UploadResult, error: 'Not authenticated' };
        }

        // Get file info
        const fileInfo = await FileSystem.getInfoAsync(localUri);
        if (!fileInfo.exists) {
            return { success: false, data: {} as UploadResult, error: 'File not found' };
        }

        // Generate unique filename
        const timestamp = Date.now();
        const fileName = `${user.id}/${timestamp}.mp4`;

        // Step 1: Generate thumbnail (at 1 second mark)
        onProgress?.({ loaded: 0, total: 100, percentage: 5 });
        console.log('📸 Generating thumbnail...');
        const thumbnailUri = await generateThumbnail(localUri, 1000);

        let thumbnailUrl: string | undefined;
        if (thumbnailUri) {
            console.log('📤 Uploading thumbnail...');
            onProgress?.({ loaded: 0, total: 100, percentage: 10 });
            thumbnailUrl = (await uploadThumbnail(thumbnailUri, user.id, timestamp)) || undefined;
            console.log('✅ Thumbnail uploaded:', thumbnailUrl);
        }

        // Step 2: Read and upload video
        console.log('📤 Uploading video...');
        onProgress?.({ loaded: 0, total: 100, percentage: 15 });

        const base64 = await FileSystem.readAsStringAsync(localUri, {
            encoding: FileSystem.EncodingType.Base64,
        });

        const byteArray = Uint8Array.from(atob(base64), c => c.charCodeAt(0));

        const { data, error } = await supabase.storage
            .from('videos')
            .upload(fileName, byteArray, {
                contentType: 'video/mp4',
                upsert: false,
            });

        if (error) {
            console.error('Upload error:', error);
            return { success: false, data: {} as UploadResult, error: error.message };
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
            .from('videos')
            .getPublicUrl(fileName);

        onProgress?.({ loaded: 100, total: 100, percentage: 100 });
        console.log('✅ Video uploaded:', publicUrl);

        return {
            success: true,
            data: {
                videoUrl: publicUrl,
                thumbnailUrl,
                durationSec: undefined, // Duration can be set manually or from video metadata
            },
        };
    } catch (error) {
        console.error('Upload video error:', error);
        return {
            success: false,
            data: {} as UploadResult,
            error: error instanceof Error ? error.message : 'Upload failed'
        };
    }
}

/**
 * Upload avatar image to Supabase Storage
 */
export async function uploadAvatar(localUri: string): Promise<ApiResponse<string>> {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return { success: false, data: '', error: 'Not authenticated' };
        }

        // Read file as base64
        const base64 = await FileSystem.readAsStringAsync(localUri, {
            encoding: FileSystem.EncodingType.Base64,
        });

        // Determine file extension from URI
        const extension = localUri.split('.').pop() || 'jpg';
        const fileName = `${user.id}-${Date.now()}.${extension}`;

        // Convert base64 to byte array
        const byteArray = Uint8Array.from(atob(base64), c => c.charCodeAt(0));

        // Upload to Supabase Storage
        const { data, error } = await supabase.storage
            .from('avatars')
            .upload(fileName, byteArray, {
                contentType: `image/${extension}`,
                upsert: true,
            });

        if (error) {
            console.error('Avatar upload error:', error);
            return { success: false, data: '', error: error.message };
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
            .from('avatars')
            .getPublicUrl(fileName);

        return { success: true, data: publicUrl };
    } catch (error) {
        console.error('Upload avatar error:', error);
        return {
            success: false,
            data: '',
            error: error instanceof Error ? error.message : 'Upload failed'
        };
    }
}

/**
 * Delete a file from Supabase Storage
 */
export async function deleteFile(bucket: string, path: string): Promise<boolean> {
    try {
        const { error } = await supabase.storage
            .from(bucket)
            .remove([path]);

        if (error) {
            console.error('Delete file error:', error);
            return false;
        }

        return true;
    } catch (error) {
        console.error('Delete file error:', error);
        return false;
    }
}
