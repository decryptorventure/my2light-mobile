import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { HighlightService } from "../highlight.service";
import type { Highlight } from "@/types";
import { CACHE_TTL } from "@/shared/constants/cache";

// Query keys for highlights
export const highlightQueryKeys = {
    all: ["highlights"] as const,
    lists: () => [...highlightQueryKeys.all, "list"] as const,
    list: (limit: number) => [...highlightQueryKeys.lists(), { limit }] as const,
    user: (userId: string) => [...highlightQueryKeys.all, "user", userId] as const,
};

export function useHighlights(limit: number = 20) {
    return useQuery({
        queryKey: highlightQueryKeys.list(limit),
        queryFn: async () => {
            const result = await HighlightService.getHighlights(limit);
            return result.data;
        },
        staleTime: CACHE_TTL.FREQUENT,
        gcTime: CACHE_TTL.FREQUENT * 2,
    });
}

export function useUserHighlights(userId: string, limit: number = 50) {
    return useQuery({
        queryKey: highlightQueryKeys.user(userId),
        queryFn: async () => {
            const result = await HighlightService.getUserHighlights(userId, limit);
            return result.data;
        },
        staleTime: CACHE_TTL.FREQUENT,
        gcTime: CACHE_TTL.FREQUENT * 2,
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
        }) =>
            HighlightService.createHighlight(
                params.courtId,
                params.videoUrl,
                params.duration,
                params.title,
                params.description
            ),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: highlightQueryKeys.all });
        },
    });
}

export function useToggleLike() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (params: { highlightId: string; currentLikes: number; isLiked: boolean }) =>
            HighlightService.toggleLike(params.highlightId, params.currentLikes, params.isLiked),

        // Optimistic update - immediately update UI before network response
        onMutate: async (params) => {
            // Cancel outgoing queries to avoid race conditions
            await queryClient.cancelQueries({ queryKey: highlightQueryKeys.all });

            // Snapshot previous value for rollback
            const previousData = queryClient.getQueryData(highlightQueryKeys.lists());

            // Optimistically update all list queries
            queryClient.setQueriesData({ queryKey: highlightQueryKeys.lists() }, (old: any) => {
                if (!old) return old;
                return old.map((h: Highlight) =>
                    h.id === params.highlightId
                        ? {
                              ...h,
                              likes: params.isLiked ? h.likes - 1 : h.likes + 1,
                              isLiked: !params.isLiked,
                          }
                        : h
                );
            });

            return { previousData };
        },

        // Revert on error
        onError: (err, params, context) => {
            if (context?.previousData) {
                queryClient.setQueriesData(
                    { queryKey: highlightQueryKeys.lists() },
                    context.previousData
                );
            }
        },

        // Only invalidate on success (for server sync)
        onSettled: () => {
            // Invalidate to ensure consistency, but optimistic update already happened
            queryClient.invalidateQueries({ queryKey: highlightQueryKeys.lists() });
        },
    });
}
