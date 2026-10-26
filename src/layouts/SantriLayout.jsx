import { Bell, FilePlus2, FileText, Sparkles } from 'lucide-react'
import { useCallback, useEffect, useRef } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import DemoBanner from '../components/DemoBanner'
import AuthenticatedHeader from './AuthenticatedHeader'
import AuthenticatedNavigation from './AuthenticatedNavigation'
import { IdleWarning } from '../features/auth/IdleWarning'
import { useAuth } from '../features/auth/auth-context'
import { useIdleTimer } from '../features/auth/useIdleTimer'
import { useNotificationSummary } from '../features/notifications/hooks'
import { ROLES, ROLE_LABELS } from '../lib/constants'
import { IDLE_TIMEOUT_SECONDS } from '../lib/env'

const NAV_ITEMS = [
  { to: '/santri/buat-laporan', label: 'Buat Laporan', icon: FilePlus2 },
  { to: '/santri/teman-cerita', label: 'Teman Cerita', icon: Sparkles },
  { to: '/santri/laporan-saya', label: 'Laporan Saya', icon: FileText },
]

export function SantriLayout() {
  const { user, logout, quickExit } = useAuth()
  const navigate = useNavigate()
  const lastEscape = useRef(0)
  const { data: notificationSummary } = useNotificationSummary()

  const notificationCount = Number(notificationSummary?.total ?? 0)
  const items = [
    ...NAV_ITEMS,
    {
      to: '/santri/notifikasi',
      label: 'Notifikasi',
      icon: Bell,
      badge: notificationCount,
    },
  ]

  const handleIdle = useCallback(() => {
    logout()
    navigate('/login', {
      replace: true,
      state: { message: 'Sesi berakhir karena tidak ada aktivitas.' },
    })
  }, [logout, navigate])

  const { secondsLeft, stay } = useIdleTimer({
    timeoutSeconds: IDLE_TIMEOUT_SECONDS,
    onIdle: handleIdle,
  })

  useEffect(() => {
    if (user?.role !== ROLES.SANTRI) return undefined

    const handleKeyDown = (event) => {
      if (
        event.key !== 'Escape' ||
        event.repeat ||
        event.defaultPrevented ||
        event.target.closest?.('[role="dialog"], [role="alertdialog"], [aria-modal="true"]')
      ) {
        return
      }

      const now = Date.now()
      if (now - lastEscape.current <= 600) {
        lastEscape.current = 0
        event.preventDefault()
        quickExit()
      } else {
        lastEscape.current = now
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [user?.role, quickExit])

  return (
    <div className="flex min-h-svh flex-col bg-[#edf6f0] text-[#12372a]">
      <DemoBanner />
      <div className="flex min-h-0 flex-1">
        <AuthenticatedNavigation
          items={items}
          homePath={NAV_ITEMS[0].to}
          label="Navigasi santri"
          darkSidebar
          user={user}
          roleLabel={ROLE_LABELS[ROLES.SANTRI]}
          onExit={quickExit}
          sidebarNote={{
            title: 'Privasi tetap terjaga',
            description: 'Gunakan Keluar Cepat saat meninggalkan komputer pojok curhat.',
          }}
        />
        <div className="flex min-w-0 flex-1 flex-col">
          <AuthenticatedHeader
            homePath={NAV_ITEMS[0].to}
            user={user}
            roleLabel={ROLE_LABELS[ROLES.SANTRI]}
            exitLabel="Keluar Cepat"
            onExit={quickExit}
          />
          <main className="w-full flex-1 px-4 py-6 pb-24 sm:px-6 lg:px-8 lg:py-8 lg:pb-10">
            <Outlet />
          </main>
        </div>
      </div>
      <IdleWarning secondsLeft={secondsLeft} onStay={stay} onLogout={handleIdle} />
    </div>
  )
}
