import { ApiError } from '../errors'
import {
  adaptAccount,
  adaptMessage,
  adaptNote,
  adaptNotificationSummary,
  adaptPagination,
  adaptReport,
  adaptSummary,
  adaptUser,
} from '../adapters'
import {
  IDENTITY_PROOF_MAX_BYTES,
  routesToPimpinan,
} from '../../lib/constants'
import {
  createSantriWorkbookBlob,
  createSantriTemplateWorkbookBlob,
  readSantriWorkbook,
} from '../../lib/santriWorkbook'
import {
  clearSession,
  emitSessionExpired,
  getSession,
  getToken,
} from '../../lib/session'
import {
  accounts,
  nextMessageId,
  nextNoteId,
  nextReportId,
  offsetDate,
  personName,
  reports as reportStore,
} from './store'

const delay = (ms = 300) => new Promise((resolve) => setTimeout(resolve, ms))

const fail = (status, message, errors = null) => {
  throw new ApiError({ status, message, errors })
}

const expired = () => {
  clearSession()
  emitSessionExpired()
  fail(401, 'Sesi berakhir. Silakan masuk kembali.')
}

const requireUser = () => {
  const token = getToken()
  if (!token || !token.startsWith('mock.')) expired()
  const id = Number(token.slice(5))
  const account = accounts.find((item) => item.id === id)
  if (!account || !account.active) expired()
  return account
}

// Mock AI dipakai juga saat aplikasi tersambung ke API asli, sehingga
// identitas diambil dari sesi yang tersimpan, bukan dari token mock.
const requireSessionUser = () => {
  const user = getSession()?.user
  if (!user) expired()
  return user
}

const requireRole = (user, roles) => {
  if (!roles.includes(user.role)) {
    fail(403, 'Kamu tidak punya akses ke halaman ini.')
  }
}

const findReport = (id) =>
  reportStore.find((item) => String(item.id) === String(id))

const canView = (user, report) => {
  if (user.role === 'santri') return report.ownerId === user.id
  if (user.role === 'pengawas') return Boolean(report.menyangkutPimpinan)
  if (user.role === 'pengurus') return report.penerima === 'pengurus'
  return true
}

const accessibleReport = (user, id) => {
  const report = findReport(id)
  if (!report) fail(404, 'Laporan tidak ditemukan.')
  if (!canView(user, report)) {
    fail(403, 'Kamu tidak punya akses ke laporan ini.')
  }
  return report
}

const assertUnlocked = (report) => {
  if (report.isLocked || report.status === 'DITERUSKAN_KE_BERWAJIB') {
    fail(409, 'Laporan terkunci karena sudah diteruskan ke pihak berwajib.')
  }
}

// Snapshot baca hanya hidup di memori modul, sama seperti data mock lain.
const readSnapshots = new Map()
const readKey = (userId, reportId) => `${userId}:${reportId}`

const markReportRead = (user, report) => {
  if (!user || !report) return
  readSnapshots.set(readKey(user.id, report.id), {
    messageCount: report.messages.length,
    status: report.status,
    identityStatus: report.permintaanIdentitas?.status ?? null,
    readAt: Date.now(),
  })
}

const snapshotFor = (user, report) =>
  readSnapshots.get(readKey(user.id, report.id))

const hasNewMessages = (report, user, snapshot) => {
  const start = snapshot?.messageCount ?? 0
  return report.messages
    .slice(start)
    .some(
      (message) =>
        message.senderId != null &&
        String(message.senderId) !== String(user.id),
    )
}

const PROOF_TYPES = ['image/jpeg', 'image/png', 'application/pdf']

// Percakapan Teman Cerita disimpan di memori seperti data mock lain dan tidak
// pernah menyentuh localStorage.
const aiConversations = new Map()
let aiConversationSequence = 0
let aiMessageSequence = 0

const nextAiConversationId = () => {
  aiConversationSequence += 1
  return `ai-${aiConversationSequence}`
}

const nextAiMessageId = () => {
  aiMessageSequence += 1
  return `ai-msg-${aiMessageSequence}`
}

const AI_RISK_PATTERN =
  /(bunuh diri|ingin mati|pengen mati|mau mati|mengakhiri hidup|menyakiti diri|melukai diri|silet|overdosis|dipukul|ditendang|diancam|dilecehkan|diperkosa|pemerkosaan)/i
const AI_BULLY_PATTERN =
  /(ejek|diejek|hina|dihina|kucil|dikucilkan|bully|perundungan|diganggu|mengganggu|ditertawakan)/i
const AI_SAD_PATTERN =
  /(sedih|cemas|takut|kesepian|sendiri|rindu|sulit tidur|stres|stress|beban|lelah|capek)/i
const AI_REPORT_PATTERN = /(lapor|laporkan|draft|draf)/i

const AI_REPLY_PACKS = {
  crisis: {
    bodies: [
      'Terima kasih sudah berani cerita. Keadaan ini terdengar berat, dan keselamatanmu yang paling penting. Tolong segera temui pengurus, ustaz, atau orang dewasa yang kamu percaya di pesantren untuk mendapatkan bantuan langsung.',
    ],
    suggestions: ['Aku mau bicara ke pengurus', 'Aku mau buat laporan'],
  },
  bullying: {
    bodies: [
      'Terima kasih sudah cerita. Diperlakukan seperti itu pasti menyakitkan, dan kamu tidak pantas mengalaminya. Sejak kapan ini terjadi?',
      'Aku mendengarmu. Itu bukan salahmu, dan kamu berhak merasa aman. Apakah ada orang dewasa di pesantren yang sudah kamu percaya untuk bicara?',
      'Terima kasih sudah terus bercerita. Kamu tidak sendirian. Kalau mau, kita bisa pelan-pelan merapikan ceritamu jadi laporan.',
    ],
    suggestions: ['Beberapa hari', 'Sudah lama', 'Lewati'],
  },
  sad: {
    bodies: [
      'Aku di sini menemani. Perasaan itu berat, ya. Mau cerita apa yang paling mengganggu pikiranmu belakangan ini?',
      'Terima kasih sudah jujur. Tidak apa-apa kalau belum tahu harus bagaimana. Apakah kamu punya orang dewasa yang bisa diajak bicara?',
      'Aku mendengarmu. Kamu tidak harus menghadapi semuanya sendirian. Kalau mau, aku bisa bantu merapikan ceritamu jadi draf laporan.',
    ],
    suggestions: ['Belakangan ini', 'Sudah lama', 'Lewati'],
  },
  generic: {
    bodies: [
      'Hai, aku di sini. Cerita saja pelan-pelan, tidak perlu rapi. Apa yang sedang kamu rasakan?',
      'Terima kasih sudah cerita. Aku mendengarkan. Boleh lanjutkan bagian yang paling ingin kamu sampaikan?',
      'Aku mengerti. Kamu sudah berani bercerita, itu langkah yang baik. Mau cerita lebih lanjut?',
    ],
    suggestions: ['Aku masih ingin cerita', 'Bantu aku membuat laporan'],
  },
}

