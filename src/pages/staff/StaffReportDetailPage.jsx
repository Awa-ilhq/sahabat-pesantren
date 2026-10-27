import { useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft,
  FileQuestion,
  Send,
  Share2,
  StickyNote,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import EmptyState from '../../components/ui/EmptyState'
import ErrorState from '../../components/ui/ErrorState'
import Modal from '../../components/ui/Modal'
import Select from '../../components/ui/Select'
import Skeleton from '../../components/ui/Skeleton'
import Textarea from '../../components/ui/Textarea'
import { useToast } from '../../components/ui/toast-context'
import { Conversation } from '../../features/conversations/Conversation'
import { useAuth } from '../../features/auth/auth-context'
import IdentityRequestStaff from '../../features/identity/IdentityRequestStaff'
import { notificationKeys } from '../../features/notifications/queryKeys'
import {
  CategoryBadge,
  SensitiveBadge,
  StatusBadge,
} from '../../features/reports/components/badges'
import {
  useAddNote,
  useEscalate,
  useReport,
  useUpdateStatus,
} from '../../features/reports/hooks'
import {
  ESCALATION_TARGETS,
  ESCALATION_TARGET_LABELS,
  ROLES,
  STATUSES,
  reportsBasePath,
} from '../../lib/constants'
import { displayReporter } from '../../lib/displayReporter'
import { formatDateOnly } from '../../lib/formatDate'

const DETAIL_CARD_SURFACE =
  '!border !border-[#e1e9e2] !shadow-[0_2px_10px_rgba(18,55,42,0.06)]'

function InfoRow({ label, children }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-xs font-semibold uppercase tracking-wide text-body">
        {label}
      </dt>
      <dd className="text-sm text-navy">{children}</dd>
    </div>
  )
}

