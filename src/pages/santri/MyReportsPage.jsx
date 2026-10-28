import {
  CheckCircle2,
  ChevronRight,
  CircleDot,
  Clock3,
  FileText,
  Plus,
  RefreshCw,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Badge from '../../components/ui/Badge'
import ButtonLink from '../../components/ui/ButtonLink'
import EmptyState from '../../components/ui/EmptyState'
import ErrorState from '../../components/ui/ErrorState'
import Input from '../../components/ui/Input'
import Pagination from '../../components/ui/Pagination'
import Select from '../../components/ui/Select'
import Skeleton from '../../components/ui/Skeleton'
import { useAuth } from '../../features/auth/auth-context'
import { useMyReports } from '../../features/reports/hooks'
import {
  CATEGORIES,
  CATEGORY_LABELS,
  PAGE_SIZE,
  STATUSES,
} from '../../lib/constants'
import { formatDateOnly } from '../../lib/formatDate'

const ALL = ''
const EMPTY_REPORTS = []
const FILTER_CATEGORIES = [
  { value: ALL, label: 'Semua kategori' },
  ...CATEGORIES.map(({ value, label }) => ({ value, label })),
]
const STATUS_FILTERS = [
  { value: ALL, label: 'Semua' },
  ...STATUSES.map(({ value, label }) => ({ value, label })),
]
const STATUS_META = {
  baru: {
    label: 'Baru',
    icon: CircleDot,
    className: 'bg-[#dfeaff] text-[#315d9e]',
  },
  diproses: {
    label: 'Diproses',
    icon: RefreshCw,
    className: 'bg-[#fff0bd] text-[#735b12]',
  },
  selesai: {
    label: 'Selesai',
    icon: CheckCircle2,
    className: 'bg-[#d9f0e1] text-[#31714d]',
  },
}
const CATEGORY_CLASS_NAMES = {
  perundungan: 'bg-[#e8defd] text-[#60469c]',
  kekerasan_fisik: 'bg-[#ffddd1] text-[#a74831]',
  kekerasan_verbal: 'bg-[#fff0bd] text-[#755c10]',
  masalah_pengurus: 'bg-[#dfeaff] text-[#315d9e]',
  masalah_pribadi: 'bg-[#d9f0e1] text-[#31714d]',
  lainnya: 'bg-[#edf0ed] text-[#536158]',
}

const countStatus = (reports, status) =>
  reports.filter((report) => report.status === status).length

function StatusPill({ status }) {
  const meta = STATUS_META[status] ?? {
    label: status,
    icon: CircleDot,
    className: 'bg-[#edf0ed] text-[#536158]',
  }
  const Icon = meta.icon

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold ${meta.className}`}
    >
      <Icon aria-hidden="true" className="size-3" />
      {meta.label}
    </span>
  )
}

export default function MyReportsPage() {
  const { user } = useAuth()
  const [filters, setFilters] = useState({
    page: 1,
    status: ALL,
    kategori: ALL,
    kodeLaporan: '',
  })
  const { data, isLoading, isError, refetch } = useMyReports()
  const reports = data?.items ?? EMPTY_REPORTS
  const filteredReports = useMemo(() => {
    const code = filters.kodeLaporan.trim().toLocaleLowerCase('id')
    return reports.filter(
      (report) =>
        (!filters.status || report.status === filters.status) &&
        (!filters.kategori || report.kategori === filters.kategori) &&
        (!code || String(report.noLaporan ?? '').toLocaleLowerCase('id').includes(code)),
    )
  }, [filters.kategori, filters.kodeLaporan, filters.status, reports])
  const lastPage = Math.max(1, Math.ceil(filteredReports.length / PAGE_SIZE))
  const page = Math.min(filters.page, lastPage)
  const pageReports = filteredReports.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE,
  )
  const hasFilters = Boolean(
    filters.status || filters.kategori || filters.kodeLaporan.trim(),
  )
  const updateFilters = (patch) =>
    setFilters((current) => ({ ...current, ...patch, page: 1 }))
  const stats = [
    {
      label: 'Laporanku',
      value: reports.length,
      icon: FileText,
      className: 'bg-[#edf0ed]',
      iconColor: 'text-[#536158]',
    },
    {
      label: 'Menunggu',
      value: countStatus(reports, 'baru'),
      icon: Clock3,
      className: 'bg-[#dfeaff]',
      iconColor: 'text-[#315d9e]',
    },
    {
      label: 'Diproses',
      value: countStatus(reports, 'diproses'),
      icon: RefreshCw,
      className: 'bg-[#fff0bd]',
      iconColor: 'text-[#735b12]',
    },
    {
      label: 'Selesai',
      value: countStatus(reports, 'selesai'),
      icon: CheckCircle2,
      className: 'bg-[#d9f0e1]',
      iconColor: 'text-[#31714d]',
    },
  ]

  return (
    <div className="w-full">
      <header className="mb-6">
        <span className="inline-flex rounded-full bg-[#ffe99e] px-3 py-1 text-[11px] font-semibold text-[#163b2f]">
          Halo, {user?.name}
        </span>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-[#12372a] sm:text-4xl">
              Laporan{' '}
              <span className="underline decoration-[#ffd166] decoration-4 underline-offset-[-2px]">
                saya
              </span>
            </h1>
            <p className="mt-2 text-sm text-[#718078]">
              Pantau status dan balasan petugas untuk laporan yang kamu buat.
            </p>
          </div>
          <ButtonLink
            to="/santri/buat-laporan"
            className="!min-h-11 !bg-[#0d352a] !px-5 !text-xs !shadow-[0_8px_20px_rgba(13,53,42,0.2)]"
          >
            <Plus aria-hidden="true" className="size-4" />
            Buat laporan
          </ButtonLink>
        </div>
      </header>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {stats.map((stat) => (
            <Skeleton key={stat.label} className="h-32 w-full" />
          ))}
        </div>
      ) : isError ? (
        <ErrorState
          message="Laporanmu gagal dimuat. Coba lagi sebentar."
          onRetry={refetch}
        />
      ) : (
        <>
          <section
            aria-label="Ringkasan laporan"
            className="grid grid-cols-2 gap-3 sm:grid-cols-4"
          >
            {stats.map(({ label, value, icon: Icon, className, iconColor }) => (
              <article
                key={label}
                className={`min-h-32 rounded-2xl border border-[#e1e9e2] p-4 shadow-[0_2px_10px_rgba(18,55,42,0.06)] ${className}`}
              >
                <span className="flex size-8 items-center justify-center rounded-lg bg-white/80">
                  <Icon aria-hidden="true" className={`size-4 ${iconColor}`} />
                </span>
                <p className="mt-2 text-2xl font-extrabold leading-none text-[#12372a]">
                  {value}
                </p>
                <p className="mt-2 text-xs font-medium text-[#536158]">{label}</p>
              </article>
            ))}
          </section>

          <section
            aria-label="Filter laporan"
            className="mt-5 flex flex-col gap-3"
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                id="my-reports-code-filter"
                label="Kode laporan"
                placeholder="Cari kode laporan"
                autoComplete="off"
                value={filters.kodeLaporan}
                onChange={(event) =>
                  updateFilters({ kodeLaporan: event.target.value })
                }
              />
              <Select
                id="my-reports-category-filter"
                label="Kategori"
                options={FILTER_CATEGORIES}
                value={filters.kategori}
                onChange={(event) =>
                  updateFilters({ kategori: event.target.value })
                }
              />
            </div>
            <div
              role="group"
              aria-label="Filter status laporan"
              className="flex flex-wrap gap-2"
            >
              {STATUS_FILTERS.map(({ value, label }) => (
                <button
                  key={value || 'all'}
                  type="button"
                  aria-pressed={filters.status === value}
                  onClick={() => updateFilters({ status: value })}
                  className={`min-h-10 rounded-full px-4 text-xs font-semibold shadow-[0_5px_14px_rgba(35,69,48,0.05)] transition-colors ${
                    filters.status === value
                      ? 'bg-[#0d352a] text-white'
                      : 'bg-white text-[#385347] hover:bg-[#e4eee7]'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </section>

          <p className="mt-4 text-sm text-body" aria-live="polite">
            {filteredReports.length} laporan
          </p>
          {pageReports.length ? (
            <>
              <ul className="mt-3 flex flex-col gap-3">
                {pageReports.map((report) => {
                  const hasIdentityRequest =
                    report.permintaanIdentitas?.status === 'menunggu'
                  const categoryClassName =
                    CATEGORY_CLASS_NAMES[report.kategori] ??
                    'bg-[#edf0ed] text-[#536158]'
                  return (
                    <li key={report.id}>
                      <Link
                        to={`/santri/laporan/${report.id}`}
                        className={`group flex items-center justify-between gap-3 rounded-2xl border border-[#e1e9e2] p-4 shadow-[0_2px_10px_rgba(18,55,42,0.06)] transition-all hover:-translate-y-0.5 hover:border-[#cbd9ce] hover:shadow-[0_4px_14px_rgba(18,55,42,0.08)] ${
                          hasIdentityRequest ? 'bg-[#fff9e5]' : 'bg-white'
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-extrabold text-[#163b2f]">
                              {report.noLaporan}
                            </span>
                            <StatusPill status={report.status} />
                            {hasIdentityRequest ? (
                              <Badge className="!border-0 !bg-[#0d352a] !px-2.5 !py-1 !text-[10px] !text-[#ffd166]">
                                Ada permintaan untukmu
                              </Badge>
                            ) : null}
                          </div>
                          <p
                            className="mt-2 line-clamp-2 text-sm leading-5 text-[#43574d]"
                            data-pre-wrap
                          >
                            {report.isi}
                          </p>
                          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                            <span
                              className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${categoryClassName}`}
                            >
                              {CATEGORY_LABELS[report.kategori] ?? report.kategori}
                            </span>
                            <span className="text-[10px] text-[#718078]">
                              Dibuat {formatDateOnly(report.createdAt)} {report.status === 'baru' ? '· Respon maks. 24 jam' : ''}
                            </span>
                          </div>
                        </div>
                        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#e9f4ed] text-[#315944] transition-colors group-hover:bg-[#d9ecdf]">
                          <ChevronRight aria-hidden="true" className="size-4" />
                        </span>
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
            <div className="mt-4">
              <EmptyState
                icon={FileText}
                title={hasFilters ? 'Laporan tidak ditemukan' : 'Belum ada laporan'}
                description={
                  hasFilters
                    ? 'Tidak ada laporan yang cocok dengan filter ini.'
                    : 'Saat kamu siap, kamu bisa membuat laporan pertamamu dengan tenang.'
                }
                action={
                  hasFilters ? (
                    <button
                      type="button"
                      onClick={() =>
                        setFilters({
                          page: 1,
                          status: ALL,
                          kategori: ALL,
                          kodeLaporan: '',
                        })
                      }
                      className="font-semibold text-primary-hover hover:underline"
                    >
                      Bersihkan filter
                    </button>
                  ) : (
                    <ButtonLink to="/santri/buat-laporan">
                      Buat laporan
                    </ButtonLink>
                  )
                }
              />
            </div>
          )}
        </>
      )}
    </div>
  )
}
