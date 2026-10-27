import Skeleton from '../../../components/ui/Skeleton'
import { ROLE_LABELS } from '../../../lib/constants'
import { formatDateOnly } from '../../../lib/formatDate'
import { useReportTrail } from '../hooks'

const ACTION_LABELS = {
  terkirim: 'Laporan terkirim',
  dibuka: 'Dibuka',
  status_diubah: 'Status diubah',
  dibalas: 'Dibalas',
  diteruskan: 'Diteruskan',
  minta_nama: 'Meminta nama pelapor',
  minta_nama_dijawab: 'Permintaan nama dijawab',
}

const STATUS_LABELS = { diproses: 'Diproses', selesai: 'Selesai' }

export default function ReportTrail({ id, createdAt }) {
  const { data, isLoading, isError } = useReportTrail(id)

  if (isError) return null

  const items = [
    { aksi: 'terkirim', peran: 'santri', tanggal: createdAt, status: null },
    ...(data ?? []),
  ]

  return (
    <div className="rounded-3xl border border-[#e1e9e2] bg-white p-5 shadow-[0_2px_10px_rgba(18,55,42,0.06)] sm:p-6">
      <h2 className="text-lg font-extrabold tracking-tight text-navy">
        Jejak laporan
      </h2>
      <p className="mt-1 text-sm text-body">
        Siapa yang menyentuh laporanmu. Hanya tanggal dan peran, tanpa nama.
      </p>
      {isLoading ? (
        <Skeleton className="mt-4 h-24 w-full" />
      ) : (
        <ol className="mt-4 flex flex-col gap-3">
          {items.map((item, index) => (
            <li
              key={`${item.aksi}-${item.tanggal}-${index}`}
              className="flex items-start gap-3"
            >
              <span
                aria-hidden="true"
                className="mt-1.5 size-3 shrink-0 rounded-full bg-primary"
              />
              <div>
                <p className="text-sm font-semibold text-navy">
                  {ACTION_LABELS[item.aksi] ?? item.aksi}
                  {item.status
                    ? ` menjadi ${STATUS_LABELS[item.status] ?? item.status}`
                    : ''}
                </p>
                <p className="text-sm text-body">
                  {formatDateOnly(item.tanggal)} ·{' '}
                  {ROLE_LABELS[item.peran] ?? item.peran}
                </p>
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}