import { QueryClient } from '@tanstack/react-query';
import { cromApi } from './cromApi';
import { scpDataApi } from './scpDataApi';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 30, // 30 minutes cache validity
      gcTime: 1000 * 60 * 60 * 24, // 24 hours garbage collection retention
      refetchOnWindowFocus: false,
      retry: 1
    }
  }
});

// Prefetch an SCP dossier into TanStack cache (triggered on card hover or list load)
export const prefetchScpDossier = async (slug: string, langCode: string) => {
  await queryClient.prefetchQuery({
    queryKey: ['scp-detail', slug, langCode],
    queryFn: () => cromApi.fetchScpDetail(slug, langCode),
    staleTime: 1000 * 60 * 60 * 2 // 2 hours
  });
};

// Prefetch a whole series into TanStack cache (triggered on series button hover or idle)
export const prefetchScpSeries = async (seriesId: string, langCode: string) => {
  await queryClient.prefetchQuery({
    queryKey: ['scp-series', seriesId, langCode],
    queryFn: () => cromApi.fetchSeries(seriesId, langCode),
    staleTime: 1000 * 60 * 60 * 2 // 2 hours
  });
};