const aiReplyPackFor = (text) => {
  if (AI_RISK_PATTERN.test(text)) return 'crisis'
  if (AI_BULLY_PATTERN.test(text)) return 'bullying'
  if (AI_SAD_PATTERN.test(text)) return 'sad'
  return 'generic'
}

const aiReplyFor = (text, turn) => {
  const key = aiReplyPackFor(text)
  const pack = AI_REPLY_PACKS[key]
  return {
    body: pack.bodies[(Math.max(turn, 1) - 1) % pack.bodies.length],
    suggestions: pack.suggestions,
    risk: key === 'crisis' ? 'high' : 'low',
  }
}

const aiCategoryFor = (text) => {
  const value = text.toLowerCase()
  if (/(pengurus|ustaz|ustadz|pembina|pengasuh)/.test(value)) return 'masalah_pengurus'
  if (/(pukul|tendang|dorong|sentuh|fisik|memukul|menendang)/.test(value)) {
    return 'kekerasan_fisik'
  }
  if (/(ejek|hina|kucil|bully|perundungan|ganggu|tertawa)/.test(value)) {
    return 'perundungan'
  }
  if (/(bentak|ancam|makian|maki|teriak|kata kasar)/.test(value)) {
    return 'kekerasan_verbal'
  }
  if (/(sedih|cemas|takut|kesepian|rindu|tidur|stres|stress|beban)/.test(value)) {
    return 'masalah_pribadi'
  }
  return 'lainnya'
}

const toRawRequest = (request, viewer) => {
  // Pengurus tidak perlu tahu soal permintaan ini; hanya pelapor dan pimpinan.
  if (!request || viewer.role === 'pengurus') return null
  return {
    status: request.status,
    alasan: request.alasan,
    diminta_oleh: request.dimintaOleh,
    bukti_nama: request.bukti?.nama ?? null,
    bukti_url: request.bukti?.url ?? null,
    dibuat: request.createdAt,
    dijawab: request.answeredAt,
  }
}

// Nama terbuka bila saklar santri menyala (untuk petugas), atau bila santri
// menyetujui permintaan pimpinan (hanya untuk pimpinan).
const revealName = (report, viewer) =>
  viewer.role !== 'santri' &&
  (report.tampilkanIdentitas ||
    (viewer.role === 'pimpinan' &&
      report.permintaanIdentitas?.status === 'disetujui'))

const toRawReport = (report, viewer) => {
  const isStaff = viewer.role !== 'santri'
  return {
    id: report.id,
    users_id: report.ownerId,
    no_laporan: report.noLaporan,
    kategori: report.kategori,
    isi: report.isi,
    tampilkan_identitas: report.tampilkanIdentitas,
    menyangkut_pimpinan:
      viewer.role === 'pengawas' || viewer.role === 'santri'
        ? Boolean(report.menyangkutPimpinan)
        : false,
    status: report.status,
    penerima: report.penerima,
    batas_klarifikasi: report.batasKlarifikasi,
    dieskalasi_tujuan: report.escalated?.tujuan ?? null,
    dieskalasi_catatan: report.escalated?.catatan ?? null,
    dieskalasi_at: report.escalated?.at ?? null,
    is_locked:
      report.isLocked === true ||
      report.status === 'DITERUSKAN_KE_BERWAJIB',
    waktu: report.createdAt,
    pelapor_nama: revealName(report, viewer) ? personName(report.ownerId) : null,
    permintaan_identitas: toRawRequest(report.permintaanIdentitas, viewer),
    perlu_klarifikasi: report.perluKlarifikasi,
    terlambat: report.terlambat === true,
    lewat_batas: report.terlambat === true,
    diedit: report.edited === true,
    diubah_pada: report.updatedAt ?? null,
    catatan_internal: isStaff
      ? report.notes.map((note) => ({
        id: note.id,
        author_name: note.authorName,
        body: note.body,
        created_at: note.createdAt,
      }))
      : undefined,
  }
}

const toRawMessage = (item) => ({
  id: item.id,
  from: item.from,
  sender_id: item.senderId,
  sender_name: item.from !== 'santri' ? item.senderName : null,
  isi: item.body,
  created_at: item.createdAt,
})

const PAGE_SIZE = 8

const countBy = (items, key) =>
  items.reduce((accumulator, item) => {
    const value = item[key]
    accumulator[value] = (accumulator[value] ?? 0) + 1
    return accumulator
  }, {})

