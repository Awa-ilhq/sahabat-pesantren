// Sumber kebenaran tunggal untuk label & konstanta domain.
// Jangan mendefinisikan label kategori/status di tempat lain.

export const ROLES = {
  SANTRI: 'santri',
  PENGURUS: 'pengurus',
  PIMPINAN: 'pimpinan',
  PENGAWAS: 'pengawas',
}

export const ROLE_LABELS = {
  [ROLES.SANTRI]: 'Santri',
  [ROLES.PENGURUS]: 'Pengurus',
  [ROLES.PIMPINAN]: 'Pimpinan',
  [ROLES.PENGAWAS]: 'Pengawas',
}

export const CATEGORIES = [
  {
    value: 'perundungan',
    label: 'Perundungan',
    description: 'Diejek, dikucilkan, atau diganggu terus-menerus.',
  },
  {
    value: 'kekerasan_fisik',
    label: 'Kekerasan fisik',
    description: 'Dipukul, ditendang, atau disentuh tanpa izin.',
  },
  {
    value: 'kekerasan_verbal',
    label: 'Kekerasan verbal',
    description: 'Dibentak, dihina, atau diancam dengan kata-kata.',
  },
  {
    value: 'masalah_pengurus',
    label: 'Masalah dengan pengurus',
    description: 'Perilaku pengurus yang membuatmu tidak nyaman.',
  },
  {
    value: 'masalah_pribadi',
    label: 'Masalah pribadi',
    description: 'Sedang sedih, cemas, atau butuh teman bicara.',
  },
  {
    value: 'lainnya',
    label: 'Lainnya',
    description: 'Sesuatu yang belum cocok dengan pilihan di atas.',
  },
]

export const CATEGORY_LABELS = Object.fromEntries(
  CATEGORIES.map((item) => [item.value, item.label]),
)

export const STATUSES = [
  { value: 'baru', label: 'Baru', tone: 'new' },
  { value: 'diproses', label: 'Diproses', tone: 'process' },
  { value: 'selesai', label: 'Selesai', tone: 'done' },
]

export const STATUS_LABELS = Object.fromEntries(
  STATUSES.map((item) => [item.value, item.label]),
)

export const ESCALATION_TARGETS = [
  { value: 'pimpinan', label: 'Pimpinan pesantren' },
  { value: 'tim_konseling', label: 'Tim Konseling / Medis' },
  { value: 'kepolisian', label: 'Kepolisian' },
  { value: 'dinas_p3a', label: 'Dinas P3A / PPPA' },
  { value: 'lainnya', label: 'Lainnya' },
]

export const ESCALATION_TARGET_LABELS = Object.fromEntries(
  ESCALATION_TARGETS.map((item) => [item.value, item.label]),
)

export const REPORT_RECIPIENTS = {
  pengurus: 'Pengurus',
  pimpinan: 'Pimpinan',
  pengawas: 'Pengawas',
}

// Laporan tentang pengurus diteruskan langsung ke pimpinan.
export const routesToPimpinan = ({ kategori }) =>
  kategori === 'masalah_pengurus'

// Laporan yang menyangkut pimpinan hanya boleh dibaca oleh pengawas.
export const isSensitiveReport = (report) =>
  Boolean(report?.menyangkutPimpinan)

export const reportsBasePath = (role) =>
  role === ROLES.PENGAWAS ? '/dashboard/pengawas/laporan' : '/petugas'

export const reportDetailPath = (role, id) => {
  if (role === ROLES.SANTRI) return `/santri/laporan/${id}`
  if (role === ROLES.PENGAWAS) return `${reportsBasePath(role)}/${id}`
  return `/petugas/laporan/${id}`
}

export const AUDIT_ACTION_OPTIONS = [
  { value: '', label: 'Semua aksi' },
  { value: 'report.viewed', label: 'Membuka laporan' },
  { value: 'report.status_changed', label: 'Mengubah status' },
  { value: 'report.message_sent', label: 'Membalas pesan' },
  { value: 'report.note_added', label: 'Menambah catatan internal' },
  { value: 'report.escalated', label: 'Meneruskan laporan' },
  { value: 'identity.requested', label: 'Meminta nama pelapor' },
  { value: 'identity.responded', label: 'Menjawab permintaan nama' },
  { value: 'identity.toggled', label: 'Mengubah tampilan nama' },
  { value: 'account.activated', label: 'Mengaktifkan akun' },
  { value: 'account.deactivated', label: 'Menonaktifkan akun' },
  { value: 'deactivation.requested', label: 'Mengajukan penonaktifan' },
  { value: 'deactivation.approved', label: 'Menyetujui penonaktifan' },
  { value: 'deactivation.rejected', label: 'Menolak penonaktifan' },
]

export const AUDIT_ACTION_LABELS = Object.fromEntries(
  AUDIT_ACTION_OPTIONS.filter((item) => item.value).map((item) => [
    item.value,
    item.label,
  ]),
)

export const DEACTIVATION_STATUS = {
  menunggu: { label: 'Menunggu persetujuan', tone: 'new' },
  disetujui: { label: 'Disetujui', tone: 'done' },
  ditolak: { label: 'Ditolak', tone: 'danger' },
}

// Permintaan pimpinan untuk melihat nama pelapor (harus disetujui santri).
export const IDENTITY_REQUEST_STATUS = {
  menunggu: { label: 'Menunggu persetujuan', tone: 'new' },
  disetujui: { label: 'Disetujui', tone: 'done' },
  ditolak: { label: 'Ditolak', tone: 'danger' },
  dicabut: { label: 'Dicabut', tone: 'neutral' },
}

export const IDENTITY_PROOF_ACCEPT = 'image/jpeg,image/png,application/pdf'
export const IDENTITY_PROOF_MAX_BYTES = 5 * 1024 * 1024

export const PAGE_SIZE = 8

export const MAX_IMPORT_BYTES = 5 * 1024 * 1024

export const HOME_BY_ROLE = {
  [ROLES.SANTRI]: '/santri/buat-laporan',
  [ROLES.PENGURUS]: '/petugas/dashboard',
  [ROLES.PIMPINAN]: '/pimpinan/dashboard',
  [ROLES.PENGAWAS]: '/dashboard/pengawas',
}

// Backend mengirimkan `dashboard` pada respons login; fallback ke peta peran
// bila field itu tidak tersedia.
export const homeForRole = (role, dashboard = null) =>
  dashboard || HOME_BY_ROLE[role] || '/'
