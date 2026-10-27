import { zodResolver } from '@hookform/resolvers/zod'
import {
  CheckCircle2,
  CirclePlus,
  Heart,
  Info,
  LifeBuoy,
  MessageCircle,
  Shield,
  ShieldCheck,
  Sparkles,
  UsersRound,
  Hand,
} from 'lucide-react'
import { useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import Button from '../../components/ui/Button'
import ButtonLink from '../../components/ui/ButtonLink'
import Card from '../../components/ui/Card'
import Switch from '../../components/ui/Switch'
import { useToast } from '../../components/ui/toast-context'
import { useAuth } from '../../features/auth/auth-context'
import { useCreateReport } from '../../features/reports/hooks'
import { cn } from '../../lib/cn'
import { CATEGORIES, routesToPimpinan } from '../../lib/constants'

const REPORT_CARD_SURFACE =
  '!border !border-[#e1e9e2] !shadow-[0_2px_10px_rgba(18,55,42,0.06)]'

const schema = z.object({
  kategori: z.string().min(1, 'Pilih salah satu kategori.'),
  isi: z
    .string()
    .trim()
    .min(20, 'Ceritakan sedikit lebih lengkap, minimal 20 karakter.'),
  tampilkan_identitas: z.boolean(),
  menyangkut_pimpinan: z.boolean(),
})

const CATEGORY_STYLES = {
  perundungan: {
    icon: UsersRound,
    background: 'bg-[#dfeaff]',
    iconColor: 'text-[#3d67b2]',
  },
  kekerasan_fisik: {
    icon: Hand,
    background: 'bg-[#ffddd1]',
    iconColor: 'text-[#ba4c30]',
  },
  kekerasan_verbal: {
    icon: MessageCircle,
    background: 'bg-[#fff1c3]',
    iconColor: 'text-[#87670a]',
  },
  masalah_pengurus: {
    icon: Shield,
    background: 'bg-[#e8defd]',
    iconColor: 'text-[#6744ad]',
  },
  masalah_pribadi: {
    icon: Heart,
    background: 'bg-[#d9f0e1]',
    iconColor: 'text-[#34744e]',
  },
  lainnya: {
    icon: CirclePlus,
    background: 'bg-[#edf0ed]',
    iconColor: 'text-[#59665e]',
  },
}

function StepHeading({ number, children }) {
  return (
    <legend className="flex items-center gap-2 text-base font-bold text-[#163b2f]">
      <span className="flex size-5 items-center justify-center rounded-md bg-[#ffd166] text-[10px] font-extrabold text-[#163b2f]">
        {number}
      </span>
      {children}
    </legend>
  )
}

function SuccessScreen({ report }) {
  const { quickExit } = useAuth()

  return (
    <div className="mx-auto max-w-xl text-center">
      <span className="mx-auto flex size-16 items-center justify-center rounded-full bg-status-done-bg text-status-done">
        <CheckCircle2 aria-hidden="true" className="size-8" />
      </span>
      <h1 className="mt-4 text-3xl">Laporanmu sudah terkirim</h1>
      <p className="mt-2 text-body">
        Terima kasih sudah berani bercerita. Laporanmu akan diperiksa petugas
        dalam waktu 24 jam.
      </p>

      <Card className={`${REPORT_CARD_SURFACE} mt-6 p-6`}>
        <p className="text-sm font-semibold uppercase tracking-wide text-body">
          Nomor laporan
        </p>
        <p className="font-sans text-3xl font-semibold text-primary">
          {report.noLaporan}
        </p>
        <p className="mt-3 text-sm text-body">
          Catat nomor ini. Kamu bisa memantau status dan balasan di halaman
          <strong className="text-navy"> Laporan Saya</strong>.
        </p>
      </Card>

      <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
        <ButtonLink to={`/santri/laporan/${report.id}`}>
          Lihat laporanku
        </ButtonLink>
        <Button variant="secondary" onClick={quickExit}>
          Selesai dan keluar
        </Button>
      </div>
    </div>
  )
}

export default function CreateReportPage() {
  const createReport = useCreateReport()
  const toast = useToast()
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const [created, setCreated] = useState(null)
  const draftFromAi = location.state?.draft ?? null

  const {
    register,
    handleSubmit,
    control,
    setValue,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      kategori: draftFromAi?.kategori ?? '',
      isi: draftFromAi?.isi ?? '',
      tampilkan_identitas: Boolean(draftFromAi?.tampilkanIdentitas),
      menyangkut_pimpinan: Boolean(draftFromAi?.menyangkutPimpinan),
    },
  })

  const kategori = useWatch({ control, name: 'kategori' })
  const tampilkanIdentitas = Boolean(
    useWatch({ control, name: 'tampilkan_identitas' }),
  )
  const menyangkutPimpinan = Boolean(
    useWatch({ control, name: 'menyangkut_pimpinan' }),
  )
  const kePimpinan = routesToPimpinan({ kategori })

  const onSubmit = async (values) => {
    try {
      const report = await createReport.mutateAsync({
        kategori: values.kategori,
        isi: values.isi,
        tampilkan_identitas: values.tampilkan_identitas,
        menyangkut_pimpinan: values.menyangkut_pimpinan,
      })
      toast.showToast('Laporan berhasil dibuat.', 'success')
      setCreated(report)
    } catch (error) {
      if (error?.status === 422 && error.errors) {
        Object.entries(error.errors).forEach(([field, messages]) => {
          if (['kategori', 'isi'].includes(field)) {
            setError(field, { message: messages[0] })
          }
        })
        toast.showToast('Periksa kembali isianmu, ya.', 'error')
      } else {
        toast.showToast(error?.message ?? 'Laporan gagal dikirim.', 'error')
      }
    }
  }

  if (created) return <SuccessScreen report={created} />

  return (
    <div className="w-full">
      <header className="mb-5">
        <span className="inline-flex rounded-full bg-[#ffe99e] px-3 py-1 text-[11px] font-semibold text-[#163b2f]">
          Halo, {user?.name}
        </span>
        <div>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-[#12372a] sm:text-4xl">Ceritakan dengan tenang</h1>
          <p className="mt-1 text-sm text-[#718078]">
            Kamu tidak harus sempurna. Tulis saja apa yang ingin kamu sampaikan.
          </p>
        </div>
      </header>

      {draftFromAi ? (
        <div className="mb-3 flex items-start gap-2 rounded-2xl border border-primary/40 bg-amber/15 px-4 py-3 text-sm text-navy">
          <Info aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-primary-hover" />
          <p>
            Draf dari Teman Cerita sudah diisikan. Periksa dan ubah dulu sebelum
            mengirim.
          </p>
        </div>
      ) : null}

      <Card className={`${REPORT_CARD_SURFACE} mb-3 bg-[#fff1e9] p-4 sm:p-4`}>
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#ff765c] text-white">
            <LifeBuoy aria-hidden="true" className="size-5" />
          </span>
          <div>
            <h2 className="text-sm font-bold text-[#163b2f]">Butuh bantuan segera?</h2>
            <p className="mt-0.5 text-xs leading-5 text-[#6f746f]">
              Jika kamu sedang dalam bahaya, segera hubungi pengurus atau ustaz
              terdekat. Kamu juga dapat menghubungi SAPA 129 melalui{' '}
              <a href="tel:129" className="font-semibold text-[#163b2f] underline underline-offset-2">
                telepon 129
              </a>
              .
            </p>
          </div>
        </div>
      </Card>

      <Card className={`${REPORT_CARD_SURFACE} mb-3 bg-[#edf6f0] p-4 sm:p-4`}>
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#d9f0e1] text-[#34744e]">
            <Sparkles aria-hidden="true" className="size-5" />
          </span>
          <div>
            <h2 className="text-sm font-bold text-[#163b2f]">Belum siap menulis laporan?</h2>
            <p className="mt-0.5 text-xs leading-5 text-[#6f746f]">
              Cerita dulu dengan Teman Cerita. Kalau sudah siap, kami bantu
              rapikan ceritamu menjadi draf laporan.
            </p>
            <Link
              to="/santri/teman-cerita"
              className="mt-2 inline-flex text-xs font-semibold text-primary-hover hover:underline"
            >
              Buka Teman Cerita →
            </Link>
          </div>
        </div>
      </Card>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex flex-col gap-3"
        autoComplete="off"
        noValidate
      >
        <Card className={`${REPORT_CARD_SURFACE} p-4 sm:p-4`}>
          <fieldset>
            <StepHeading number="1">Ini tentang apa?</StepHeading>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {CATEGORIES.map((category) => {
                const selected = kategori === category.value
                const style = CATEGORY_STYLES[category.value]
                const Icon = style.icon
                return (
                  <label
                    key={category.value}
                    className={cn(
                      'flex min-h-[58px] cursor-pointer items-center gap-3 rounded-xl border border-transparent px-3 py-2 transition-[border-color,transform] hover:-translate-y-px focus-within:ring-2 focus-within:ring-[#12372a]',
                      style.background,
                      selected
                        ? 'border-[#12372a] shadow-[0_2px_8px_rgba(18,55,42,0.08)]'
                        : 'hover:border-[#b7c8bc]',
                    )}
                  >
                    <input
                      type="radio"
                      value={category.value}
                      className="sr-only"
                      {...register('kategori')}
                    />
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-white/80">
                      <Icon aria-hidden="true" className={cn('size-4', style.iconColor)} />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-xs font-bold text-[#163b2f]">
                        {category.label}
                      </span>
                      <span className="mt-0.5 block text-[10px] leading-4 text-[#69766f]">
                        {category.description}
                      </span>
                    </span>
                  </label>
                )
              })}
            </div>
            {errors.kategori ? (
              <p role="alert" className="mt-2 text-sm font-medium text-danger">
                {errors.kategori.message}
              </p>
            ) : null}
          </fieldset>
        </Card>

        {menyangkutPimpinan ? (
          <div className="flex items-start gap-2 rounded-2xl border border-[#e7a48f] bg-[#ffe3d9] px-4 py-3 text-sm text-[#7c2d17]">
            <Shield aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
            <p>
              Laporan ini tetap dibaca pengurus dan pimpinan seperti laporan
              lain. Pengawas ikut menerimanya agar penanganannya dipantau.
            </p>
          </div>
        ) : kePimpinan ? (
          <div className="flex items-start gap-2 rounded-2xl border border-primary/40 bg-amber/15 px-4 py-3 text-sm text-navy">
            <Info aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-primary-hover" />
            <p>Laporan tentang pengurus akan langsung diteruskan ke pimpinan.</p>
          </div>
        ) : null}

        <Card className={`${REPORT_CARD_SURFACE} p-4 sm:p-4`}>
          <fieldset>
            <StepHeading number="2">Ceritamu</StepHeading>
            <label htmlFor="isi" className="sr-only">Ceritamu</label>
            <div className="relative mt-2">
              <textarea
                id="isi"
                rows={5}
                autoComplete="off"
                placeholder="Tulis di sini dengan bahasamu sendiri…"
                aria-invalid={Boolean(errors.isi)}
                aria-describedby={errors.isi ? 'isi-error' : undefined}
                className="min-h-28 w-full resize-y rounded-xl border border-transparent bg-[#f3f7f3] px-4 py-3 pb-8 text-sm text-[#163b2f] placeholder:text-[#9aa69e] focus:border-[#12372a] focus:outline-none focus:ring-2 focus:ring-[#12372a]/15"
                {...register('isi')}
              />
            </div>
            {errors.isi ? (
              <p id="isi-error" role="alert" aria-live="polite" className="mt-2 text-sm font-medium text-danger">
                {errors.isi.message}
              </p>
            ) : null}
          </fieldset>
        </Card>

        <Card className={`${REPORT_CARD_SURFACE} p-4 sm:p-4`}>
          <fieldset>
            <StepHeading number="3">Soal namamu</StepHeading>
            <Switch
              id="tampilkan_identitas"
              label="Tampilkan namaku ke petugas"
              description="Nama hanya dapat dilihat pengurus dan pimpinan jika kamu mengaktifkan pilihan ini."
              checked={tampilkanIdentitas}
              className="!mt-2 !rounded-xl !border-0 !bg-[#e9f4ed] !px-3 !py-2.5"
              onChange={(next) =>
                setValue('tampilkan_identitas', next, { shouldDirty: true })
              }
            />
            <p className="mt-3 flex items-start gap-2 text-xs text-[#5f6c63]">
              <ShieldCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-[#537363]" />
              Kamu bisa mengubah pilihan ini kapan saja di halaman laporanmu.
            </p>
            <div className="mt-3 border-t border-[#dbe7de] pt-3">
              <Switch
                id="menyangkut_pimpinan"
                label="Laporan ini menyangkut pimpinan"
                description="Aktifkan jika laporan berkaitan dengan perilaku pimpinan. Pengawas akan ikut menerima laporan ini."
                checked={menyangkutPimpinan}
                className="!rounded-xl !border-0 !bg-[#fff1e9] !px-3 !py-2.5"
                onChange={(next) =>
                  setValue('menyangkut_pimpinan', next, { shouldDirty: true })
                }
              />
            </div>
          </fieldset>
        </Card>

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end">
          <Button
            type="button"
            variant="ghost"
            onClick={() => navigate('/santri/laporan-saya')}
            className="!min-h-11 !text-sm"
          >
            Lihat laporan saya
          </Button>
          <Button type="submit" size="md" loading={isSubmitting} className="!bg-[#0d352a] !px-6 !text-sm !shadow-[0_8px_20px_rgba(13,53,42,0.2)]">
            Kirim laporan <span aria-hidden="true">→</span>
          </Button>
        </div>
      </form>
    </div>
  )
}
