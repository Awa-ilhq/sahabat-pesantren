// Facade: satu-satunya pintu pemanggilan API untuk komponen.
// Ganti `VITE_USE_MOCK` untuk berpindah antara mock dan API asli.

import { USE_AI_MOCK, USE_MOCK } from '../lib/env'
import * as real from './services'
import * as mock from './mock'

const active = USE_MOCK ? mock : real

export const auth = active.auth
export const reports = active.reports
export const messages = active.messages
export const notes = active.notes
export const dashboard = active.dashboard
export const notifications = active.notifications
export const admin = active.admin
export const audit = active.audit
export const deactivation = active.deactivation
export const ai = USE_AI_MOCK ? mock.ai : real.ai

export default active
