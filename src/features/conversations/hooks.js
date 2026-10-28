import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as api from '../../api'
import { reportKeys } from '../reports/queryKeys'

export const useMessages = (id) =>
  useQuery({
    queryKey: reportKeys.conversation(id),
    queryFn: () => api.messages.getMessages(id),
    enabled: Boolean(id),
    refetchOnMount: 'always',
    refetchInterval: 10000,
  })

export const useSendMessage = (id) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body) => api.messages.sendMessage(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reportKeys.conversation(id) })
    },
    onError: (error) => {
      if (error?.status === 409) {
        queryClient.invalidateQueries({ queryKey: reportKeys.detail(id) })
      }
    },
  })
}
