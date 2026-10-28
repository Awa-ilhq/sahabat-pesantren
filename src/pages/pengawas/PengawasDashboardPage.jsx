import {
  ClipboardList,
  Clock3,
  FileWarning,
  History,
  ShieldCheck,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import Card from '../../components/ui/Card'
import ErrorState from '../../components/ui/ErrorState'
import Skeleton from '../../components/ui/Skeleton'
import { useSummary } from '../../features/dashboard/hooks'
import { cn } from '../../lib/cn'

const SURFACE =
  '!border !border-[#e1e9e2] !shadow-[0_2px_10px_rgba(18,55,42,0.06)]'

const STATS = [
  {
    key: 'laporanBaru',
    label: 'Laporan baru',
    icon: ClipboardList,
    tone: 'bg-report-blue text-[#3156a5]',
  },
  {
    key: 'laporanSensitif',
    label: 'Menyangkut pimpinan',
    icon: FileWarning,
    tone: 'bg-report-coral text-danger',
  },
  {
    key: 'jumlahTerlambat',
    label: 'Laporan terlambat',
    icon: Clock3,
    tone: 'bg-report-coral text-danger',
  },
  {
    key: 'auditHariIni',
    label: 'Aktivitas hari ini',
    icon: History,
    tone: 'bg-report-yellow text-[#80600b]',
  },
  {
    key: 'totalLaporan',
    label: 'Total laporan',
    icon: ShieldCheck,
    tone: 'bg-report-green text-[#216b49]',
  },
]

export default function PengawasDashboardPage() {
  const { data, isLoading, isError, refetch } = useSummary()

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-8 w-56" />
        <div className="grid grid-cols-2 gap-3">
          {STATS.map((item) => (
            <Skeleton key={item.key} className="h-28 rounded-3xl" />
          ))}
        </div>
      </div>
    )
  }

  if (isError || !data) {
    return (
      <ErrorState
        title="Dashboard pengawas gagal dimuat"
        message="Coba muat ulang beberapa saat lagi."
        onRetry={refetch}
      />
    )
  }

  return (
    <div className="flex flex-col gap-5">
      <header>
        <span className="inline-flex rounded-full bg-[#dfeaff] px-3 py-1 text-[11px] font-bold text-[#3156a5]">
          Ruang pengawas
        </span>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-navy sm:text-4xl">
          Pengawasan
        </h1>
        <p className="mt-1 text-sm text-body">
          Pantau laporan yang menyangkut pimpinan dan jejak aktivitas sistem.
        </p>
      </header>

      <section
        aria-label="Ringkasan pengawasan"
        className="grid grid-cols-2 gap-3 sm:grid-cols-3"
      >
        {STATS.map(({ key, label, icon: Icon, tone }) => (
          <Card key={key} className={`${SURFACE} p-4`}>
            <span
              className={cn(
                'flex size-9 items-center justify-center rounded-xl',
                tone,
              )}
            >
              <Icon aria-hidden="true" className="size-5" />
            </span>
            <p className="mt-2 text-3xl font-extrabold leading-none text-navy">
              {data[key] ?? data.jumlahTerlambat ?? 0}
            </p>
            <p className="mt-1 text-xs font-semibold text-navy/80">{label}</p>
          </Card>
        ))}
      </section>

      <div className="grid gap-3 sm:grid-cols-2">
        <Link
          to="/dashboard/pengawas/laporan"
          className={`${SURFACE} rounded-3xl border bg-white p-5 transition hover:-translate-y-0.5`}
        >
          <h2 className="text-lg font-semibold text-navy">
            Laporan menyangkut pimpinan
          </h2>
          <p className="mt-1 text-sm text-body">
            Tinjau laporan sensitif yang tidak dapat diakses pengurus atau
            pimpinan.
          </p>
        </Link>
        <Link
          to="/dashboard/pengawas/audit"
          className={`${SURFACE} rounded-3xl border bg-white p-5 transition hover:-translate-y-0.5`}
        >
          <h2 className="text-lg font-semibold text-navy">Log audit</h2>
          <p className="mt-1 text-sm text-body">
            Lihat siapa mengakses laporan, mengubah status, atau membuka
            identitas pelapor.
          </p>
        </Link>
      </div>
    </div>
  )
}
