import { History, Search } from 'lucide-react'
import { useDeferredValue, useState } from 'react'
import EmptyState from '../../components/ui/EmptyState'
import ErrorState from '../../components/ui/ErrorState'
import Pagination from '../../components/ui/Pagination'
import Skeleton from '../../components/ui/Skeleton'
import { useAuth } from '../../features/auth/auth-context'
import { useAuditLogs } from '../../features/audit/hooks'
import {
  AUDIT_ACTION_LABELS,
  AUDIT_ACTION_OPTIONS,
} from '../../lib/constants'
import { formatDateTime } from '../../lib/formatDate'

export default function AuditLogPage() {
  const { user } = useAuth()
  const ownOnly = user?.role === 'pengurus'
  const [query, setQuery] = useState('')
  const [action, setAction] = useState('')
  const [page, setPage] = useState(1)
  const q = useDeferredValue(query)

  const { data, isLoading, isError, isFetching, refetch } = useAuditLogs({
    q: q.trim() || undefined,
    action: action || undefined,
    page,
  })
  const items = data?.items ?? []
  const meta = data?.meta

  return (
    <div className="flex flex-col gap-4">
      <header>
        <span className="inline-flex rounded-full bg-[#dfeaff] px-3 py-1 text-[11px] font-bold text-[#3156a5]">
          Jejak aktivitas
        </span>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-navy sm:text-4xl">
          {ownOnly ? 'Aktivitas saya' : 'Log audit'}
        </h1>
        <p className="mt-1 text-sm text-body">
          {ownOnly
            ? 'Catatan aksimu pada laporan. Hanya bisa dibaca, tidak bisa diubah.'
            : 'Catatan siapa mengakses laporan dan mengubah data penting.'}
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_12rem] sm:items-center">
        <label className="relative block">
          <span className="sr-only">Cari log</span>
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-body"
          />
          <input
            type="search"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value)
              setPage(1)
            }}
            placeholder="Cari aktor, laporan, atau keterangan"
            className="h-12 w-full rounded-full border border-line bg-white pl-11 pr-4 text-sm text-navy shadow-sm outline-none transition focus:border-primary focus:ring-3 focus:ring-primary/20"
          />
        </label>

        <div className="relative">
          <label htmlFor="audit-action" className="sr-only">
            Aksi
          </label>
          <select
            id="audit-action"
            value={action}
            onChange={(event) => {
              setAction(event.target.value)
              setPage(1)
            }}
            className="h-12 w-full appearance-none rounded-full border border-line bg-white px-4 pr-10 text-sm text-navy shadow-sm transition focus:border-primary focus:outline-none focus:ring-3 focus:ring-primary/20"
          >
            {AUDIT_ACTION_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <svg
            aria-hidden="true"
            viewBox="0 0 20 20"
            fill="none"
            className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-body"
          >
            <path d="M5 7.5 10 12.5 15 7.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>

      {isError ? (
        <ErrorState message="Log audit gagal dimuat." onRetry={refetch} />
      ) : isLoading ? (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-24 rounded-3xl" />
          <Skeleton className="h-24 rounded-3xl" />
        </div>
      ) : items.length ? (
        <>
          <p className="text-sm text-body" aria-live="polite">
            {meta?.total ?? items.length} aktivitas
            {isFetching ? ' · memuat ulang…' : ''}
          </p>
          <ul className="flex flex-col gap-3">
            {items.map((log) => (
              <li
                key={log.id}
                className="rounded-3xl border border-[#dfe7df] bg-white p-4 shadow-[0_4px_12px_rgba(18,55,42,0.04)]"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold text-navy">
                    {AUDIT_ACTION_LABELS[log.aksi] ?? log.aksi ?? 'Aktivitas'}
                  </p>
                  <span className="text-xs text-body">
                    {formatDateTime(log.waktu)}
                  </span>
                </div>
                <p className="mt-1 text-sm text-navy">
                  {log.aktor}
                  {log.aktorRole ? ` · ${log.aktorRole}` : ''}
                </p>
                {log.target ? (
                  <p className="mt-1 text-sm text-body">Target: {log.target}</p>
                ) : null}
                {log.detail ? (
                  <p className="mt-1 text-sm text-body" data-pre-wrap>
                    {log.detail}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
          <Pagination
            page={meta?.currentPage ?? page}
            lastPage={meta?.lastPage ?? 1}
            onChange={setPage}
          />
        </>
      ) : (
        <EmptyState
          icon={History}
          title="Belum ada aktivitas"
          description="Log akan muncul setelah ada aktivitas yang tercatat."
        />
      )}
    </div>
  )
}
