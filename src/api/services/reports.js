import { http } from '../client'
import { adaptPagination, adaptReport } from '../adapters'
import { ROLES } from '../../lib/constants'
import { identityVisible } from '../../lib/displayReporter'
import { getSession } from '../../lib/session'
import { ApiError } from '../errors'
import { API_URL } from '../../lib/env'

const unwrap = (response) => response.data.data

// Beberapa endpoint laporan membungkus model di `data`, sebagian lagi di
// `laporan`; keduanya harus dipetakan dengan adapter yang sama.
const unwrapReport = (response) =>
  response.data.data ?? response.data.laporan

// Endpoint pengajuan memakai `data` untuk model permintaan, jadi laporan
// terbaru harus diambil dari `laporan` lebih dulu.
const unwrapNestedReport = (response) =>
  response.data.laporan ?? response.data.data

const unwrapList = (response) => {
  const body = response.data ?? {}
  const payload = body.data
  const items = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.data)
      ? payload.data
      : Array.isArray(payload?.items)
        ? payload.items
        : Array.isArray(body.items)
          ? body.items
          : []
  const meta =
    payload?.meta ??
    payload?.pagination ??
    body.meta ??
    body.pagination ??
    payload ??
    body
  return {
    items: items.map(adaptReport),
    meta: adaptPagination(meta, items.length),
  }
}

const currentUser = () => getSession()?.user ?? null

const canViewReport = (report, role, userId) => {
  if (
    role === ROLES.SANTRI &&
    report.ownerId != null &&
    userId != null &&
    String(report.ownerId) !== String(userId)
  ) {
    return false
  }
  // Pengawas hanya melihat laporan yang ditandai menyangkut pimpinan.
  if (role === ROLES.PENGAWAS) return Boolean(report.menyangkutPimpinan)
  if (role === ROLES.PENGURUS && report.kategori === 'masalah_pengurus') {
    return false
  }
  return true
}

const sanitizeReport = (report, role = currentUser()?.role ?? null) => {
  if (!report) return report
  const visible = identityVisible(report, role)
  let next = visible ? report : { ...report, pelaporNama: null }
  if (role === ROLES.SANTRI) next = { ...next, catatan: [] }
  if (role === ROLES.PENGURUS) {
    next = { ...next, permintaanIdentitas: null }
  }
  return next
}

const assertCanView = (report, role, userId) => {
  if (!canViewReport(report, role, userId)) {
    throw new ApiError({
      status: 403,
      message: 'Laporan ini tidak dapat diakses oleh peranmu.',
    })
  }
}

export const deleteReport = async (id) => {
  const response = await http.delete(`/reports/${id}`)
  return response.data
}

export const createReport = async (payload) =>
  sanitizeReport(adaptReport(unwrapReport(await http.post('/reports', payload))))

export const getMine = async () => {
  const firstPage = unwrapList(
    await http.get('/reports/mine', { params: { page: 1 } }),
  )
  const allReports = [...firstPage.items]
  for (let page = 2; page <= firstPage.meta.lastPage; page += 1) {
    const result = unwrapList(
      await http.get('/reports/mine', { params: { page } }),
    )
    allReports.push(...result.items)
  }
  const user = currentUser()
  const role = user?.role ?? null
  const visible = allReports.filter((report) =>
    canViewReport(report, role, user?.id),
  )
  return {
    items: visible.map((report) => sanitizeReport(report, role)),
    meta: adaptPagination(
      { current_page: 1, last_page: 1, total: visible.length },
      visible.length,
    ),
  }
}

export const getList = async ({
  status,
  kategori,
  kodeLaporan,
  menyangkutPimpinan,
} = {}) => {
  const firstPage = unwrapList(
    await http.get('/reports', { params: { page: 1 } }),
  )
  const allReports = [...firstPage.items]
  for (let page = 2; page <= firstPage.meta.lastPage; page += 1) {
    const result = unwrapList(
      await http.get('/reports', { params: { page } }),
    )
    allReports.push(...result.items)
  }

  const user = currentUser()
  const role = user?.role ?? null
  const code = String(kodeLaporan ?? '').trim().toLowerCase()
  const filtered = allReports
    .filter((report) => canViewReport(report, role, user?.id))
    .filter(
      (report) =>
        (!status || report.status === status) &&
        (!kategori || report.kategori === kategori) &&
        (!menyangkutPimpinan || report.menyangkutPimpinan) &&
        (!code || String(report.noLaporan ?? '').toLowerCase().includes(code)),
    )
  return {
    items: filtered.map((report) => sanitizeReport(report, role)),
    meta: adaptPagination(
      { current_page: 1, last_page: 1, total: filtered.length },
      filtered.length,
    ),
  }
}

export const getDetail = async (id) => {
  const report = adaptReport(unwrap(await http.get(`/reports/${id}`)))
  const user = currentUser()
  assertCanView(report, user?.role ?? null, user?.id)
  return sanitizeReport(report, user?.role ?? null)
}

export const updateIdentity = async (id, tampilkanIdentitas) =>
  sanitizeReport(
    adaptReport(
      unwrapReport(
        await http.patch(`/reports/${id}/identity`, {
          tampilkan_identitas: tampilkanIdentitas,
        }),
      ),
    ),
  )

export const updateStatus = async (id, status) =>
  sanitizeReport(
    adaptReport(
      unwrapReport(await http.patch(`/reports/${id}/status`, { status })),
    ),
  )

export const escalate = async (id, payload = {}) => {
  const body = {
    tujuan: payload.tujuan,
    nomor_wa_tujuan: payload.nomor_wa_tujuan ?? payload.nomorWaTujuan,
    catatan_pengurus:
      payload.catatan_pengurus ??
      payload.catatanPengurus ??
      payload.catatan ??
      null,
  }
  const response = await http.post(`/petugas/laporan/${id}/eskalasi`, body)
  const data = response.data?.data ?? response.data
  if (data?.laporan) {
    data.laporan = sanitizeReport(adaptReport(data.laporan))
  }
  return data
}

export const escalateReport = escalate

export const downloadEscalationPdf = async (id, downloadUrl) => {
  let url = downloadUrl
  if (typeof url === 'string' && !/^https?:\/\//i.test(url)) {
    if (url.startsWith('/api/')) {
      url = API_URL ? `${API_URL}${url}` : url.slice(4)
    } else if (!url.startsWith('/')) {
      url = `/${url}`
    }
  }
  const response = await http.get(
    url || `/petugas/laporan/${id}/eskalasi/pdf`,
    {
    responseType: 'blob',
    },
  )
  return response.data
}

export const requestIdentity = async (id, { alasan, bukti }) => {
  const form = new FormData()
  form.append('alasan', alasan)
  if (bukti) form.append('bukti', bukti)
  return sanitizeReport(
    adaptReport(
      unwrapNestedReport(
        await http.post(`/reports/${id}/identity-request`, form),
      ),
    ),
  )
}

// Backend menerima status 1 untuk setuju dan 0 untuk menolak.
export const answerIdentityRequest = async (id, status) => {
  const answers = { disetujui: 1, ditolak: 0 }
  if (!Object.hasOwn(answers, status)) {
    throw new Error('Jawaban permintaan identitas tidak valid.')
  }
  return sanitizeReport(
    adaptReport(
      unwrap(
        await http.patch(`/reports/${id}/identity-request`, {
          status: answers[status],
        }),
      ),
    ),
  )
}
export const getTrail = async (id) => {
  const { data } = await http.get(`/reports/${id}/trail`)
  return Array.isArray(data?.data) ? data.data : []
}
