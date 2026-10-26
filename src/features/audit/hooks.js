import { useQuery } from '@tanstack/react-query'
import * as api from '../../api'
import { reportKeys } from '../reports/queryKeys'

const retryUnlessClientError = (count, error) =>
  error?.status >= 500 && count < 1

export const useAuditLogs = (filters) =>
  useQuery({
    queryKey: reportKeys.audit(filters),
    queryFn: () => api.audit.getAuditLogs(filters),
    retry: retryUnlessClientError,
    placeholderData: (previous) => previous,
  })