export default function StaffReportDetailPage() {
  const { id } = useParams()
  const {
    data: report,
    dataUpdatedAt,
    isLoading,
    isError,
    error,
    refetch,
  } = useReport(id)
  const updateStatus = useUpdateStatus(id)
  const escalate = useEscalate(id)
  const queryClient = useQueryClient()
  const toast = useToast()
  const { user } = useAuth()
  const addNote = useAddNote(id, user?.name)

  useEffect(() => {
    if (!dataUpdatedAt) return
    queryClient.invalidateQueries({ queryKey: notificationKeys.all() })
  }, [dataUpdatedAt, queryClient])

  const [escalateOpen, setEscalateOpen] = useState(false)
  const [tujuan, setTujuan] = useState('')
  const [catatanEskalasi, setCatatanEskalasi] = useState('')
  const [noteBody, setNoteBody] = useState('')

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    )
  }

  if (isError || !report) {
    if (error?.status === 404) {
      return (
        <EmptyState
          icon={FileQuestion}
          title="Laporan tidak ditemukan"
          description="Laporan mungkin sudah dihapus atau nomornya salah."
          action={
            <Link
              to={reportsBasePath(user?.role)}
              className="font-semibold text-primary-hover hover:underline"
            >
              Kembali ke daftar laporan
            </Link>
          }
        />
      )
    }
    if (error?.status === 403) {
      return (
        <ErrorState
          title="Tidak punya akses"
          message={error.message}
        />
      )
    }
    return (
      <ErrorState
        title="Laporan tidak dapat dibuka"
        message={error?.message ?? 'Terjadi gangguan saat membuka laporan.'}
        onRetry={refetch}
      />
    )
  }

  const handleStatusChange = (event) => {
    const next = event.target.value
    updateStatus.mutate(next, {
      onSuccess: () => toast.showToast('Status laporan diperbarui.', 'success'),
      onError: (mutationError) =>
        toast.showToast(mutationError?.message ?? 'Gagal memperbarui status.', 'error'),
    })
  }

  const submitEscalate = async (event) => {
    event.preventDefault()
    if (!tujuan) {
      toast.showToast('Pilih tujuan eskalasi dulu.', 'error')
      return
    }
    try {
      await escalate.mutateAsync({ tujuan, catatan: catatanEskalasi || null })
      toast.showToast('Laporan diteruskan.', 'success')
      setEscalateOpen(false)
      setTujuan('')
      setCatatanEskalasi('')
    } catch (mutationError) {
      toast.showToast(mutationError?.message ?? 'Gagal meneruskan laporan.', 'error')
    }
  }

  const submitNote = async (event) => {
    event.preventDefault()
    if (!noteBody.trim()) return
    try {
      await addNote.mutateAsync(noteBody.trim())
      setNoteBody('')
      toast.showToast('Catatan internal ditambahkan.', 'success')
    } catch (mutationError) {
      toast.showToast(mutationError?.message ?? 'Gagal menambah catatan.', 'error')
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <Link
        to={reportsBasePath(user?.role)}
        className="inline-flex items-center gap-2 text-sm font-semibold text-primary-hover hover:underline"
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        Kembali ke daftar laporan
      </Link>

      <Card className={`${DETAIL_CARD_SURFACE} p-5 sm:p-6`}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="font-sans text-2xl font-semibold text-primary">
            {report.noLaporan}
          </span>
          <StatusBadge status={report.status} />
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <CategoryBadge kategori={report.kategori} />
          {user?.role === ROLES.PENGAWAS && report.menyangkutPimpinan ? (
            <SensitiveBadge />
          ) : null}
        </div>

        <dl className="mt-5 grid gap-4 sm:grid-cols-2">
          <InfoRow label="Pelapor">
            {displayReporter(report, user?.role)}
          </InfoRow>
          <InfoRow label="Tanggal laporan">{formatDateOnly(report.createdAt)}</InfoRow>
        </dl>

        <p className="mt-5 rounded-2xl bg-white p-4" data-pre-wrap>
          {report.isi}
        </p>

        {report.perluKlarifikasi ? (
          <p className="mt-3 rounded-2xl border border-primary/40 bg-amber/15 px-4 py-3 text-sm text-navy">
            Laporan ini perlu klarifikasi lanjutan.
          </p>
        ) : null}

        {report.dieskalasiTujuan ? (
          <div className="mt-3 rounded-2xl border border-primary/40 bg-amber/15 px-4 py-3 text-sm text-navy">
            <p className="font-semibold">
              Diteruskan ke{' '}
              {ESCALATION_TARGET_LABELS[report.dieskalasiTujuan] ??
                report.dieskalasiTujuan}
            </p>
            {report.dieskalasiCatatan ? (
              <p className="mt-1" data-pre-wrap>
                {report.dieskalasiCatatan}
              </p>
            ) : null}
            <p className="mt-1 text-xs text-body">
              {formatDateOnly(report.dieskalasiAt)}
            </p>
          </div>
        ) : null}
      </Card>

      {user?.role !== ROLES.PENGAWAS ? (
        <Card className={`${DETAIL_CARD_SURFACE} p-5 sm:p-6`}>
          <h2 className="text-xl">Tindakan</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Select
              id="ubah-status"
              label="Ubah status"
              options={STATUSES}
              value={report.status}
              disabled={updateStatus.isPending}
              onChange={handleStatusChange}
            />
            <div className="flex items-end">
              <Button
                variant="secondary"
                onClick={() => setEscalateOpen(true)}
                className="w-full"
              >
                <Share2 aria-hidden="true" className="size-4" />
                Teruskan laporan
              </Button>
            </div>
          </div>
        </Card>
      ) : null}

      {user?.role === 'pimpinan' ? (
        <IdentityRequestStaff report={report} />
      ) : null}

      {user?.role !== ROLES.PENGAWAS ? (
        <Conversation id={id} viewer="petugas" />
      ) : null}

      {user?.role !== ROLES.PENGAWAS ? (
        <Card className={`${DETAIL_CARD_SURFACE} p-5 sm:p-6`}>
          <h2 className="flex items-center gap-2 text-xl">
            <StickyNote aria-hidden="true" className="size-5 text-primary" />
            Catatan internal
          </h2>
          <p className="mt-0.5 text-sm text-body">
            Hanya terlihat oleh petugas. Pelapor tidak bisa membaca catatan ini.
          </p>

          <ul className="mt-4 flex flex-col gap-3">
            {report.catatan.length ? (
              report.catatan.map((note) => (
                <li
                  key={note.id}
                  className="rounded-2xl border border-border bg-white p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-body">
                    <span className="font-semibold text-primary">
                      {note.authorName ?? 'Nama pengirim tidak tersedia'}
                    </span>
                    <span>{formatDateOnly(note.createdAt)}</span>
                  </div>
                  <p className="mt-2 text-sm text-navy" data-pre-wrap>
                    {note.body}
                  </p>
                </li>
              ))
            ) : (
              <li className="rounded-2xl border border-dashed border-border px-4 py-6 text-center text-sm text-body">
                Belum ada catatan internal.
              </li>
            )}
          </ul>

          <form onSubmit={submitNote} className="mt-4" autoComplete="off" noValidate>
            <Textarea
              id="note-body"
              label="Tambah catatan"
              rows={3}
              autoComplete="off"
              placeholder="Tulis catatan untuk sesama petugas…"
              value={noteBody}
              onChange={(event) => setNoteBody(event.target.value)}
            />
            <div className="mt-3 flex justify-end">
              <Button
                type="submit"
                size="sm"
                loading={addNote.isPending}
                disabled={!noteBody.trim()}
              >
                <Send aria-hidden="true" className="size-4" />
                Simpan catatan
              </Button>
            </div>
          </form>
        </Card>
      ) : null}

      <Modal
        open={escalateOpen}
        onClose={() => setEscalateOpen(false)}
        title="Teruskan laporan"
        footer={
          <>
            <Button variant="ghost" onClick={() => setEscalateOpen(false)}>
              Batal
            </Button>
            <Button
              type="submit"
              form="escalate-form"
              loading={escalate.isPending}
            >
              Teruskan
            </Button>
          </>
        }
      >
        <form id="escalate-form" onSubmit={submitEscalate} className="flex flex-col gap-4">
          <Select
            id="tujuan-eskalasi"
            label="Tujuan eskalasi"
            options={[
              { value: '', label: 'Pilih tujuan' },
              ...ESCALATION_TARGETS,
            ]}
            value={tujuan}
            onChange={(event) => setTujuan(event.target.value)}
          />
          <Textarea
            id="catatan-eskalasi"
            label="Catatan (opsional)"
            rows={3}
            autoComplete="off"
            placeholder="Ringkasan alasan penerusan…"
            value={catatanEskalasi}
            onChange={(event) => setCatatanEskalasi(event.target.value)}
          />
        </form>
      </Modal>
    </div>
  )
}
