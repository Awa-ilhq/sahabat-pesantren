import assert from 'node:assert/strict'
import test from 'node:test'
import fs from 'node:fs'
import { STUDENT_DEADLINE_TEXT, isReportLate, countLateReports } from './reportDeadline.js'
import { adaptSummary, adaptNotificationSummary, adaptNotification } from '../api/adapters.js'
import { isLateReportNotificationVisible } from '../features/notifications/rules.js'

const exactText = 'Laporanmu akan ditinjau dalam 24 jam.'

test('badge status terlambat hanya berasal dari boolean terlambat', () => {
  assert.equal(isReportLate({ terlambat: true }), true)
  assert.equal(isReportLate({ terlambat: false }), false)
  assert.equal(isReportLate({ createdAt: '2000-01-01T00:00:00Z' }), false)
  assert.equal(countLateReports([{ terlambat: true }, { terlambat: false }, {}]), 1)
})

test('ringkasan dashboard membaca jumlah_terlambat dari API', () => {
  assert.equal(adaptSummary({ jumlah_terlambat: 7 }).jumlahTerlambat, 7)
  assert.equal(adaptSummary({ jumlah_terlambat: 7 }).jumlah_terlambat, 7)
})

test('ringkasan dan item notifikasi terlambat dipetakan', () => {
  assert.equal(adaptNotificationSummary({ laporan_terlambat: 4 }).laporanTerlambat, 4)
  assert.equal(adaptNotification({ tipe: 'laporan_terlambat', laporan_id: 12, status_laporan: 'baru' }).statusLaporan, 'baru')
})

test('peringatan laporan terlambat berhenti saat status bukan baru', () => {
  assert.equal(isLateReportNotificationVisible({ tipe: 'laporan_terlambat', statusLaporan: 'baru' }), true)
  assert.equal(isLateReportNotificationVisible({ tipe: 'laporan_terlambat', statusLaporan: 'diproses' }), false)
  assert.equal(isLateReportNotificationVisible({ tipe: 'laporan_terlambat', statusLaporan: 'selesai' }), false)
})

test('halaman daftar tidak lagi memanggil perhitungan batas klarifikasi', () => {
  const source = fs.readFileSync('src/pages/staff/StaffReportListPage.jsx', 'utf8')
  assert.doesNotMatch(source, /dueState\s*\(|batasKlarifikasi|batas_klarifikasi/)
  assert.match(source, /function dueDescription\(report\)/)
})

test('ketiga janji santri memakai teks persis yang disyaratkan', () => {
  assert.equal(STUDENT_DEADLINE_TEXT, exactText)
  for (const file of ['src/pages/HomePage.jsx', 'src/pages/santri/CreateReportPage.jsx', 'src/pages/LoginPage.jsx']) {
    assert.match(fs.readFileSync(file, 'utf8'), /Laporanmu akan ditinjau dalam 24 jam\./)
  }
})
