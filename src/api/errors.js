export class ApiError extends Error {
  constructor({
    status = 0,
    message = 'Terjadi kesalahan',
    errors = null,
    isNetwork = false,
    requiresApproval = false,
    requestId = null,
  }) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.errors = errors
    this.isNetwork = isNetwork
    this.requiresApproval = requiresApproval
    this.requestId = requestId
  }
}

const firstMessage = (errors) => {
  if (!errors) return null
  const values = Object.values(errors)
  for (const value of values) {
    if (Array.isArray(value) && value.length) return value[0]
    if (typeof value === 'string' && value) return value
  }
  return null
}

export const toApiError = (error) => {
  if (error instanceof ApiError) return error

  const response = error?.response
  if (!response) {
    return new ApiError({
      status: 0,
      message: 'Tidak dapat terhubung ke server. Periksa koneksi lalu coba lagi.',
      isNetwork: true,
    })
  }

  const data = response.data || {}
  const errors = data.errors || null
  const message =
    data.message || firstMessage(errors) || 'Terjadi kesalahan. Coba lagi.'

  return new ApiError({
    status: response.status,
    message,
    errors,
    requiresApproval: Boolean(
      data.requires_approval ?? data.requiresApproval,
    ),
    requestId: data.request_id ?? data.requestId ?? data.id ?? null,
  })
}
