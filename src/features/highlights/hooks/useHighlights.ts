import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { HighlightService } from "../highlight.service";
import type { Highlight } from "@/types";

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
        staleTime: 60000, // 1 minute
    });
}

export function useUserHighlights(userId: string, limit: number = 50) {
    return useQuery({
        queryKey: highlightQueryKeys.user(userId),
        queryFn: async () => {
            const result = await HighlightService.getUserHighlights(userId, limit);
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
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: highlightQueryKeys.all });
        },
    });
}
