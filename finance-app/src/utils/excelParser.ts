import ExcelJS from 'exceljs'
import type { Transaction } from '../types'
import { buildTransactionsFromRows } from './parseHelpers'

function cellToValue(cell: ExcelJS.Cell): string | number | Date {
  const value = cell.value

  if (value === null || value === undefined) return ''
  if (value instanceof Date) return value
  if (typeof value === 'number' || typeof value === 'string') return value

  // Formula result
  if (typeof value === 'object' && 'result' in value) {
    const result = (value as { result?: unknown }).result
    if (result instanceof Date) return result
    if (typeof result === 'number' || typeof result === 'string') return result
  }

  // Rich text
  if (typeof value === 'object' && 'richText' in value) {
    const richText = (value as { richText: { text: string }[] }).richText
    return richText.map((r) => r.text).join('')
  }

  return String(value)
}

export async function parseExcel(file: File): Promise<Transaction[]> {
  const buffer = await file.arrayBuffer()
  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.load(buffer)

  const worksheet = workbook.worksheets[0]
  if (!worksheet) {
    throw new Error('No sheets found in this spreadsheet.')
  }

  const rows: (string | number | Date)[][] = []
  worksheet.eachRow({ includeEmpty: false }, (row) => {
    const values: (string | number | Date)[] = []
    row.eachCell({ includeEmpty: true }, (cell) => {
      values.push(cellToValue(cell))
    })
    if (values.some((v) => v !== '')) {
      rows.push(values)
    }
  })

  return buildTransactionsFromRows(rows)
}
