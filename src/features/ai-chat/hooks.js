import { useMutation, useQueryClient } from '@tanstack/react-query'
import * as api from '../../api'
import { aiKeys } from './queryKeys'

export const useAiChat = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload) => api.ai.chat(payload),
    onSuccess: (result) => {
      if (result?.conversationId) {
        queryClient.invalidateQueries({
          queryKey: aiKeys.conversation(result.conversationId),
        })
      }
    },
  })
}

export const useAiDraft = () =>
  useMutation({
    mutationFn: (payload) => api.ai.createDraft(payload),
  })
