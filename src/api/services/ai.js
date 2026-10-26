import { http } from '../client'
import { adaptAiDraft, adaptAiReply } from '../adapters'
import { draftFromAiMessages } from '../../lib/aiDraft'

const unwrap = (response) => response.data?.data ?? response.data ?? {}

// Balasan AI bisa lebih lama dari endpoint biasa, jadi pakai timeout khusus.
const AI_TIMEOUT_MS = 60000

// Backend hanya menerima nilai role tertentu untuk riwayat. Coba nilai yang
// paling umum, lalu jatuh ke permintaan tanpa riwayat bila semuanya ditolak.
const HISTORY_ROLES = ['model', 'ai']

let historyRole = HISTORY_ROLES[0]
let historyEnabled = true

const buildHistory = (history, role) =>
  (Array.isArray(history) ? history : []).map((item) => ({
    role: item.role === 'user' ? 'user' : role,
    text: item.text ?? item.body ?? '',
  }))

const isHistoryRoleError = (error) => {
  if (error?.status !== 422) return false
  const keys = Object.keys(error?.errors ?? {})
  if (keys.some((key) => /^history\.\d+\.role$/.test(key))) return true
  return /history\.\d+\.role/i.test(error?.message ?? '')
}

const send = (payload) =>
  http.post('/chat', payload, { timeout: AI_TIMEOUT_MS })

const sendChat = async ({ message, history }) => {
  const entries = Array.isArray(history) ? history : []
  if (historyEnabled && entries.length) {
    let index = HISTORY_ROLES.indexOf(historyRole)
    if (index < 0) index = 0
    while (index < HISTORY_ROLES.length) {
      const role = HISTORY_ROLES[index]
      try {
        const response = await send({
          message,
          history: buildHistory(entries, role),
        })
        historyRole = role
        return response
      } catch (error) {
        if (!isHistoryRoleError(error)) throw error
        index += 1
      }
    }
    historyEnabled = false
  }
  return send({ message, history: [] })
}

// Backend menyediakan POST /chat dengan riwayat percakapan. Bentuk respons:
// { message, history: [{ role, text }] }.
export const chat = async ({ message, history = [] }) =>
  adaptAiReply(unwrap(await sendChat({ message, history })))

// Backend belum menyediakan endpoint draf, jadi draf dibuat dari riwayat
// percakapan yang sudah ada di klien.
export const createDraft = async ({ conversationId, messages } = {}) => {
  if (Array.isArray(messages) && messages.length) {
    return adaptAiDraft(draftFromAiMessages(messages))
  }
  if (!conversationId) {
    return adaptAiDraft({})
  }
  return adaptAiDraft(
    unwrap(
      await http.post(
        `/ai/conversations/${conversationId}/draft`,
        {},
        { timeout: AI_TIMEOUT_MS },
      ),
    ),
  )
}
