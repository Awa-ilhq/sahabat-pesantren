import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'
import { MessageCircle, Send } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import EmptyState from '../../components/ui/EmptyState'
import ErrorState from '../../components/ui/ErrorState'
import Skeleton from '../../components/ui/Skeleton'
import { cn } from '../../lib/cn'
import { formatDateOnly } from '../../lib/formatDate'
import { useToast } from '../../components/ui/toast-context'
import { useAuth } from '../auth/auth-context'
import { notificationKeys } from '../notifications/queryKeys'
import { useMessages, useSendMessage } from './hooks'

const schema = z.object({
  body: z
    .string()
    .trim()
    .min(1, 'Tulis pesan dulu, ya.')
    .max(1000, 'Pesan terlalu panjang.'),
})
const CONVERSATION_CARD_SURFACE =
  '!border !border-[#e1e9e2] !shadow-[0_2px_10px_rgba(18,55,42,0.06)]'

const sortMessagesOldestFirst = (messages) =>
  messages
    .map((message, index) => ({
      message,
      index,
      timestamp: Date.parse(message.createdAt ?? ''),
    }))
    .sort((a, b) => {
      const aHasTimestamp = Number.isFinite(a.timestamp)
      const bHasTimestamp = Number.isFinite(b.timestamp)
      if (!aHasTimestamp || !bHasTimestamp) {
        return aHasTimestamp === bHasTimestamp ? a.index - b.index : aHasTimestamp ? -1 : 1
      }
      return a.timestamp - b.timestamp || a.index - b.index
    })
    .map(({ message }) => message)

export function Conversation({ id, viewer }) {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const { data, isLoading, isError, refetch } = useMessages(id)
  const messages = data ? sortMessagesOldestFirst(data) : []
  const sendMessage = useSendMessage(id)
  const toast = useToast()
  const listRef = useRef(null)
  const markedReadRef = useRef(null)
  const previousCountRef = useRef(0)
  const stickToBottomRef = useRef(true)

  useEffect(() => {
    if (!data || markedReadRef.current === id) return
    markedReadRef.current = id
    queryClient.invalidateQueries({ queryKey: notificationKeys.all() })
  }, [data, id, queryClient])

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema), defaultValues: { body: '' } })

  useEffect(() => {
    previousCountRef.current = 0
    stickToBottomRef.current = true
  }, [id])

  const handleScroll = () => {
    const element = listRef.current
    if (!element) return
    stickToBottomRef.current =
      element.scrollHeight - element.scrollTop - element.clientHeight < 80
  }

  useEffect(() => {
    const element = listRef.current
    if (!element || !data) return
    const previousCount = previousCountRef.current
    const nextCount = data.length
    if (
      (previousCount === 0 || stickToBottomRef.current) &&
      nextCount > previousCount
    ) {
      element.scrollTop = element.scrollHeight
    }
    previousCountRef.current = nextCount
  }, [data])

  const senderRoleFor = (message) => {
    if (message.from === 'santri') return 'santri'
    if (
      message.from === 'petugas' ||
      message.from === 'pengurus' ||
      message.from === 'pimpinan'
    ) {
      return message.from
    }
    return null
  }

  const isOwn = (message, senderRole) => {
    if (message.senderId != null && user?.id != null) {
      return String(message.senderId) === String(user.id)
    }
    if (message.senderName && user?.name) {
      return message.senderName === user.name
    }
    if (senderRole === 'santri') return viewer === 'santri'
    if (senderRole === 'pengurus' || senderRole === 'pimpinan') {
      return senderRole === user?.role
    }
    return false
  }

  const isAnonymousName = (name) =>
    !name || /^anonymous$/i.test(String(name).trim())

  const labelFor = (message, senderRole, own) => {
    if (viewer === 'santri') return own ? 'Kamu' : 'Petugas'
    if (own) return message.senderName || user?.name || 'Petugas'
    if (senderRole === 'santri' || isAnonymousName(message.senderName)) {
      return 'Pelapor'
    }
    if (senderRole === 'pengurus' || senderRole === 'pimpinan') {
      return senderRole === user?.role
        ? message.senderName || senderRole
        : senderRole === 'pengurus'
          ? 'Pengurus'
          : 'Pimpinan'
    }
    return message.senderName || 'Pelapor'
  }

  const onSubmit = async (values) => {
    try {
      await sendMessage.mutateAsync(values.body)
      reset()
    } catch (error) {
      toast.showToast(error?.message ?? 'Pesan gagal dikirim.', 'error')
    }
  }

  return (
    <Card className={`${CONVERSATION_CARD_SURFACE} p-5 sm:p-6`}>
      <h2 className="text-xl">Percakapan</h2>
      <p className="mt-0.5 text-sm text-body">
        {viewer === 'santri'
          ? 'Balasan petugas akan muncul di sini.'
          : 'Pelapor selalu tampil sebagai "Pelapor".'}
      </p>

      <div
        ref={listRef}
        onScroll={handleScroll}
        className="mt-4 flex max-h-80 flex-col gap-3 overflow-y-auto pr-1"
      >
        {isLoading ? (
          <>
            <Skeleton className="h-14 w-3/4" />
            <Skeleton className="ml-auto h-14 w-2/3" />
          </>
        ) : isError ? (
          <ErrorState
            title="Percakapan gagal dimuat"
            message="Coba muat ulang percakapan."
            onRetry={refetch}
          />
        ) : messages.length ? (
          messages.map((message) => {
            const senderRole = senderRoleFor(message)
            const own = isOwn(message, senderRole)
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
                <div className="flex items-center gap-2 text-xs font-semibold">
                  <span className={own ? 'text-[#216b49]' : 'text-primary'}>
                    {labelFor(message, senderRole, own)}
                  </span>
                  <span className={own ? 'text-[#216b49]/70' : 'text-body'}>
                    {formatDateOnly(message.createdAt)}
                  </span>
                </div>
                <p data-pre-wrap className="text-sm">
                  {message.body}
                </p>
              </div>
            )
          })
        ) : (
          <EmptyState
            icon={MessageCircle}
            title="Belum ada pesan"
            description="Pesan pertama bisa membuka jalan untuk dibantu."
            className="border-none bg-transparent py-6"
          />
        )}
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="mt-4 flex items-end gap-2"
        autoComplete="off"
        noValidate
      >
        <div className="flex-1">
          <label htmlFor="message-body" className="sr-only">
            Pesan
          </label>
          <textarea
            id="message-body"
            rows={2}
            autoComplete="off"
            placeholder="Tulis pesan…"
            className={cn(
              'w-full rounded-2xl border bg-white px-4 py-3 text-navy placeholder:text-body/60 focus:border-primary focus:outline-none focus:ring-3 focus:ring-primary/30',
              errors.body ? 'border-danger' : 'border-border',
            )}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault()
                event.currentTarget.form?.requestSubmit()
              }
            }}
            {...register('body')}
          />
          {errors.body ? (
            <p role="alert" className="mt-1 text-sm text-danger">
              {errors.body.message}
            </p>
          ) : null}
        </div>
        <Button
          type="submit"
          size="icon"
          disabled={isSubmitting}
          aria-label="Kirim pesan"
        >
          <Send aria-hidden="true" className="size-5" />
        </Button>
      </form>
    </Card>
  )
}
