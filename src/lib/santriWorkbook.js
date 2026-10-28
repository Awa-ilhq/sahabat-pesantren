const TEMPLATE_HEADERS = [
  'name',
  'email',
  'nis',
  'jenis_kelamin',
  'telepon_ortu',
  'password',
]

const loadExcelJS = async () => {
  const { default: ExcelJS } = await import('exceljs')
  return ExcelJS
}

const cellText = (value) => {
  if (value === null || value === undefined) return ''
  if (typeof value === 'object') {
    if (value.formula || value.sharedFormula) return ''
    if (Array.isArray(value.richText)) {
      return value.richText.map((part) => part.text).join('').trim()
    }
    if ('text' in value) return String(value.text).trim()
    return ''
  }
  return String(value).trim()
}

export const createSantriWorkbookBlob = async (rows) => {
  const ExcelJS = await loadExcelJS()
  const workbook = new ExcelJS.Workbook()
  const worksheet = workbook.addWorksheet('Data Santri')
  worksheet.addRow(TEMPLATE_HEADERS)
  rows.forEach((row) => worksheet.addRow(row.map((value) => value ?? '')))
  worksheet.views = [{ state: 'frozen', ySplit: 1 }]
  worksheet.autoFilter = {
    from: 'A1',
    to: `F${Math.max(1, rows.length + 1)}`,
  }
  worksheet.getRow(1).font = { bold: true }
  worksheet.columns = TEMPLATE_HEADERS.map((header) => ({
    header,
    key: header,
    width: header === 'name' ? 30 : 22,
  }))
  worksheet.eachRow((row) =>
    row.eachCell((cell) => {
      cell.numFmt = '@'
    }),
  )

  const buffer = await workbook.xlsx.writeBuffer()
  return new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
}

export const createSantriTemplateWorkbookBlob = async () => {
  const ExcelJS = await loadExcelJS()
  const workbook = new ExcelJS.Workbook()
  const worksheet = workbook.addWorksheet('Data Santri')
  worksheet.addRow(TEMPLATE_HEADERS)
  worksheet.views = [{ state: 'frozen', ySplit: 1 }]
  worksheet.autoFilter = { from: 'A1', to: 'G1' }
  worksheet.getRow(1).font = { bold: true }
  worksheet.columns = TEMPLATE_HEADERS.map((header) => ({
    header,
    key: header,
    width: header === 'name' ? 28 : 22,
  }))
  worksheet.eachRow((row) =>
    row.eachCell((cell) => {
      cell.numFmt = '@'
    }),
  )

  const buffer = await workbook.xlsx.writeBuffer()
  return new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
}

export const readSantriWorkbook = async (file) => {
  const ExcelJS = await loadExcelJS()
  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.load(await file.arrayBuffer())
  const worksheet =
    workbook.getWorksheet('Data Santri') ?? workbook.worksheets[0]
  if (!worksheet) throw new Error('File Excel tidak memiliki lembar data santri.')

  const headers = worksheet
    .getRow(1)
    .values.slice(1)
    .map((header) => cellText(header).toLowerCase())
  if (
    headers.length !== TEMPLATE_HEADERS.length ||
    !TEMPLATE_HEADERS.every((header, index) => headers[index] === header)
  ) {
    throw new Error(
      `Header Excel harus berurutan: ${TEMPLATE_HEADERS.join(', ')}.`,
    )
  }

  const rows = []
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return
    const values = TEMPLATE_HEADERS.map((_, index) =>
      cellText(row.getCell(index + 1).value),
    )
    if (values.every((value) => !value)) return
    rows.push({
      index: rowNumber,
      name: values[0],
      email: values[1],
      nis: values[2],
      jenisKelamin: values[3],
      teleponOrtu: values[4],
      password: values[5],
    })
  })
  return rows
}
