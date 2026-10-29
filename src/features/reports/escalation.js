import { ROLES } from '../../lib/constants.js'

export const isReportLocked = (report) =>
  report?.isLocked === true ||
  report?.status === 'DITERUSKAN_KE_BERWAJIB'

export const canEscalateReport = (role, report) => {
  const normalizedRole = String(role ?? '').toLowerCase()
  const canEscalateRole = [ROLES.PENGURUS, ROLES.PIMPINAN].includes(normalizedRole)
  return canEscalateRole && !isReportLocked(report)
}

export const ESCALATION_TARGET_PHONES = {
  polsek: '+6288216289887',
  uppt_ppa: '+62882003668995',
  pengurus_pusat: '+628817718672',
}

export const validateEscalationForm = (form) => {
  if (!form.tujuan) return 'Pilih tujuan eskalasi.'
  if (!['polsek', 'uppt_ppa', 'pengurus_pusat'].includes(form.tujuan)) {
    return 'Tujuan eskalasi tidak valid.'
  }

  const phone = String(form.nomor_wa_tujuan || ESCALATION_TARGET_PHONES[form.tujuan] || '').trim()
  if (!phone) return 'Nomor WhatsApp tujuan belum tersedia di sistem.'
  if (!phone.startsWith('+')) {
    return 'Gunakan format internasional, contoh +6281234567890.'
  }
  if (!/^\d{8,15}$/.test(phone.slice(1))) {
    return 'Nomor WhatsApp tujuan tidak valid.'
  }
  if (!String(form.catatan_pengurus ?? '').trim()) {
    return 'Catatan pengurus wajib diisi.'
  }
  return ''
}

const safeWhatsAppUrl = (value) => {
  if (typeof value !== 'string') return null
  try {
    const url = new URL(value)
    return url.protocol === 'https:' ? url.href : null
  } catch {
    return null
  }
}

const openWhatsAppPopup = (openWhatsAppWindow) => {
  try {
    return openWhatsAppWindow()
  } catch {
    return null
  }
}

export const runEscalationWorkflow = async ({
  payload,
  openWhatsAppWindow,
  requestEscalation,
  navigateWhatsAppWindow,
  closeWhatsAppWindow,
  downloadPdf,
}) => {
  const whatsappWindow = openWhatsAppPopup(openWhatsAppWindow)

  try {
    const result = await requestEscalation(payload)
    const whatsappUrl = safeWhatsAppUrl(
      result?.whatsapp_url ?? result?.whatsappUrl,
    )
    const pdfUrl =
      result?.pdf_download_url ?? result?.pdfDownloadUrl ?? null
    let popupBlocked = !whatsappWindow

    if (whatsappWindow && whatsappUrl) {
      try {
        navigateWhatsAppWindow(whatsappWindow, whatsappUrl)
      } catch {
        closeWhatsAppWindow(whatsappWindow)
        popupBlocked = true
      }
    } else if (whatsappWindow) {
      closeWhatsAppWindow(whatsappWindow)
    }

    let pdfError = null
    try {
      await downloadPdf(pdfUrl)
    } catch (error) {
      pdfError = error
    }
    return { result, whatsappUrl, popupBlocked, pdfError }
  } catch (error) {
    if (whatsappWindow) closeWhatsAppWindow(whatsappWindow)
    throw error
  }
}
