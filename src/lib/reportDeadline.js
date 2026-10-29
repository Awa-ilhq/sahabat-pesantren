export const STUDENT_DEADLINE_TEXT = 'Laporanmu akan ditinjau dalam 24 jam.'

export const isReportLate = (report) => report?.terlambat === true

export const countLateReports = (reports = []) =>
  reports.filter(isReportLate).length
