import {
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Eye,
  EyeOff,
  Plus,
  Upload,
  UserPlus,
  Users,
  XCircle,
} from 'lucide-react'
import { useDeferredValue, useRef, useState } from 'react'
import Button from '../../components/ui/Button'

import Card from '../../components/ui/Card'
import ErrorState from '../../components/ui/ErrorState'
import Input from '../../components/ui/Input'
import Modal from '../../components/ui/Modal'
import Select from '../../components/ui/Select'
import Skeleton from '../../components/ui/Skeleton'
import { useToast } from '../../components/ui/toast-context'
import {
  useAccounts,
  useCreateAccount,
  useImportSantri,
  usePreviewImport,
  useSetAccountActive,
  useExportSantri,
} from '../../features/accounts/hooks'
import { cn } from '../../lib/cn'
import { MAX_IMPORT_BYTES, ROLE_LABELS, ROLES } from '../../lib/constants'
import { downloadBlob } from '../../lib/download'

const ACTIVE_OPTIONS = [
  { value: '', label: 'Semua status' },
  { value: 'true', label: 'Aktif' },
  { value: 'false', label: 'Nonaktif' },
]

const ACCOUNT_CARD_SURFACE =
  '!border !border-[#e1e9e2] !shadow-[0_2px_10px_rgba(18,55,42,0.06)]'
const ACCEPTED_EXT = ['.xlsx']

