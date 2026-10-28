import { useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft,
  FileQuestion,
  Forward,
  Send,
  StickyNote,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import * as api from '../../api'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import EmptyState from '../../components/ui/EmptyState'
import ErrorState from '../../components/ui/ErrorState'
import Input from '../../components/ui/Input'
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
  LateBadge,
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
  ROLES,
  STATUSES,
  reportsBasePath,
} from '../../lib/constants'
import { downloadBlob } from '../../lib/download'
import { displayReporter } from '../../lib/displayReporter'
import { formatDateOnly } from '../../lib/formatDate'
import {
  canEscalateReport,
  isReportLocked,
  runEscalationWorkflow,
  validateEscalationForm,
} from '../../features/reports/escalation'

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

const ESCALATION_TARGET_OPTIONS = [
  { value: 'polsek', label: 'Polsek' },
  { value: 'uppt_ppa', label: 'UPT PPA' },
  { value: 'pengurus_pusat', label: 'Pengurus Pusat' },
]

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
  const escalateMutation = useEscalate(id)
  const queryClient = useQueryClient()
  const toast = useToast()
  const { user } = useAuth()
  const addNote = useAddNote(id, user?.name)

  useEffect(() => {
    if (!dataUpdatedAt) return
    queryClient.invalidateQueries({ queryKey: notificationKeys.all() })
  }, [dataUpdatedAt, queryClient])

  const [escalateOpen, setEscalateOpen] = useState(false)
  const [noteBody, setNoteBody] = useState('')
  const [form, setForm] = useState({
    tujuan: '',
    nomor_wa_tujuan: '',
    catatan_pengurus: '',
  })
  const [formError, setFormError] = useState('')
  const [manualWhatsAppUrl, setManualWhatsAppUrl] = useState('')

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

  const isLocked = isReportLocked(report)
  const canEscalate = canEscalateReport(user?.role, report)

  const handleStatusChange = (event) => {
    if (isLocked) {
      toast.showToast('Laporan terkunci karena sudah dieskalasi.', 'error')
      return
    }
    const next = event.target.value
    updateStatus.mutate(next, {
      onSuccess: () => toast.showToast('Status laporan diperbarui.', 'success'),
      onError: (mutationError) => {
        if (mutationError?.status === 409) refetch()
        toast.showToast(mutationError?.message ?? 'Gagal memperbarui status.', 'error')
      },
    })
  }

  const openEscalateDialog = () => {
    if (!canEscalate) return
    setForm({ tujuan: '', nomor_wa_tujuan: '', catatan_pengurus: '' })
    setFormError('')
    setEscalateOpen(true)
  }

  const closeEscalateDialog = () => {
    if (escalateMutation.isPending) return
    setEscalateOpen(false)
    setForm({ tujuan: '', nomor_wa_tujuan: '', catatan_pengurus: '' })
    setFormError('')
  }

  const submitEscalation = async (event) => {
    event.preventDefault()
    if (escalateMutation.isPending) return
    if (!canEscalateReport(user?.role, report)) {
      toast.showToast('Laporan ini tidak dapat dieskalasi.', 'error')
      return
    }
    const validation = validateEscalationForm(form)
    if (validation) {
      setFormError(validation)
      return
    }
    setFormError('')

    try {
      const payload = {
        tujuan: form.tujuan,
        nomor_wa_tujuan: form.nomor_wa_tujuan.trim(),
        catatan_pengurus: form.catatan_pengurus.trim(),
      }
      const workflow = await runEscalationWorkflow({
        payload,
        openWhatsAppWindow: () => window.open('about:blank', '_blank'),
        requestEscalation: (data) => escalateMutation.mutateAsync(data),
        navigateWhatsAppWindow: (popup, url) => {
          popup.location.href = url
        },
        closeWhatsAppWindow: (popup) => popup.close(),
        downloadPdf: async (pdfUrl) => {
          const blob = await api.reports.downloadEscalationPdf(id, pdfUrl)
          downloadBlob(blob, `Surat-Pengantar-${id}.pdf`)
        },
      })

      setManualWhatsAppUrl(
        workflow.popupBlocked ? workflow.whatsappUrl ?? '' : '',
      )
      if (workflow.popupBlocked && workflow.whatsappUrl) {
        toast.showToast(
          'Popup WhatsApp diblokir. Izinkan popup atau gunakan tautan manual pada halaman laporan.',
          'error',
        )
      } else if (!workflow.whatsappUrl) {
        toast.showToast(
          'Eskalasi berhasil, tetapi tautan WhatsApp tidak tersedia dari server.',
          'error',
        )
      }
      if (workflow.pdfError) {
        toast.showToast(
          workflow.pdfError?.message ??
            'Eskalasi berhasil, tetapi PDF surat pengantar gagal diunduh.',
          'error',
        )
      }
      toast.showToast(
        workflow.result?.message ||
          'Laporan berhasil dieskalasi dan dikunci.',
        'success',
      )
      setEscalateOpen(false)
      setForm({ tujuan: '', nomor_wa_tujuan: '', catatan_pengurus: '' })
      setFormError('')
      await queryClient.invalidateQueries({ queryKey: ['reports'] })
      await refetch()
    } catch (mutationError) {
      if (mutationError?.status === 409) {
        await refetch()
      }
      setFormError(mutationError?.message ?? 'Gagal mengeskalasi laporan.')
      toast.showToast(mutationError?.message ?? 'Gagal mengeskalasi laporan.', 'error')
    }
  }

  const submitNote = async (event) => {
    event.preventDefault()
    if (isLocked) {
      toast.showToast('Laporan terkunci, tidak dapat menambah catatan.', 'error')
      return
    }
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
          <div className="flex flex-wrap items-center gap-2">
            {report.terlambat === true || report.lewatBatas === true ? <LateBadge /> : null}
            {report.edited === true ? (
              <span className="rounded-full bg-[#edf0ed] px-2.5 py-1 text-[10px] font-bold text-[#536158]">
                Diedit
              </span>
            ) : null}
            <StatusBadge status={report.status} />
            {isLocked ? (
              <span className="rounded-full bg-[#fbe9e7] px-2.5 py-1 text-[10px] font-bold text-danger">
                Terkunci
              </span>
            ) : null}
          </div>
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
              Diteruskan ke pihak berwajib
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
        {manualWhatsAppUrl ? (
          <a
            href={manualWhatsAppUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex min-h-11 items-center rounded-full border border-primary px-4 py-2 text-sm font-semibold text-primary hover:bg-band-1"
          >
            Buka WhatsApp secara manual
          </a>
        ) : null}
      </Card>

      {user?.role !== ROLES.PENGAWAS && !isLocked ? (
        <Card className={`${DETAIL_CARD_SURFACE} p-5 sm:p-6`}>
          <h2 className="text-xl">Tindakan</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Select
              id="ubah-status"
              label="Ubah status"
              options={STATUSES.filter((s) => s.value !== 'DITERUSKAN_KE_BERWAJIB')}
              value={report.status}
              disabled={updateStatus.isPending || isLocked}
              onChange={handleStatusChange}
            />
            {canEscalate ? (
              <div className="flex items-end">
                <Button
                  variant="secondary"
                  onClick={openEscalateDialog}
                  className="w-full"
                >
                  <Forward aria-hidden="true" className="size-4" />
                  Eskalasi
                </Button>
              </div>
            ) : null}
          </div>
        </Card>
      ) : null}

      {user?.role === 'pimpinan' && !isLocked ? (
        <IdentityRequestStaff report={report} />
      ) : null}

      {user?.role !== ROLES.PENGAWAS ? (
        <Conversation id={id} viewer="petugas" locked={isLocked} />
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
            {report.catatan && report.catatan.length ? (
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

          {!isLocked ? (
            <form onSubmit={submitNote} className="mt-4" autoComplete="off" noValidate>
              <Textarea
                id="note-body"
                label="Tambah catatan"
                rows={3}
                autoComplete="off"
                placeholder="Tulis catatan untuk sesama petugas"
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
          ) : null}
        </Card>
      ) : null}

      <Modal
        open={escalateOpen && canEscalate}
        onClose={closeEscalateDialog}
        title="Eskalasi laporan"
        footer={
          <>
            <Button variant="ghost" onClick={closeEscalateDialog} disabled={escalateMutation.isPending}>
              Batal
            </Button>
            <Button type="submit" form="escalate-form" loading={escalateMutation.isPending} disabled={escalateMutation.isPending}>
              Eskalasi
            </Button>
          </>
        }
      >
        <form id="escalate-form" onSubmit={submitEscalation} className="flex flex-col gap-4" noValidate>
          <Select
            id="tujuan-escalasi"
            label="Tujuan"
            options={ESCALATION_TARGET_OPTIONS}
            value={form.tujuan}
            disabled={escalateMutation.isPending}
            onChange={(e) => setForm((f) => ({ ...f, tujuan: e.target.value }))}
          />
          <Input
            id="nomor-wa-tujuan"
            label="Nomor WhatsApp tujuan"
            placeholder="+6281234567890"
            value={form.nomor_wa_tujuan}
            disabled={escalateMutation.isPending}
            onChange={(e) => setForm((f) => ({ ...f, nomor_wa_tujuan: e.target.value }))}
            helperText="Gunakan format internasional seperti +6281234567890."
          />
          <Textarea
            id="catatan-pengurus"
            label="Catatan pengurus"
            rows={4}
            value={form.catatan_pengurus}
            disabled={escalateMutation.isPending}
            onChange={(e) => setForm((f) => ({ ...f, catatan_pengurus: e.target.value }))}
          />
          {formError ? <p className="text-sm text-danger">{formError}</p> : null}
        </form>
      </Modal>
    </div>
  )
}
