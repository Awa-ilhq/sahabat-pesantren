import { Link, NavLink, useLocation } from 'react-router-dom'
import Brand from '../components/Brand'
import { cn } from '../lib/cn'
import { USE_MOCK } from '../lib/env'

function AuthenticatedNavigation({
  items,
  homePath,
  label,
  sidebarNote,
  darkSidebar = false,
  user,
  roleLabel,
  onExit,
}) {
  const { pathname } = useLocation()
  const profilePath =
    user?.role === 'santri'
      ? '/santri/profil'
      : user?.role === 'pimpinan'
        ? '/pimpinan/profil'
        : user?.role === 'pengawas'
          ? '/dashboard/pengawas/profil'
          : '/petugas/profil'

  const linkClass = ({ isActive }) =>
    cn(
      'flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold transition-colors',
      darkSidebar
        ? isActive
          ? 'bg-[#ffd166] text-[#12372a]'
          : 'text-white/75 hover:bg-white/10 hover:text-white'
        : isActive
          ? 'bg-[#0d352a] text-white shadow-[0_3px_0_#09281f]'
          : 'text-[#315344] hover:bg-[#edf6f0]',
    )

  return (
    <>
      <aside
        className={cn(
          cn(
            'sticky top-0 hidden shrink-0 flex-col px-3.5 py-5 lg:flex',
            USE_MOCK ? 'h-[calc(100svh-2rem)]' : 'h-svh',
          ),
          darkSidebar
            ? 'w-64 bg-[#103a2e] text-white'
            : 'w-72 border-r border-[#d3e2d8] bg-white/90 px-6 py-7',
        )}
      >
        <NavLink to={homePath} aria-label="Sahabat Pesantren" className="px-2">
          {darkSidebar ? (
            <span className="inline-flex items-center gap-2.5">
              <Brand tone="light" showText={false} className="[&>svg]:size-8" />
              <span className="text-sm font-extrabold leading-4 text-white">
                Sahabat
                <br />
                Pesantren
              </span>
            </span>
          ) : (
            <Brand />
          )}
        </NavLink>
        <p className={cn(
          'mt-8 px-2.5 text-[10px] font-extrabold uppercase tracking-[0.14em]',
          darkSidebar ? 'text-white/50' : 'text-[#718078]',
        )}>
          Menu utama
        </p>
        <nav aria-label={label} className="mt-2 flex flex-col gap-1">
          {items.map(
            ({ to, label: itemLabel, icon: Icon, end, matchPrefix, badge = 0 }) => {
              const badgeLabel = badge > 99 ? '99+' : String(badge)
              return (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  className={(state) =>
                    linkClass({
                      isActive:
                        state.isActive ||
                        (matchPrefix && pathname.startsWith(matchPrefix)),
                    })
                  }
                >
                  <Icon aria-hidden="true" className="size-5 shrink-0" />
                  <span className="min-w-0 flex-1 truncate">{itemLabel}</span>
                  {badge > 0 ? (
                    <span
                      aria-hidden="true"
                      className={cn(
                        'min-w-6 shrink-0 rounded-full bg-[#ff7a59] px-1.5 py-0.5 text-center text-[10px] font-extrabold leading-4 text-white',
                      )}
                    >
                      {badgeLabel}
                    </span>
                  ) : null}
                  {badge > 0 ? (
                    <span className="sr-only">{badge} pembaruan</span>
                  ) : null}
                </NavLink>
              )
            },
          )}
        </nav>
        {darkSidebar ? (
          <div className="mt-auto flex flex-col gap-3">
            {sidebarNote ? (
              <div className="px-2.5">
                <p className="text-xs font-bold text-white/80">{sidebarNote.title}</p>
                <p className="mt-1 text-[10px] leading-4 text-white/50">
                  {sidebarNote.description}
                </p>
              </div>
            ) : null}
            <div className="flex min-w-0 items-center gap-2.5 rounded-2xl bg-white/10 p-2.5">
              <Link
                to={profilePath}
                aria-label="Buka profil"
                className="flex min-w-0 flex-1 items-center gap-2.5 rounded-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#ff7a59] text-sm font-extrabold text-[#12372a]">
                  {user?.name?.trim()?.charAt(0)?.toLocaleUpperCase() ?? 'P'}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-xs font-bold leading-4 text-white">
                    {user?.name}
                  </span>
                  <span className="block truncate text-[10px] leading-4 text-white/55">
                    {roleLabel}
                  </span>
                </span>
              </Link>
              <button
                type="button"
                onClick={onExit}
                className="shrink-0 rounded-lg px-1.5 py-2 text-[10px] font-medium text-white/55 transition hover:bg-white/10 hover:text-white focus-visible:outline-white"
              >
                Keluar
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-auto flex flex-col gap-3">
            {sidebarNote ? (
              <div className="rounded-2xl border border-[#d3e2d8] bg-[#edf6f0] p-4">
                <p className="text-sm font-extrabold text-[#163b2f]">{sidebarNote.title}</p>
                <p className="mt-1 text-xs leading-5 text-[#718078]">{sidebarNote.description}</p>
              </div>
            ) : null}
          </div>
        )}
      </aside>

      <nav
        aria-label={label}
        className="fixed inset-x-0 bottom-0 z-40 flex border-t border-[#d3e2d8] bg-[#edf6f0]/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
      >
        {items.map(({ to, label: itemLabel, icon: Icon, end, matchPrefix, badge = 0 }) => {
          const badgeLabel = badge > 99 ? '99+' : String(badge)
          return (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  'flex min-h-16 flex-1 flex-col items-center justify-center gap-1 px-1 py-2 text-[11px] font-bold transition-colors',
                  isActive ||
                    (matchPrefix && pathname.startsWith(matchPrefix))
                    ? 'text-[#0d352a]'
                    : 'text-[#718078]',
                )
              }
            >
              <span className="relative">
                <Icon aria-hidden="true" className="size-5" />
                {badge > 0 ? (
                  <span
                    aria-hidden="true"
                    className="absolute -right-2.5 -top-2 flex min-w-4 items-center justify-center rounded-full bg-[#ff7a59] px-1 text-[9px] font-extrabold leading-4 text-white"
                  >
                    {badgeLabel}
                  </span>
                ) : null}
              </span>
              <span className="max-w-full truncate">{itemLabel}</span>
              {badge > 0 ? (
                <span className="sr-only">{badge} pembaruan</span>
              ) : null}
            </NavLink>
          )
        })}
      </nav>
    </>
  )
}

export default AuthenticatedNavigation