export const auth = {
  async login({ identifier, password }) {
    await delay()
    const account = accounts.find(
      (item) =>
        item.username.toLowerCase() === String(identifier).trim().toLowerCase(),
    )
    if (!account || account.password !== password) {
      fail(401, 'NIS/ID atau kata sandi salah.')
    }
    if (!account.active) {
      fail(403, 'Akun ini dinonaktifkan. Hubungi pimpinan.')
    }
    return {
      token: `mock.${account.id}`,
      user: adaptUser({
        id: account.id,
        name: account.name,
        role: account.role,
        email: account.email,
        nis: account.nis,
        telepon_ortu: account.teleponOrtu,
        username: account.username,
        must_change_password: account.mustChangePassword,
      }),
    }
  },

  async changePassword({ currentPassword, newPassword }) {
    await delay()
    const account = requireUser()
    if (account.password !== currentPassword) {
      fail(422, 'Kata sandi saat ini tidak cocok.', {
        current_password: ['Kata sandi saat ini tidak cocok.'],
      })
    }
    if (String(newPassword ?? '').length < 8) {
      fail(422, 'Kata sandi minimal 8 karakter.', {
        new_password: ['Kata sandi minimal 8 karakter.'],
      })
    }
    account.password = newPassword
    account.mustChangePassword = false
    return { ok: true }
  },

  async updateProfile(payload = {}) {
    await delay()
    const account = requireUser()
    if (payload.name !== undefined) account.name = payload.name
    if (payload.email !== undefined) account.email = payload.email || null
    if (payload.phone !== undefined) account.teleponOrtu = payload.phone || null
    if (payload.telepon_ortu !== undefined) account.teleponOrtu = payload.telepon_ortu || null
    if (payload.nis !== undefined) account.nis = payload.nis || account.nis
    return {
      user: adaptUser({
        id: account.id,
        name: account.name,
        role: account.role,
        email: account.email,
        nis: account.nis,
        telepon_ortu: account.teleponOrtu,
        username: account.username,
        must_change_password: account.mustChangePassword,
      }),
      message: 'Profil berhasil diperbarui.',
    }
  },

  async getProfile() {
    await delay()
    const account = requireUser()
    return {
      user: adaptUser({
        id: account.id,
        name: account.name,
        role: account.role,
        email: account.email,
        nis: account.nis,
        telepon_ortu: account.teleponOrtu,
        username: account.username,
        must_change_password: account.mustChangePassword,
      }),
    }
  },

  async logout(_token) {
    void _token
    await delay(120)
    return { ok: true }
  },
}

