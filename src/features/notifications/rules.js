export const isLateReportNotificationVisible = (item, reportStatus) => {
  if (item?.tipe !== 'laporan_terlambat') return true
  const status = reportStatus ?? item?.statusLaporan ?? item?.statusBaru
  return status == null || status === 'baru'
}
