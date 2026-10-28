import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import * as api from '../../api'
import { notificationKeys } from '../notifications/queryKeys'
import { reportKeys } from './queryKeys'

// Jangan mengulang permintaan untuk error yang tidak akan berubah.
const retryUnlessClientError = (count, error) =>
  error?.status >= 500 && count < 1

export const useMyReports = () =>
  useQuery({
    queryKey: reportKeys.mine(),
    queryFn: () => api.reports.getMine(),
    retry: retryUnlessClientError,
    placeholderData: (previous) => previous,
  })

export const useReport = (id) =>
  useQuery({
    queryKey: reportKeys.detail(id),
    queryFn: () => api.reports.getDetail(id),
    enabled: Boolean(id),
    refetchOnMount: 'always',
    // Selama permintaan identitas masih menunggu jawaban santri, muat ulang
    // berkala agar status persetujuan ikut berubah tanpa refresh manual.
    refetchInterval: (query) =>
      query.state.data?.permintaanIdentitas?.status === 'menunggu' ? 10_000 : false,
    retry: retryUnlessClientError,
  })

export const useReportTrail = (id) =>
  useQuery({
    queryKey: reportKeys.trail(id),
    queryFn: () => api.reports.getTrail(id),
    enabled: Boolean(id),
    retry: retryUnlessClientError,
  })

export const useStaffReports = (filters) =>
  useQuery({
    queryKey: reportKeys.staff({
      status: filters.status,
      kategori: filters.kategori,
      kodeLaporan: filters.kodeLaporan,
      menyangkutPimpinan: filters.menyangkutPimpinan,
    }),
    queryFn: () => api.reports.getList(filters),
    retry: retryUnlessClientError,
    placeholderData: (previous) => previous,
  })

export const useDeleteReport = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id) => api.reports.deleteReport(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] })
      queryClient.invalidateQueries({ queryKey: notificationKeys.all() })
    },
  })
}

export const useCreateReport = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload) => api.reports.createReport(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports', 'mine'] })
    },
  })
}

export const useUpdateIdentity = (id) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (tampilkanIdentitas) =>
      api.reports.updateIdentity(id, tampilkanIdentitas),
    onSuccess: (report) => {
      if (report) {
        queryClient.setQueryData(reportKeys.detail(id), report)
      }
      queryClient.invalidateQueries({ queryKey: reportKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: ['reports', 'mine'] })
      queryClient.invalidateQueries({ queryKey: notificationKeys.all() })
    },
  })
}

export const useUpdateStatus = (id) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (status) => api.reports.updateStatus(id, status),
    onSuccess: (report) => {
      queryClient.setQueryData(reportKeys.detail(id), report)
      queryClient.invalidateQueries({ queryKey: ['reports'] })
      queryClient.invalidateQueries({ queryKey: notificationKeys.all() })
    },
  })
}

export const useEscalate = (id) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload) => api.reports.escalate(id, payload),
    onSuccess: (result, payload) => {
      const report = result?.laporan
      if (report) {
        queryClient.setQueryData(reportKeys.detail(id), report)
      } else {
        queryClient.setQueryData(reportKeys.detail(id), (current) =>
          current
            ? {
                ...current,
                status: 'DITERUSKAN_KE_BERWAJIB',
                isLocked: true,
                dieskalasiTujuan: payload.tujuan,
                dieskalasiCatatan: payload.catatan_pengurus,
                dieskalasiAt: new Date().toISOString(),
              }
            : current,
        )
      }
      queryClient.invalidateQueries({ queryKey: reportKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: ['reports'] })
      queryClient.invalidateQueries({ queryKey: notificationKeys.all() })
    },
  })
}

export const useRequestIdentity = (id) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload) => api.reports.requestIdentity(id, payload),
    onSuccess: (report) => {
      queryClient.setQueryData(reportKeys.detail(id), report)
      queryClient.invalidateQueries({ queryKey: ['reports'] })
    },
  })
}

export const useAnswerIdentityRequest = (id) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (status) => api.reports.answerIdentityRequest(id, status),
    onSuccess: (report) => {
      queryClient.setQueryData(reportKeys.detail(id), report)
      queryClient.invalidateQueries({ queryKey: ['reports'] })
      queryClient.invalidateQueries({ queryKey: notificationKeys.all() })
    },
  })
}

export const useAddNote = (id, authorName) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (body) => {
      const note = await api.notes.addNote(id, body)
      return { ...note, authorName: note.authorName ?? authorName ?? null }
    },
    onSuccess: (note) => {
      queryClient.setQueryData(reportKeys.detail(id), (report) => {
        if (!report) return report
        const notes = report.catatan ?? []
        if (notes.some((item) => String(item.id) === String(note.id))) {
          return report
        }
        return { ...report, catatan: [...notes, note] }
      })
    },
  })
}
