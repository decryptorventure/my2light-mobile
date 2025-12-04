import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ApiService } from '../services/api';
import type { Highlight, Court, User, Booking, MatchRequest } from '../types';

// Query keys - centralized for cache management
export const queryKeys = {
    highlights: {
        all: ['highlights'] as const,
        lists: () => [...queryKeys.highlights.all, 'list'] as const,
        list: (limit: number) => [...queryKeys.highlights.lists(), { limit }] as const,
        user: (userId: string) => [...queryKeys.highlights.all, 'user', userId] as const,
    },
    courts: {
        all: ['courts'] as const,
        lists: () => [...queryKeys.courts.all, 'list'] as const,
        detail: (id: string) => [...queryKeys.courts.all, 'detail', id] as const,
    },
    user: {
        current: ['user', 'current'] as const,
        credits: ['user', 'credits'] as const,
    },
    bookings: {
        all: ['bookings'] as const,
        history: () => [...queryKeys.bookings.all, 'history'] as const,
        active: () => [...queryKeys.bookings.all, 'active'] as const,
    },
    matches: {
        all: ['matches'] as const,
        open: () => [...queryKeys.matches.all, 'open'] as const,
    },
    notifications: {
        all: ['notifications'] as const,
        list: () => [...queryKeys.notifications.all, 'list'] as const,
        unreadCount: () => [...queryKeys.notifications.all, 'unreadCount'] as const,
    },
    transactions: {
        all: ['transactions'] as const,
        list: () => [...queryKeys.transactions.all, 'list'] as const,
    },
};

// ============ HIGHLIGHT HOOKS ============
export function useHighlights(limit: number = 20) {
    return useQuery({
        queryKey: queryKeys.highlights.list(limit),
        queryFn: async () => {
            const result = await ApiService.getHighlights(limit);
            return result.data;
        },
        staleTime: 60000, // 1 minute
    });
}

export function useUserHighlights(userId: string, limit: number = 50) {
    return useQuery({
        queryKey: queryKeys.highlights.user(userId),
        queryFn: async () => {
            const result = await ApiService.getUserHighlights(userId, limit);
            return result.data;
        },
        staleTime: 60000,
        enabled: !!userId,
    });
}

export function useCreateHighlight() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (params: {
            courtId: string;
            videoUrl?: string;
            duration?: number;
            title?: string;
            description?: string;
        }) => ApiService.createHighlight(
            params.courtId,
            params.videoUrl,
            params.duration,
            params.title,
            params.description
        ),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.highlights.all });
        },
    });
}

export function useToggleLike() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (params: { highlightId: string; currentLikes: number; isLiked: boolean }) =>
            ApiService.toggleLike(params.highlightId, params.currentLikes, params.isLiked),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.highlights.all });
        },
    });
}

// ============ COURT HOOKS ============
export function useCourts() {
    return useQuery({
        queryKey: queryKeys.courts.lists(),
        queryFn: async () => {
            const result = await ApiService.getCourts();
            return result.data;
        },
        staleTime: 300000, // 5 minutes
    });
}

export function useCourtById(id: string) {
    return useQuery({
        queryKey: queryKeys.courts.detail(id),
        queryFn: async () => {
            const result = await ApiService.getCourtById(id);
            return result.data;
        },
        staleTime: 300000,
        enabled: !!id,
    });
}

// ============ USER HOOKS ============
export function useCurrentUser() {
    return useQuery({
        queryKey: queryKeys.user.current,
        queryFn: async () => {
            const result = await ApiService.getCurrentUser();
            return result.data;
        },
        staleTime: 300000,
        retry: 1,
    });
}

export function useUpdateUserProfile() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (updates: any) => ApiService.updateUserProfile(updates),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.user.current });
        },
    });
}

export function useUserCredits() {
    return useQuery({
        queryKey: queryKeys.user.credits,
        queryFn: async () => {
            const result = await ApiService.getUserCredits();
            return result.data;
        },
        staleTime: 60000,
    });
}

// ============ BOOKING HOOKS ============
export function useBookingHistory() {
    return useQuery({
        queryKey: queryKeys.bookings.history(),
        queryFn: async () => {
            const result = await ApiService.getBookingHistory();
            return result.data;
        },
        staleTime: 60000,
    });
}

export function useActiveBooking() {
    return useQuery({
        queryKey: queryKeys.bookings.active(),
        queryFn: async () => {
            const result = await ApiService.getActiveBooking();
            return result.data;
        },
        staleTime: 30000, // 30 seconds
    });
}

// ============ MATCH HOOKS ============
export function useMatchRequests() {
    return useQuery({
        queryKey: queryKeys.matches.open(),
        queryFn: async () => {
            const result = await ApiService.getMatchRequests();
            return result.data;
        },
        staleTime: 60000,
    });
}

export function useCreateMatchRequest() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (request: Omit<MatchRequest, 'id' | 'userId' | 'status' | 'createdAt'>) =>
            ApiService.createMatchRequest(request),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.matches.all });
        },
    });
}

// ============ NOTIFICATION HOOKS ============
export function useNotifications(limit: number = 20) {
    return useQuery({
        queryKey: queryKeys.notifications.list(),
        queryFn: async () => {
            const result = await ApiService.getNotifications(limit);
            return result.data;
        },
        staleTime: 30000,
    });
}

export function useUnreadNotificationCount() {
    return useQuery({
        queryKey: queryKeys.notifications.unreadCount(),
        queryFn: async () => {
            const result = await ApiService.getUnreadNotificationCount();
            return result.data;
        },
        staleTime: 30000,
    });
}

export function useMarkNotificationRead() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (notificationId: string) => ApiService.markNotificationRead(notificationId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
        },
    });
}

export function useMarkAllNotificationsRead() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: () => ApiService.markAllNotificationsRead(),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
        },
    });
}

// ============ TRANSACTION HOOKS ============
export function useTransactions(limit: number = 50) {
    return useQuery({
        queryKey: queryKeys.transactions.list(),
        queryFn: async () => {
            const result = await ApiService.getTransactions(limit);
            return result.data;
        },
        staleTime: 60000,
    });
}
