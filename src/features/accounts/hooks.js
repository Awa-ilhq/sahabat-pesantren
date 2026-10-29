import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as api from '../../api'
import { reportKeys } from '../reports/queryKeys'

const retryUnlessClientError = (count, error) =>
  error?.status >= 500 && count < 1

export const useAccounts = (filters) =>
  useQuery({
    queryKey: reportKeys.accounts(filters),
    queryFn: () => api.admin.getAccounts(filters),
    retry: retryUnlessClientError,
    placeholderData: (previous) => previous,
  })

export const useCreateAccount = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload) => api.admin.createAccount(payload),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['admin', 'accounts'] }),
  })
}

export const useSetAccountActive = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, active }) => api.admin.setAccountActive(id, active),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['admin', 'accounts'] }),
  })
}

export const useTemplate = () =>
  useQuery({
    queryKey: ['admin', 'template'],
    queryFn: () => api.admin.getTemplate(),
    retry: retryUnlessClientError,
    staleTime: Infinity,
  })

export const useExportSantri = () =>
  useMutation({ mutationFn: () => api.admin.exportSantri() })

export const usePreviewImport = () =>
  useMutation({ mutationFn: (file) => api.admin.previewImport(file) })

export const useImportSantri = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload) => api.admin.importSantri(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['admin', 'accounts'],
        refetchType: 'none',
      })
      await queryClient.refetchQueries({
        queryKey: ['admin', 'accounts'],
        type: 'all',
      })
    },
  })
}
