/**
 * Review Service
 * Handles court reviews and ratings
 */

import { supabase } from '../lib/supabase';
import { ApiResponse } from '../types';
import { logger } from '../lib/logger';

const reviewLogger = logger.create('Review');

export interface Review {
    id: string;
    courtId: string;
    userId: string;
    bookingId?: string;
    rating: number;
    comment?: string;
    createdAt: string;
    updatedAt: string;
    // Joined data
    userName?: string;
    userAvatar?: string;
}

export interface ReviewStats {
    averageRating: number;
    totalReviews: number;
    ratingDistribution: {
        1: number;
        2: number;
        3: number;
        4: number;
        5: number;
    };
}

export const ReviewService = {
    /**
     * Get reviews for a court
     */
    getCourtReviews: async (courtId: string): Promise<ApiResponse<Review[]>> => {
        try {
            const { data, error } = await supabase
                .from('court_reviews')
                .select(`
                    *,
                    profiles:user_id (name, avatar)
                `)
                .eq('court_id', courtId)
                .order('created_at', { ascending: false });

            if (error) {
                reviewLogger.error('getCourtReviews error', error);
                return { success: false, data: [], error: error.message };
            }

            const reviews: Review[] = (data || []).map((r: any) => ({
                id: r.id,
                courtId: r.court_id,
                userId: r.user_id,
                bookingId: r.booking_id,
                rating: r.rating,
                comment: r.comment,
                createdAt: r.created_at,
                updatedAt: r.updated_at,
                userName: r.profiles?.name || 'Ẩn danh',
                userAvatar: r.profiles?.avatar,
            }));

            return { success: true, data: reviews };
        } catch (e) {
            reviewLogger.error('getCourtReviews exception', e);
            return { success: false, data: [], error: 'Failed to load reviews' };
        }
    },

    /**
     * Get review stats for a court
     */
    getReviewStats: async (courtId: string): Promise<ApiResponse<ReviewStats>> => {
        try {
            const { data, error } = await supabase
                .from('court_reviews')
                .select('rating')
                .eq('court_id', courtId);

            if (error) {
                return {
                    success: false,
                    data: {
                        averageRating: 0,
                        totalReviews: 0,
                        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
                    }
                };
            }

            const ratings = data || [];
            const total = ratings.length;
            const avg = total > 0
                ? ratings.reduce((sum, r) => sum + r.rating, 0) / total
                : 0;

            const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
            ratings.forEach(r => {
                distribution[r.rating as keyof typeof distribution]++;
            });

            return {
                success: true,
                data: {
                    averageRating: Math.round(avg * 10) / 10,
                    totalReviews: total,
                    ratingDistribution: distribution,
                }
            };
        } catch (e) {
            return {
                success: false,
                data: {
                    averageRating: 0,
                    totalReviews: 0,
                    ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
                }
            };
        }
    },

    /**
     * Submit a review for a court
     */
    submitReview: async (data: {
        courtId: string;
        rating: number;
        comment?: string;
        bookingId?: string;
    }): Promise<ApiResponse<Review | null>> => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return { success: false, data: null, error: 'Not authenticated' };
        }

        try {
            // Upsert - update if exists, insert if not
            const { data: review, error } = await supabase
                .from('court_reviews')
                .upsert({
                    court_id: data.courtId,
                    user_id: user.id,
                    booking_id: data.bookingId || null,
                    rating: data.rating,
                    comment: data.comment || null,
                    updated_at: new Date().toISOString(),
                }, {
                    onConflict: 'user_id,court_id',
                })
                .select()
                .single();

            if (error) {
                reviewLogger.error('submitReview error', error);
                return { success: false, data: null, error: error.message };
            }

            reviewLogger.info('Review submitted', { courtId: data.courtId, rating: data.rating });

            return {
                success: true,
                data: {
                    id: review.id,
                    courtId: review.court_id,
                    userId: review.user_id,
                    bookingId: review.booking_id,
                    rating: review.rating,
                    comment: review.comment,
                    createdAt: review.created_at,
                    updatedAt: review.updated_at,
                }
            };
        } catch (e) {
            reviewLogger.error('submitReview exception', e);
            return { success: false, data: null, error: 'Failed to submit review' };
        }
    },

    /**
     * Delete user's review
     */
    deleteReview: async (reviewId: string): Promise<ApiResponse<boolean>> => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return { success: false, data: false, error: 'Not authenticated' };
        }

        try {
            const { error } = await supabase
                .from('court_reviews')
                .delete()
                .eq('id', reviewId)
                .eq('user_id', user.id);

            if (error) {
                return { success: false, data: false, error: error.message };
            }

            return { success: true, data: true };
        } catch (e) {
            return { success: false, data: false, error: 'Failed to delete review' };
        }
    },

    /**
     * Check if user has reviewed a court
     */
    getUserReview: async (courtId: string): Promise<ApiResponse<Review | null>> => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return { success: false, data: null };
        }

        try {
            const { data, error } = await supabase
                .from('court_reviews')
                .select('*')
                .eq('court_id', courtId)
                .eq('user_id', user.id)
                .maybeSingle();

            if (error || !data) {
                return { success: true, data: null };
            }

            return {
                success: true,
                data: {
                    id: data.id,
                    courtId: data.court_id,
                    userId: data.user_id,
                    bookingId: data.booking_id,
                    rating: data.rating,
                    comment: data.comment,
                    createdAt: data.created_at,
                    updatedAt: data.updated_at,
                }
            };
        } catch (e) {
            return { success: false, data: null };
        }
    },

    /**
     * Get user's reviews (for profile page)
     */
    getMyReviews: async (): Promise<ApiResponse<Review[]>> => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return { success: false, data: [] };
        }

        try {
            const { data, error } = await supabase
                .from('court_reviews')
                .select(`
                    *,
                    courts:court_id (name)
                `)
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) {
                return { success: false, data: [] };
            }

            const reviews: Review[] = (data || []).map((r: any) => ({
                id: r.id,
                courtId: r.court_id,
                userId: r.user_id,
                rating: r.rating,
                comment: r.comment,
                createdAt: r.created_at,
                updatedAt: r.updated_at,
                courtName: r.courts?.name,
            }));

            return { success: true, data: reviews };
        } catch (e) {
            return { success: false, data: [] };
        }
    },
};
