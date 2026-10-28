import { http } from '../client'
import { adaptUser } from '../adapters'

const unwrap = (response) => response.data.data ?? response.data

export const login = async ({ identifier, password }) => {
  const { data } = await http.post(
    '/auth/login',
    { identifier, password },
    { skipSessionExpiry: true },
  )
  const result = data?.data ?? data
  const token = result?.access_token ?? result?.token
  const user = adaptUser(result?.user)

  if (typeof token !== 'string' || !token || !user) {
    throw new Error('Respons login dari server tidak valid.')
  }

  return {
    token,
    user,
    message: result.message ?? data.message,
  }
}

export const changePassword = async ({ currentPassword, newPassword }) => {
  await http.post('/auth/password', {
    current_password: currentPassword,
    password: newPassword,
    password_confirmation: newPassword,
  })
}

export const updateProfile = async (payload) => {
  const { data } = await http.put('/auth/profile', payload)
  const result = unwrap(data)
  return adaptUser(result?.user ?? result)
}

export const getProfile = async () => {
  const { data } = await http.get('/auth/me')
  const result = unwrap(data)
  return adaptUser(result?.user ?? result)
}

export const logout = async (token) => {
  await http.post(
    '/logout',
    {},
    {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      timeout: 5000,
      skipSessionExpiry: true,
    },
  )
}
