import {
  BarChart3,
  ClipboardList,
  Sparkles,
  TrendingUp,
  UsersRound,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import ErrorState from '../../components/ui/ErrorState'
import Skeleton from '../../components/ui/Skeleton'
import { useAiSummary, useSummary } from '../../features/dashboard/hooks'
import { StatusBadge } from '../../features/reports/components/badges'
import {
  CATEGORIES,
  CATEGORY_LABELS,
  STATUSES,
} from '../../lib/constants'
import { cn } from '../../lib/cn'

function StatCard({ icon: Icon, label, value, tone = 'default', hint }) {
  return (
    <div className={cn(
      'rounded-[20px] border border-[#e1e9e2] p-4 shadow-[0_2px_10px_rgba(18,55,42,0.06)]',
      tone === 'danger' ? 'bg-report-coral' : 'bg-report-blue',
    )}>
      <div className="flex flex-col items-start">
        <span
          className={cn(
            'flex size-9 items-center justify-center rounded-xl bg-white/80',
            tone === 'danger'
              ? 'text-danger'
              : 'text-[#3156a5]',
          )}
        >
          <Icon aria-hidden="true" className="size-5" />
        </span>
        <div>
          <p className="mt-2 text-3xl font-extrabold leading-none text-navy">{value}</p>
          <p className="mt-1 text-xs font-semibold text-navy/80">{label}</p>
        </div>
      </div>
      {hint ? <p className="mt-2 text-xs text-navy/70">{hint}</p> : null}
    </div>
  )
}

function Breakdown({ title, entries }) {
  const total = entries.reduce((sum, [, count]) => sum + count, 0)
  return (
    <div className="rounded-3xl border border-[#e1e9e2] bg-white p-5 shadow-[0_2px_10px_rgba(18,55,42,0.06)]">
      <h2 className="text-lg font-semibold text-navy">{title}</h2>
      <ul className="mt-3 flex flex-col gap-3">
        {entries.map(([key, count]) => {
          const percent = total ? Math.round((count / total) * 100) : 0
          return (
            <li key={key}>
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-navy">{key}</span>
                <span className="text-body">{count}</span>
              </div>
              <div className="mt-1 h-2 overflow-hidden rounded-full bg-[#e5eee7]">
                <div
                  className="h-full rounded-full bg-primary-hover"
                  style={{ width: `${percent}%` }}
                />
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

export default function DashboardPage() {
  const { data, isLoading, isError, refetch } = useSummary()
  const {
    data: aiData,
    isLoading: aiLoading,
    isError: aiError,
    refetch: refetchAi,
  } = useAiSummary({ periode: 7 })

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 sm:grid-cols-2">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
        <Skeleton className="h-64" />
      </div>
    )
  }

  if (isError || !data) {
    return (
      <ErrorState
        title="Ringkasan gagal dimuat"
        message="Coba muat ulang dashboard."
        onRetry={refetch}
      />
    )
  }

  const statusEntries = STATUSES.map((status) => ({
    value: status.value,
    count: data.perStatus[status.value] ?? 0,
  }))

  const kategoriEntries = CATEGORIES.map((category) => [
    CATEGORY_LABELS[category.value],
    data.perKategori[category.value] ?? 0,
  ]).filter(([, count]) => count > 0)

  return (
    <div className="flex flex-col gap-5">
      <header>
        <p className="mb-2 inline-flex rounded-full bg-[#ffe8a3] px-3 py-1 text-[11px] font-bold text-[#12372a]">
          Dashboard pimpinan
        </p>
        <h1 className="text-3xl font-extrabold">Dashboard</h1>
        <p className="mt-1 text-body">
          Gambaran umum laporan dan status penanganannya.
        </p>
      </header>

      <div className="grid grid-cols-2 gap-3">
        <StatCard
          icon={UsersRound}
          label="Total santri"
          value={data.totalSantri}
          hint="Seluruh santri yang terdaftar."
        />
        <StatCard
          icon={ClipboardList}
          label="Total laporan"
          value={data.totalLaporan}
          hint="Seluruh laporan yang tercatat."
        />
      </div>

      <div className="grid gap-4">
        <div className="rounded-3xl border border-[#e1e9e2] bg-white p-5 shadow-[0_2px_10px_rgba(18,55,42,0.06)]">
          <div className="flex items-center gap-2">
            <BarChart3 aria-hidden="true" className="size-5 text-primary" />
            <h2 className="text-lg font-semibold text-navy">Per status</h2>
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            {statusEntries.map((entry) => (
              <div
                key={entry.value}
                className="flex items-center justify-between gap-3 rounded-2xl border border-[#e1e9e2] bg-band-1 p-4"
              >
                <StatusBadge status={entry.value} />
                <span className="text-lg font-semibold text-navy">
                  {entry.count}
                </span>
              </div>
            ))}
          </div>
          <Link
            to="/petugas"
            className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary-hover hover:underline"
          >
            <TrendingUp aria-hidden="true" className="size-4" />
            Lihat semua laporan
          </Link>
        </div>
      </div>

      <div className="rounded-3xl border border-[#e1e9e2] bg-white p-5 shadow-[0_2px_10px_rgba(18,55,42,0.06)]">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Sparkles aria-hidden="true" className="size-5 text-primary" />
            <h2 className="text-lg font-semibold text-navy">Ringkasan AI</h2>
          </div>
          {aiData?.dari_cache ? (
            <span className="rounded-full bg-[#edf6ef] px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-primary-hover">
              cache
            </span>
          ) : null}
        </div>

        {aiLoading ? (
          <Skeleton className="mt-4 h-20 w-full" />
        ) : aiError ? (
          <div className="mt-4 rounded-2xl border border-[#f1d5d5] bg-[#fff5f5] p-4 text-sm text-danger">
            Ringkasan AI gagal dimuat.
            <button
              type="button"
              onClick={() => refetchAi()}
              className="ml-2 font-semibold text-danger underline underline-offset-2"
            >
              Coba lagi
            </button>
          </div>
        ) : aiData ? (
          <div className="mt-4 space-y-3">
            <p className="text-sm leading-6 text-navy">
              {aiData.ringkasan}
            </p>
            {Array.isArray(aiData.poin) && aiData.poin.length ? (
              <ul className="list-disc space-y-1 pl-5 text-sm text-body">
                {aiData.poin.map((item, index) => (
                  <li key={`${item}-${index}`}>{item}</li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}
      </div>

      {kategoriEntries.length ? (
        <Breakdown title="Per kategori" entries={kategoriEntries} />
      ) : null}
    </div>
  )
}
