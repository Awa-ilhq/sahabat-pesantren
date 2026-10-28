import { Menu, X } from 'lucide-react'
import { useState } from 'react'
import { Link, Outlet } from 'react-router-dom'
import Brand from '../components/Brand'
import DemoBanner from '../components/DemoBanner'
import ButtonLink from '../components/ui/ButtonLink'
import { useAuth } from '../features/auth/auth-context'
import { homeForRole } from '../lib/constants'
import { USE_MOCK } from '../lib/env'

const NAV_ITEMS = [
  ['Coba sendiri', '/#coba'],
  ['Cara kerja', '/#cara'],
  ['Bantuan', '/#bantuan'],
]

export function PublicLayout() {
  const [menuOpen, setMenuOpen] = useState(false)
  const { user, isAuthenticated } = useAuth()
  const destination =
    isAuthenticated && user
      ? user.mustChangePassword
        ? '/ganti-password'
        : homeForRole(user.role)
      : '/login'
  const actionLabel = isAuthenticated ? 'Dashboard' : 'Masuk'

  const closeMenu = () => setMenuOpen(false)

  return (
    <div className="flex min-h-svh flex-col bg-mint-50">
      <header className="fixed inset-x-0 top-0 z-30 w-full bg-mint-50">
        <DemoBanner />
        <div className="mx-auto flex min-h-[92px] w-full max-w-7xl items-center justify-between gap-5 px-5 sm:px-8 lg:px-12">
          <Link to="/" aria-label="Beranda Sahabat Pesantren" onClick={closeMenu}>
            <Brand />
          </Link>
          <nav aria-label="Navigasi utama" className="hidden items-center gap-10 lg:flex">
            {NAV_ITEMS.map(([label, href]) => (
              <a key={label} href={href} className="text-sm font-bold text-navy transition hover:text-primary-hover">
                {label}
              </a>
            ))}
          </nav>
          <div className="hidden lg:block">
            <ButtonLink to={destination} size="sm" className="min-w-32 bg-navy text-white hover:bg-primary-hover">{actionLabel}</ButtonLink>
          </div>
          <button
            type="button"
            aria-label={menuOpen ? 'Tutup menu' : 'Buka menu'}
            aria-expanded={menuOpen}
            aria-controls="public-mobile-menu"
            className="inline-flex size-11 items-center justify-center rounded-xl text-navy hover:bg-white/70 lg:hidden"
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
          </button>
        </div>
        {menuOpen ? (
          <nav id="public-mobile-menu" aria-label="Navigasi utama seluler" className="border-t border-primary/10 bg-mint-50 px-5 py-4 lg:hidden">
            <div className="mx-auto flex max-w-7xl flex-col gap-1 sm:px-5">
              {NAV_ITEMS.map(([label, href]) => (
                <a key={label} href={href} onClick={closeMenu} className="rounded-xl px-4 py-3 font-semibold text-navy hover:bg-white/70">
                  {label}
                </a>
              ))}
              <ButtonLink to={destination} className="mt-2 bg-navy text-white hover:bg-primary-hover" onClick={closeMenu}>{actionLabel}</ButtonLink>
            </div>
          </nav>
        ) : null}
      </header>

      <main className={`flex-1 ${USE_MOCK ? 'pt-[124px]' : 'pt-[92px]'}`}>
        <Outlet />
      </main>

      <footer className="bg-navy text-white">
        <div className="mx-auto grid w-full max-w-7xl gap-10 px-5 py-12 sm:px-8 md:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr] lg:px-12">
          <div>
            <Brand tone="light" />
            <p className="mt-4 max-w-md text-sm leading-6 text-white/70">
              Ruang aman santri untuk bersuara, bercerita, dan memantau tindak lanjut laporan.
            </p>
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Navigasi</h2>
            <ul className="mt-4 space-y-2 text-sm text-white/75">
              {NAV_ITEMS.map(([label, href]) => <li key={label}><a href={href} className="hover:text-amber">{label}</a></li>)}
            </ul>
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Peran</h2>
            <ul className="mt-4 space-y-2 text-sm text-white/75">
              {['Santri', 'Pengurus', 'Pimpinan'].map((role) => <li key={role}><Link to="/login" className="hover:text-amber">{role}</Link></li>)}
            </ul>
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Bantuan</h2>
            <ul className="mt-4 space-y-2 text-sm text-white/75">
              <li><Link to={destination} className="hover:text-amber">{actionLabel}</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-white/15 px-5 py-5 text-center text-xs text-white/65">
          <p>© 2026 Sahabat Pesantren · Karya UINIC 8.0</p>
          {USE_MOCK ? <p className="mt-1">Data pada demo ini adalah data contoh.</p> : null}
        </div>
      </footer>
    </div>
  )
}
