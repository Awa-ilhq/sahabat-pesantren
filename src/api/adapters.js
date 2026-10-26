// Pemetaan field JSON API -> model aplikasi. Ubah di sini bila bentuk
// respons backend berubah, supaya komponen tidak perlu ikut berubah.

export const adaptUser = (raw) =>
  raw
    ? {
        id: raw.id,
        name: raw.name,
        role: raw.role,
        email: raw.email ?? null,
        nis: raw.nis ?? raw.santri?.nis ?? null,
        phone: raw.telepon_ortu ?? raw.santri?.telepon_ortu ?? raw.phone ?? null,
        username: raw.username ?? null,
        mustChangePassword: Boolean(raw.must_change_password),
        dashboard: raw.dashboard ?? null,
      }
    : null

export const adaptMessage = (raw) => ({
  id: raw.id,
  body: raw.isi ?? raw.body,
  from: raw.pengirim?.role ?? raw.from ?? null,
  senderId: raw.sender_id ?? raw.pengirim?.id ?? raw.pengirim?.users_id ?? null,
  senderName: raw.sender_name ?? raw.pengirim?.name ?? null,
  createdAt: raw.created_at ?? null,
})

export const adaptNote = (raw) => ({
  id: raw.id,
  body: raw.catatan ?? raw.body,
  authorName:
    raw.author_name ??
    raw.user?.name ??
    raw.pengirim?.name ??
    raw.users?.name ??
    raw.author?.name ??
    null,
  createdAt: raw.created_at ?? null,
})

export const adaptIdentityRequest = (raw) =>
  raw
    ? {
        status:
          raw.status === true || raw.status === 1 || raw.status === '1'
            ? 'disetujui'
            : raw.status === false ||
                raw.status === 0 ||
                raw.status === '0'
              ? 'ditolak'
            : raw.status === 2 || raw.status === '2'
              ? 'dicabut'
              : raw.status,
        alasan: raw.alasan,
        diminta: raw.diminta_oleh ?? null,
        buktiNama: raw.bukti_nama ?? null,
        buktiUrl: raw.bukti_url ?? null,
        createdAt: raw.dibuat ?? null,
        answeredAt: raw.dijawab ?? null,
      }
    : null

export const adaptReport = (raw) =>
  raw
    ? {
        id: raw.id,
        ownerId: raw.users_id ?? null,
        noLaporan: raw.no_laporan,
        kategori: raw.kategori,
        isi: raw.isi,
        tampilkanIdentitas: Boolean(raw.tampilkan_identitas),
        menyangkutPimpinan: Boolean(
          raw.menyangkut_pimpinan ?? raw.menyangkutPimpinan,
        ),
        status: raw.status,
        penerima: raw.penerima,
        batasKlarifikasi: raw.batas_klarifikasi ?? null,
        dieskalasiTujuan: raw.dieskalasi_tujuan ?? null,
        dieskalasiCatatan: raw.dieskalasi_catatan ?? null,
        dieskalasiAt: raw.dieskalasi_at ?? null,
        createdAt: raw.waktu ?? raw.created_at ?? null,
        pelaporNama: raw.pelapor_nama ?? raw.user?.name ?? null,
        perluKlarifikasi: Boolean(raw.perlu_klarifikasi),
        statusChangedAt: raw.status_diubah ?? null,
        // Waktu baca per peran dipakai untuk menurunkan notifikasi saat
        // endpoint daftar notifikasi belum tersedia di backend.
        readAt: {
          santri: raw.santri_dibaca ?? null,
          pengurus: raw.pengurus_dibaca ?? null,
          pimpinan: raw.pimpinan_dibaca ?? null,
        },
        messages: Array.isArray(raw.percakapans ?? raw.messages)
          ? (raw.percakapans ?? raw.messages).map(adaptMessage)
          : [],
        permintaanIdentitas: adaptIdentityRequest(raw.permintaan_identitas),
        catatan: Array.isArray(raw.catatan_internal ?? raw.catatans)
          ? (raw.catatan_internal ?? raw.catatans).map(adaptNote)
          : [],
      }
    : null

