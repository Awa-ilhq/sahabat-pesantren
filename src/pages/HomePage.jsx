import {
  ArrowDown,
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  LockKeyhole,
  MessageCircle,
  ShieldCheck,
} from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import Mascot from '../components/Mascot'

const QUESTIONS = [
  {
    question: 'Apakah laporanku benar-benar anonim?',
    answer:
      'Namamu tidak ditampilkan kepada pengurus dan pimpinan kecuali kamu memilih untuk membagikannya. Akun tetap digunakan agar kamu dapat melihat perkembangan laporanmu.',
  },
  {
    question: 'Aku sedang dalam bahaya sekarang. Bagaimana?',
    answer:
      'Segera temui pengurus, ustaz, atau orang dewasa yang kamu percaya di pesantren untuk mendapatkan bantuan langsung.',
  },
  {
    question: 'Kenapa harus keluar setelah selesai?',
    answer:
      'Komputer pojok curhat bisa dipakai bersama. Sesi akan keluar otomatis saat tidak aktif untuk membantu menjaga ceritamu tetap pribadi.',
  },
]

const STEPS = [
  {
    number: '01',
    title: 'Masuk',
    text: 'Pakai NIS dan kata sandi di komputer pojok curhat. Sesi berakhir sendiri kalau kamu pergi.',
  },
  {
    number: '02',
    title: 'Ceritakan',
    text: 'Pilih apa yang terjadi dan tulis dengan kata-katamu sendiri. Tidak ada jawaban yang salah.',
  },
  {
    number: '03',
    title: 'Pantau',
    text: 'Lihat status di Laporan Saya. Kalau belum ditangani dalam 24 jam, laporan naik ke pimpinan.',
  },
]

function ConversationIllustration() {
  return (
    <svg
      viewBox="0 0 560 440"
      role="img"
      aria-label="Dua santri berbincang dengan nyaman"
      className="relative z-10 mx-auto w-full max-w-[560px]"
    >
      <circle cx="280" cy="217" r="183" fill="#d6eadf" />
      <path
        d="M88 347c22-67 87-112 192-112s170 45 192 112v42H88z"
        fill="#fffdf7"
      />
      <path d="M280 67c-57 0-103 46-103 103v67h206v-67c0-57-46-103-103-103Z" fill="#fffdf7" />
      <path d="M177 199h206" stroke="#c9ddcf" strokeWidth="8" />
      <path d="M280 67v170" stroke="#c9ddcf" strokeWidth="7" />

      <path d="M131 337c7-41 36-67 76-67s68 26 76 67v48H131z" fill="#ff7a59" />
      <circle cx="207" cy="215" r="43" fill="#c9855f" />
      <path d="M163 216c2-39 21-62 46-62 28 0 47 23 47 60-14-12-23-23-29-36-11 18-35 30-64 38Z" fill="#12372a" />
      <path d="M164 227c12 37 25 50 43 50 19 0 35-15 45-50-11 11-27 17-45 17-17 0-32-6-43-17Z" fill="#fffdf7" />
      <path d="M279 337c7-41 36-67 76-67s68 26 76 67v48H279z" fill="#f4c95d" />
      <circle cx="355" cy="215" r="43" fill="#a96e4f" />
      <path d="M312 209c3-39 19-57 44-57 28 0 45 22 46 58-17-8-32-20-43-37-10 17-25 29-47 36Z" fill="#12372a" />
      <path d="M326 239c10 9 20 13 30 13 11 0 22-4 31-13" fill="none" stroke="#713f32" strokeWidth="4" strokeLinecap="round" />
      <circle cx="194" cy="218" r="4" fill="#12372a" />
      <circle cx="220" cy="218" r="4" fill="#12372a" />
      <circle cx="342" cy="218" r="4" fill="#12372a" />
      <circle cx="368" cy="218" r="4" fill="#12372a" />

      <g transform="translate(199 25)">
        <rect width="162" height="78" rx="28" fill="white" />
        <path d="m38 76-10 18 28-17" fill="white" />
        <path
          d="M81 61 58 41C39 24 63 5 81 23c18-18 42 1 23 18L81 61Z"
          fill="#ff7a59"
        />
      </g>
      <path d="M91 307c-14-18-21-41-21-68" fill="none" stroke="#83ad8e" strokeWidth="8" strokeLinecap="round" />
      <path d="M469 305c14-18 21-41 21-68" fill="none" stroke="#83ad8e" strokeWidth="8" strokeLinecap="round" />
      <circle cx="73" cy="220" r="10" fill="#f4c95d" />
      <circle cx="488" cy="213" r="12" fill="#ff7a59" />
    </svg>
  )
}

