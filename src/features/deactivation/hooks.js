import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as api from '../../api'
import { reportKeys } from '../reports/queryKeys'

const retryUnlessClientError = (count, error) =>
  error?.status >= 500 && count < 1

export const useDeactivationRequests = (filters) =>
  useQuery({
    queryKey: reportKeys.deactivation(filters),
    queryFn: () => api.deactivation.getRequests(filters),
    retry: retryUnlessClientError,
    placeholderData: (previous) => previous,
  })

export const useDecideDeactivation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status, alasan }) =>
      api.deactivation.decideRequest(id, { status, alasan }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'deactivation-requests'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'accounts'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'audit-logs'] })
    },
  })
}
