import { ShieldQuestion } from 'lucide-react'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import { useToast } from '../../components/ui/toast-context'
import { IDENTITY_REQUEST_STATUS } from '../../lib/constants'
import { formatDateOnly } from '../../lib/formatDate'
import { isReportLocked } from '../reports/escalation'
import {
  useAnswerIdentityRequest,
  useUpdateIdentity,
} from '../reports/hooks'
import { ProofLink } from './IdentityRequestStaff'

const IDENTITY_CARD_SURFACE =
  '!border !border-[#e1e9e2] !shadow-[0_2px_10px_rgba(18,55,42,0.06)]'

// Kartu untuk SANTRI: setujui / tolak permintaan pimpinan.
export default function IdentityRequestSantri({ report }) {
  const request = report.permintaanIdentitas
  const answer = useAnswerIdentityRequest(report.id)
  const updateIdentity = useUpdateIdentity(report.id)
  const toast = useToast()

  if (isReportLocked(report)) return null
  if (!request) return null
  const status = request.status
  const pending = status === 'menunggu'

  const respond = (next, message) => {
    answer.mutate(next, {
      onSuccess: () => toast.showToast(message, 'success'),
      onError: (error) =>
        toast.showToast(error?.message ?? 'Gagal menyimpan jawabanmu.', 'error'),
    })
  }

  const revokeConsent = () => {
    updateIdentity.mutate(false, {
      onSuccess: () =>
        toast.showToast(
          'Persetujuan dicabut. Namamu disembunyikan lagi.',
          'success',
        ),
      onError: (error) =>
        toast.showToast(
          error?.message ?? 'Gagal mencabut persetujuan.',
          'error',
        ),
    })
  }

  return (
    <Card
      className={`${IDENTITY_CARD_SURFACE} p-5 sm:p-6`}
      aria-live="polite"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-xl">
          <ShieldQuestion aria-hidden="true" className="size-5 text-primary" />
          {pending
            ? `${request.diminta ?? 'Pimpinan'} ingin melihat namamu`
            : 'Permintaan melihat namamu'}
        </h2>
        <Badge tone={IDENTITY_REQUEST_STATUS[status]?.tone}>
          {IDENTITY_REQUEST_STATUS[status]?.label ?? status}
        </Badge>
      </div>

      <p className="mt-3 text-sm font-semibold text-navy">Alasannya:</p>
      <p className="mt-1 rounded-2xl bg-band-1 p-4 text-sm text-navy" data-pre-wrap>
        {request.alasan}
      </p>
      <div className="mt-2">
        <ProofLink request={request} />
      </div>

      {pending ? (
        <>
          <p className="mt-4 text-sm text-body">
            Kamu bebas memilih. Kalau kamu menolak, namamu tetap tersembunyi
            dan laporanmu tetap diproses. Jika menyetujui, pengaturan
            &quot;Tampilkan namaku ke petugas&quot; akan aktif sehingga pengurus
            dan pimpinan dapat melihat namamu.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button
              loading={answer.isPending || updateIdentity.isPending}
              onClick={() => respond('disetujui', 'Kamu menyetujui permintaan ini.')}
            >
              Setujui
            </Button>
            <Button
              variant="secondary"
              disabled={answer.isPending || updateIdentity.isPending}
              onClick={() => respond('ditolak', 'Permintaan ditolak. Namamu tetap tersembunyi.')}
            >
              Tolak
            </Button>
          </div>
        </>
      ) : null}

      {status === 'disetujui' ? (
        <>
          <p className="mt-4 text-sm text-body">
            Kamu menyetujui pada {formatDateOnly(request.answeredAt)}. Pengurus
            dan pimpinan dapat melihat namamu di laporan ini.
          </p>
          <div className="mt-4">
            <Button
              variant="secondary"
              loading={updateIdentity.isPending}
              onClick={revokeConsent}
            >
              Cabut persetujuan
            </Button>
          </div>
        </>
      ) : null}

      {status === 'ditolak' ? (
        <p className="mt-4 text-sm text-body">
          Kamu menolak pada {formatDateOnly(request.answeredAt)}. Namamu
          tersembunyi.
        </p>
      ) : null}

      {status === 'dicabut' ? (
        <p className="mt-4 text-sm text-body">
          Kamu mencabut persetujuan pada {formatDateOnly(request.answeredAt)}.
          Namamu disembunyikan lagi.
        </p>
      ) : null}
    </Card>
  )
}
