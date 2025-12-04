import { supabase } from '../lib/supabase';
import * as FileSystem from 'expo-file-system';
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
 * Upload video to Supabase Storage
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

        // Read file as base64
        const base64 = await FileSystem.readAsStringAsync(localUri, {
            encoding: FileSystem.EncodingType.Base64,
        });

        // Convert base64 to blob-like format for Supabase
        const byteArray = Uint8Array.from(atob(base64), c => c.charCodeAt(0));

        // Upload to Supabase Storage
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

        return {
            success: true,
            data: {
                videoUrl: publicUrl,
                thumbnailUrl: undefined, // TODO: Generate thumbnail
                durationSec: undefined, // TODO: Get video duration
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
