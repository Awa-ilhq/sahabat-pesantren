import { FileWarning, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import EmptyState from '../../components/ui/EmptyState'
import ErrorState from '../../components/ui/ErrorState'
import Pagination from '../../components/ui/Pagination'
import Skeleton from '../../components/ui/Skeleton'
import {
  CategoryBadge,
  SensitiveBadge,
  StatusBadge,
} from '../../features/reports/components/badges'
import { useStaffReports } from '../../features/reports/hooks'
import { PAGE_SIZE, ROLES, reportDetailPath, STATUSES } from '../../lib/constants'
import { displayReporter } from '../../lib/displayReporter'
import { formatDateOnly } from '../../lib/formatDate'
import { cn } from '../../lib/cn'

const ALL = ''

export default function SensitiveReportListPage() {
  const [status, setStatus] = useState(ALL)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const { data, isLoading, isError, refetch } = useStaffReports({
    menyangkutPimpinan: true,
  })
  const visible = useMemo(() => {
    const reports = data?.items ?? []
    const needle = search.trim().toLowerCase()
    return reports.filter((report) => {
      const matchesStatus = !status || report.status === status
      const matchesSearch =
        !needle ||
        [report.noLaporan, report.isi]
          .join(' ')
          .toLowerCase()
          .includes(needle)
      return matchesStatus && matchesSearch
    })
  }, [data, search, status])

  const lastPage = Math.max(1, Math.ceil(visible.length / PAGE_SIZE))
  const currentPage = Math.min(page, lastPage)
  const items = visible.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  )

  return (
    <div className="flex flex-col gap-4">
      <header>
        <span className="inline-flex rounded-full bg-[#dfeaff] px-3 py-1 text-[11px] font-bold text-[#3156a5]">
          Akses terbatas
        </span>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-navy sm:text-4xl">
          Laporan sensitif
        </h1>
        <p className="mt-1 text-sm text-body">
          Laporan yang menyangkut pimpinan hanya dapat dibaca oleh pengawas.
        </p>
      </header>

      <div className="flex flex-col gap-3">
        <label className="relative block">
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
              setPage(1)
            }}
            placeholder="Cari kode atau isi laporan"
            className="h-12 w-full rounded-full border border-line bg-white pl-11 pr-4 text-sm text-navy shadow-sm outline-none transition focus:border-primary focus:ring-3 focus:ring-primary/20"
          />
        </label>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {[{ value: ALL, label: 'Semua' }, ...STATUSES].map((item) => (
            <button
              key={item.value || 'all'}
              type="button"
              aria-pressed={status === item.value}
              onClick={() => {
                setStatus(item.value)
                setPage(1)
              }}
              className={cn(
                'min-h-10 shrink-0 rounded-full px-4 text-xs font-semibold transition-colors',
                status === item.value
                  ? 'bg-primary text-white'
                  : 'bg-white text-navy shadow-sm hover:bg-mint-50',
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {isError ? (
        <ErrorState
          message="Laporan sensitif gagal dimuat."
          onRetry={refetch}
        />
      ) : isLoading ? (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-24 rounded-3xl" />
          <Skeleton className="h-24 rounded-3xl" />
        </div>
      ) : items.length ? (
        <>
          <p className="text-sm text-body">{visible.length} laporan</p>
          <ul className="flex flex-col gap-3">
            {items.map((report) => (
              <li key={report.id}>
                <Link
                  to={reportDetailPath(ROLES.PENGAWAS, report.id)}
                  className="block rounded-3xl bg-white p-4 shadow-[0_8px_24px_rgba(18,55,42,0.06)] transition hover:-translate-y-0.5 sm:p-5"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-sans text-base font-extrabold text-navy">
                      {report.noLaporan}
                    </span>
                    <StatusBadge status={report.status} />
                    <SensitiveBadge />
                  </div>
                  <p className="mt-2 line-clamp-2 text-sm text-navy" data-pre-wrap>
                    {report.isi}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <CategoryBadge kategori={report.kategori} />
                    <span className="text-xs text-body">
                      {displayReporter(report, ROLES.PENGAWAS)}
                    </span>
                    <span className="text-xs text-body">
                      {formatDateOnly(report.createdAt)}
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
          <Pagination
            page={currentPage}
            lastPage={lastPage}
            onChange={setPage}
          />
        </>
      ) : (
        <EmptyState
          icon={FileWarning}
          title="Belum ada laporan sensitif"
          description="Laporan yang ditandai menyangkut pimpinan akan tampil di sini."
        />
      )}
    </div>
  )
}