function AccountsTab({ role }) {
  const toast = useToast()
  const [filters, setFilters] = useState({ q: '', active: '' })
  const deferredQuery = useDeferredValue(filters.q)
  const { data, isLoading, isError, refetch } = useAccounts({ role })
  const visibleAccounts = (data?.items ?? []).filter((account) => {
    const query = deferredQuery.trim().toLocaleLowerCase()
    const matchesQuery =
      !query ||
      [account.name, account.username]
        .filter(Boolean)
        .some((value) => String(value).toLocaleLowerCase().includes(query))
    const matchesActive =
      filters.active === '' || account.active === (filters.active === 'true')
    return account.role === role && matchesQuery && matchesActive
  })
  const setActive = useSetAccountActive()
  const createAccount = useCreateAccount()

  const [open, setOpen] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [pendingApproval, setPendingApproval] = useState(null)

  const submit = async (event) => {
    event.preventDefault()
    setErrors({})
    try {
      await createAccount.mutateAsync({
        name: form.name,
        email: form.email,
        password: form.password,
      })
      toast.showToast(
        `Akun ${ROLE_LABELS[role].toLowerCase()} dibuat. Pemilik akun wajib mengganti kata sandi saat pertama masuk.`,
        'success',
      )
      setOpen(false)
      setShowPassword(false)
      setForm({ name: '', email: '', password: '' })
    } catch (error) {
      if (error?.status === 422 && error.errors) {
        setErrors(error.errors)
      } else {
        toast.showToast(error?.message ?? 'Gagal membuat akun.', 'error')
      }
    }
  }

  const toggleActive = (account) => {
    if (account.role === ROLES.PIMPINAN) {
      toast.showToast('Akun pimpinan tidak dapat dinonaktifkan.', 'error')
      return
    }
    setActive.mutate(
      { id: account.id, active: !account.active },
      {
        onSuccess: () =>
          toast.showToast(
            account.active ? 'Akun dinonaktifkan.' : 'Akun diaktifkan.',
            'success',
          ),
        onError: (error) => {
          if (error?.requiresApproval) {
            setPendingApproval({
              name: account.name,
              message: error.message,
            })
            return
          }
          toast.showToast(
            error?.message ?? 'Gagal mengubah status akun.',
            'error',
          )
        },
      },
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <Card className={`${ACCOUNT_CARD_SURFACE} p-4`}>
        <div className="grid gap-3 sm:grid-cols-2">
          <Input
            id={`akun-cari-${role}`}
            label="Cari"
            placeholder={
              role === ROLES.SANTRI ? 'Nama atau NIS' : 'Nama atau email'
            }
            autoComplete="off"
            value={filters.q}
            onChange={(event) =>
              setFilters((prev) => ({ ...prev, q: event.target.value }))
            }
          />
          <Select
            id="akun-aktif"
            label="Status"
            options={ACTIVE_OPTIONS}
            value={filters.active}
            onChange={(event) =>
              setFilters((prev) => ({ ...prev, active: event.target.value }))
            }
          />
        </div>
        {role === ROLES.PENGURUS ? (
          <div className="mt-4 flex justify-end">
            <Button size="sm" onClick={() => setOpen(true)}>
              <Plus aria-hidden="true" className="size-4" />
              Tambah akun pengurus
            </Button>
          </div>
        ) : null}
      </Card>

      {isLoading ? (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      ) : isError ? (
        <ErrorState message="Daftar akun gagal dimuat." onRetry={refetch} />
      ) : visibleAccounts.length ? (
        <ul className="flex flex-col gap-3">
          {visibleAccounts.map((account) => (
            <li key={account.id}>
              <Card
                className={`${ACCOUNT_CARD_SURFACE} flex flex-wrap items-center justify-between gap-3 p-4`}
              >
                <div className="flex items-center gap-3">
                  <span className="flex size-10 items-center justify-center rounded-2xl bg-amber/15 text-primary">
                    <Users aria-hidden="true" className="size-5" />
                  </span>
                  <div>
                    <p className="font-semibold text-navy">{account.name}</p>
                    <p className="text-sm text-body">
                      {account.username
                        ? role === ROLES.SANTRI
                          ? `NIS: ${account.username}`
                          : account.username
                        : 'Identitas belum tersedia'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={cn(
                      'inline-flex items-center gap-1 rounded-full border px-3 py-1 text-sm font-semibold',
                      account.active
                        ? 'border-status-done/30 bg-status-done-bg text-status-done'
                        : 'border-border bg-band-1 text-body',
                    )}
                  >
                    {account.active ? (
                      <CheckCircle2 aria-hidden="true" className="size-4" />
                    ) : (
                      <XCircle aria-hidden="true" className="size-4" />
                    )}
                    {account.active ? 'Aktif' : 'Nonaktif'}
                  </span>
                  {account.role === ROLES.PIMPINAN ? (
                    <span className="rounded-full bg-band-1 px-3 py-1 text-xs font-semibold text-body">
                      Akun Utama
                    </span>
                  ) : (
                    <Button
                    variant="secondary"
                    size="sm"
                    loading={setActive.isPending}
                    onClick={() => toggleActive(account)}
                  >
                    {account.active ? 'Nonaktifkan' : 'Aktifkan'}
                  </Button>
                  )}
                </div>
              </Card>
            </li>
          ))}
        </ul>
      ) : (
        <Card className={`${ACCOUNT_CARD_SURFACE} px-6 py-10 text-center text-sm text-body`}>
          Tidak ada akun yang cocok.
        </Card>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={`Tambah akun ${ROLE_LABELS[role].toLowerCase()}`}
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Batal
            </Button>
            <Button
              type="submit"
              form="create-account-form"
              loading={createAccount.isPending}
            >
              <UserPlus aria-hidden="true" className="size-4" />
              Buat akun
            </Button>
          </>
        }
      >
        <form
          id="create-account-form"
          onSubmit={submit}
          className="flex flex-col gap-4"
          autoComplete="off"
        >
          <Input
            id="akun-nama"
            label="Nama lengkap"
            required
            autoComplete="off"
            maxLength={255}
            value={form.name}
            error={errors.name?.[0]}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, name: event.target.value }))
            }
          />
          <Input
            id="akun-email"
            label="Email"
            type="email"
            required
            autoComplete="email"
            maxLength={255}
            value={form.email}
            error={errors.email?.[0]}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, email: event.target.value }))
            }
          />
          <div className="relative">
            <Input
              id="akun-password"
              label="Kata sandi awal"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              required
              minLength={8}
              maxLength={255}
              hint="Minimal 8 karakter."
              value={form.password}
              error={errors.password?.[0]}
              className="pr-12"
              onChange={(event) =>
                setForm((prev) => ({ ...prev, password: event.target.value }))
              }
            />
            <button
              type="button"
              aria-label={
                showPassword ? 'Sembunyikan kata sandi' : 'Lihat kata sandi'
              }
              aria-pressed={showPassword}
              onClick={() => setShowPassword((visible) => !visible)}
              className="absolute right-2 top-8 flex size-10 items-center justify-center rounded-lg text-body hover:bg-band-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              {showPassword ? (
                <EyeOff aria-hidden="true" className="size-5" />
              ) : (
                <Eye aria-hidden="true" className="size-5" />
              )}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        open={Boolean(pendingApproval)}
        onClose={() => setPendingApproval(null)}
        title="Tidak dapat dinonaktifkan"
        footer={
          <Button variant="ghost" onClick={() => setPendingApproval(null)}>
            Tutup
          </Button>
        }
      >
        <p className="text-sm text-navy">
          {pendingApproval?.message ??
            'Penonaktifan akun pimpinan tidak tersedia.'}
        </p>
      </Modal>
    </div>
  )
}