export const reports = {
  async deleteReport(id) {
    await delay()
    const user = requireUser()
    const report = accessibleReport(user, id)
    assertUnlocked(report)
    if (user.role === 'santri' && report.status !== 'baru') {
      fail(403, 'Laporan yang sudah diproses tidak dapat dihapus.')
    }
    const idx = reportStore.findIndex((item) => String(item.id) === String(id))
    if (idx !== -1) {
      reportStore.splice(idx, 1)
    }
    return { ok: true, message: 'Laporan berhasil dihapus.' }
  },
  async createReport(payload) {
    await delay()
    const user = requireUser()
    const today = offsetDate(0)

    const countToday = reportStore.filter(
      (item) => item.ownerId === user.id && item.createdAt === today,
    ).length
    if (countToday >= 3) {
      fail(429, 'Batas laporan hari ini sudah tercapai. Coba lagi besok, ya.')
    }

    const isi = String(payload.isi ?? '').trim()
    const errors = {}
    if (!payload.kategori) errors.kategori = ['Pilih salah satu kategori.']
    if (isi.length < 20) {
      errors.isi = ['Ceritakan sedikit lebih lengkap, minimal 20 karakter.']
    }
    if (Object.keys(errors).length) {
      fail(422, 'Periksa kembali isianmu.', errors)
    }

    const { id, noLaporan } = nextReportId()
    const menyangkutPimpinan = Boolean(
      payload.menyangkut_pimpinan ?? payload.menyangkutPimpinan,
    )
    const penerima = routesToPimpinan({ kategori: payload.kategori })
      ? 'pimpinan'
      : 'pengurus'

    const report = {
      id,
      noLaporan,
      ownerId: user.id,
      kategori: payload.kategori,
      isi,
      tampilkanIdentitas: Boolean(payload.tampilkan_identitas),
      menyangkutPimpinan,
      status: 'baru',
      penerima,
      batasKlarifikasi: offsetDate(1),
      perluKlarifikasi: false,
      escalated: null,
      statusChangedAt: null,
      createdAt: today,
      messages: [],
      notes: [],
    }
    reportStore.unshift(report)
    return adaptReport(toRawReport(report, user))
  },

  async getMine() {
    await delay()
    const user = requireUser()
    const mine = reportStore
      .filter((item) => item.ownerId === user.id)
      .map((item) => toRawReport(item, user))
    return {
      items: mine.map(adaptReport),
      meta: adaptPagination({
        current_page: 1,
        last_page: 1,
        total: mine.length,
        per_page: PAGE_SIZE,
      }),
    }
  },

  async getList({ status, kategori, kodeLaporan, menyangkutPimpinan } = {}) {
    await delay()
    const user = requireUser()
    requireRole(user, ['pengurus', 'pimpinan', 'pengawas'])
    let visible = reportStore.filter((item) => canView(user, item))
    if (status) visible = visible.filter((item) => item.status === status)
    if (menyangkutPimpinan) {
      visible = visible.filter((item) => item.menyangkutPimpinan)
    }
    if (kategori) visible = visible.filter((item) => item.kategori === kategori)
    if (kodeLaporan?.trim()) {
      const query = kodeLaporan.trim().toLowerCase()
      visible = visible.filter((item) =>
        String(item.noLaporan).toLowerCase().includes(query),
      )
    }
    const items = visible.map((item) => toRawReport(item, user))
    return {
      items: items.map(adaptReport),
      meta: adaptPagination({
        current_page: 1,
        last_page: Math.max(1, Math.ceil(items.length / PAGE_SIZE)),
        total: items.length,
        per_page: PAGE_SIZE,
      }),
    }
  },

  async getDetail(id) {
    await delay()
    const user = requireUser()
    const report = accessibleReport(user, id)
    markReportRead(user, report)
    return adaptReport(toRawReport(report, user))
  },

  async getTrail(id) {
    await delay()
    const user = requireUser()
    const report = findReport(id)
    if (!report || report.ownerId !== user.id) {
      fail(404, 'Laporan tidak ditemukan.')
    }
    const trail = []
    if (report.status !== 'baru') {
      trail.push({
        aksi: 'dibuka',
        peran: report.penerima,
        tanggal: report.createdAt,
        status: null,
      })
      trail.push({
        aksi: 'status_diubah',
        peran: report.penerima,
        tanggal: report.createdAt,
        status: report.status,
      })
    }
    return trail
  },

  async updateIdentity(id, tampilkanIdentitas) {
    await delay()
    const user = requireUser()
    const report = accessibleReport(user, id)
    assertUnlocked(report)
    if (user.role !== 'santri') {
      fail(403, 'Hanya pelapor yang dapat mengubah ini.')
    }
    const next = Boolean(tampilkanIdentitas)
    report.tampilkanIdentitas = next
    const request = report.permintaanIdentitas
    if (request) {
      if (!next && request.status === 'disetujui') {
        request.status = 'dicabut'
        request.answeredAt = offsetDate(0)
      } else if (next && request.status === 'dicabut') {
        request.status = 'disetujui'
        request.answeredAt = offsetDate(0)
      }
    }
    markReportRead(user, report)
    return adaptReport(toRawReport(report, user))
  },

  async requestIdentity(id, { alasan, bukti }) {
    await delay(400)
    const user = requireUser()
    requireRole(user, ['pimpinan'])
    const report = accessibleReport(user, id)
    assertUnlocked(report)
    const current = report.permintaanIdentitas?.status
    if (current === 'menunggu') {
      fail(409, 'Permintaan untuk laporan ini masih menunggu jawaban santri.')
    }
    if (current === 'disetujui') {
      fail(409, 'Santri sudah menyetujui permintaan untuk laporan ini.')
    }
    const text = String(alasan ?? '').trim()
    const errors = {}
    if (text.length < 20) {
      errors.alasan = ['Jelaskan alasannya minimal 20 karakter.']
    } else if (text.length > 1000) {
      errors.alasan = ['Alasan terlalu panjang, maksimal 1000 karakter.']
    }
    if (bukti) {
      if (!PROOF_TYPES.includes(bukti.type)) {
        errors.bukti = ['Bukti harus berupa foto JPG/PNG atau berkas PDF.']
      } else if (bukti.size > IDENTITY_PROOF_MAX_BYTES) {
        errors.bukti = ['Ukuran bukti maksimal 5 MB.']
      }
    }
    if (Object.keys(errors).length) fail(422, 'Periksa kembali isian.', errors)
    report.permintaanIdentitas = {
      status: 'menunggu',
      alasan: text,
      dimintaOleh: user.name,
      bukti: bukti
        ? { nama: bukti.name, url: URL.createObjectURL(bukti) }
        : null,
      createdAt: offsetDate(0),
      answeredAt: null,
    }
    return adaptReport(toRawReport(report, user))
  },

  async answerIdentityRequest(id, status) {
    await delay()
    const user = requireUser()
    requireRole(user, ['santri'])
    const report = accessibleReport(user, id)
    assertUnlocked(report)
    const request = report.permintaanIdentitas
    if (!request) fail(404, 'Tidak ada permintaan untuk laporan ini.')
    const identityStatus =
      status === 1 || status === '1' || status === 'disetujui'
        ? 'disetujui'
        : status === 0 || status === '0' || status === 'ditolak'
          ? 'ditolak'
          : null
    if (request.status !== 'menunggu' || !identityStatus) {
      fail(409, 'Permintaan ini tidak bisa diubah lagi.')
    }
    request.status = identityStatus
    request.answeredAt = offsetDate(0)
    markReportRead(user, report)
    return adaptReport(toRawReport(report, user))
  },

  async updateStatus(id, status) {
    await delay()
    const user = requireUser()
    requireRole(user, ['pengurus', 'pimpinan'])
    const report = accessibleReport(user, id)
    assertUnlocked(report)
    if (!['baru', 'diproses', 'selesai'].includes(status)) {
      fail(422, 'Status tidak dikenal.', { status: ['Status tidak dikenal.'] })
    }
    report.status = status
    report.statusChangedAt = new Date().toISOString()
    if (status !== 'baru') report.perluKlarifikasi = false
    markReportRead(user, report)
    return adaptReport(toRawReport(report, user))
  },

  async escalate(id, payload = {}) {
    await delay()
    const user = requireUser()
    requireRole(user, ['pengurus'])
    const report = accessibleReport(user, id)
    assertUnlocked(report)
    const tujuan = payload.tujuan
    const phone = String(payload.nomor_wa_tujuan ?? '').trim()
    const catatan = String(payload.catatan_pengurus ?? '').trim()
    const errors = {}
    if (!['polsek', 'uppt_ppa', 'pengurus_pusat'].includes(tujuan)) {
      errors.tujuan = ['Pilih tujuan eskalasi yang valid.']
    }
    if (!/^\+\d{8,15}$/.test(phone)) {
      errors.nomor_wa_tujuan = [
        'Gunakan format internasional, contoh +6281234567890.',
      ]
    }
    if (!catatan) {
      errors.catatan_pengurus = ['Catatan pengurus wajib diisi.']
    }
    if (Object.keys(errors).length) {
      fail(422, 'Periksa kembali isian eskalasi.', errors)
    }
    report.escalated = { tujuan, catatan, at: offsetDate(0) }
    report.status = 'DITERUSKAN_KE_BERWAJIB'
    report.isLocked = true
    markReportRead(user, report)
    return {
      success: true,
      message: 'Laporan berhasil dieskalasi dan dikunci.',
      whatsapp_url: `https://wa.me/${phone.slice(1)}`,
      pdf_download_url: `/petugas/laporan/${id}/eskalasi/pdf`,
      laporan: adaptReport(toRawReport(report, user)),
    }
  },

  async downloadEscalationPdf(id) {
    await delay()
    const user = requireUser()
    requireRole(user, ['pengurus'])
    const report = accessibleReport(user, id)
    if (!report.isLocked && report.status !== 'DITERUSKAN_KE_BERWAJIB') {
      fail(404, 'PDF surat pengantar belum tersedia.')
    }
    return new Blob(['%PDF-1.4\n% Mock surat pengantar\n%%EOF'], {
      type: 'application/pdf',
    })
  },
}

export const messages = {
  async getMessages(id) {
    await delay()
    const user = requireUser()
    const report = accessibleReport(user, id)
    markReportRead(user, report)
    return report.messages.map(toRawMessage).map(adaptMessage)
  },

  async sendMessage(id, body) {
    await delay()
    const user = requireUser()
    const report = accessibleReport(user, id)
    assertUnlocked(report)
    const text = String(body ?? '').trim()
    if (!text) {
      fail(422, 'Pesan tidak boleh kosong.', { isi: ['Pesan tidak boleh kosong.'] })
    }
    const item = {
      id: nextMessageId(),
      from: user.role,
      senderId: user.id,
      senderName: user.name,
      body: text,
      createdAt: offsetDate(0),
    }
    report.messages.push(item)
    markReportRead(user, report)
    return adaptMessage(toRawMessage(item))
  },
}

