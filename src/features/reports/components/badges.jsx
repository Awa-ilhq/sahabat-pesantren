import {
  AlertTriangle,
  CheckCircle2,
  CircleDot,
  Hourglass,
  ShieldAlert,
} from 'lucide-react'
import Badge from '../../../components/ui/Badge'
import {
  CATEGORY_LABELS,
  STATUS_LABELS,
  STATUSES,
} from '../../../lib/constants'

const STATUS_ICONS = {
  baru: CircleDot,
  diproses: Hourglass,
  selesai: CheckCircle2,
}

export function StatusBadge({ status }) {
  const meta = STATUSES.find((item) => item.value === status)
  return (
    <Badge tone={meta?.tone ?? 'neutral'} icon={STATUS_ICONS[status]}>
      {STATUS_LABELS[status] ?? status}
    </Badge>
  )
}

export function LateBadge() {
  return (
    <Badge tone="danger" icon={AlertTriangle}>
      Terlambat
    </Badge>
  )
}

export function CategoryBadge({ kategori }) {
  const tones = {
    perundungan: 'blue',
    kekerasan_fisik: 'coral',
    kekerasan_verbal: 'yellow',
    masalah_pengurus: 'blue',
    masalah_pribadi: 'done',
    lainnya: 'neutral',
  }

  return (
    <Badge tone={tones[kategori] ?? 'neutral'}>
      {CATEGORY_LABELS[kategori] ?? kategori}
    </Badge>
  )
}

export function SensitiveBadge() {
  return (
    <Badge tone="danger" icon={ShieldAlert}>
      Menyangkut pimpinan
    </Badge>
  )
}
