import {
  FileText,
  HeartHandshake,
  RotateCcw,
  Send,
  ShieldAlert,
  Sparkles,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import Modal from '../../components/ui/Modal'
import Select from '../../components/ui/Select'
import Textarea from '../../components/ui/Textarea'
import { useToast } from '../../components/ui/toast-context'
import { cn } from '../../lib/cn'
import { CATEGORIES } from '../../lib/constants'
import { useAuth } from '../auth/auth-context'
import { useAiChat, useAiDraft } from './hooks'

const SURFACE =
  '!border !border-[#e1e9e2] !shadow-[0_2px_10px_rgba(18,55,42,0.06)]'
const GREETING =
  'Hai, aku Teman Cerita. Di sini kamu bisa cerita apa saja dengan bahasamu sendiri. Aku akan mendengarkan tanpa menghakimi.'
const INITIAL_SUGGESTIONS = [
  'Aku sedih belakangan ini',
  'Ada yang menggangguku',
  'Cuma mau cerita',
]

const greetingMessage = () => ({
  id: 'ai-greeting',
  role: 'assistant',
  body: GREETING,
})

const CHAT_STORAGE_PREFIX = 'sp.ai.chat'

const chatStorageKey = (userId) =>
  userId == null ? null : `${CHAT_STORAGE_PREFIX}.${userId}`

const readChatState = (userId) => {
  const key = chatStorageKey(userId)
  if (!key) return null
  try {
    const parsed = JSON.parse(localStorage.getItem(key) ?? 'null')
    if (!parsed || !Array.isArray(parsed.messages)) return null
    const messages = parsed.messages
      .filter((message) => message && typeof message.body === 'string')
      .map((message, index) => ({
        id: `ai-restored-${index}`,
        role: message.role === 'user' ? 'user' : 'assistant',
        body: message.body,
      }))
    if (!messages.some((message) => message.id === 'ai-greeting')) {
      messages.unshift(greetingMessage())
    }
    return {
      messages,
      conversationId:
        typeof parsed.conversationId === 'string' ||
        typeof parsed.conversationId === 'number'
          ? parsed.conversationId
          : null,
      suggestions: Array.isArray(parsed.suggestions)
        ? parsed.suggestions.filter(
            (item) => typeof item === 'string' && item.trim(),
          )
        : INITIAL_SUGGESTIONS,
      offerReport: Boolean(parsed.offerReport),
      risk: parsed.risk === 'high' ? 'high' : 'low',
    }
  } catch {
    return null
  }
}

const clearChatState = (userId) => {
  const key = chatStorageKey(userId)
  if (!key) return
  try {
    localStorage.removeItem(key)
  } catch {
    // storage tidak tersedia: riwayat tetap hidup di memori React.
  }
}

export default function TemanCerita() {
  const navigate = useNavigate()
  const toast = useToast()
  const { user } = useAuth()
  const chat = useAiChat()
  const draftMutation = useAiDraft()

  const [restored] = useState(() => readChatState(user?.id))
  const [messages, setMessages] = useState(
    () => restored?.messages ?? [greetingMessage()],
  )
  const [conversationId, setConversationId] = useState(
    () => restored?.conversationId ?? null,
  )
  const [suggestions, setSuggestions] = useState(
    () => restored?.suggestions ?? INITIAL_SUGGESTIONS,
  )
  const [offerReport, setOfferReport] = useState(
    () => restored?.offerReport ?? false,
  )
  const [risk, setRisk] = useState(() => restored?.risk ?? 'low')
  const [input, setInput] = useState('')
  const [draft, setDraft] = useState(null)
  const [draftOpen, setDraftOpen] = useState(false)

  const listRef = useRef(null)
  const nextMessageRef = useRef(0)
  const stateUserIdRef = useRef(user?.id)

  const makeMessage = (role, body) => {
    nextMessageRef.current += 1
    return { id: `ai-local-${nextMessageRef.current}`, role, body }
  }

  useEffect(() => {
    const element = listRef.current
    if (!element) return
    element.scrollTop = element.scrollHeight
  }, [messages, chat.isPending])

  useEffect(() => {
    const key = chatStorageKey(stateUserIdRef.current)
    if (!key) return
    try {
      localStorage.setItem(
        key,
        JSON.stringify({
          messages,
          conversationId,
          suggestions,
          offerReport,
          risk,
        }),
      )
    } catch {
      // storage penuh/tidak tersedia: abaikan.
    }
  }, [conversationId, messages, offerReport, risk, suggestions])

  useEffect(() => {
    if (stateUserIdRef.current === user?.id) return
    stateUserIdRef.current = user?.id
    const next = readChatState(user?.id)
    setMessages(next?.messages ?? [greetingMessage()])
    setConversationId(next?.conversationId ?? null)
    setSuggestions(next?.suggestions ?? INITIAL_SUGGESTIONS)
    setOfferReport(next?.offerReport ?? false)
    setRisk(next?.risk ?? 'low')
    setInput('')
    setDraft(null)
    setDraftOpen(false)
  }, [user?.id])

  const resetConversation = () => {
    if (chat.isPending) return
    clearChatState(user?.id)
    setMessages([greetingMessage()])
    setConversationId(null)
    setSuggestions(INITIAL_SUGGESTIONS)
    setOfferReport(false)
    setRisk('low')
    setInput('')
    setDraft(null)
    setDraftOpen(false)
  }

  const sendMessage = async (value) => {
    const text = String(value ?? '').trim()
    if (!text || chat.isPending) return

    const history = messages
      .filter((message) => message.id !== 'ai-greeting')
      .map((message) => ({ role: message.role, text: message.body }))

    setInput('')
    setSuggestions([])
    setOfferReport(false)
    setMessages((previous) => [...previous, makeMessage('user', text)])

    try {
      const result = await chat.mutateAsync({
        conversationId,
        message: text,
        history,
      })
      if (result.conversationId) {
        setConversationId(result.conversationId)
      }
      setMessages((previous) => [
        ...previous,
        makeMessage(
          'assistant',
          result.reply ||
            'Aku mendengarmu. Mau cerita sedikit lagi tentang apa yang kamu rasakan?',
        ),
      ])
      setSuggestions(result.suggestions)
      setRisk((previous) =>
        previous === 'high' || result.risk === 'high' ? 'high' : 'low',
      )
      setOfferReport(Boolean(result.offerReport))
    } catch (error) {
      setMessages((previous) => [
        ...previous,
        makeMessage(
          'assistant',
          'Maaf, aku sedang tidak bisa merespons. Coba kirim lagi, ya. Kalau ini mendesak, hubungi pengurus atau ustaz terdekat.',
        ),
      ])
      toast.showToast(
        error?.message ?? 'Pesan gagal dikirim. Coba lagi.',
        'error',
      )
    }
  }

  const onSubmit = (event) => {
    event.preventDefault()
    sendMessage(input)
  }

  const onKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      event.currentTarget.form?.requestSubmit()
    }
  }

  const openDraft = async () => {
    const hasStory = messages.some(
      (message) => message.role === 'user' && message.body?.trim(),
    )
    if (!hasStory) {
      toast.showToast('Cerita dulu sedikit, ya.', 'error')
      return
    }
    try {
      const result = await draftMutation.mutateAsync({
        conversationId,
        messages,
      })
      setDraft(result)
      setDraftOpen(true)
    } catch (error) {
      toast.showToast(
        error?.message ?? 'Gagal membuat draf laporan.',
        'error',
      )
    }
  }

  const updateDraft = (field, value) => {
    setDraft((previous) => (previous ? { ...previous, [field]: value } : previous))
  }

  const goToForm = () => {
    if (!draft) return
    if (draft.isi.trim().length < 20) {
      toast.showToast('Ceritakan sedikit lebih lengkap, minimal 20 karakter.', 'error')
      return
    }
    setDraftOpen(false)
    navigate('/santri/buat-laporan', { state: { draft } })
  }

  const draftTooShort = Boolean(draft) && draft.isi.trim().length < 20

  return (
    <div className="w-full">
      <header className="mb-5">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#ffe99e] px-3 py-1 text-[11px] font-semibold text-[#163b2f]">
          <Sparkles aria-hidden="true" className="size-3.5" />
          Teman Cerita
        </span>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-[#12372a] sm:text-4xl">
          Cerita dulu, pelan-pelan
        </h1>
        <p className="mt-1 text-sm text-[#718078]">
          Aku akan mendengarkan tanpa menghakimi. Kalau kamu mau, nanti kita bisa
          rapikan ceritamu menjadi draf laporan.
        </p>
      </header>

      <div className="mb-3 flex items-start gap-3 rounded-2xl border border-[#f0c6b8] bg-[#fff1e9] px-4 py-3 text-sm text-[#6f746f]">
        <ShieldAlert
          aria-hidden="true"
          className="mt-0.5 size-5 shrink-0 text-[#ba4c30]"
        />
        <p>
          Teman Cerita adalah AI, bukan manusia dan bukan layanan darurat. Kalau
          kamu sedang dalam bahaya, hubungi pengurus atau ustaz terdekat, atau
          telepon{' '}
          <a
            href="tel:129"
            className="font-semibold text-[#163b2f] underline underline-offset-2"
          >
            SAPA 129
          </a>
          .
        </p>
      </div>

      {risk === 'high' ? (
        <div
          role="alert"
          className="mb-3 rounded-2xl border border-[#e7a48f] bg-[#ffe3d9] px-4 py-3 text-sm text-[#7c2d17]"
        >
          Keselamatanmu yang paling penting. Tolong segera hubungi pengurus,
          ustaz, atau orang dewasa yang kamu percaya. Kamu juga bisa menghubungi
          SAPA 129 melalui{' '}
          <a href="tel:129" className="font-semibold underline underline-offset-2">
            telepon 129
          </a>
          .
        </div>
      ) : null}

      <Card className={`${SURFACE} p-4 sm:p-6`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="flex size-10 items-center justify-center rounded-xl bg-[#d9f0e1] text-[#34744e]">
              <HeartHandshake aria-hidden="true" className="size-5" />
            </span>
            <div>
              <h2 className="text-lg">Teman Cerita</h2>
              <p className="text-xs text-body">AI pendamping, bukan pengganti manusia</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={resetConversation}
            disabled={chat.isPending}
          >
            <RotateCcw aria-hidden="true" className="size-4" />
            Mulai ulang
          </Button>
        </div>

        <div
          ref={listRef}
          aria-live="polite"
          className="mt-4 flex max-h-[26rem] min-h-64 flex-col gap-3 overflow-y-auto pr-1"
        >
          {messages.map((message) => {
            const own = message.role === 'user'
            return (
              <div
                key={message.id}
                className={cn(
                  'flex max-w-[85%] flex-col gap-1 rounded-2xl px-4 py-3',
                  own
                    ? 'self-end bg-report-green text-[#12372a]'
                    : 'self-start bg-band-1 text-navy',
                )}
              >
                <span
                  className={cn(
                    'text-xs font-semibold',
                    own ? 'text-[#216b49]' : 'text-primary',
                  )}
                >
                  {own ? 'Kamu' : 'Teman Cerita'}
                </span>
                <p data-pre-wrap className="text-sm">
                  {message.body}
                </p>
              </div>
            )
          })}

          {chat.isPending ? (
            <div className="flex items-center gap-2 self-start rounded-2xl bg-band-1 px-4 py-3 text-sm text-body">
              <span className="flex gap-1" aria-hidden="true">
                <span
                  className="size-1.5 animate-bounce rounded-full bg-primary/60"
                  style={{ animationDelay: '0ms' }}
                />
                <span
                  className="size-1.5 animate-bounce rounded-full bg-primary/60"
                  style={{ animationDelay: '150ms' }}
                />
                <span
                  className="size-1.5 animate-bounce rounded-full bg-primary/60"
                  style={{ animationDelay: '300ms' }}
                />
              </span>
              Teman Cerita sedang mengetik…
            </div>
          ) : null}
        </div>

        {suggestions.length && !chat.isPending ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {suggestions.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => sendMessage(suggestion)}
                className="rounded-full border border-[#c6d9cc] bg-white px-3 py-1.5 text-xs font-semibold text-primary transition hover:bg-[#edf6f0] focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                {suggestion}
              </button>
            ))}
          </div>
        ) : null}

        {offerReport && !chat.isPending ? (
          <div className="mt-3 flex flex-col gap-3 rounded-2xl border border-[#c6d9cc] bg-[#edf6f0] p-4 sm:flex-row sm:items-center">
            <FileText
              aria-hidden="true"
              className="size-5 shrink-0 text-primary"
            />
            <p className="flex-1 text-sm text-navy">
              Mau aku bantu rapikan ceritamu jadi draf laporan? Kamu tetap yang
              memutuskan dan bisa mengubahnya.
            </p>
            <Button
              size="sm"
              onClick={openDraft}
              loading={draftMutation.isPending}
            >
              Bantu buat draf
            </Button>
          </div>
        ) : null}

        <form
          onSubmit={onSubmit}
          className="mt-4 flex items-end gap-2"
          autoComplete="off"
          noValidate
        >
          <div className="flex-1">
            <label htmlFor="ai-message" className="sr-only">
              Pesan untuk Teman Cerita
            </label>
            <textarea
              id="ai-message"
              rows={2}
              maxLength={1000}
              autoComplete="off"
              placeholder="Tulis apa yang ingin kamu ceritakan…"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={onKeyDown}
              className="w-full rounded-2xl border border-border bg-white px-4 py-3 text-navy placeholder:text-body/60 focus:border-primary focus:outline-none focus:ring-3 focus:ring-primary/30"
            />
            <div className="mt-1 flex items-center justify-between gap-2 text-xs text-body">
              <span>Enter untuk kirim, Shift+Enter untuk baris baru.</span>
              <span>{input.length}/1000</span>
            </div>
          </div>
          <Button
            type="submit"
            size="icon"
            aria-label="Kirim pesan"
            disabled={!input.trim() || chat.isPending}
          >
            <Send aria-hidden="true" className="size-5" />
          </Button>
        </form>

        {!offerReport ? (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-4">
            <p className="text-xs text-body">
              Cerita ini bukan laporan sampai kamu mengirimnya sendiri.
            </p>
            <Button
              variant="secondary"
              size="sm"
              onClick={openDraft}
              loading={draftMutation.isPending}
              disabled={
                chat.isPending ||
                !messages.some(
                  (message) => message.role === 'user' && message.body?.trim(),
                )
              }
            >
              <FileText aria-hidden="true" className="size-4" />
              Buat draf laporan
            </Button>
          </div>
        ) : null}
      </Card>

      <Modal
        open={draftOpen && Boolean(draft)}
        onClose={() => setDraftOpen(false)}
        title="Draf laporan dari ceritamu"
        footer={
          <>
            <Button variant="ghost" onClick={() => setDraftOpen(false)}>
              Nanti saja
            </Button>
            <Button onClick={goToForm} disabled={draftTooShort}>
              Lanjut ke formulir
            </Button>
          </>
        }
      >
        {draft ? (
          <>
            <p className="text-sm text-body">
              Periksa dan ubah dulu. Laporan baru terkirim setelah kamu menekan
              tombol kirim di formulir.
            </p>
            <Select
              id="ai-draft-kategori"
              label="Kategori"
              options={CATEGORIES.map((category) => ({
                value: category.value,
                label: category.label,
              }))}
              value={draft.kategori}
              onChange={(event) => updateDraft('kategori', event.target.value)}
            />
            <Textarea
              id="ai-draft-isi"
              label="Isi laporan"
              required
              rows={8}
              value={draft.isi}
              onChange={(event) => updateDraft('isi', event.target.value)}
              hint="Ceritakan sedikit lebih lengkap, minimal 20 karakter."
              error={
                draftTooShort
                  ? 'Isi laporan minimal 20 karakter.'
                  : undefined
              }
            />
          </>
        ) : null}
      </Modal>
    </div>
  )
}
