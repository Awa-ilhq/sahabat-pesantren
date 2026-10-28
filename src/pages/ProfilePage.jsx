import { zodResolver } from '@hookform/resolvers/zod'
import { Pencil } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import Input from '../components/ui/Input'
import { useToast } from '../components/ui/toast-context'
import { useAuth } from '../features/auth/auth-context'
import { ROLE_LABELS, ROLES } from '../lib/constants'
import ChangePasswordPage from './ChangePasswordPage'

const PROFILE_CARD_SURFACE =
  '!border !border-[#e1e9e2] !shadow-[0_2px_10px_rgba(18,55,42,0.06)]'

const schema = z.object({
  name: z.string().min(1, 'Nama wajib diisi.').max(255, 'Nama maksimal 255 karakter.'),
  email: z
    .string()
    .email('Email tidak valid.')
    .max(255, 'Email maksimal 255 karakter.')
    .optional()
    .or(z.literal('')),
  phone: z.string().max(20, 'Nomor telepon maksimal 20 karakter.').optional().or(z.literal('')),
})

const FIELD_MAP = {
  name: 'name',
  email: 'email',
  phone: 'phone',
  telepon_ortu: 'phone',
}

export default function ProfilePage() {
  const { user, updateProfile } = useAuth()
  const toast = useToast()
  const [editOpen, setEditOpen] = useState(false)
  const [formError, setFormError] = useState(null)

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      name: user?.name ?? '',
      email: user?.email ?? '',
      phone: user?.phone ?? '',
    },
  })

  useEffect(() => {
    reset({
      name: user?.name ?? '',
      email: user?.email ?? '',
      phone: user?.phone ?? '',
    })
  }, [reset, user?.name, user?.email, user?.phone])

  const onSubmit = async (values) => {
    setFormError(null)
    try {
      const payload = {
        name: values.name?.trim(),
        email: values.email?.trim() || null,
      }
      if (user?.role === ROLES.SANTRI) {
        payload.phone = values.phone?.trim() || null
      }
      await updateProfile(payload)
      toast.showToast('Profil berhasil diperbarui.', 'success')
      setEditOpen(false)
    } catch (error) {
      if (error?.status === 422 && error.errors) {
        Object.entries(error.errors).forEach(([field, messages]) => {
          const key = FIELD_MAP[field]
          if (key) {
            setError(key, { message: Array.isArray(messages) ? messages[0] : messages })
          }
        })
        setFormError(error.message ?? 'Validasi gagal.')
      } else {
        setFormError(error?.message ?? 'Gagal memperbarui profil.')
        toast.showToast(error?.message ?? 'Gagal memperbarui profil.', 'error')
      }
    }
  }

  const fields = [
    { label: 'Nama', value: user?.name },
    { label: 'Peran', value: ROLE_LABELS[user?.role] ?? user?.role },
    { label: 'ID akun', value: user?.id },
    ...(user?.role === ROLES.SANTRI
      ? [
          { label: 'NIS', value: user?.nis ?? user?.username },
          { label: 'Telepon wali', value: user?.phone },
        ]
      : [
          {
            label: user?.email ? 'Email' : 'Nama pengguna',
            value: user?.email ?? user?.username,
          },
        ]),
  ]

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-5">
      <header>
        <h1 className="text-3xl">Profil</h1>
        <p className="mt-1 text-body">Informasi akun dan pengaturan kata sandi.</p>
      </header>

      <Card className={`${PROFILE_CARD_SURFACE} p-5 sm:p-6`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-semibold text-navy">Data pengguna</h2>
          {!editOpen && user?.role !== ROLES.SANTRI ? (
            <Button variant="secondary" size="sm" onClick={() => setEditOpen(true)}>
              <Pencil aria-hidden="true" className="size-4" />
              Edit profil
            </Button>
          ) : null}
        </div>
        {!editOpen ? (
          <dl className="mt-4 divide-y divide-border">
            {fields.map(({ label, value }) => (
              <div
                key={label}
                className="grid gap-1 py-3 sm:grid-cols-[12rem_1fr] sm:gap-4"
              >
                <dt className="text-sm text-body">{label}</dt>
                <dd className="break-words text-sm font-semibold text-navy">
                  {value || 'Belum tersedia'}
                </dd>
              </div>
            ))}
          </dl>
        ) : user?.role !== ROLES.SANTRI ? (
          <form onSubmit={handleSubmit(onSubmit)} className="mt-4 flex flex-col gap-4" noValidate>
            {formError ? (
              <p
                role="alert"
                aria-live="assertive"
                className="rounded-2xl border border-danger/30 bg-danger-bg px-4 py-3 text-sm font-medium text-danger"
              >
                {formError}
              </p>
            ) : null}
            <Input
              id="profil-nama"
              label="Nama"
              required
              error={errors.name?.message}
              {...register('name')}
            />
            {user?.role === ROLES.SANTRI ? null : (
              <Input
                id="profil-email"
                label="Email"
                type="email"
                error={errors.email?.message}
                {...register('email')}
              />
            )}
            <div className="flex flex-wrap items-center justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  reset({
                    name: user?.name ?? '',
                    email: user?.email ?? '',
                    phone: user?.phone ?? '',
                  })
                  setFormError(null)
                  setEditOpen(false)
                }}
              >
                Batal
              </Button>
              <Button type="submit" loading={isSubmitting}>
                Simpan
              </Button>
            </div>
          </form>
        ) : null}
      </Card>

      <Card className={`${PROFILE_CARD_SURFACE} p-5 sm:p-6`}>
        <ChangePasswordPage embedded />
      </Card>
    </div>
  )
}
