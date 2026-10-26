import '@fontsource-variable/bricolage-grotesque'
import { zodResolver } from '@hookform/resolvers/zod'
import { CircleAlert, Eye, EyeOff } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import Brand from '../components/Brand'
import DemoBanner from '../components/DemoBanner'
import { useAuth } from '../features/auth/auth-context'
import { homeForRole } from '../lib/constants'
import { USE_MOCK } from '../lib/env'

const schema = z.object({
  identifier: z.string().trim().min(1, 'Isi NIS atau ID terlebih dulu.'),
  password: z.string().min(1, 'Isi kata sandi terlebih dulu.'),
})

const DEMO_ACCOUNTS = [
  { label: 'Santri', identifier: 'santri1', password: 'santri123' },
  { label: 'Santri 2', identifier: 'santri2', password: 'santri123' },
  { label: 'Pengurus', identifier: 'pengurus1', password: 'pengurus123' },
  { label: 'Pimpinan', identifier: 'pimpinan1', password: 'pimpinan123' },
  { label: 'Pimpinan 2', identifier: 'pimpinan2', password: 'pimpinan123' },
  { label: 'Pengawas', identifier: 'pengawas1', password: 'pengawas123' },
]

const DISPLAY = {    
  fontFamily: "'Bricolage Grotesque Variable', 'Lexend', sans-serif",
}

// Animasi kecil. Dimatikan otomatis untuk pengguna yang mengurangi gerakan.
const ANIMATIONS = `
@keyframes lp-wig { to { transform: translateY(-9px); } }
@keyframes lp-up { from { opacity: 0; transform: translateY(40px); } }
@keyframes lp-swing { from { opacity: 0; transform: rotate(-14deg) scale(.5); } }
.lp-wig { animation: lp-wig 3s ease-in-out infinite alternate; }
.lp-up { animation: lp-up .8s cubic-bezier(.2,.9,.3,1.1) both; }
.lp-delay { animation-delay: .2s; }
.lp-swing { animation: lp-swing 1.1s .7s cubic-bezier(.2,1.6,.4,1) both; }
@keyframes lp-reveal { from { clip-path: circle(0% at 85% 70%); } to { clip-path: circle(150% at 85% 70%); } }
.lp-reveal { animation: lp-reveal .8s ease-out both; }
@media (prefers-reduced-motion: reduce) {
  .lp-wig, .lp-up, .lp-swing, .lp-reveal { animation: none; }
}
`

