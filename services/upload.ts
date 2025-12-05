import { supabase } from '../lib/supabase';
import * as FileSystem from 'expo-file-system/legacy';
import * as VideoThumbnails from 'expo-video-thumbnails';
import { ApiResponse } from '../types';
import { AVPlaybackStatus, Video } from 'expo-av';

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
 * Get video duration in seconds using expo-av
 */
async function getVideoDuration(uri: string): Promise<number> {
    try {
        // Create a temporary video component to get duration
        const { sound, status } = await Video.createAsync(
            { uri },
            { shouldPlay: false }
        );

        if (status.isLoaded && status.durationMillis) {
            const durationSec = Math.round(status.durationMillis / 1000);
            console.log('📏 Video duration:', durationSec, 'seconds');
            await sound?.unloadAsync();
            return durationSec;
        }

        await sound?.unloadAsync();
        return 0;
    } catch (error) {
        console.warn('Could not get video duration:', error);
        return 0;
    }
}

/**
 * Generate thumbnail from video at specific time
 */
async function generateThumbnail(videoUri: string, timeMs: number = 1000): Promise<string | null> {
    try {
        console.log('📸 Generating thumbnail from video at', timeMs, 'ms');
        const { uri } = await VideoThumbnails.getThumbnailAsync(videoUri, {
            time: timeMs,
            quality: 0.8,
        });
        console.log('📸 Thumbnail generated:', uri ? 'success' : 'failed');
        return uri;
    } catch (error) {
        console.error('❌ Thumbnail generation failed:', error);
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
        console.log('📤 Reading thumbnail file...');
        const base64 = await FileSystem.readAsStringAsync(thumbnailUri, {
            encoding: FileSystem.EncodingType.Base64,
        });

        const byteArray = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
        // Store thumbnails in user's folder in videos bucket
        const fileName = `${userId}/thumb_${timestamp}.jpg`;

        console.log('📤 Uploading thumbnail to:', fileName);
        const { error } = await supabase.storage
            .from('videos')
            .upload(fileName, byteArray, {
                contentType: 'image/jpeg',
                upsert: true, // Allow overwrite
            });

        if (error) {
            console.error('❌ Thumbnail upload failed:', error.message);
            return null;
        }

        const { data: { publicUrl } } = supabase.storage
            .from('videos')
            .getPublicUrl(fileName);

        console.log('✅ Thumbnail uploaded successfully:', publicUrl);
        return publicUrl;
    } catch (error) {
        console.error('❌ Thumbnail upload error:', error);
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
        console.log('🎬 Starting video upload process...');
        console.log('🎬 Video URI:', localUri);

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            console.error('❌ User not authenticated');
            return { success: false, data: {} as UploadResult, error: 'Not authenticated' };
        }

        console.log('✅ User authenticated:', user.id.slice(0, 8));

        // Get file info
        const fileInfo = await FileSystem.getInfoAsync(localUri);
        if (!fileInfo.exists) {
            return { success: false, data: {} as UploadResult, error: 'File not found' };
        }

        console.log('📁 File size:', Math.round((fileInfo as any).size / 1024 / 1024 * 100) / 100, 'MB');

        // Generate unique filename
        const timestamp = Date.now();
        const fileName = `${user.id}/${timestamp}.mp4`;

        // Step 1: Get video duration
        onProgress?.({ loaded: 0, total: 100, percentage: 5 });
        const durationSec = await getVideoDuration(localUri);

        // Step 2: Generate and upload thumbnail
        onProgress?.({ loaded: 0, total: 100, percentage: 10 });
        const thumbnailUri = await generateThumbnail(localUri, 1000);

        let thumbnailUrl: string | undefined;
        if (thumbnailUri) {
            onProgress?.({ loaded: 0, total: 100, percentage: 15 });
            thumbnailUrl = (await uploadThumbnail(thumbnailUri, user.id, timestamp)) || undefined;
        } else {
            console.warn('⚠️ No thumbnail generated, video will have no preview');
        }

        // Step 3: Upload video
        console.log('📤 Uploading video file...');
        onProgress?.({ loaded: 0, total: 100, percentage: 20 });

        const base64 = await FileSystem.readAsStringAsync(localUri, {
            encoding: FileSystem.EncodingType.Base64,
        });

        console.log('📤 Video encoded to base64, uploading to storage...');
        const byteArray = Uint8Array.from(atob(base64), c => c.charCodeAt(0));

        const { data, error } = await supabase.storage
            .from('videos')
            .upload(fileName, byteArray, {
                contentType: 'video/mp4',
                upsert: false,
            });

        if (error) {
            console.error('❌ Video upload error:', error);
            return { success: false, data: {} as UploadResult, error: error.message };
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
            .from('videos')
            .getPublicUrl(fileName);

        onProgress?.({ loaded: 100, total: 100, percentage: 100 });

        console.log('✅ Upload complete!');
        console.log('   Video URL:', publicUrl);
        console.log('   Thumbnail URL:', thumbnailUrl || 'none');
        console.log('   Duration:', durationSec, 'seconds');

        return {
            success: true,
            data: {
                videoUrl: publicUrl,
                thumbnailUrl,
                durationSec: durationSec || undefined,
            },
        };
    } catch (error) {
        console.error('❌ Upload video error:', error);
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
