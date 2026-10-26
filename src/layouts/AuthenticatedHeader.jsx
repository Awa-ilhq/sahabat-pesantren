import { LogOut } from 'lucide-react'
import { Link } from 'react-router-dom'
import Brand from '../components/Brand'

function AuthenticatedHeader({ homePath, user, roleLabel, exitLabel, onExit }) {
  const profilePath =
    user?.role === 'santri'
      ? '/santri/profil'
      : user?.role === 'pimpinan'
        ? '/pimpinan/profil'
        : user?.role === 'pengawas'
          ? '/dashboard/pengawas/profil'
          : '/petugas/profil'

  return (
    <header className="sticky top-0 z-40 border-b border-[#d3e2d8] bg-[#edf6f0]/95 backdrop-blur lg:hidden">
      <div className="flex min-h-[68px] w-full items-center justify-between gap-3 px-4 sm:px-6 lg:min-h-[76px] lg:px-8">
        <Link
          to={homePath}
          aria-label="Sahabat Pesantren"
          className="shrink-0 lg:hidden"
        >
          <Brand className="gap-2" showText={false} />
        </Link>

        <Link
          to={profilePath}
          aria-label="Buka profil"
          className="min-w-0 flex-1 rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0d352a] lg:flex-none"
        >
          <div className="min-w-0 text-right">
            <p className="max-w-60 truncate text-xs font-bold text-[#163b2f]">
              {user?.name}
            </p>
            <p className="text-[10px] font-medium text-[#718078]">{roleLabel}</p>
          </div>
        </Link>

        <button
          type="button"
          onClick={onExit}
          aria-label={exitLabel}
          className="inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-full bg-salmon px-3 text-xs font-extrabold text-[#163b2f] shadow-[0_3px_0_#df664d] transition hover:-translate-y-px hover:shadow-[0_4px_0_#df664d] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0d352a] sm:px-4"
        >
          <LogOut aria-hidden="true" className="size-3.5" />
          <span className="hidden min-[360px]:inline">{exitLabel}</span>
        </button>
      </div>
    </header>
  )
}

export default AuthenticatedHeader
