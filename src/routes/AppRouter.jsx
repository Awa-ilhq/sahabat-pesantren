import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import PageFallback from '../components/PageFallback'
import { RedirectIfAuthenticated } from '../features/auth/RedirectIfAuthenticated'
import { RequireAuth } from '../features/auth/RequireAuth'
import { PublicLayout } from '../layouts/PublicLayout'
import { SantriLayout } from '../layouts/SantriLayout'
import { StaffLayout } from '../layouts/StaffLayout'
import { ROLES } from '../lib/constants'

const HomePage = lazy(() => import('../pages/HomePage'))
const LoginPage = lazy(() => import('../pages/LoginPage'))
const ChangePasswordPage = lazy(() => import('../pages/ChangePasswordPage'))
const ProfilePage = lazy(() => import('../pages/ProfilePage'))
const NotifikasiPage = lazy(() => import('../pages/NotifikasiPage'))
const CreateReportPage = lazy(() => import('../pages/santri/CreateReportPage'))
const TemanCeritaPage = lazy(
  () => import('../pages/santri/TemanCeritaPage'),
)
const MyReportsPage = lazy(() => import('../pages/santri/MyReportsPage'))
const SantriReportDetailPage = lazy(
  () => import('../pages/santri/SantriReportDetailPage'),
)
const StaffReportListPage = lazy(
  () => import('../pages/staff/StaffReportListPage'),
)
const StaffReportDetailPage = lazy(
  () => import('../pages/staff/StaffReportDetailPage'),
)
const DashboardPage = lazy(() => import('../pages/pimpinan/DashboardPage'))
const StaffDashboardPage = lazy(
  () => import('../pages/staff/StaffDashboardPage'),
)
const AccountsPage = lazy(() => import('../pages/pimpinan/AccountsPage'))
const DeactivationRequestsPage = lazy(
  () => import('../pages/pimpinan/DeactivationRequestsPage'),
)
const PengawasDashboardPage = lazy(
  () => import('../pages/pengawas/PengawasDashboardPage'),
)
const SensitiveReportListPage = lazy(
  () => import('../pages/pengawas/SensitiveReportListPage'),
)
const AuditLogPage = lazy(() => import('../pages/pengawas/AuditLogPage'))
const ForbiddenPage = lazy(() => import('../pages/ForbiddenPage'))
const NotFoundPage = lazy(() => import('../pages/NotFoundPage'))

export default function AppRouter() {
  return (
    <Suspense fallback={<PageFallback />}>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route path="/" element={<HomePage />} />
        </Route>

        <Route
          path="/login"
          element={
            <RedirectIfAuthenticated>
              <LoginPage />
            </RedirectIfAuthenticated>
          }
        />

        <Route
          path="/ganti-password"
          element={
            <RequireAuth>
              <ChangePasswordPage />
            </RequireAuth>
          }
        />

        <Route
          path="/santri"
          element={
            <RequireAuth roles={[ROLES.SANTRI]}>
              <SantriLayout />
            </RequireAuth>
          }
        >
          <Route index element={<Navigate to="buat-laporan" replace />} />
          <Route path="buat-laporan" element={<CreateReportPage />} />
          <Route path="teman-cerita" element={<TemanCeritaPage />} />
          <Route path="laporan-saya" element={<MyReportsPage />} />
          <Route path="laporan/:id" element={<SantriReportDetailPage />} />
          <Route path="notifikasi" element={<NotifikasiPage />} />
          <Route path="profil" element={<ProfilePage />} />
        </Route>

        <Route
          path="/petugas"
          element={
            <RequireAuth roles={[ROLES.PENGURUS, ROLES.PIMPINAN]}>
              <StaffLayout />
            </RequireAuth>
          }
        >
          <Route index element={<StaffReportListPage />} />
          <Route
            path="dashboard"
            element={
              <RequireAuth roles={[ROLES.PENGURUS]}>
                <StaffDashboardPage />
              </RequireAuth>
            }
          />
          <Route path="laporan/:id" element={<StaffReportDetailPage />} />
          <Route path="notifikasi" element={<NotifikasiPage />} />
          <Route path="profil" element={<ProfilePage />} />
        </Route>

        <Route
          path="/pimpinan"
          element={
            <RequireAuth roles={[ROLES.PIMPINAN]}>
              <StaffLayout />
            </RequireAuth>
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="akun" element={<AccountsPage />} />
          <Route path="audit" element={<AuditLogPage />} />
          <Route path="pengajuan" element={<DeactivationRequestsPage />} />
          <Route path="notifikasi" element={<NotifikasiPage />} />
          <Route path="profil" element={<ProfilePage />} />
        </Route>

        <Route
          path="/dashboard/pengawas"
          element={
            <RequireAuth roles={[ROLES.PENGAWAS, ROLES.PIMPINAN]}>
              <StaffLayout />
            </RequireAuth>
          }
        >
          <Route index element={<PengawasDashboardPage />} />
          <Route
            path="laporan"
            element={
              <RequireAuth roles={[ROLES.PENGAWAS]}>
                <SensitiveReportListPage />
              </RequireAuth>
            }
          />
          <Route
            path="laporan/:id"
            element={
              <RequireAuth roles={[ROLES.PENGAWAS]}>
                <StaffReportDetailPage />
              </RequireAuth>
            }
          />
          <Route path="audit" element={<AuditLogPage />} />
          <Route path="notifikasi" element={<NotifikasiPage />} />
          <Route path="profil" element={<ProfilePage />} />
        </Route>

        <Route
          path="/pengawas"
          element={<Navigate to="/dashboard/pengawas" replace />}
        />
        <Route
          path="/pengawas/dashboard"
          element={<Navigate to="/dashboard/pengawas" replace />}
        />

        <Route path="/403" element={<ForbiddenPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  )
}
