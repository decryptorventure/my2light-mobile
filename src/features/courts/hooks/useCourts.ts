import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CourtService } from '../court.service';

export const courtQueryKeys = {
    all: ['courts'] as const,
    lists: () => [...courtQueryKeys.all, 'list'] as const,
    detail: (id: string) => [...courtQueryKeys.all, 'detail', id] as const,
};

export function useCourts() {
    return useQuery({
        queryKey: courtQueryKeys.lists(),
        queryFn: async () => {
            const result = await CourtService.getCourts();
            return result.data;
        },
        staleTime: 300000, // 5 minutes
    });
}

export function useCourtById(id: string) {
    return useQuery({
        queryKey: courtQueryKeys.detail(id),
        queryFn: async () => {
            const result = await CourtService.getCourtById(id);
            return result.data;
        },
        staleTime: 300000,
        enabled: !!id,
    });
}
