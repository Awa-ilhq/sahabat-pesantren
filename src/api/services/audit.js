import { http } from '../client'
import { adaptAuditList } from '../adapters'

export const getAuditLogs = async ({
  q,
  action,
  actor,
  from,
  to,
  page,
  perPage,
} = {}) => {
  const { data } = await http.get('/admin/audit-logs', {
    params: {
      ...(q ? { q } : {}),
      ...(action ? { action } : {}),
      ...(actor ? { actor } : {}),
      ...(from ? { from } : {}),
      ...(to ? { to } : {}),
      ...(page ? { page } : {}),
      ...(perPage ? { per_page: perPage } : {}),
    },
  })
  return adaptAuditList(data)
}