export default function LoginPage() {
  const { login, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [formError, setFormError] = useState(location.state?.message ?? null)
  const [showPassword, setShowPassword] = useState(false)
  const [welcome, setWelcome] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { identifier: '', password: '' },
  })

  const onSubmit = async (values) => {
    setFormError(null)
    setWelcome(true)
    try {
      const loggedIn = await login(values)
      await new Promise((resolve) => setTimeout(resolve, 1200))
      if (loggedIn.mustChangePassword) {
        navigate('/ganti-password', { replace: true })
      } else {
        navigate(homeForRole(loggedIn.role, loggedIn.dashboard), {
          replace: true,
        })
      }
    } catch (error) {
      setWelcome(false)
      if (error?.status === 422 && error.errors) {
        Object.entries(error.errors).forEach(([field, messages]) => {
          const key = field === 'identifier' || field === 'password' ? field : null
          if (key) setError(key, { message: messages[0] })
        })
        setFormError(error.message)
      } else {
        setFormError(error?.message ?? 'Tidak dapat masuk. Coba lagi.')
      }
    }
  }

  const fill = (account) => {
    setValue('identifier', account.identifier, { shouldValidate: true })
    setValue('password', account.password, { shouldValidate: true })
  }

  const fieldClass = (error) =>
    `h-14 w-full rounded-2xl border-[2.5px] border-[#14201A] bg-[#FFFBF2] px-4 text-base font-semibold text-[#14201A] placeholder:text-[#7A867E] transition focus:bg-white focus:shadow-[4px_4px_0_#B8F2D2] focus:outline-none ${
      error ? 'bg-[#FFE3DC]' : ''
    }`

  return (
    <div className="flex min-h-svh flex-col bg-[#FFF3DC] text-[#14201A] [background-image:radial-gradient(#E9D5AE_1.5px,transparent_1.5px)] [background-size:26px_26px]">
      <style>{ANIMATIONS}</style>
      {welcome && isAuthenticated ? (
        <div
          role="status"
          aria-live="polite"
          className="lp-reveal fixed inset-0 z-50 grid place-items-center bg-[#C9B6FF] px-6 text-center"
        >
          <p
            style={DISPLAY}
            className="text-[clamp(3rem,12vw,7rem)] font-extrabold lowercase leading-none tracking-[-0.05em] text-[#14201A]"
          >
            yey, masuk!
          </p>
        </div>
      ) : null}
      <DemoBanner />

      <header className="flex items-center justify-between gap-4 px-5 py-5 sm:px-10">
        <Link to="/" aria-label="Kembali ke beranda">
          <Brand />
        </Link>
        <Link
          to="/"
          className="rounded-full border-[2.5px] border-[#14201A] bg-white px-4 py-2 text-sm font-extrabold shadow-[3px_3px_0_#14201A] transition hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[1px_1px_0_#14201A]"
        >
          &larr; Beranda
        </Link>
      </header>

      <main className="mx-auto grid w-full max-w-6xl flex-1 items-center gap-10 px-5 pb-12 pt-2 sm:px-10 lg:grid-cols-[1fr_460px] lg:gap-16">
        {/* Kiri: judul besar + stiker */}
        <section aria-hidden="false" className="lp-up">
          <p className="lp-wig mb-4 inline-block rotate-3 rounded-[22px_22px_22px_4px] border-[2.5px] border-[#14201A] bg-white px-4 py-2 text-sm font-bold shadow-[4px_4px_0_#14201A]">
            aku takut cerita...
          </p>
          <h2
            style={DISPLAY}
            className="text-[clamp(3.4rem,9.5vw,8.25rem)] font-extrabold lowercase leading-[0.86] tracking-[-0.05em] text-[#14201A]"
          >
            cerita
            <br />
            aja,{' '}
            <span className="lp-swing mt-2 inline-block -rotate-3 rounded-[1.75rem] border-[3px] border-[#14201A] bg-[#C9B6FF] px-5 pb-2 shadow-[6px_6px_0_#14201A]">
              tenang.
            </span>
          </h2>
          <ul className="mt-9 hidden flex-wrap gap-3 sm:flex">
            {[
              ['nama disembunyiin', 'bg-[#B8F2D2] -rotate-6'],
              ['dibales < 24 jam', 'bg-[#FFB8A3] rotate-3'],
              ['no judgement', 'bg-[#FFE27A] -rotate-2'],
            ].map(([text, tone], index) => (
              <li
                key={text}
                style={{ animationDelay: `${index * -1.2}s` }}
                className={`lp-wig rounded-full border-[2.5px] border-[#14201A] px-4 py-2 text-base font-extrabold shadow-[4px_4px_0_#14201A] ${tone}`}
              >
                {text}
              </li>
            ))}
          </ul>
        </section>

        {/* Kanan: form */}
        <section className="lp-up lp-delay rounded-[2rem] border-[3px] border-[#14201A] bg-white p-6 shadow-[10px_10px_0_#14201A] sm:p-8 lg:rotate-1">
          <h1 style={DISPLAY} className="text-4xl font-extrabold lowercase tracking-[-0.04em] text-[#14201A] sm:text-5xl">
            masuk yuk!
          </h1>
          <p className="mb-5 mt-1 text-sm text-[#4C5B52]">
            Pakai NIS atau ID petugas yang diberikan pengurus.
          </p>

          {formError ? (
            <p
              role="alert"
              aria-live="assertive"
              className="mb-4 flex items-start gap-2 rounded-2xl border-[2.5px] border-[#14201A] bg-[#FFB8A3] px-4 py-3 text-sm font-bold text-[#14201A]"
            >
              <CircleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
              {formError}
            </p>
          ) : null}

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="flex flex-col gap-5"
            autoComplete="off"
            noValidate
          >
            <div className="flex flex-col gap-2">
              <label htmlFor="identifier" className="text-sm font-extrabold">
                NIS atau ID petugas
              </label>
              <input
                id="identifier"
                type="text"
                autoComplete="off"
                placeholder="Contoh: 2024-0137"
                aria-invalid={Boolean(errors.identifier)}
                aria-describedby={errors.identifier ? 'identifier-error' : undefined}
                className={fieldClass(errors.identifier)}
                {...register('identifier')}
              />
              {errors.identifier ? (
                <p id="identifier-error" role="alert" className="text-sm font-bold text-[#B42318]">
                  {errors.identifier.message}
                </p>
              ) : null}
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="password" className="text-sm font-extrabold">
                Kata sandi
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="off"
                  placeholder="Kata sandimu"
                  aria-invalid={Boolean(errors.password)}
                  aria-describedby={errors.password ? 'password-error' : undefined}
                  className={`${fieldClass(errors.password)} pr-20`}
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                  aria-pressed={showPassword}
                  className="absolute right-2 top-1/2 flex h-10 -translate-y-1/2 items-center gap-1.5 rounded-xl px-2.5 text-sm font-bold text-[#4C5B52] transition hover:bg-[#FFF3DC] focus-visible:outline-3 focus-visible:outline-[#14201A]"
                >
                  {showPassword ? (
                    <EyeOff aria-hidden="true" className="size-5" />
                  ) : (
                    <Eye aria-hidden="true" className="size-5" />
                  )}
                  <span className="hidden sm:inline">{showPassword ? 'tutup' : 'lihat'}</span>
                </button>
              </div>
              {errors.password ? (
                <p id="password-error" role="alert" className="text-sm font-bold text-[#B42318]">
                  {errors.password.message}
                </p>
              ) : null}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="h-16 rounded-[1.25rem] border-[3px] border-[#14201A] bg-[#FF7A59] text-lg font-extrabold text-[#14201A] shadow-[5px_5px_0_#14201A] transition hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-[2px_2px_0_#14201A] active:translate-x-[5px] active:translate-y-[5px] active:shadow-none disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-[#14201A]"
            >
              {isSubmitting ? 'Sebentar ya...' : 'Masuk \u2192'}
            </button>
          </form>

          <p className="mt-5 text-sm leading-6 text-[#4C5B52]">
            Nama pelapor tidak dilihat pengurus kecuali kamu yang memilihnya.
          </p>

          {USE_MOCK ? (
            <div className="mt-5 flex flex-wrap items-center gap-2 border-t-[2.5px] border-dashed border-[#14201A]/40 pt-4 text-sm font-bold">
              <span>Akun demo:</span>
              {DEMO_ACCOUNTS.map((account) => (
                <button
                  key={account.identifier}
                  type="button"
                  onClick={() => fill(account)}
                  className="rounded-full border-2 border-[#14201A] bg-[#B8F2D2] px-3.5 py-1.5 transition hover:bg-[#14201A] hover:text-white focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#14201A]"
                >
                  {account.label}
                </button>
              ))}
            </div>
          ) : null}
        </section>
      </main>
    </div>
  )
}