export const adaptAccount = (raw) => {
  const user = raw.user ?? raw
  const active = user.active ?? user.is_active
  return {
    id: user.id ?? raw.users_id,
    username:
      raw.nis ??
      raw.santri?.nis ??
      raw.username ??
      user.email ??
      raw.email ??
      raw.id_pengguna ??
      null,
    name: user.name ?? raw.name ?? null,
    role: user.role ?? raw.role,
    active:
      active === true ||
      active === 1 ||
      active === '1' ||
      active === 'true',
    mustChangePassword: Boolean(
      user.must_change_password ?? raw.must_change_password,
    ),
  }
}

export const adaptPagination = (meta, itemCount = 0) => {
  const currentPage = Number(meta?.current_page ?? meta?.currentPage ?? 1)
  const total = Number(
    meta?.total ?? meta?.total_count ?? meta?.count ?? itemCount,
  )
  const perPage = Number(meta?.per_page ?? meta?.perPage ?? (itemCount || 1))
  const lastPage = Number(
    meta?.last_page ??
      meta?.lastPage ??
      Math.max(1, Math.ceil(total / perPage)),
  )
  return { currentPage, lastPage, total, perPage }
}

export const adaptNotificationSummary = (raw) => ({
  permintaanIdentitas: raw?.permintaan_identitas ?? 0,
  pesanBaru: raw?.pesan_baru ?? 0,
  statusDiubah: raw?.status_diubah ?? 0,
  laporanBaru: raw?.laporan_baru ?? 0,
  total:
    raw?.pembaruan ??
    (raw?.permintaan_identitas ?? 0) +
      (raw?.pesan_baru ?? 0) +
      (raw?.status_diubah ?? 0) +
      (raw?.laporan_baru ?? 0),
})

export const adaptNotification = (raw) =>
  raw
    ? {
        id: raw.id ?? `${raw.tipe}:${raw.laporan_id ?? raw.report_id}`,
        tipe: raw.tipe ?? raw.type ?? null,
        laporanId: raw.laporan_id ?? raw.report_id ?? raw.laporan?.id ?? null,
        noLaporan:
          raw.no_laporan ?? raw.laporan?.no_laporan ?? raw.report?.no_laporan ?? null,
        kategori: raw.kategori ?? raw.laporan?.kategori ?? raw.report?.kategori ?? null,
        waktu: raw.waktu ?? raw.created_at ?? raw.updated_at ?? null,
        statusBaru: raw.status_baru ?? raw.status ?? null,
        pengirim:
          raw.pengirim?.name ??
          raw.sender_name ??
          raw.sender?.name ??
          (typeof raw.pengirim === 'string' ? raw.pengirim : null),
        preview: raw.preview ?? raw.isi ?? raw.pesan ?? null,
      }
    : null

export const adaptNotificationList = (raw) => {
  const body = raw ?? {}
  const payload = body.data ?? body
  const items = Array.isArray(payload)
    ? payload
    : Array.isArray(payload.items)
      ? payload.items
      : Array.isArray(payload.data)
        ? payload.data
        : []
  const meta = payload.meta ?? body.meta ?? body.pagination ?? payload.pagination
  return {
    items: items.map(adaptNotification).filter(Boolean),
    meta: adaptPagination(meta, items.length),
  }
}

const normalizeRisk = (value) => {
  const risk = String(value ?? 'low').toLowerCase()
  return ['high', 'tinggi', 'krisis', 'crisis'].includes(risk) ? 'high' : 'low'
}

const adaptAiHistory = (raw) =>
  (Array.isArray(raw?.history) ? raw.history : [])
    .filter((item) => item && typeof item.text === 'string')
    .map((item) => ({
      role: item.role === 'user' ? 'user' : 'assistant',
      body: item.text,
    }))

export const adaptAiReply = (raw) => {
  const body = raw ?? {}
  const history = adaptAiHistory(body)
  const suggestions = Array.isArray(body.suggestions)
    ? body.suggestions
    : Array.isArray(body.saran)
      ? body.saran
      : []
  const lastAssistant = [...history]
    .reverse()
    .find((item) => item.role === 'assistant')
  const reply =
    body.reply ??
    body.balasan ??
    body.isi ??
    body.message ??
    lastAssistant?.body ??
    ''
  const userTurns = history.filter((item) => item.role === 'user').length

  return {
    conversationId:
      body.conversation_id ?? body.conversationId ?? body.id ?? null,
    reply,
    history,
    suggestions: suggestions.filter(
      (item) => typeof item === 'string' && item.trim(),
    ),
    risk: normalizeRisk(body.risk ?? body.risiko),
    offerReport: Boolean(
      body.offer_report ??
        body.tawarkan_laporan ??
        body.offerReport ??
        (userTurns >= 3 && reply),
    ),
  }
}

