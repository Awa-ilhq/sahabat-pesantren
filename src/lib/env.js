const asBool = (value, fallback) => {
  if (value === undefined || value === null || value === '') return fallback
  return String(value).toLowerCase() === 'true'
}

const asNumber = (value, fallback) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

export const API_URL = String(import.meta.env.VITE_API_URL || '')
  .trim()
  .replace(/\/+$/, '')
  .replace(/\/api\/v1$/i, '')

export const USE_MOCK = asBool(import.meta.env.VITE_USE_MOCK, true)

// Tanpa konfigurasi eksplisit, AI mengikuti mode aplikasi: mock saat
// VITE_USE_MOCK=true, AI asli saat tersambung ke API.
export const USE_AI_MOCK = asBool(import.meta.env.VITE_USE_AI_MOCK, USE_MOCK)

export const IDLE_TIMEOUT_SECONDS = asNumber(
  import.meta.env.VITE_IDLE_TIMEOUT_SECONDS,
  180,
)

export const STAFF_IDLE_TIMEOUT_SECONDS = asNumber(
  import.meta.env.VITE_STAFF_IDLE_TIMEOUT_SECONDS,
  900,
)