export const ai = {
  async chat({ conversationId, message }) {
    await delay(700)
    const user = requireSessionUser()
    requireRole(user, ['santri'])

    const text = String(message ?? '').trim()
    if (!text) {
      fail(422, 'Tulis pesan dulu, ya.', { message: ['Tulis pesan dulu, ya.'] })
    }
    if (text.length > 1000) {
      fail(422, 'Pesan terlalu panjang, maksimal 1000 karakter.', {
        message: ['Pesan terlalu panjang, maksimal 1000 karakter.'],
      })
    }

    let conversation = conversationId
      ? aiConversations.get(String(conversationId))
      : null
    if (conversation && conversation.ownerId !== user.id) {
      fail(403, 'Percakapan ini bukan milikmu.')
    }
    if (!conversation) {
      conversation = {
        id: nextAiConversationId(),
        ownerId: user.id,
        turn: 0,
        messages: [],
        createdAt: new Date().toISOString(),
      }
      aiConversations.set(conversation.id, conversation)
    }

    conversation.turn += 1
    conversation.messages.push({
      id: nextAiMessageId(),
      role: 'user',
      body: text,
      createdAt: new Date().toISOString(),
    })

    const { body, suggestions, risk } = aiReplyFor(text, conversation.turn)
    const offerReport =
      risk === 'high' ||
      conversation.turn >= 3 ||
      AI_REPORT_PATTERN.test(text)

    conversation.messages.push({
      id: nextAiMessageId(),
      role: 'assistant',
      body,
      createdAt: new Date().toISOString(),
    })

    return {
      conversationId: conversation.id,
      reply: body,
      suggestions:
        offerReport && risk !== 'high'
          ? ['Bantu aku membuat laporan', 'Aku mau cerita lagi']
          : suggestions,
      risk,
      offerReport,
    }
  },

  async createDraft(payload) {
    await delay(400)
    const user = requireSessionUser()
    requireRole(user, ['santri'])

    const { conversationId, messages } =
      typeof payload === 'string' ? { conversationId: payload } : payload ?? {}

    const conversation = conversationId
      ? aiConversations.get(String(conversationId))
      : null
    if (conversation && conversation.ownerId !== user.id) {
      fail(403, 'Percakapan ini bukan milikmu.')
    }

    const stories = conversation
      ? conversation.messages
        .filter((item) => item.role === 'user')
        .map((item) => item.body)
      : (Array.isArray(messages) ? messages : [])
        .filter((item) => item.role === 'user' && item.body?.trim())
        .map((item) => item.body.trim())
    if (!stories.length) {
      fail(422, 'Belum ada cerita yang bisa dijadikan draf.')
    }

    return {
      kategori: aiCategoryFor(stories.join(' ')),
      isi:
        stories.length === 1
          ? `Berikut kronologi yang saya alami:\n\n${stories[0]}\n\nMohon ditindaklanjuti oleh pihak pesantren.`
          : `Berikut ringkasan kejadian yang saya alami:\n\n${stories.map((s, idx) => `${idx + 1}. ${s}`).join('\n\n')}\n\nMohon ditindaklanjuti oleh pihak pesantren.`,
      tampilkanIdentitas: false,
    }
  },
}

export const notes = {
  async addNote(id, body) {
    await delay()
    const user = requireUser()
    requireRole(user, ['pengurus', 'pimpinan'])
    const report = accessibleReport(user, id)
    assertUnlocked(report)
    const text = String(body ?? '').trim()
    if (!text) {
      fail(422, 'Catatan tidak boleh kosong.', {
        catatan: ['Catatan tidak boleh kosong.'],
      })
    }
    const item = {
      id: nextNoteId(),
      authorName: user.name,
      body: text,
      createdAt: offsetDate(0),
    }
    report.notes.push(item)
    return adaptNote({
      id: item.id,
      author_name: item.authorName,
      catatan: item.body,
      created_at: item.createdAt,
    })
  },
}

export const notifications = {
  async getSummary() {
    await delay()
    const user = requireUser()

    if (user.role === 'santri') {
      const mine = reportStore.filter((item) => item.ownerId === user.id)
      let permintaanIdentitas = 0
      let pesanBaru = 0
      let statusDiubah = 0

      mine.forEach((report) => {
        const snapshot = snapshotFor(user, report)
        const request = report.permintaanIdentitas
        if (
          request?.status === 'menunggu' &&
          snapshot?.identityStatus !== 'menunggu'
        ) {
          permintaanIdentitas += 1
        }
        if (hasNewMessages(report, user, snapshot)) pesanBaru += 1
        if (
          report.statusChangedAt &&
          (!snapshot || Date.parse(report.statusChangedAt) > snapshot.readAt)
        ) {
          statusDiubah += 1
        }
      })

      return adaptNotificationSummary({
        permintaan_identitas: permintaanIdentitas,
        pesan_baru: pesanBaru,
        status_diubah: statusDiubah,
        pembaruan: permintaanIdentitas + pesanBaru + statusDiubah,
      })
    }

    const visible = reportStore.filter((item) => canView(user, item))
    let laporanBaru = 0
    let pesanBaru = 0

    visible.forEach((report) => {
      const snapshot = snapshotFor(user, report)
      if (report.status === 'baru' && !snapshot) laporanBaru += 1
      if (
        report.status !== 'selesai' &&
        hasNewMessages(report, user, snapshot)
      ) {
        pesanBaru += 1
      }
    })

    return adaptNotificationSummary({
      laporan_baru: laporanBaru,
      pesan_baru: pesanBaru,
      pembaruan: laporanBaru + pesanBaru,
    })
  },

  async getList() {
    await delay()
    const user = requireUser()
    const items = []

    const push = (report, tipe, waktu, extra = {}) => {
      items.push({
        id: `${tipe}:${report.id}`,
        tipe,
        laporanId: report.id,
        noLaporan: report.noLaporan,
        kategori: report.kategori,
        waktu,
        ...extra,
      })
    }

    const incomingSince = (report, snapshot) =>
      report.messages
        .slice(snapshot?.messageCount ?? 0)
        .filter(
          (message) =>
            message.senderId != null &&
            String(message.senderId) !== String(user.id),
        )

    if (user.role === 'santri') {
      reportStore
        .filter((item) => item.ownerId === user.id)
        .forEach((report) => {
          const snapshot = snapshotFor(user, report)
          const request = report.permintaanIdentitas

          if (
            request?.status === 'menunggu' &&
            snapshot?.identityStatus !== 'menunggu'
          ) {
            push(report, 'permintaan_identitas', request.createdAt, {
              pengirim: request.dimintaOleh,
            })
          }

          const incoming = incomingSince(report, snapshot)
          if (incoming.length) {
            const last = incoming[incoming.length - 1]
            push(report, 'pesan_baru', last.createdAt, {
              pengirim: last.senderName,
              preview: last.body,
            })
          }

          if (
            report.statusChangedAt &&
            (!snapshot || Date.parse(report.statusChangedAt) > snapshot.readAt)
          ) {
            push(report, 'status_diubah', report.statusChangedAt, {
              statusBaru: report.status,
            })
          }
        })
    } else {
      reportStore
        .filter((item) => canView(user, item))
        .forEach((report) => {
          const snapshot = snapshotFor(user, report)

          if (report.status === 'baru' && !snapshot) {
            push(report, 'laporan_baru', report.createdAt)
          }

          if (report.status !== 'selesai') {
            const incoming = incomingSince(report, snapshot)
            if (incoming.length) {
              const last = incoming[incoming.length - 1]
              push(report, 'pesan_baru', last.createdAt, {
                pengirim: last.senderName,
                preview: last.body,
              })
            }
          }
        })
    }

    items.sort((a, b) => (Date.parse(b.waktu) ?? 0) - (Date.parse(a.waktu) ?? 0))

    return {
      items,
      meta: adaptPagination(
        { current_page: 1, last_page: 1, total: items.length },
        items.length,
      ),
    }
  },
}

