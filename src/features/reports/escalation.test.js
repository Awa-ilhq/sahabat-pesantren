import assert from 'node:assert/strict'
import test from 'node:test'
import {
  canEscalateReport,
  isReportLocked,
  runEscalationWorkflow,
  validateEscalationForm,
} from './escalation.js'

const validForm = {
  tujuan: 'polsek',
  nomor_wa_tujuan: '+6281234567890',
  catatan_pengurus: 'Mohon ditindaklanjuti.',
}

test('eskalasi tersedia bagi pengurus dan pimpinan untuk laporan yang belum terkunci', () => {
  assert.equal(canEscalateReport('pengurus', { status: 'baru' }), true)
  assert.equal(canEscalateReport('PENGURUS', { status: 'baru' }), true)
  assert.equal(canEscalateReport('pimpinan', { status: 'baru' }), true)
  assert.equal(canEscalateReport('PIMPINAN', { status: 'baru' }), true)
  assert.equal(canEscalateReport('santri', { status: 'baru' }), false)
  assert.equal(canEscalateReport('pengawas', { status: 'baru' }), false)
  assert.equal(
    canEscalateReport('pengurus', {
      status: 'DITERUSKAN_KE_BERWAJIB',
      isLocked: true,
    }),
    false,
  )
})

test('status eskalasi dan flag is_locked sama-sama mengunci laporan', () => {
  assert.equal(isReportLocked({ status: 'baru', isLocked: true }), true)
  assert.equal(
    isReportLocked({ status: 'DITERUSKAN_KE_BERWAJIB', isLocked: false }),
    true,
  )
  assert.equal(isReportLocked({ status: 'selesai', isLocked: false }), false)
})

test('validasi menerima nomor internasional dan menolak input tidak lengkap', () => {
  assert.equal(validateEscalationForm(validForm), '')
  assert.match(
    validateEscalationForm({ ...validForm, tujuan: 'lainnya' }),
    /Tujuan/,
  )
  assert.match(
    validateEscalationForm({ ...validForm, nomor_wa_tujuan: '081234567890' }),
    /internasional/,
  )
  assert.match(
    validateEscalationForm({ ...validForm, nomor_wa_tujuan: '+12x' }),
    /tidak valid/,
  )
  assert.match(
    validateEscalationForm({ ...validForm, catatan_pengurus: ' ' }),
    /Catatan/,
  )
})

test('submit eskalasi membuka WhatsApp dan mengunduh PDF dari URL response', async () => {
  const popup = { location: {} }
  const calls = []
  const response = {
    success: true,
    whatsapp_url: 'https://wa.me/6281234567890',
    pdf_download_url: 'https://api.example.test/api/pengantar.pdf',
  }

  const result = await runEscalationWorkflow({
    payload: validForm,
    openWhatsAppWindow: () => popup,
    requestEscalation: async (payload) => {
      calls.push(['request', payload])
      return response
    },
    navigateWhatsAppWindow: (window, url) => {
      calls.push(['whatsapp', window, url])
      window.location.href = url
    },
    closeWhatsAppWindow: () => calls.push(['close']),
    downloadPdf: async (url) => calls.push(['download', url]),
  })

  assert.equal(result.result, response)
  assert.equal(result.popupBlocked, false)
  assert.equal(result.pdfError, null)
  assert.equal(popup.location.href, response.whatsapp_url)
  assert.deepEqual(calls, [
    ['request', validForm],
    ['whatsapp', popup, response.whatsapp_url],
    ['download', response.pdf_download_url],
  ])
})

test('popup terblokir memberi URL untuk dibuka manual dan tetap mengunduh PDF', async () => {
  const result = await runEscalationWorkflow({
    payload: validForm,
    openWhatsAppWindow: () => null,
    requestEscalation: async () => ({
      whatsapp_url: 'https://wa.me/6281234567890',
    }),
    navigateWhatsAppWindow: () => assert.fail('Tidak boleh membuka popup null'),
    closeWhatsAppWindow: () => assert.fail('Tidak ada popup untuk ditutup'),
    downloadPdf: async () => {},
  })

  assert.equal(result.popupBlocked, true)
  assert.equal(result.whatsappUrl, 'https://wa.me/6281234567890')
})

test('kegagalan eskalasi menutup tab kosong dan meneruskan error', async () => {
  const popup = {}
  let closed = false

  await assert.rejects(
    runEscalationWorkflow({
      payload: validForm,
      openWhatsAppWindow: () => popup,
      requestEscalation: async () => {
        throw new Error('HTTP 409: laporan terkunci')
      },
      navigateWhatsAppWindow: () => assert.fail('Tidak ada URL saat request gagal'),
      closeWhatsAppWindow: (window) => {
        assert.equal(window, popup)
        closed = true
      },
      downloadPdf: () => assert.fail('PDF tidak diunduh saat eskalasi gagal'),
    }),
    /HTTP 409/,
  )
  assert.equal(closed, true)
})

test('kegagalan unduh PDF dilaporkan tanpa membatalkan eskalasi sukses', async () => {
  const result = await runEscalationWorkflow({
    payload: validForm,
    openWhatsAppWindow: () => null,
    requestEscalation: async () => ({ success: true }),
    navigateWhatsAppWindow: () => {},
    closeWhatsAppWindow: () => {},
    downloadPdf: async () => {
      throw new Error('PDF tidak dapat diunduh')
    },
  })

  assert.equal(result.result.success, true)
  assert.equal(result.pdfError.message, 'PDF tidak dapat diunduh')
})
