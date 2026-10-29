import {
  Bell,
  ChevronRight,
  FilePlus2,
  MessageCircle,
  RefreshCw,
  ShieldQuestion,
  AlertTriangle,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import EmptyState from '../components/ui/EmptyState'
import ErrorState from '../components/ui/ErrorState'
import Skeleton from '../components/ui/Skeleton'
import { useAuth } from '../features/auth/auth-context'
import {
  CategoryBadge,
  StatusBadge,
} from '../features/reports/components/badges'
import {
  useNotifications,
  useNotificationSummary,
} from '../features/notifications/hooks'
import { isLateReportNotificationVisible } from '../features/notifications/rules'
import { cn } from '../lib/cn'
import {
  ROLES,
  ROLE_LABELS,
  STATUS_LABELS,
  reportDetailPath,
} from '../lib/constants'
import { formatDateOnly } from '../lib/formatDate'

const EMPTY_ITEMS = []
const NOTIFICATION_CARD_SURFACE =
  '!border !border-[#e1e9e2] !shadow-[0_2px_10px_rgba(18,55,42,0.06)]'

const NOTIFICATION_META = {
  laporan_terlambat: {
    label: 'Peringatan keterlambatan',
    icon: AlertTriangle,
    iconClass: 'bg-[#ffddd1] text-danger',
  },
  laporan_baru: {
    label: 'Laporan baru',
    icon: FilePlus2,
    iconClass: 'bg-[#dfeaff] text-[#315d9e]',
  },
  pesan_baru: {
    label: 'Pesan baru',
    icon: MessageCircle,
    iconClass: 'bg-[#d9f0e1] text-[#31714d]',
  },
  status_diubah: {
    label: 'Status laporan berubah',
    icon: RefreshCw,
    iconClass: 'bg-[#fff0bd] text-[#735b12]',
  },
  permintaan_identitas: {
    label: 'Permintaan melihat identitas',
    icon: ShieldQuestion,
    iconClass: 'bg-[#ffddd1] text-[#a74831]',
  },
}

const FALLBACK_META = {
  label: 'Pembaruan',
  icon: Bell,
  iconClass: 'bg-band-1 text-body',
}

function descriptionFor(item, role) {
  if (item.tipe === 'laporan_terlambat') {
    return 'Laporan berstatus baru telah melewati batas waktu peninjauan.'
  }
  if (item.tipe === 'laporan_baru') {
    return 'Ada laporan baru yang masuk dan belum kamu buka.'
  }
  if (item.tipe === 'pesan_baru') {
    const from = item.pengirim ? ` dari ${item.pengirim}` : ''
    return role === ROLES.SANTRI
      ? `Ada pesan baru${from} pada laporanmu.`
      : `Ada pesan baru${from} pada laporan ini.`
  }
  if (item.tipe === 'status_diubah') {
    return `Status laporan sekarang ${
      STATUS_LABELS[item.statusBaru] ?? item.statusBaru ?? 'diperbarui'
    }.`
  }
  if (item.tipe === 'permintaan_identitas') {
    return `${item.pengirim ?? 'Pimpinan'} meminta izin melihat namamu.`
  }
  return 'Ada pembaruan pada laporan ini.'
}

export default function NotifikasiPage() {
  const { user } = useAuth()
  const { data, isLoading, isError, isFetching, refetch } = useNotifications()
  const { data: notificationSummary } = useNotificationSummary()

  const role = user?.role
  const items = (data?.items ?? EMPTY_ITEMS).filter((item) =>
    isLateReportNotificationVisible(item),
  )
  const total = Number(data?.meta?.total ?? items.length)
  const detailPath = (id) => reportDetailPath(role, id)

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="mb-2 inline-flex rounded-full bg-[#ffe8a3] px-3 py-1 text-[11px] font-bold text-[#12372a]">
            {ROLE_LABELS[role] ?? 'Pengguna'}
          </p>
          <h1 className="text-3xl font-extrabold tracking-tight text-navy sm:text-4xl">
            Notifikasi
          </h1>
          <p className="mt-1 text-sm text-body">
            Pembaruan yang belum kamu baca. Klik untuk membuka laporannya.
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          loading={isFetching}
          onClick={() => refetch()}
        >
          {isFetching ? null : (
            <RefreshCw aria-hidden="true" className="size-4" />
          )}
          Muat ulang
        </Button>
      </header>

      {isLoading ? (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-20 w-full rounded-3xl" />
          <Skeleton className="h-24 w-full rounded-3xl" />
          <Skeleton className="h-24 w-full rounded-3xl" />
        </div>
      ) : isError || !data ? (
        <ErrorState
          title="Notifikasi gagal dimuat"
          message="Coba muat ulang daftar notifikasi."
          onRetry={refetch}
        />
      ) : (
        <>
          <Card
            className={`${NOTIFICATION_CARD_SURFACE} flex flex-wrap items-center justify-between gap-4 p-5 sm:p-6`}
          >
            <div className="flex items-center gap-3">
              <span className="flex size-12 items-center justify-center rounded-2xl bg-[#ffd166] text-[#163b2f]">
                <Bell aria-hidden="true" className="size-6" />
              </span>
              <div>
                <p className="text-sm font-semibold text-body">
                  Pembaruan belum dibaca
                </p>
                <p className="text-3xl font-extrabold leading-none text-navy">
                  {total}
                </p>
              </div>
            </div>
            <p className="max-w-md text-sm text-body">
              {total > 0
                ? 'Buka laporan terkait untuk menandai notifikasi sudah dibaca.'
                : 'Semua pembaruan sudah kamu baca.'}
            </p>
          </Card>

          {role === ROLES.PENGAWAS ? (
            <Card className={`${NOTIFICATION_CARD_SURFACE} flex items-center gap-3 p-5`}>
              <span className="flex size-12 items-center justify-center rounded-2xl bg-[#ffddd1] text-danger">
                <AlertTriangle aria-hidden="true" className="size-6" />
              </span>
              <div>
                <p className="text-sm font-semibold text-body">Laporan terlambat</p>
                <p className="text-3xl font-extrabold leading-none text-navy">
                  {Number(notificationSummary?.laporanTerlambat ?? 0)}
                </p>
              </div>
            </Card>
          ) : null}

          {items.length ? (
            <ul className="flex flex-col gap-3">
              {items.map((item) => {
                const meta = NOTIFICATION_META[item.tipe] ?? FALLBACK_META
                const Icon = meta.icon
                return (
                  <li key={item.id}>
                    <Link
                      to={detailPath(item.laporanId)}
                      className="group flex items-start gap-3 rounded-2xl border border-[#e1e9e2] bg-white p-4 shadow-[0_2px_10px_rgba(18,55,42,0.06)] transition-all hover:-translate-y-0.5 hover:border-[#cbd9ce] hover:shadow-[0_4px_14px_rgba(18,55,42,0.08)]"
                    >
                      <span
                        className={cn(
                          'mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-2xl',
                          meta.iconClass,
                        )}
                      >
                        <Icon aria-hidden="true" className="size-5" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-extrabold text-[#163b2f]">
                            {meta.label}
                          </span>
                          {item.noLaporan ? (
                            <span className="text-xs font-bold text-[#718078]">
                              {item.noLaporan}
                            </span>
                          ) : null}
                        </span>
                        <span className="mt-1 block text-sm text-[#43574d]">
                          {descriptionFor(item, role)}
                        </span>
                        {item.preview ? (
                          <span
                            className="mt-1 line-clamp-2 block rounded-xl bg-band-1 px-3 py-2 text-xs text-navy"
                            data-pre-wrap
                          >
                            {item.preview}
                          </span>
                        ) : null}
                        <span className="mt-2 flex flex-wrap items-center gap-2">
                          {item.kategori ? (
                            <CategoryBadge kategori={item.kategori} />
                          ) : null}
                          {item.tipe === 'status_diubah' && item.statusBaru ? (
                            <StatusBadge status={item.statusBaru} />
                          ) : null}
                          <span className="text-[10px] text-[#718078]">
                            {formatDateOnly(item.waktu)}
                          </span>
                        </span>
                      </span>
                      <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-[#e9f4ed] text-[#315944] transition-colors group-hover:bg-[#d9ecdf]">
                        <ChevronRight aria-hidden="true" className="size-4" />
                      </span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          ) : (
            <EmptyState
              icon={Bell}
              title="Tidak ada notifikasi baru"
              description="Pembaruan baru akan muncul di sini saat ada laporan, pesan, atau permintaan identitas."
            />
          )}

          <p className="text-xs text-body">
            Notifikasi diperbarui otomatis setiap 30 detik. Membuka detail
            laporan atau percakapan akan menandainya sudah dibaca.
          </p>
        </>
      )}
    </div>
  )
}