export const dashboard = {
  async getSummary() {
    await delay()
    const user = requireUser()
    requireRole(user, ['pimpinan', 'pengawas'])
    return adaptSummary({
      total_santri: accounts.filter((account) => account.role === 'santri').length,
      total_laporan: reportStore.length,
      laporan_baru: reportStore.filter((item) => item.status === 'baru').length,
      laporan_sensitif: reportStore.filter((item) => item.menyangkutPimpinan)
        .length,
      audit_hari_ini: 3,
      jumlah_terlambat: reportStore.filter((item) => item.terlambat === true).length,
      laporan_per_status: countBy(reportStore, 'status'),
      laporan_per_kategori: countBy(reportStore, 'kategori'),
    })
  },

  async getAiSummary({ periode = 7 } = {}) {
    await delay()
    const user = requireUser()
    requireRole(user, ['pimpinan', 'pengawas'])

    const since = Date.now() - Number(periode) * 24 * 60 * 60 * 1000
    const recent = reportStore.filter((report) => {
      const createdAt = Date.parse(report.createdAt)
      return Number.isFinite(createdAt) && createdAt >= since
    })

    const ringkasan = recent.length
      ? `Dalam ${periode} hari terakhir ada ${recent.length} laporan yang masuk dengan pola utama pada kategori ${countBy(recent, 'kategori') ? Object.entries(countBy(recent, 'kategori')).sort((a, b) => b[1] - a[1])[0][0] : 'umum'}. Status laporan masih didominasi oleh proses yang sedang berjalan.`
      : `Belum ada laporan pada ${periode} hari terakhir.`

    const poin = recent.length
      ? [
          `Jumlah laporan: ${recent.length}`,
          `Status terbanyak: ${Object.entries(countBy(recent, 'status')).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'baru'}`,
          `Laporan sensitif: ${reportStore.filter((item) => item.menyangkutPimpinan).length}`,
        ]
      : ['Belum ada laporan baru dalam periode ini.']

    return {
      jumlah_laporan: recent.length,
      periode_hari: Number(periode),
      dibuat_pada: new Date().toISOString(),
      ringkasan,
      poin,
      dari_cache: false,
    }
  },
}

const previewSantriImport = async (file) => {
  const rows = await readSantriWorkbook(file)
  if (rows.length > 500) {
    fail(422, 'Maksimal 500 baris data per import.')
  }
  const errors = []
  const seenEmails = new Set()
  const seenNis = new Set()
  const previewRows = rows.map((row) => {
    const rowErrors = {}
    const existing = accounts.find(
      (account) =>
        account.role === 'santri' &&
        String(account.nis ?? account.username) === String(row.nis),
    )
    const addError = (field, message) => {
      rowErrors[field] = [...(rowErrors[field] ?? []), message]
    }

    if (!row.name) addError('name', 'Nama wajib diisi.')
    if (!row.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email)) {
      addError('email', 'Email wajib diisi dengan format yang valid.')
    }
    if (!row.nis) addError('nis', 'NIS wajib diisi.')
    if (!['laki', 'perempuan'].includes(row.jenisKelamin)) {
      addError('jenis_kelamin', 'Jenis kelamin harus laki atau perempuan.')
    }
    if (row.teleponOrtu.length < 10 || row.teleponOrtu.length > 20) {
      addError('telepon_ortu', 'Telepon wali harus 10–20 karakter.')
    }
    if (existing && row.password && row.password.length < 8) {
      addError('password', 'Password baru minimal 8 karakter.')
    } else if (!existing && row.password.length < 8) {
      addError('password', 'Password santri baru wajib minimal 8 karakter.')
    }

    const emailKey = row.email.toLocaleLowerCase()
    const existingEmail = accounts.some(
      (account) =>
        account.id !== existing?.id &&
        account.email?.toLocaleLowerCase() === emailKey,
    )
    if (emailKey && (seenEmails.has(emailKey) || existingEmail)) {
      addError('email', 'Email sudah digunakan.')
    }
    const nisKey = row.nis
    const existingNis = accounts.some(
      (account) =>
        account.id !== existing?.id &&
        (account.nis ?? (account.role === 'santri' ? account.username : null)) ===
        nisKey,
    )
    if (nisKey && (seenNis.has(nisKey) || existingNis)) {
      addError('nis', 'NIS sudah digunakan.')
    }
    if (emailKey) seenEmails.add(emailKey)
    if (nisKey) seenNis.add(nisKey)

    if (Object.keys(rowErrors).length) {
      errors.push({ row: row.index, errors: rowErrors })
    }
    return {
      row: row.index,
      name: row.name,
      email: row.email,
      nis: row.nis,
      jenis_kelamin: row.jenisKelamin,
      telepon_ortu: row.teleponOrtu,
      valid: Object.keys(rowErrors).length === 0,
    }
  })
  return {
    data: previewRows,
    errors,
    can_import: previewRows.length > 0 && errors.length === 0,
    message: 'Preview import selesai; belum ada data yang disimpan.',
  }
}

