import { useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Clock, FileQuestion, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import EmptyState from '../../components/ui/EmptyState'
import ErrorState from '../../components/ui/ErrorState'
import Modal from '../../components/ui/Modal'
import Skeleton from '../../components/ui/Skeleton'
import Switch from '../../components/ui/Switch'
import { useToast } from '../../components/ui/toast-context'
import { Conversation } from '../../features/conversations/Conversation'
import IdentityRequestSantri from '../../features/identity/IdentityRequestSantri'
import ReportTrail from '../../features/reports/components/ReportTrail'
import {
  CategoryBadge,
  StatusBadge,
} from '../../features/reports/components/badges'
import { notificationKeys } from '../../features/notifications/queryKeys'
import {
  useDeleteReport,
  useReport,
  useUpdateIdentity,
} from '../../features/reports/hooks'
import { formatDateOnly } from '../../lib/formatDate'

const DETAIL_CARD_SURFACE =
  '!border !border-[#e1e9e2] !shadow-[0_2px_10px_rgba(18,55,42,0.06)]'

export default function SantriReportDetailPage() {
  const { id } = useParams()
  const {
    data: report,
    dataUpdatedAt,
    isLoading,
    isError,
    error,
    refetch,
  } = useReport(id)
  const updateIdentity = useUpdateIdentity(id)
  const deleteReport = useDeleteReport()
  const queryClient = useQueryClient()
  const toast = useToast()
  const navigate = useNavigate()
  const [deleteOpen, setDeleteOpen] = useState(false)

  useEffect(() => {
    if (!dataUpdatedAt) return
    queryClient.invalidateQueries({ queryKey: notificationKeys.all() })
  }, [dataUpdatedAt, queryClient])

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-48 w-full" />
      </div>
    )
  }

  if (isError || !report) {
    const notFound = error?.status === 404
    if (notFound) {
      return (
        <EmptyState
          icon={FileQuestion}
          title="Laporan tidak ditemukan"
          description="Pastikan nomor laporannya benar."
          action={
            <Link
              to="/santri/laporan-saya"
              className="font-semibold text-primary-hover hover:underline"
            >
              Kembali ke Laporan Saya
            </Link>
          }
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

  const toggleIdentity = (next) => {
    updateIdentity.mutate(next, {
      onError: (mutationError) =>
        toast.showToast(
          mutationError?.message ?? 'Gagal mengubah pengaturan nama.',
          'error',
        ),
    })
  }

  const handleDelete = async () => {
    try {
      await deleteReport.mutateAsync(id)
      toast.showToast('Laporan berhasil dihapus.', 'success')
      navigate('/santri/laporan-saya', { replace: true })
    } catch (err) {
      toast.showToast(err?.message ?? 'Gagal menghapus laporan.', 'error')
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <Link
        to="/santri/laporan-saya"
        className="inline-flex items-center gap-2 text-sm font-semibold text-primary-hover hover:underline"
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        Kembali ke Laporan Saya
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
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-border pt-3 text-xs text-body">
          <span>Dibuat {formatDateOnly(report.createdAt)}</span>
          <span className="inline-flex items-center gap-1 font-medium text-[#163b2f]">
            <Clock className="size-3.5 text-[#34744e]" />
            Target respon: Maksimal 24 jam kerja
          </span>
        </div>
        <p className="mt-3 rounded-2xl bg-white p-4" data-pre-wrap>
          {report.isi}
        </p>
      </Card>

      <IdentityRequestSantri report={report} />

      <Card className={`${DETAIL_CARD_SURFACE} p-5 sm:p-6`}>
        <Switch
          id="identity-toggle"
          label="Tampilkan namaku ke petugas"
          description={
            report.tampilkanIdentitas
              ? 'Pengurus dan pimpinan dapat melihat namamu sesuai pilihanmu.'
              : 'Pengurus dan pimpinan tidak dapat melihat namamu selama pilihan ini mati.'
          }
          checked={report.tampilkanIdentitas}
          disabled={updateIdentity.isPending}
          onChange={toggleIdentity}
        />
      </Card>

      <Card className={`${DETAIL_CARD_SURFACE} p-5 sm:p-6`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-[#163b2f]">Pengelolaan Laporan</h2>
            <p className="mt-0.5 text-xs text-body">
              {report.status === 'baru'
                ? 'Laporan ini masih baru dan belum diproses. Kamu masih bisa menghapusnya bila diperlukan.'
                : 'Laporan ini sudah diproses atau selesai sehingga tidak dapat dihapus demi keamanan dan riwayat penanganan.'}
            </p>
          </div>
          {report.status === 'baru' ? (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setDeleteOpen(true)}
              className="!text-[#ba4c30] !border-[#f0c6b8] hover:!bg-[#fff1e9]"
            >
              <Trash2 className="size-4" />
              Hapus Laporan
            </Button>
          ) : (
            <span className="rounded-full bg-band-1 px-3 py-1 text-xs font-semibold text-body">
              Tidak dapat dihapus (Sudah diproses)
            </span>
          )}
        </div>
      </Card>

      <ReportTrail id={id} createdAt={report.createdAt} />

      <Conversation id={id} viewer="santri" />

      <Modal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Hapus Laporan Ini?"
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeleteOpen(false)}>
              Batal
            </Button>
            <Button
              onClick={handleDelete}
              loading={deleteReport.isPending}
              className="!bg-[#ba4c30] text-white hover:!bg-[#9e3a20]"
            >
              Ya, Hapus Laporan
            </Button>
          </>
        }
      >
        <p className="text-sm text-navy">
          Apakah kamu yakin ingin menghapus laporan <strong>{report.noLaporan}</strong>?
        </p>
        <p className="mt-2 text-xs text-body">
          Laporan yang belum diproses petugas ini akan dihapus permanen dari sistem dan tidak dapat dipulihkan.
        </p>
      </Modal>
    </div>
  )
}