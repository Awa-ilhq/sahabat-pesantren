import { useQuery } from '@tanstack/react-query'
import * as api from '../../api'
import { reportKeys } from '../reports/queryKeys'

const retryUnlessClientError = (count, error) =>
  error?.status >= 500 && count < 1

export const useSummary = () =>
  useQuery({
    queryKey: reportKeys.summary(),
    queryFn: () => api.dashboard.getSummary(),
    retry: retryUnlessClientError,
  })

export const useAiSummary = ({ periode = 7, refresh = false } = {}) =>
  useQuery({
    queryKey: ['dashboard', 'ai-summary', periode, refresh],
    queryFn: () => api.dashboard.getAiSummary({ periode, refresh }),
    retry: retryUnlessClientError,
    enabled: Boolean(api.dashboard?.getAiSummary),
  })