export const admin = {
  async getTemplate() {
    await delay()
    const user = requireUser()
    requireRole(user, ['pimpinan'])
    return {
      filename: 'template-import-santri.xlsx',
      blob: await createSantriTemplateWorkbookBlob(),
    }
  },

  async previewImport(file) {
    await delay()
    const user = requireUser()
    requireRole(user, ['pimpinan'])
    const preview = await previewSantriImport(file)
    const rowErrors = new Map(
      preview.errors.map((item) => [
        Number(item.row),
        Object.values(item.errors).flat(),
      ]),
    )
    return {
      rows: preview.data.map((row) => ({
        index: row.row,
        name: row.name,
        email: row.email,
        nis: row.nis,
        jenisKelamin: row.jenis_kelamin,
        teleponOrtu: row.telepon_ortu,
        valid: row.valid,
        errors: rowErrors.get(row.row) ?? [],
      })),
      canImport: preview.can_import,
      message: preview.message,
    }
  },

  async importSantri({ file }) {
    await delay(500)
    const user = requireUser()
    requireRole(user, ['pimpinan'])
    const preview = await previewSantriImport(file)
    if (!preview.can_import) {
      fail(422, 'Impor dibatalkan karena file kosong atau memiliki baris tidak valid.', {
        rows: preview.errors,
      })
    }
    let created = 0
    let updated = 0
    const rows = await readSantriWorkbook(file)
    rows.forEach((row) => {
      const existing = accounts.find(
        (account) =>
          account.role === 'santri' &&
          String(account.nis ?? account.username) === String(row.nis),
      )
      if (existing) {
        existing.name = row.name
        existing.email = row.email
        existing.nis = row.nis
        existing.username = row.nis
        existing.jenisKelamin = row.jenisKelamin
        existing.teleponOrtu = row.teleponOrtu
        if (row.password) existing.password = row.password
        updated += 1
      } else {
        accounts.push({
          id: Math.max(...accounts.map((account) => account.id)) + 1,
          username: row.nis,
          password: row.password,
          name: row.name,
          email: row.email,
          nis: row.nis,
          jenisKelamin: row.jenisKelamin,
          teleponOrtu: row.teleponOrtu,
          role: 'santri',
          active: true,
          mustChangePassword: true,
        })
        created += 1
      }
    })
    return {
      imported: rows.length,
      created,
      updated,
      message: `${created} data santri ditambahkan dan ${updated} data diperbarui.`,
    }
  },

  async exportSantri() {
    await delay()
    const user = requireUser()
    requireRole(user, ['pimpinan'])
    const rows = accounts
      .filter((account) => account.role === 'santri')
      .map((account) => [
        account.name,
        account.email ?? '',
        account.nis ?? account.username,
        account.jenisKelamin ?? '',
        account.teleponOrtu ?? '',
        '',
      ])
    return {
      filename: 'data-santri.xlsx',
      blob: await createSantriWorkbookBlob(rows),
    }
  },

  async getAccounts({ q, role, active } = {}) {
    await delay()
    const user = requireUser()
    requireRole(user, ['pimpinan'])
    let visible = [...accounts]
    if (q) {
      const term = String(q).toLowerCase()
      visible = visible.filter(
        (item) =>
          item.name.toLowerCase().includes(term) ||
          item.username.toLowerCase().includes(term),
      )
    }
    if (role) visible = visible.filter((item) => item.role === role)
    if (active !== undefined && active !== '' && active !== null) {
      const wanted = active === true || active === 'true'
      visible = visible.filter((item) => item.active === wanted)
    }
    return {
      items: visible.map((item) =>
        adaptAccount({
          id: item.id,
          username: item.username,
          name: item.name,
          role: item.role,
          active: item.active,
          must_change_password: item.mustChangePassword,
        }),
      ),
      meta: adaptPagination({
        current_page: 1,
        last_page: 1,
        total: visible.length,
      }),
    }
  },

  async createAccount(payload) {
    await delay()
    const user = requireUser()
    requireRole(user, ['pimpinan'])
    const errors = {}
    if (!payload.name) errors.name = ['Nama wajib diisi.']
    if (!payload.email) {
      errors.email = ['Email wajib diisi.']
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) {
      errors.email = ['Email tidak valid.']
    }
    if (
      payload.email &&
      accounts.some(
        (account) =>
          String(account.email ?? account.username).toLowerCase() ===
          payload.email.toLowerCase(),
      )
    ) {
      errors.email = ['Email sudah digunakan.']
    }
    if (!payload.password) errors.password = ['Kata sandi wajib diisi.']
    else if (payload.password.length < 8) {
      errors.password = ['Kata sandi minimal 8 karakter.']
    }
    if (Object.keys(errors).length) fail(422, 'Periksa kembali isian.', errors)
    const id = Math.max(...accounts.map((a) => a.id)) + 1
    const account = {
      id,
      username: payload.email,
      email: payload.email,
      password: payload.password,
      name: payload.name,
      role: 'pengurus',
      active: true,
      mustChangePassword: true,
    }
    accounts.push(account)
    return adaptAccount({
      id: account.id,
      email: account.email,
      name: account.name,
      role: account.role,
      is_active: account.active,
      must_change_password: account.mustChangePassword,
    })
  },

  async setAccountActive(id, active) {
    await delay()
    const user = requireUser()
    requireRole(user, ['pimpinan'])
    const account = accounts.find((item) => item.id === id)
    if (!account) fail(404, 'Akun tidak ditemukan.')
    if (!active && account.role === 'pimpinan') {
      const existing = deactivationRequests.find(
        (request) =>
          request.accountId === account.id && request.status === 'menunggu',
      )
      if (!existing) {
        deactivationRequests.unshift({
          id: deactivationRequests.length + 1,
          accountId: account.id,
          status: 'menunggu',
          requestedBy: user.name,
          reason: 'Penonaktifan akun pimpinan memerlukan persetujuan pimpinan lain.',
          createdAt: new Date().toISOString(),
          decidedBy: null,
          decidedAt: null,
        })
      }
      throw new ApiError({
        status: 422,
        message:
          'Penonaktifan akun pimpinan memerlukan persetujuan pimpinan lain.',
        requiresApproval: true,
        requestId: existing?.id ?? deactivationRequests[0].id,
      })
    }
    account.active = Boolean(active)
    return adaptAccount({
      id: account.id,
      email: account.email ?? account.username,
      name: account.name,
      role: account.role,
      is_active: account.active,
      must_change_password: account.mustChangePassword,
    })
  },
}