export default function HomePage() {
  const [showName, setShowName] = useState(false)

  return (
    <div className="overflow-hidden bg-sky-50 text-navy">
      <section className="relative isolate bg-mint-50">
        <div className="mx-auto grid min-h-[660px] w-full max-w-7xl items-center gap-8 px-5 pb-20 pt-14 sm:px-8 lg:grid-cols-[1.08fr_0.92fr] lg:px-12 lg:pb-24 lg:pt-10">
          <div className="relative z-10 max-w-2xl">
            <span className="inline-flex -rotate-2 rounded-full bg-amber px-5 py-2 text-sm font-bold text-navy sm:text-base">
              Tempat curhat yang aman
            </span>
            <h1 className="mt-7 max-w-[680px] text-[2.75rem] font-extrabold leading-[1.08] tracking-[-0.055em] sm:text-6xl lg:text-[4.2rem]">
              Mau cerita apa hari ini?
            </h1>
            <p className="mt-6 max-w-xl text-base leading-8 text-body sm:text-lg">
              Diejek? Dikucilkan? Atau ada hal lain yang bikin tidak nyaman?
              Tulis di komputer pojok curhat. Namamu aman dari pengurus dan
              pimpinan.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                to="/login"
                className="inline-flex min-h-14 items-center gap-2 rounded-[1.4rem] bg-salmon px-7 font-extrabold text-navy shadow-[0_8px_0_#e86c50] transition hover:-translate-y-0.5 hover:shadow-[0_10px_0_#e86c50] active:translate-y-1 active:shadow-[0_4px_0_#e86c50]"
              >
                Mulai bercerita <ArrowRight aria-hidden="true" className="size-5" />
              </Link>
              <a
                href="#coba"
                className="inline-flex min-h-12 items-center gap-2 px-2 font-bold text-navy transition hover:text-primary"
              >
                Coba dulu, lihat cara kerjanya
                <ArrowDown aria-hidden="true" className="size-4" />
              </a>
            </div>
            <div className="mt-10 flex flex-wrap gap-x-6 gap-y-3 text-sm font-semibold text-navy">
              <span className="inline-flex items-center gap-2">
                <ShieldCheck aria-hidden="true" className="size-5 text-primary" />
                Privasi dijaga
              </span>
              <span className="inline-flex items-center gap-2">
                <LockKeyhole aria-hidden="true" className="size-5 text-primary" />
                Keluar otomatis
              </span>
            </div>
          </div>
          <div className="relative mx-auto w-full max-w-xl lg:max-w-none">
            <div className="absolute -inset-4 rounded-[45%] bg-white/40 blur-2xl" />
            <ConversationIllustration />
            <Mascot className="absolute -top-4 left-2 z-20 size-24 sm:size-28" />
            <div className="absolute bottom-8 left-0 z-20 rounded-2xl bg-white px-4 py-3 shadow-[0_12px_30px_rgba(18,55,42,0.12)] sm:bottom-10 sm:left-2">
              <p className="text-xs font-medium text-body">Namamu</p>
              <p className="font-extrabold text-navy">disembunyikan</p>
            </div>
            <div className="absolute right-0 top-10 z-20 rounded-2xl bg-white px-4 py-3 shadow-[0_12px_30px_rgba(18,55,42,0.12)] sm:right-2">
              <p className="text-xs font-medium text-body">Ditanggapi</p>
              <p className="font-extrabold text-navy">dalam 24 jam</p>
            </div>
          </div>
        </div>
        <div className="absolute inset-x-0 bottom-0 h-8 rounded-t-[50%] bg-sky-50" />
      </section>

      <section className="bg-navy px-5 py-16 text-white sm:px-8 sm:py-20">
        <div className="mx-auto max-w-5xl">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-amber">
              Kamu tidak sendirian
            </p>
            <h2 className="mt-4 text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-4xl">
              Kadang yang berat bukan kejadiannya, tapi bercerita
            </h2>
            <p className="mt-3 text-sm text-white/70">
              Perasaan seperti ini wajar. Kamu berhak mendapat ruang untuk didengar.
            </p>
          </div>
          <div className="mt-9 grid gap-3 sm:grid-cols-3">
            {[
              '“Aku takut dibilang melawan ustaz.”',
              '“Aku nggak punya HP buat lapor.”',
              '“Kalau ketahuan, nanti dibalas.”',
            ].map((quote, index) => (
              <p
                key={quote}
                className={`rounded-[1.4rem] p-5 text-center text-base font-bold leading-relaxed text-navy sm:text-lg ${
                  ['bg-mint-50', 'bg-amber', 'bg-salmon'][index]
                }`}
              >
                {quote}
              </p>
            ))}
          </div>
          <p className="mx-auto mt-8 max-w-3xl text-center text-sm leading-7 text-white/75">
            Sahabat Pesantren dibuat agar bercerita terasa lebih mudah dan aman —
            lewat komputer yang tersedia di lingkungan pesantren, tanpa perlu
            ponsel pribadi.
          </p>
        </div>
      </section>

      <section id="coba" className="scroll-mt-32 bg-sky-50 px-5 py-16 sm:px-8 sm:py-24">
        <div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="text-sm font-extrabold uppercase tracking-[0.15em] text-primary">
              Coba sendiri
            </p>
            <h2 className="mt-3 text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">
              Kamu yang pegang kendali atas namamu
            </h2>
            <p className="mt-4 max-w-lg leading-7 text-body">
              Secara bawaan namamu tidak ditampilkan. Geser tombolnya dan lihat
              apa yang berubah bagi petugas.
            </p>
          </div>
          <div className="rounded-[2rem] bg-white p-5 shadow-[0_18px_55px_rgba(18,55,42,0.09)] sm:p-8">
            <div className="flex items-center justify-between gap-4 border-b border-line pb-5">
              <div>
                <p className="font-extrabold text-navy">Tampilkan namaku ke petugas</p>
                <p className="mt-1 text-sm text-body">Kamu bisa mengubahnya kapan saja.</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={showName}
                aria-label="Tampilkan namaku ke petugas"
                onClick={() => setShowName((visible) => !visible)}
                className={`relative inline-flex h-8 w-14 shrink-0 items-center rounded-full p-1 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
                  showName ? 'bg-primary' : 'bg-[#d9ded8]'
                }`}
              >
                <span
                  className={`size-6 rounded-full bg-white shadow-sm transition-transform ${
                    showName ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
            <div className="grid gap-3 pt-5 sm:grid-cols-2">
              {['Pengurus melihat', 'Pimpinan melihat'].map((label) => (
                <div key={label} className="rounded-2xl bg-band-1 p-4">
                  <p className="text-sm font-semibold text-body">{label}</p>
                  <p className="mt-2 flex items-center gap-2 font-extrabold text-navy">
                    {showName ? (
                      <>
                        <Eye aria-hidden="true" className="size-4 text-primary" />
                        Namamu ditampilkan
                      </>
                    ) : (
                      <>
                        <EyeOff aria-hidden="true" className="size-4 text-primary" />
                        Santri anonim
                      </>
                    )}
                  </p>
                </div>
              ))}
            </div>
            <p aria-live="polite" className="mt-4 text-sm leading-6 text-body">
              {showName
                ? 'Namamu akan terlihat oleh petugas yang menangani laporan ini.'
                : 'Mati. Tidak ada yang bisa melihat namamu. Hanya kamu yang bisa menyalakannya.'}
            </p>
          </div>
        </div>
      </section>

      <section id="cara" className="scroll-mt-32 bg-mint-50 px-5 py-16 sm:px-8 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-extrabold uppercase tracking-[0.15em] text-primary">
              Cara kerja
            </p>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
              Tiga langkah, tanpa ribet
            </h2>
          </div>
          <ol className="mt-10 grid gap-4 md:grid-cols-3">
            {STEPS.map(({ number, title, text }, index) => (
              <li
                key={number}
                className={`rounded-[1.8rem] p-6 sm:p-8 ${
                  ['bg-white', 'bg-amber', 'bg-salmon'][index]
                }`}
              >
                <span className="grid size-12 place-items-center rounded-2xl bg-navy text-lg font-extrabold text-white">
                  {number}
                </span>
                <h3 className="mt-6 text-2xl font-extrabold">{title}</h3>
                <p className="mt-3 leading-7 text-body">{text}</p>
              </li>
            ))}
          </ol>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-2 text-sm font-semibold text-primary">
            <Check aria-hidden="true" className="size-5" />
            Laporan belum ditangani dalam 24 jam akan diteruskan ke pimpinan.
          </div>
        </div>
      </section>

      <section className="bg-salmon px-5 py-14 sm:px-8 sm:py-20">
        <div className="mx-auto flex max-w-5xl flex-col items-start justify-between gap-7 md:flex-row md:items-center">
          <div className="max-w-2xl">
            <p className="text-sm font-extrabold uppercase tracking-[0.15em] text-navy/70">
              Mulai dari satu kalimat
            </p>
            <h2 className="mt-3 text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">
              Sisanya kami bantu.
            </h2>
          </div>
          <Link
            to="/login"
            className="inline-flex min-h-14 shrink-0 items-center gap-2 rounded-[1.4rem] bg-navy px-7 font-extrabold text-white transition hover:-translate-y-0.5 hover:bg-primary-hover"
          >
            Mulai bercerita <ArrowRight aria-hidden="true" className="size-5" />
          </Link>
        </div>
      </section>

      <section
        id="bantuan"
        className="scroll-mt-32 bg-sky-50 px-5 py-16 sm:px-8 sm:py-24"
      >
        <div className="mx-auto max-w-3xl">
          <div className="text-center">
            <MessageCircle aria-hidden="true" className="mx-auto size-9 text-primary" />
            <h2 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl">
              Masih ragu?
            </h2>
          </div>
          <div className="mt-8 space-y-3">
            {QUESTIONS.map(({ question, answer }) => (
              <details
                key={question}
                className="group rounded-2xl bg-white p-5 shadow-[0_8px_24px_rgba(18,55,42,0.06)]"
              >
                <summary className="cursor-pointer list-none pr-8 font-extrabold text-navy marker:hidden">
                  <span className="flex items-center justify-between gap-4">
                    {question}
                    <span className="grid size-8 shrink-0 place-items-center rounded-full bg-mint-50 text-primary transition-transform group-open:rotate-45">
                      <span aria-hidden="true" className="text-xl leading-none">+</span>
                    </span>
                  </span>
                </summary>
                <p className="mt-4 max-w-2xl leading-7 text-body">{answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
