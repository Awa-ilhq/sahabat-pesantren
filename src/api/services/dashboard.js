import { http } from '../client'
import { adaptSummary } from '../adapters'

export const getSummary = async () => {
  const { data } = await http.get('/dashboard/summary')
  return adaptSummary(data.data)
}

export const getAiSummary = async ({ periode = 7, refresh = false } = {}) => {
  const { data } = await http.post('/dashboard/ai-summary', { periode, refresh })
  return data?.data ?? data ?? null
}
