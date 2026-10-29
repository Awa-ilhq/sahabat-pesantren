import { getSession } from '../../lib/session'
import { ROLES } from '../../lib/constants'
import {
  adaptNotificationList,
  adaptNotificationSummary,
  adaptPagination,
} from '../adapters'
import { http } from '../client'
import * as reports from './reports'

export const getSummary = async () => {
  const { data } = await http.get('/notifications/summary')
  return adaptNotificationSummary(data.data)
}

const parseTime = (value) => {
  const time = Date.parse(value ?? '')
  return Number.isFinite(time) ? time : null
}

const eventAfterRead = (value, readTime) => {
  const time = parseTime(value)
  if (time == null) return false
  return readTime == null || time > readTime
}

const latestIncoming = (messages, userName, readTime) => {
  let latest = null
  messages.forEach((message) => {
    if (message.senderName === userName) return
    if (!eventAfterRead(message.createdAt, readTime)) return
    const time = parseTime(message.createdAt)
    if (time == null) return
    if (!latest || time > latest.time) latest = { message, time }
  })
  return latest
}

// Fallback bila GET /notifications tidak tersedia (404): daftar notifikasi
// diturunkan dari data laporan + waktu baca per peran.
const buildDerivedList = async () => {
  const user = getSession()?.user
  const role = user?.role
  if (!user) {
    return {
      items: [],
      meta: adaptPagination({ current_page: 1, last_page: 1, total: 0 }, 0),
    }
  }

  const source =
    role === ROLES.SANTRI
      ? await reports.getMine()
      : await reports.getList()
  const items = []

  source.items.forEach((report) => {
    const readAt = report.readAt?.[role] ?? null
    const readTime = parseTime(readAt)
    const base = {
      laporanId: report.id,
      noLaporan: report.noLaporan,
      kategori: report.kategori,
    }

    if (role === ROLES.SANTRI) {
      const request = report.permintaanIdentitas
      if (
        request?.status === 'menunggu' &&
        eventAfterRead(request.createdAt, readTime)
      ) {
        items.push({
          ...base,
          id: `permintaan_identitas:${report.id}`,
          tipe: 'permintaan_identitas',
          waktu: request.createdAt,
          pengirim: request.diminta,
        })
      }

      if (
        report.statusChangedAt &&
        eventAfterRead(report.statusChangedAt, readTime)
      ) {
        items.push({
          ...base,
          id: `status_diubah:${report.id}`,
          tipe: 'status_diubah',
          waktu: report.statusChangedAt,
          statusBaru: report.status,
        })
      }

      const latest = latestIncoming(
        report.messages ?? [],
        user.name,
        readTime,
      )
      if (latest) {
        items.push({
          ...base,
          id: `pesan_baru:${report.id}`,
          tipe: 'pesan_baru',
          waktu: latest.message.createdAt,
          pengirim: latest.message.senderName,
          preview: latest.message.body,
        })
      }
      return
    }

    if (role === ROLES.PENGAWAS && report.status === 'baru' && report.terlambat === true) {
      items.push({
        ...base,
        id: `laporan_terlambat:${report.id}`,
        tipe: 'laporan_terlambat',
        waktu: report.createdAt,
        statusLaporan: report.status,
      })
    }

    if (report.status === 'baru' && parseTime(readAt) == null) {
      items.push({
        ...base,
        id: `laporan_baru:${report.id}`,
        tipe: 'laporan_baru',
        waktu: report.createdAt,
      })
    }

    if (report.status !== 'selesai') {
      const latest = latestIncoming(
        report.messages ?? [],
        user.name,
        readTime,
      )
      if (latest) {
        items.push({
          ...base,
          id: `pesan_baru:${report.id}`,
          tipe: 'pesan_baru',
          waktu: latest.message.createdAt,
          pengirim: latest.message.senderName,
          preview: latest.message.body,
        })
      }
    }
  })

  items.sort((a, b) => (parseTime(b.waktu) ?? 0) - (parseTime(a.waktu) ?? 0))

  return {
    items,
    meta: adaptPagination(
      { current_page: 1, last_page: 1, total: items.length },
      items.length,
    ),
  }
}

const PER_PAGE = 100

const fetchNotificationPage = async (page) => {
  const { data } = await http.get('/notifications', {
    params: { page, per_page: PER_PAGE },
  })
  return adaptNotificationList(data)
}

// Ambil seluruh halaman agar jumlah item sama dengan meta.total.
const fetchAllFromEndpoint = async () => {
  const first = await fetchNotificationPage(1)
  const byId = new Map(first.items.map((item) => [item.id, item]))

  for (let page = 2; page <= first.meta.lastPage; page += 1) {
    const next = await fetchNotificationPage(page)
    next.items.forEach((item) => byId.set(item.id, item))
  }

  const items = [...byId.values()]
  return {
    items,
    meta: adaptPagination(
      {
        current_page: 1,
        last_page: 1,
        total: items.length,
        per_page: items.length || first.meta.perPage,
      },
      items.length,
    ),
  }
}

// Coba endpoint resmi sekali per sesi muat aplikasi; jika 404, pakai
// penurunan dari data laporan agar halaman tetap berfungsi.
let listEndpointAvailable = null

export const getList = async () => {
  if (listEndpointAvailable !== false) {
    try {
      const result = await fetchAllFromEndpoint()
      listEndpointAvailable = true
      return result
    } catch (error) {
      if (error?.status !== 404) throw error
      listEndpointAvailable = false
    }
  }

  return buildDerivedList()
}