function ImportTab({ onImported }) {
  const toast = useToast()
  const inputRef = useRef(null)
  const preview = usePreviewImport()
  const importMut = useImportSantri()
  const exportSantri = useExportSantri()

  const [file, setFile] = useState(null)
  const [rows, setRows] = useState(null)
  const [canImport, setCanImport] = useState(false)
  const [result, setResult] = useState(null)

  const resetPreview = () => {
    setFile(null)
    setRows(null)
    setCanImport(false)
    setResult(null)
  }

  const handleFile = async (event) => {
    const selected = event.target.files?.[0] ?? null
    event.target.value = ''
    resetPreview()
    setFile(null)
    if (!selected) {
      return
    }
    const lower = selected.name.toLowerCase()
    if (!ACCEPTED_EXT.some((ext) => lower.endsWith(ext))) {
      toast.showToast('Berkas harus berupa Excel .xlsx.', 'error')
      return
    }
    if (selected.size > MAX_IMPORT_BYTES) {
      toast.showToast('Ukuran berkas maksimal 5 MB.', 'error')
      return
    }
    setFile(selected)
    try {
      const data = await preview.mutateAsync(selected)
      setRows(data.rows ?? [])
      setCanImport(Boolean(data.canImport))
    } catch (error) {
      toast.showToast(error?.message ?? 'Pratinjau gagal dimuat.', 'error')
    }
  }

  const doImport = async () => {
    if (!file || !canImport) return
    try {
      const data = await importMut.mutateAsync({ file })
      resetPreview()
      if (inputRef.current) inputRef.current.value = ''
      toast.showToast(
        data.message ?? `${data.imported} data santri berhasil diproses.`,
        'success',
      )
      onImported?.()
    } catch (error) {
      toast.showToast(error?.message ?? 'Impor gagal.', 'error')
    }
  }

  const downloadCurrentData = async () => {
    try {
      const file = await exportSantri.mutateAsync()
      downloadBlob(file.blob, file.filename)
    } catch (error) {
      toast.showToast(error?.message ?? 'Unduh data santri gagal.', 'error')
    }
  }

  const validCount = rows?.filter((row) => row.valid).length ?? 0
  const invalidCount = rows?.filter((row) => !row.valid).length ?? 0

  return (
    <div className="flex flex-col gap-4">
      <Card className="p-5">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-navy">
          <FileSpreadsheet aria-hidden="true" className="size-5 text-primary" />
          Langkah 1 — Siapkan berkas
        </h2>
        <p className="mt-1 text-sm text-body">
          Unduh data santri saat ini untuk mengedit data, lalu gunakan tombol impor santri untuk mengunggah berkas Excel (.xlsx).
          kata sandi default setelah ditambahkan adalah  <b>"12345678"</b>
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button
            variant="secondary"
            size="sm"
            loading={exportSantri.isPending}
            onClick={downloadCurrentData}
          >
            <Download aria-hidden="true" className="size-4" />
            Unduh data saat ini
          </Button>
          <input
            ref={inputRef}
            id="import-file"
            type="file"
            accept={ACCEPTED_EXT.join(',')}
            className="sr-only"
            onChange={handleFile}
          />
          <Button size="sm" onClick={() => inputRef.current?.click()}>
            <Upload aria-hidden="true" className="size-4" />
            Pilih berkas
          </Button>
          {file ? (
            <span className="text-sm text-body">{file.name}</span>
          ) : null}
        </div>
      </Card>

      {preview.isPending ? (
        <Skeleton className="h-40 w-full" />
      ) : rows ? (
        <>
          <Card className="p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg font-semibold text-navy">
                Langkah 2 — Periksa pratinjau
              </h2>
              <span className="text-sm text-body">
                {validCount} valid · {invalidCount} perlu diperbaiki
              </span>
            </div>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[56rem] border-collapse text-sm">
                <thead>
                  <tr className="text-left text-body">
                    <th className="px-3 py-2 font-semibold">#</th>
                    <th className="px-3 py-2 font-semibold">Nama</th>
                    <th className="px-3 py-2 font-semibold">Email</th>
                    <th className="px-3 py-2 font-semibold">NIS</th>
                    <th className="px-3 py-2 font-semibold">Jenis kelamin</th>
                    <th className="px-3 py-2 font-semibold">Telepon wali</th>
                    <th className="px-3 py-2 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.index} className="border-t border-border">
                      <td className="px-3 py-2 text-body">{row.index}</td>
                      <td className="px-3 py-2 text-navy">{row.name || '—'}</td>
                      <td className="px-3 py-2 text-navy">{row.email || '—'}</td>
                      <td className="px-3 py-2 text-navy">{row.nis || '—'}</td>
                      <td className="px-3 py-2 text-navy">
                        {row.jenisKelamin || '—'}
                      </td>
                      <td className="px-3 py-2 text-navy">
                        {row.teleponOrtu || '—'}
                      </td>
                      <td className="px-3 py-2">
                        {row.valid ? (
                          <span className="inline-flex items-center gap-1 text-status-done">
                            <CheckCircle2 aria-hidden="true" className="size-4" />
                            Valid
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-danger">
                            <XCircle aria-hidden="true" className="size-4" />
                            {row.errors?.join(', ') || 'Tidak valid'}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <Card className="p-5">
            <h2 className="text-lg font-semibold text-navy">
              Langkah 3 — Impor
            </h2>
            <div className="mt-4 flex justify-end">
              <Button
                onClick={doImport}
                loading={importMut.isPending}
                disabled={!canImport || invalidCount > 0}
              >
                <Upload aria-hidden="true" className="size-4" />
                Impor {validCount} data
              </Button>
            </div>
          </Card>
        </>
      ) : null}

      {result ? (
        <Card className="p-5">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-navy">
            <CheckCircle2 aria-hidden="true" className="size-5 text-status-done" />
            Impor selesai
          </h2>
          <p className="mt-1 text-sm text-body">
            {result.message ??
              `${result.imported} data santri berhasil diproses.`}
          </p>
        </Card>
      ) : null}
    </div>
  )
}

export default function AccountsPage() {
  const [tab, setTab] = useState('pengurus')

  const tabs = [
    { value: 'pengurus', label: 'Akun Pengurus' },
    { value: 'pimpinan', label: 'Akun Pimpinan' },
    { value: 'santri', label: 'Akun Santri' },
    { value: 'import', label: 'Impor / Update Santri' },
  ]

  return (
    <div className="flex flex-col gap-5">
      <header>
        <h1 className="text-3xl">Kelola Akun</h1>
        <p className="mt-1 text-body">
          Kelola akun petugas; ekspor, edit, dan impor data santri.
        </p>
      </header>

      <div
        role="tablist"
        aria-label="Bagian kelola akun"
        className="flex gap-2 border-b border-border"
      >
        {tabs.map((item) => (
          <button
            key={item.value}
            type="button"
            role="tab"
            aria-selected={tab === item.value}
            onClick={() => setTab(item.value)}
            className={cn(
              '-mb-px border-b-2 px-4 py-3 text-sm font-semibold transition-colors',
              tab === item.value
                ? 'border-primary text-primary'
                : 'border-transparent text-body hover:text-navy',
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === 'pengurus' ? (
        <AccountsTab role={ROLES.PENGURUS} />
      ) : tab === 'pimpinan' ? (
        <AccountsTab role={ROLES.PIMPINAN} />
      ) : tab === 'santri' ? (
        <AccountsTab role={ROLES.SANTRI} />
      ) : (
        <ImportTab onImported={() => setTab('santri')} />
      )}
    </div>
  )
}
