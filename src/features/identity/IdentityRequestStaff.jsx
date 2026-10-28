import { Paperclip, ShieldQuestion } from 'lucide-react'
import { useState } from 'react'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import Modal from '../../components/ui/Modal'
import Textarea from '../../components/ui/Textarea'
import { useToast } from '../../components/ui/toast-context'
import {
  IDENTITY_PROOF_ACCEPT,
  IDENTITY_PROOF_MAX_BYTES,
  IDENTITY_REQUEST_STATUS,
} from '../../lib/constants'
import { formatDateOnly } from '../../lib/formatDate'
import { isReportLocked } from '../reports/escalation'
import { useRequestIdentity } from '../reports/hooks'

const PROOF_TYPES = IDENTITY_PROOF_ACCEPT.split(',')
const IDENTITY_CARD_SURFACE =
  '!border !border-[#e1e9e2] !shadow-[0_2px_10px_rgba(18,55,42,0.06)]'

const isSafeProofUrl = (value) =>
  typeof value === 'string' &&
  (value.startsWith('/') || /^https?:\/\//i.test(value))

export function ProofLink({ request }) {
  if (!isSafeProofUrl(request.buktiUrl)) return null
  return (
    <a
      href={request.buktiUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary-hover hover:underline"
    >
      <Paperclip aria-hidden="true" className="size-4" />
      {request.buktiNama ?? 'Lihat bukti'}
    </a>
  )
}

// Kartu untuk PIMPINAN: minta izin santri agar nama pelapor terbuka.
export default function IdentityRequestStaff({ report }) {
  const request = report.permintaanIdentitas
  const requestIdentity = useRequestIdentity(report.id)
  const toast = useToast()
  const [open, setOpen] = useState(false)
  const [alasan, setAlasan] = useState('')
  const [bukti, setBukti] = useState(null)
  const [errors, setErrors] = useState({})

  if (isReportLocked(report)) return null
  const status = request?.status
  const identityApproved =
    status === 'disetujui' || status === true || status === 1 || status === '1'
  const canRequest =
    !report.tampilkanIdentitas && !identityApproved && status !== 'menunggu'
  const reporterNameVisible =
    Boolean(report.pelaporNama) &&
    !/^anonymous$/i.test(String(report.pelaporNama).trim())

  const close = () => {
    setOpen(false)
    setErrors({})
  }

  const onFile = (event) => {
    const file = event.target.files?.[0] ?? null
    if (file && !PROOF_TYPES.includes(file.type)) {
      setErrors((prev) => ({
        ...prev,
        bukti: 'Bukti harus berupa foto JPG/PNG atau berkas PDF.',
      }))
      event.target.value = ''
      setBukti(null)
      return
    }
    if (file && file.size > IDENTITY_PROOF_MAX_BYTES) {
      setErrors((prev) => ({ ...prev, bukti: 'Ukuran bukti maksimal 5 MB.' }))
      event.target.value = ''
      setBukti(null)
      return
    }
    setErrors((prev) => ({ ...prev, bukti: undefined }))
    setBukti(file)
  }

  const submit = async (event) => {
    event.preventDefault()
    const text = alasan.trim()
    if (text.length < 20) {
      setErrors({ alasan: 'Jelaskan alasannya minimal 20 karakter.' })
      return
    }
    try {
      await requestIdentity.mutateAsync({ alasan: text, bukti })
      toast.showToast('Permintaan dikirim ke santri.', 'success')
      setAlasan('')
      setBukti(null)
      close()
    } catch (error) {
      const first = error?.errors ? Object.values(error.errors).flat()[0] : null
      toast.showToast(first ?? error?.message ?? 'Gagal mengirim permintaan.', 'error')
    }
  }

  return (
    <Card className={`${IDENTITY_CARD_SURFACE} p-5 sm:p-6`}>
      <h2 className="flex items-center gap-2 text-xl">
        <ShieldQuestion aria-hidden="true" className="size-5 text-primary" />
        Identitas pelapor
      </h2>
      <p className="mt-0.5 text-sm text-body">
        Nama pelapor tetap tersembunyi. Untuk melihatnya, santri harus
        menyetujui permintaanmu lebih dulu.
      </p>

      {request ? (
        <div className="mt-4 rounded-2xl border border-border bg-white p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Badge tone={IDENTITY_REQUEST_STATUS[status]?.tone}>
              {IDENTITY_REQUEST_STATUS[status]?.label ?? status}
            </Badge>
            <span className="text-xs text-body">
              Diajukan {formatDateOnly(request.createdAt)}
            </span>
          </div>
          <p className="mt-3 text-sm text-navy" data-pre-wrap>
            {request.alasan}
          </p>
          <div className="mt-2">
            <ProofLink request={request} />
          </div>
          {status === 'disetujui' ? (
            <p className="mt-3 text-sm font-semibold text-status-done">
              {reporterNameVisible
                ? 'Santri menyetujui. Nama pelapor sekarang terlihat di atas.'
                : 'Santri menyetujui, tetapi nama pelapor belum tersedia dari server. Coba muat ulang.'}
            </p>
          ) : null}
          {status === 'ditolak' || status === 'dicabut' ? (
            <p className="mt-3 text-sm text-body">
              Santri {status === 'ditolak' ? 'menolak' : 'mencabut persetujuan'}{' '}
              pada {formatDateOnly(request.answeredAt)}. Hormati keputusannya;
              kamu tetap bisa mengajukan lagi dengan alasan yang lebih jelas.
            </p>
          ) : null}
          {status === 'menunggu' ? (
            <p className="mt-3 text-sm text-body">
              Menunggu jawaban santri. Namanya belum bisa dilihat.
            </p>
          ) : null}
        </div>
      ) : null}

      {canRequest ? (
        <div className="mt-4">
          <Button variant="secondary" onClick={() => setOpen(true)}>
            {request ? 'Ajukan lagi' : 'Minta lihat nama pelapor'}
          </Button>
        </div>
      ) : null}

      <Modal
        open={open}
        onClose={close}
        title="Minta lihat nama pelapor"
        footer={
          <>
            <Button variant="ghost" onClick={close}>
              Batal
            </Button>
            <Button
              type="submit"
              form="identity-request-form"
              loading={requestIdentity.isPending}
            >
              Kirim permintaan
            </Button>
          </>
        }
      >
        <form
          id="identity-request-form"
          onSubmit={submit}
          className="flex flex-col gap-4"
          noValidate
        >
          <p className="text-sm text-body">
            Santri akan membaca alasanmu dan memilih setuju atau tidak. Tulis
            dengan jelas supaya santri merasa aman.
          </p>
          <Textarea
            id="identity-alasan"
            label="Alasan"
            required
            rows={4}
            autoComplete="off"
            placeholder="Contoh: Pesantren akan melaporkan kejadian ini ke kepolisian dan butuh keterangan darimu."
            value={alasan}
            error={errors.alasan}
            onChange={(event) => setAlasan(event.target.value)}
          />
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="identity-bukti"
              className="text-sm font-semibold text-navy"
            >
              Bukti pendukung (opsional)
            </label>
            <input
              id="identity-bukti"
              type="file"
              accept={IDENTITY_PROOF_ACCEPT}
              onChange={onFile}
              className="block w-full text-sm text-body file:mr-3 file:rounded-full file:border-0 file:bg-band-1 file:px-4 file:py-2 file:font-semibold file:text-primary"
            />
            <p className="text-sm text-body">
              Foto JPG/PNG atau PDF, maksimal 5 MB. Misalnya surat panggilan
              atau bukti laporan ke polisi.
            </p>
            {errors.bukti ? (
              <p role="alert" className="text-sm font-medium text-danger">
                {errors.bukti}
              </p>
            ) : null}
          </div>
        </form>
      </Modal>
    </Card>
  )
}
