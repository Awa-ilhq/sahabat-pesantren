import { http } from '../client'
import {
  adaptDeactivationList,
  adaptDeactivationRequest,
} from '../adapters'

const unwrap = (response) => response.data?.data ?? response.data ?? {}

// Daftar pengajuan penonaktifan akun pimpinan. Hanya pimpinan yang boleh
// melihat dan memutuskan pengajuan.
export const getRequests = async ({ status = 'menunggu', page, perPage } = {}) => {
  const { data } = await http.get('/admin/deactivation-requests', {
    params: {
      ...(status ? { status } : {}),
      ...(page ? { page } : {}),
      ...(perPage ? { per_page: perPage } : {}),
    },
  })
  return adaptDeactivationList(data)
}

export const decideRequest = async (id, { status, alasan } = {}) =>
  adaptDeactivationRequest(
    unwrap(
      await http.patch(`/admin/deactivation-requests/${id}`, {
        status,
        ...(alasan ? { alasan } : {}),
      }),
    ),
  )