export const adaptAiDraft = (raw) => ({
  kategori: raw?.kategori ?? 'lainnya',
  isi: raw?.isi ?? raw?.cerita ?? '',
  tampilkanIdentitas: false,
})

export const adaptSummary = (raw) => ({
  totalSantri: raw?.total_santri ?? 0,
  totalLaporan: raw?.total_laporan ?? 0,
  laporanBaru:
    raw?.laporan_baru ??
    raw?.laporan_per_status?.baru ??
    raw?.baru ??
    0,
  laporanSensitif:
    raw?.laporan_sensitif ?? raw?.laporan_menyangkut_pimpinan ?? 0,
  auditHariIni:
    raw?.audit_hari_ini ?? raw?.aktivitas_hari_ini ?? raw?.audit_today ?? 0,
  perStatus: raw?.laporan_per_status ?? raw?.per_status ?? {},
  perKategori: raw?.laporan_per_kategori ?? raw?.per_kategori ?? {},
})

export const adaptAuditLog = (raw) =>
  raw
    ? {
        id: raw.id,
        waktu:
          raw.waktu ??
          raw.created_at ??
          raw.timestamp ??
          raw.waktu_aktivitas ??
          null,
        aktor:
          raw.aktor ??
          raw.nama ??
          raw.user?.name ??
          raw.user_name ??
          raw.pengguna?.name ??
          'Sistem',
        aktorRole: raw.role ?? raw.user?.role ?? raw.aktor_role ?? null,
        aksi: raw.aksi ?? raw.action ?? raw.jenis ?? null,
        target:
          raw.target ??
          raw.no_laporan ??
          raw.laporan?.no_laporan ??
          (raw.laporan_id ? `Laporan #${raw.laporan_id}` : null),
        laporanId: raw.laporan_id ?? raw.report_id ?? raw.laporan?.id ?? null,
        detail:
          raw.detail ??
          raw.keterangan ??
          raw.description ??
          raw.catatan ??
          null,
        ip: raw.ip ?? raw.ip_address ?? null,
      }
    : null

export const adaptAuditList = (raw) => {
  const body = raw ?? {}
  const payload = body.data ?? body
  const items = Array.isArray(payload)
    ? payload
    : Array.isArray(payload.items)
      ? payload.items
      : Array.isArray(payload.data)
        ? payload.data
        : []
  const meta = payload.meta ?? body.meta ?? body.pagination ?? payload.pagination
  return {
    items: items.map(adaptAuditLog).filter(Boolean),
    meta: adaptPagination(meta, items.length),
  }
}

export const adaptDeactivationRequest = (raw) =>
  raw
    ? {
        id: raw.id,
        status: raw.status ?? 'menunggu',
        accountId:
          raw.account_id ?? raw.user_id ?? raw.target_id ?? raw.user?.id ?? null,
        accountName:
          raw.account_name ??
          raw.nama_akun ??
          raw.target?.name ??
          raw.user?.name ??
          null,
        accountRole:
          raw.account_role ?? raw.target?.role ?? raw.user?.role ?? 'pimpinan',
        requestedBy:
          raw.requested_by ??
          raw.diminta_oleh ??
          raw.requester?.name ??
          raw.peminta?.name ??
          null,
        reason: raw.alasan ?? raw.reason ?? raw.catatan ?? null,
        createdAt:
          raw.created_at ?? raw.dibuat ?? raw.waktu ?? raw.requested_at ?? null,
        decidedBy:
          raw.decided_by ??
          raw.disetujui_oleh ??
          raw.approver?.name ??
          null,
        decidedAt:
          raw.decided_at ?? raw.dijawab ?? raw.approved_at ?? null,
      }
    : null

export const adaptDeactivationList = (raw) => {
  const body = raw ?? {}
  const payload = body.data ?? body
  const items = Array.isArray(payload)
    ? payload
    : Array.isArray(payload.items)
      ? payload.items
      : Array.isArray(payload.data)
        ? payload.data
        : []
  const meta = payload.meta ?? body.meta ?? body.pagination ?? payload.pagination
  return {
    items: items.map(adaptDeactivationRequest).filter(Boolean),
    meta: adaptPagination(meta, items.length),
  }
}
