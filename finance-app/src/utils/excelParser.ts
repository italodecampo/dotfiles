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

function rowsFromWorksheet(worksheet: ExcelJS.Worksheet): (string | number | Date)[][] {
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
  return rows
}

/**
 * Many banks export ".xlsx"/".xls" files that are actually HTML tables with
 * a spreadsheet file extension. Detect and parse those as HTML.
 */
function rowsFromHtmlTable(text: string): (string | number | Date)[][] {
  const doc = new DOMParser().parseFromString(text, 'text/html')
  const table = doc.querySelector('table')
  if (!table) return []

  const rows: (string | number | Date)[][] = []
  for (const tr of Array.from(table.querySelectorAll('tr'))) {
    const cells = Array.from(tr.querySelectorAll('td, th')).map(
      (cell) => cell.textContent?.replace(/\s+/g, ' ').trim() ?? ''
    )
    if (cells.some((c) => c !== '')) rows.push(cells)
  }
  return rows
}

function looksLikeHtml(text: string): boolean {
  return /<table[\s>]/i.test(text) || /<html[\s>]/i.test(text)
}

export async function parseExcel(file: File): Promise<Transaction[]> {
  const buffer = await file.arrayBuffer()

  let rows: (string | number | Date)[][] = []
  let xlsxError: unknown = null

  try {
    const workbook = new ExcelJS.Workbook()
    await workbook.xlsx.load(buffer)
    const worksheet = workbook.worksheets[0]
    if (worksheet) rows = rowsFromWorksheet(worksheet)
  } catch (err) {
    xlsxError = err
  }

  if (rows.length < 2) {
    const text = new TextDecoder('utf-8').decode(buffer)
    if (looksLikeHtml(text)) {
      rows = rowsFromHtmlTable(text)
    }
  }

  if (rows.length < 2) {
    if (xlsxError) {
      throw new Error(
        'Could not read this file as a spreadsheet. If it has a .xls extension, try ' +
          'opening it in Excel and re-saving as .xlsx, or export as CSV/PDF instead.'
      )
    }
    throw new Error('No data found in this spreadsheet.')
  }

  return buildTransactionsFromRows(rows)
}
