import {
  AlertTriangle,
  CheckCircle2,
  CircleDot,
  FileText,
  Forward,
  Hourglass,
  Inbox,
  Search,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import EmptyState from '../../components/ui/EmptyState'
import ErrorState from '../../components/ui/ErrorState'
import Pagination from '../../components/ui/Pagination'
import Select from '../../components/ui/Select'
import Skeleton from '../../components/ui/Skeleton'
import { useAuth } from '../../features/auth/auth-context'
import {
  CategoryBadge,
  LateBadge,
  StatusBadge,
} from '../../features/reports/components/badges'
import { useStaffReports } from '../../features/reports/hooks'
import {
  CATEGORIES,
  PAGE_SIZE,
  STATUSES,
  reportDetailPath,
} from '../../lib/constants'
import { displayReporter } from '../../lib/displayReporter'
import { formatDateOnly } from '../../lib/formatDate'
import { isReportLate, countLateReports } from '../../lib/reportDeadline'
import { cn } from '../../lib/cn'
import { canEscalateReport, isReportLocked } from '../../features/reports/escalation'

const ALL = ''
const EMPTY_REPORTS = []
const STATUS_FILTERS = [
  { value: ALL, label: 'Semua' },
  ...STATUSES.map(({ value, label }) => ({ value, label })),
]
const CATEGORY_OPTIONS = [
  { value: ALL, label: 'Semua kategori' },
  ...CATEGORIES.map(({ value, label }) => ({ value, label })),
]
const STATUS_SUMMARY = [
  { status: 'baru', label: 'Baru', icon: CircleDot, tone: 'blue' },
  { status: 'diproses', label: 'Diproses', icon: Hourglass, tone: 'yellow' },
  { status: 'overdue', label: 'Lewat batas', icon: AlertTriangle, tone: 'coral' },
  { status: 'selesai', label: 'Selesai', icon: CheckCircle2, tone: 'green' },
]

function dueDescription(report) {
  if (isReportLate(report)) return 'Lewat batas'
  if (report.status === 'selesai') return 'Selesai'
  if (report.status === 'diproses') return 'Sedang ditangani'
  return 'Menunggu peninjauan'
}

function SummaryCard({ icon: Icon, label, value, tone }) {
  const toneClasses = {
    blue: 'bg-report-blue',
    yellow: 'bg-report-yellow',
    coral: 'bg-report-coral',
    green: 'bg-report-green',
  }
  const iconClasses = {
    blue: 'text-[#3156a5]',
    yellow: 'text-[#80600b]',
    coral: 'text-danger',
    green: 'text-[#216b49]',
  }

  return (
    <div
      className={cn(
        'min-h-28 rounded-[20px] p-3 shadow-[0_8px_24px_rgba(18,55,42,0.05)]',
        toneClasses[tone],
      )}
    >
      <span className="flex size-8 items-center justify-center rounded-xl bg-white/80">
        <Icon aria-hidden="true" className={cn('size-5', iconClasses[tone])} />
      </span>
      <p className="mt-2 text-3xl font-extrabold leading-none text-navy">{value}</p>
      <p className="mt-1 text-xs font-semibold leading-none text-navy/80">{label}</p>
    </div>
  )
}

export default function StaffReportListPage() {
  const { user } = useAuth()
  const [filters, setFilters] = useState({
    page: 1,
    status: ALL,
    kategori: ALL,
  })
  const [search, setSearch] = useState('')
  const { data, isLoading, isError, refetch, isFetching } =
    useStaffReports({})
  const reports = data?.items ?? EMPTY_REPORTS
  const visibleReports = useMemo(() => {
    const needle = search.trim().toLocaleLowerCase('id')
    return reports.filter((report) => {
      const matchesStatus = !filters.status || report.status === filters.status
      const matchesCategory =
        !filters.kategori || report.kategori === filters.kategori
      const matchesSearch =
        !needle ||
        [
          report.noLaporan,
          report.isi,
          displayReporter(report, user?.role),
        ]
          .join(' ')
          .toLocaleLowerCase('id')
          .includes(needle)
      return matchesStatus && matchesCategory && matchesSearch
    })
  }, [filters.kategori, filters.status, reports, search, user?.role])
  const lastPage = Math.max(1, Math.ceil(visibleReports.length / PAGE_SIZE))
  const page = Math.min(filters.page, lastPage)
  const pageReports = visibleReports.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE,
  )
  const overdueCount = countLateReports(reports)
  const summaries = [
    reports.filter((report) => report.status === 'baru').length,
    reports.filter((report) => report.status === 'diproses').length,
    overdueCount,
    reports.filter((report) => report.status === 'selesai').length,
  ]
  const update = (patch) =>
    setFilters((current) => ({ ...current, ...patch, page: 1 }))
  const hasFilters = Boolean(filters.status || filters.kategori || search.trim())

  return (
    <div className="flex flex-col gap-4">
      <header>
        <span className="inline-flex rounded-full bg-[#ffe8a3] px-3 py-1 text-[11px] font-bold text-[#12372a]">
          Halo, {user?.name}
        </span>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-navy sm:text-4xl">
          Daftar laporan
        </h1>
        <p className="mt-1 text-sm text-body">
          Kelola dan tindak lanjuti laporan yang masuk.
        </p>
      </header>

      {isLoading ? (
        <section
          aria-label="Ringkasan status laporan"
          className="grid grid-cols-2 gap-3 md:grid-cols-4"
        >
          {STATUS_SUMMARY.map((item) => (
            <Skeleton key={item.status} className="h-28 rounded-3xl" />
          ))}
        </section>
      ) : null}

      {!isLoading && !isError ? (
        <section
          aria-label="Ringkasan status laporan"
          className="grid grid-cols-2 gap-3 md:grid-cols-4"
        >
          {STATUS_SUMMARY.map((item, index) => (
            <SummaryCard
              key={item.status}
              icon={item.icon}
              label={item.label}
              value={summaries[index]}
              tone={item.tone}
            />
          ))}
        </section>
      ) : null}

      <section
        aria-label="Cari dan saring laporan"
        className="flex flex-col gap-3"
      >
        <label className="relative block min-w-0">
          <span className="sr-only">Cari laporan</span>
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-body"
          />
          <input
            type="search"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value)
              setFilters((current) => ({ ...current, page: 1 }))
            }}
            placeholder="Cari kode laporan, isi, atau pelapor"
            className="h-12 w-full rounded-full border border-line bg-white pl-11 pr-4 text-sm text-navy shadow-sm outline-none transition focus:border-primary focus:ring-3 focus:ring-primary/20"
          />
        </label>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div
            role="group"
            aria-label="Filter status laporan"
            className="flex gap-2 overflow-x-auto pb-1"
          >
            {STATUS_FILTERS.map((item) => (
              <button
                key={item.value || 'all'}
                type="button"
                aria-pressed={filters.status === item.value}
                onClick={() => update({ status: item.value })}
                className={cn(
                  'min-h-10 shrink-0 rounded-full px-4 text-xs font-semibold transition-colors focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-primary',
                  filters.status === item.value
                    ? 'bg-primary text-white shadow-[0_5px_14px_rgba(18,55,42,0.18)]'
                    : 'bg-white text-navy shadow-sm hover:bg-mint-50',
                )}
              >
                {item.label}
              </button>
            ))}
          </div>
          <Select
            id="filter-kategori"
            label="Kategori"
            options={CATEGORY_OPTIONS}
            value={filters.kategori}
            className="h-10 rounded-full py-0 text-sm sm:w-64"
            onChange={(event) => update({ kategori: event.target.value })}
          />
        </div>
      </section>

      {isError ? (
        <ErrorState
          message="Daftar laporan gagal dimuat. Coba lagi sebentar."
          onRetry={refetch}
        />
      ) : isLoading ? (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-24 w-full rounded-3xl" />
          <Skeleton className="h-24 w-full rounded-3xl" />
          <Skeleton className="h-24 w-full rounded-3xl" />
        </div>
      ) : pageReports.length ? (
        <>
          <p className="text-sm text-body" aria-live="polite">
            {visibleReports.length} laporan
            {isFetching ? ' · memuat ulang…' : ''}
          </p>
          <ul className="flex flex-col gap-3">
            {pageReports.map((report) => {
              const overdue = isReportLate(report)
              return (
                <li key={report.id}>
                  <Link
                    to={reportDetailPath(user?.role, report.id)}
                    className={cn(
                      'grid gap-4 rounded-3xl p-4 shadow-[0_8px_24px_rgba(18,55,42,0.06)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(18,55,42,0.1)] sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:p-5',
                      overdue ? 'bg-[#fff2eb]' : 'bg-white',
                    )}
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-sans text-base font-extrabold text-navy">
                          {report.noLaporan}
                        </span>
                        {overdue ? <LateBadge /> : null}
                        <StatusBadge status={report.status} />
                        {isReportLocked(report) ? (
                          <span className="rounded-full bg-[#fbe9e7] px-2.5 py-1 text-[10px] font-bold text-danger">
                            Terkunci
                          </span>
                        ) : null}
                        {report.edited === true ? (
                          <span className="rounded-full bg-[#edf0ed] px-2.5 py-1 text-[10px] font-bold text-[#536158]">
                            Diedit
                          </span>
                        ) : null}
                      </div>
                      <p
                        className="mt-2 line-clamp-2 text-sm text-navy"
                        data-pre-wrap
                      >
                        {report.isi}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <CategoryBadge kategori={report.kategori} />
                        <span className="text-xs text-body">
                          {displayReporter(report, user?.role)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs sm:min-w-32 sm:flex-col sm:items-end">
                      <span
                        className={cn(
                          'font-bold',
                          overdue ? 'text-danger' : 'text-navy',
                        )}
                      >
                        {dueDescription(report)}
                      </span>
                      <span className="text-body">
                        {formatDateOnly(report.createdAt)}
                      </span>
                      {canEscalateReport(user?.role, report) ? (
                        <span className="mt-1 inline-flex min-h-10 items-center justify-center gap-1.5 rounded-full border border-primary/30 bg-white px-4 py-2 text-sm font-bold text-primary">
                          <Forward aria-hidden="true" className="size-4" />
                          Eskalasi
                        </span>
                      ) : null}
                    </div>
                  </Link>
                </li>
              )
            })}
          </ul>
          <Pagination
            page={page}
            lastPage={lastPage}
            onChange={(nextPage) =>
              setFilters((current) => ({ ...current, page: nextPage }))
            }
          />
        </>
      ) : (
        <EmptyState
          icon={Inbox}
          title={hasFilters ? 'Laporan tidak ditemukan' : 'Belum ada laporan'}
          description={
            hasFilters
              ? 'Tidak ada laporan yang cocok dengan filter ini.'
              : 'Laporan yang masuk akan tampil di sini.'
          }
          action={
            hasFilters ? (
              <button
                type="button"
                onClick={() => {
                  setSearch('')
                  setFilters({ page: 1, status: ALL, kategori: ALL })
                }}
                className="font-semibold text-primary-hover hover:underline"
              >
                Bersihkan filter
              </button>
            ) : (
              <FileText aria-hidden="true" className="size-5 text-body" />
            )
          }
        />
      )}
    </div>
  )
}
