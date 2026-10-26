import { CheckCircle2, ShieldCheck, XCircle } from 'lucide-react'
import { useState } from 'react'
import Button from '../../components/ui/Button'
import EmptyState from '../../components/ui/EmptyState'
import ErrorState from '../../components/ui/ErrorState'
import Modal from '../../components/ui/Modal'
import Skeleton from '../../components/ui/Skeleton'
import Textarea from '../../components/ui/Textarea'
import { useToast } from '../../components/ui/toast-context'
import {
  useDeactivationRequests,
  useDecideDeactivation,
} from '../../features/deactivation/hooks'
import {
  DEACTIVATION_STATUS,
  ROLE_LABELS,
} from '../../lib/constants'
import { formatDateTime } from '../../lib/formatDate'
import { cn } from '../../lib/cn'

const STATUS_TABS = [
  { value: 'menunggu', label: 'Menunggu' },
  { value: 'disetujui', label: 'Disetujui' },
  { value: 'ditolak', label: 'Ditolak' },
]

export default function DeactivationRequestsPage() {
  const toast = useToast()
  const [status, setStatus] = useState('menunggu')
  const [target, setTarget] = useState(null)
  const [decision, setDecision] = useState('disetujui')
  const [reason, setReason] = useState('')
  const { data, isLoading, isError, refetch } = useDeactivationRequests({
    status,
  })
  const decide = useDecideDeactivation()
  const items = data?.items ?? []

  const openDecision = (request, nextStatus) => {
    setTarget(request)
    setDecision(nextStatus)
    setReason('')
  }

  const submit = async () => {
    if (!target) return
    try {
      await decide.mutateAsync({
        id: target.id,
        status: decision,
        alasan: reason.trim() || undefined,
      })
      toast.showToast(
        decision === 'disetujui'
          ? 'Penonaktifan akun disetujui.'
          : 'Pengajuan penonaktifan ditolak.',
        'success',
      )
      setTarget(null)
    } catch (error) {
      toast.showToast(error?.message ?? 'Gagal menyimpan keputusan.', 'error')
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <header>
        <span className="inline-flex rounded-full bg-[#dfeaff] px-3 py-1 text-[11px] font-bold text-[#3156a5]">
          Persetujuan berlapis
        </span>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-navy sm:text-4xl">
          Pengajuan penonaktifan
        </h1>
        <p className="mt-1 text-sm text-body">
          Penonaktifan akun pimpinan memerlukan persetujuan pimpinan lain.
        </p>
      </header>

      <div
        role="tablist"
        aria-label="Status pengajuan"
        className="flex gap-2 overflow-x-auto border-b border-border pb-px"
      >
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={status === tab.value}
            onClick={() => setStatus(tab.value)}
            className={cn(
              '-mb-px border-b-2 px-4 py-3 text-sm font-semibold transition-colors',
              status === tab.value
                ? 'border-primary text-primary'
                : 'border-transparent text-body hover:text-navy',
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {isError ? (
        <ErrorState message="Pengajuan gagal dimuat." onRetry={refetch} />
      ) : isLoading ? (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-28 rounded-3xl" />
          <Skeleton className="h-28 rounded-3xl" />
        </div>
      ) : items.length ? (
        <ul className="flex flex-col gap-3">
          {items.map((request) => {
            const meta =
              DEACTIVATION_STATUS[request.status] ??
              DEACTIVATION_STATUS.menunggu
            return (
              <li
                key={request.id}
                className="rounded-3xl bg-white p-4 shadow-[0_8px_24px_rgba(18,55,42,0.06)] sm:p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-lg font-semibold text-navy">
                      {request.accountName ?? `Akun #${request.accountId}`}
                    </p>
                    <p className="text-sm text-body">
                      {ROLE_LABELS[request.accountRole] ?? request.accountRole}
                      {request.requestedBy
                        ? ` · diajukan oleh ${request.requestedBy}`
                        : ''}
                    </p>
                  </div>
                  <span
                    className={cn(
                      'inline-flex rounded-full border px-3 py-1 text-xs font-bold',
                      request.status === 'disetujui'
                        ? 'border-status-done/30 bg-status-done-bg text-status-done'
                        : request.status === 'ditolak'
                          ? 'border-danger/30 bg-danger-bg text-danger'
                          : 'border-status-new/30 bg-status-new-bg text-status-new',
                    )}
                  >
                    {meta.label}
                  </span>
                </div>

                {request.reason ? (
                  <p className="mt-3 rounded-2xl bg-band-1 px-4 py-3 text-sm text-navy">
                    {request.reason}
                  </p>
                ) : null}

                <p className="mt-2 text-xs text-body">
                  Diajukan {formatDateTime(request.createdAt)}
                  {request.decidedBy
                    ? ` · diputuskan oleh ${request.decidedBy}`
                    : ''}
                </p>

                {request.status === 'menunggu' ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      onClick={() => openDecision(request, 'disetujui')}
                    >
                      <CheckCircle2 aria-hidden="true" className="size-4" />
                      Setujui
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => openDecision(request, 'ditolak')}
                    >
                      <XCircle aria-hidden="true" className="size-4" />
                      Tolak
                    </Button>
                  </div>
                ) : null}
              </li>
            )
          })}
        </ul>
      ) : (
        <EmptyState
          icon={ShieldCheck}
          title="Tidak ada pengajuan"
          description="Pengajuan penonaktifan akun pimpinan akan tampil di sini."
        />
      )}

      <Modal
        open={Boolean(target)}
        onClose={() => setTarget(null)}
        title={
          decision === 'disetujui'
            ? 'Setujui penonaktifan'
            : 'Tolak penonaktifan'
        }
        footer={
          <>
            <Button variant="ghost" onClick={() => setTarget(null)}>
              Batal
            </Button>
            <Button loading={decide.isPending} onClick={submit}>
              {decision === 'disetujui' ? 'Setujui' : 'Tolak'}
            </Button>
          </>
        }
      >
        <p className="text-sm text-body">
          {decision === 'disetujui'
            ? `Akun ${target?.accountName ?? ''} akan dinonaktifkan sehingga tidak bisa masuk lagi.`
            : `Pengajuan untuk ${target?.accountName ?? 'akun ini'} akan ditolak dan akun tetap aktif.`}
        </p>
        <Textarea
          id="deactivation-reason"
          label="Catatan keputusan (opsional)"
          rows={3}
          value={reason}
          onChange={(event) => setReason(event.target.value)}
        />
      </Modal>
    </div>
  )
}
