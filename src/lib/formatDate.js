// Semua tanggal di UI ditampilkan sebagai TANGGAL saja (tanpa jam).
// Jam laporan tidak boleh bocor, jadi util ini sengaja tidak pernah
// memformat waktu.

const DATE_FORMATTER = new Intl.DateTimeFormat('id-ID', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
})

export const parseDateOnly = (value) => {
  if (!value) return null
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return null
    return new Date(value.getFullYear(), value.getMonth(), value.getDate())
  }

  const text = String(value)
  const match = text.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (match) {
    return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
  }

  const parsed = new Date(text)
  if (Number.isNaN(parsed.getTime())) return null
  return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate())
}

export const formatDateOnly = (value, fallback = '—') => {
  const date = parseDateOnly(value)
  return date ? DATE_FORMATTER.format(date) : fallback
}

const DATE_TIME_FORMATTER = new Intl.DateTimeFormat('id-ID', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

// Hanya untuk log audit: waktu kejadian memang bagian dari data audit.
export const formatDateTime = (value, fallback = '—') => {
  if (!value) return fallback
  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime()) ? fallback : DATE_TIME_FORMATTER.format(date)
}

export const startOfToday = () => {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), now.getDate())
}

export const isToday = (value) => {
  const date = parseDateOnly(value)
  if (!date) return false
  return date.getTime() === startOfToday().getTime()
}

export const isPastDate = (value) => {
  const date = parseDateOnly(value)
  if (!date) return false
  return date.getTime() < startOfToday().getTime()
}

// Keadaan batas klarifikasi HANYA berbasis tanggal (tanpa hitung mundur jam).
export const dueState = (value) => {
  if (!value) return 'none'
  if (isToday(value)) return 'today'
  if (isPastDate(value)) return 'overdue'
  return 'upcoming'
}
