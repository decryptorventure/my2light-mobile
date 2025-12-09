/**
 * Video Compression Utility
 * Compresses videos before upload to reduce file size and upload time
 */

import * as FileSystem from 'expo-file-system/legacy';
import { logger } from '../lib/logger';

const compressLogger = logger.create('VideoCompress');

export interface CompressionOptions {
    maxWidth?: number;
    maxHeight?: number;
    quality?: 'low' | 'medium' | 'high';
    maxDurationSec?: number;
}

export interface CompressionResult {
    uri: string;
    originalSize: number;
    compressedSize: number;
    compressionRatio: number;
    width?: number;
    height?: number;
}

const QUALITY_SETTINGS = {
    low: { bitrate: 1_000_000, scale: 0.5 },     // 1 Mbps, 50% scale
    medium: { bitrate: 2_500_000, scale: 0.75 }, // 2.5 Mbps, 75% scale
    high: { bitrate: 5_000_000, scale: 1.0 },    // 5 Mbps, full scale
};

/**
 * Get video file size in bytes
 */
export async function getVideoFileSize(uri: string): Promise<number> {
    try {
        const fileInfo = await FileSystem.getInfoAsync(uri);
        if (fileInfo.exists && 'size' in fileInfo) {
            return fileInfo.size as number;
        }
        return 0;
    } catch (error) {
        compressLogger.error('Failed to get video size', error);
        return 0;
    }
}

/**
 * Check if video needs compression based on file size
 * Returns true if video is larger than 50MB
 */
export function needsCompression(fileSizeBytes: number): boolean {
    const MAX_SIZE_MB = 50;
    const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;
    return fileSizeBytes > MAX_SIZE_BYTES;
}

/**
 * Estimate compressed file size based on quality setting
 */
export function estimateCompressedSize(
    originalSize: number,
    quality: 'low' | 'medium' | 'high' = 'medium'
): number {
    const compressionFactors = {
        low: 0.2,    // ~80% reduction
        medium: 0.4, // ~60% reduction
        high: 0.6,   // ~40% reduction
    };

    return Math.round(originalSize * compressionFactors[quality]);
}

/**
 * Compress video using FFmpeg (expo-video-thumbnails approach)
 * Note: Full compression requires expo-av-compressor or similar
 * This is a placeholder that shows the interface
 */
export async function compressVideo(
    inputUri: string,
    options: CompressionOptions = {}
): Promise<CompressionResult | null> {
    const {
        quality = 'medium',
    } = options;

    try {
        compressLogger.debug('Starting video compression', { quality });

        // Get original file size
        const originalSize = await getVideoFileSize(inputUri);

        if (!needsCompression(originalSize)) {
            compressLogger.debug('Video does not need compression', {
                sizeMB: Math.round(originalSize / 1024 / 1024 * 100) / 100
            });

            return {
                uri: inputUri,
                originalSize,
                compressedSize: originalSize,
                compressionRatio: 1,
            };
        }

        /**
         * Note: For actual video compression, you would need to:
         * 1. Install expo-video-thumbnails or react-native-video-processing
         * 2. Use FFmpeg or similar for actual compression
         * 
         * Example with react-native-video-processing:
         * 
         * import { ProcessingManager } from 'react-native-video-processing';
         * 
         * const compressed = await ProcessingManager.compress(inputUri, {
         *   width: 1080,
         *   height: 1920,
         *   bitrateMultiplier: quality === 'low' ? 3 : quality === 'medium' ? 5 : 7,
         *   minimumBitrate: 300000,
         * });
         */

        compressLogger.warn('Full compression not implemented - returning original');

        // For now, return original with metadata
        const estimatedSize = estimateCompressedSize(originalSize, quality);

        return {
            uri: inputUri,
            originalSize,
            compressedSize: originalSize, // Would be smaller after actual compression
            compressionRatio: 1,
        };
    } catch (error) {
        compressLogger.error('Video compression failed', error);
        return null;
    }
}

/**
 * Compress video if needed, otherwise return original
 */
export async function compressIfNeeded(
    inputUri: string,
    options: CompressionOptions = {}
): Promise<string> {
    const fileSize = await getVideoFileSize(inputUri);

    if (!needsCompression(fileSize)) {
        compressLogger.debug('Compression not needed');
        return inputUri;
    }

    const result = await compressVideo(inputUri, options);
    return result?.uri || inputUri;
}

/**
 * Get compression info for UI display
 */
export function getCompressionInfo(fileSizeBytes: number) {
    const sizeMB = fileSizeBytes / 1024 / 1024;
    const needs = needsCompression(fileSizeBytes);

    return {
        sizeMB: Math.round(sizeMB * 100) / 100,
        needsCompression: needs,
        estimatedLow: Math.round(estimateCompressedSize(fileSizeBytes, 'low') / 1024 / 1024 * 100) / 100,
        estimatedMedium: Math.round(estimateCompressedSize(fileSizeBytes, 'medium') / 1024 / 1024 * 100) / 100,
        estimatedHigh: Math.round(estimateCompressedSize(fileSizeBytes, 'high') / 1024 / 1024 * 100) / 100,
    };
}