const deactivationRequests = [
  {
    id: 1,
    accountId: 8,
    status: 'menunggu',
    requestedBy: 'KH. Abdullah',
    reason: 'Mutasi tugas ke lembaga lain.',
    createdAt: new Date().toISOString(),
    decidedBy: null,
    decidedAt: null,
  },
]

const auditSeed = [
  {
    id: 1,
    waktu: new Date().toISOString(),
    aktor: 'KH. Abdullah',
    aktorRole: 'pimpinan',
    aksi: 'account.deactivated',
    target: null,
    laporanId: null,
    detail: 'Menonaktifkan akun santri.',
    ip: '127.0.0.1',
  },
  {
    id: 2,
    waktu: new Date().toISOString(),
    aktor: 'Ust. Rizal',
    aktorRole: 'pengurus',
    aksi: 'identity.requested',
    target: 'Laporan #2',
    laporanId: 2,
    detail: 'Membuka identitas pelapor dengan persetujuan santri.',
    ip: '127.0.0.1',
  },
  {
    id: 3,
    waktu: offsetDate(0),
    aktor: 'Dewan Pengawas',
    aktorRole: 'pengawas',
    aksi: 'report.viewed',
    target: 'Laporan #4',
    laporanId: 4,
    detail: 'Meninjau laporan yang menyangkut pimpinan.',
    ip: '127.0.0.1',
  },
]

const buildAuditLogs = () => {
  const reportLogs = reportStore.slice(0, 6).map((report, index) => ({
    id: 100 + index,
    waktu: report.createdAt,
    aktor: 'Ust. Rizal',
    aktorRole: 'pengurus',
    aksi: 'report.viewed',
    target: `Laporan #${report.noLaporan}`,
    laporanId: report.id,
    detail: 'Membuka laporan.',
    ip: '127.0.0.1',
  }))
  return [...auditSeed, ...reportLogs]
}

export const audit = {
  async getAuditLogs({ q, action, from, to, page = 1, perPage = PAGE_SIZE } = {}) {
    await delay()
    const user = requireUser()
    requireRole(user, ['pengurus', 'pimpinan', 'pengawas'])
    const needle = String(q ?? '').trim().toLowerCase()
    // Pengawas melihat semua, pimpinan aksi pengurus dan pimpinan,
    // pengurus hanya aksi pengurus (pendekatan sederhana untuk demo).
    const scoped = buildAuditLogs().filter((item) => {
      if (user.role === 'pengawas') return true
      if (user.role === 'pimpinan') {
        return item.aktorRole === 'pengurus' || item.aktorRole === 'pimpinan'
      }
      return item.aktorRole === 'pengurus'
    })
    const items = scoped.filter((item) => {
      const matchesAction = !action || item.aksi === action
      const matchesFrom = !from || item.waktu >= from
      const matchesTo = !to || item.waktu <= `${to}~`
      const matchesQuery =
        !needle ||
        [item.aktor, item.target, item.detail]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
          .includes(needle)
      return matchesAction && matchesFrom && matchesTo && matchesQuery
    })
    items.sort((a, b) => String(b.waktu).localeCompare(String(a.waktu)))
    const start = (page - 1) * perPage
    return {
      items: items.slice(start, start + perPage),
      meta: adaptPagination(
        {
          current_page: page,
          last_page: Math.max(1, Math.ceil(items.length / perPage)),
          total: items.length,
          per_page: perPage,
        },
        items.length,
      ),
    }
  },
}

export const deactivation = {
  async getRequests({ status = 'menunggu', page = 1, perPage = PAGE_SIZE } = {}) {
    await delay()
    const user = requireUser()
    requireRole(user, ['pimpinan', 'pengawas'])
    const items = deactivationRequests
      .filter((item) => !status || item.status === status)
      .map((item) => {
        const account = accounts.find((entry) => entry.id === item.accountId)
        return {
          ...item,
          accountName: account?.name ?? null,
          accountRole: account?.role ?? 'pimpinan',
        }
      })
    const start = (page - 1) * perPage
    return {
      items: items.slice(start, start + perPage),
      meta: adaptPagination(
        {
          current_page: page,
          last_page: Math.max(1, Math.ceil(items.length / perPage)),
          total: items.length,
          per_page: perPage,
        },
        items.length,
      ),
    }
  },

  async decideRequest(id, { status, alasan } = {}) {
    await delay()
    const user = requireUser()
    requireRole(user, ['pimpinan'])
    const request = deactivationRequests.find(
      (item) => String(item.id) === String(id),
    )
    if (!request) fail(404, 'Pengajuan tidak ditemukan.')
    if (!['disetujui', 'ditolak'].includes(status)) {
      fail(422, 'Status keputusan tidak dikenal.')
    }
    request.status = status
    request.decidedBy = user.name
    request.decidedAt = new Date().toISOString()
    request.reason = alasan ?? request.reason
    if (status === 'disetujui') {
      const account = accounts.find((item) => item.id === request.accountId)
      if (account) account.active = false
    }
    const account = accounts.find((item) => item.id === request.accountId)
    return {
      ...request,
      accountName: account?.name ?? null,
      accountRole: account?.role ?? 'pimpinan',
    }
  },
}
