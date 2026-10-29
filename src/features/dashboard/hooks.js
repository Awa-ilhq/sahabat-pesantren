import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as api from '../../api'
import { reportKeys } from '../reports/queryKeys'

const AI_SUMMARY_CACHE_MS = 10 * 60 * 1000

const retryUnlessClientError = (count, error) =>
  error?.status >= 500 && count < 1

export const useSummary = () =>
  useQuery({
    queryKey: reportKeys.summary(),
    queryFn: () => api.dashboard.getSummary(),
    retry: retryUnlessClientError,
  })

export const useAiSummary = ({ periode = 7 } = {}) => {
  const queryClient = useQueryClient()
  const queryKey = ['dashboard', 'ai-summary', periode]
  const query = useQuery({
    queryKey,
    queryFn: () => api.dashboard.getAiSummary({ periode, refresh: false }),
    retry: false,
    enabled: false,
    staleTime: AI_SUMMARY_CACHE_MS,
    gcTime: AI_SUMMARY_CACHE_MS,
  })

  const request = useMutation({
    mutationFn: () =>
      queryClient.fetchQuery({
        queryKey,
        queryFn: () => api.dashboard.getAiSummary({ periode, refresh: false }),
        retry: false,
        staleTime: AI_SUMMARY_CACHE_MS,
        gcTime: AI_SUMMARY_CACHE_MS,
      }),
    onSuccess: (data) => {
      queryClient.setQueryData(queryKey, data)
    },
  })

  return {
    ...query,
    data: request.data || query.data,
    requestSummary: request.mutate,
    isRequesting: request.isPending,
    requestError: request.error,
    clearRequestError: request.reset,
  }
}
