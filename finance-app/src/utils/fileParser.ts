import type { Transaction } from '../types'

export type SupportedExtension = 'csv' | 'xlsx' | 'xls' | 'pdf'

export function getExtension(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() ?? ''
}

export function isSupportedFile(filename: string): boolean {
  return ['csv', 'xlsx', 'xls', 'pdf'].includes(getExtension(filename))
}

export async function parseFile(file: File): Promise<Transaction[]> {
  const ext = getExtension(file.name)

  switch (ext) {
    case 'csv': {
      const { parseCSV } = await import('./csvParser')
      return parseCSV(file)
    }
    case 'xlsx':
    case 'xls': {
      const { parseExcel } = await import('./excelParser')
      return parseExcel(file)
    }
    case 'pdf': {
      const { parsePDF } = await import('./pdfParser')
      return parsePDF(file)
    }
    default:
      throw new Error('Unsupported file type. Please upload a CSV, Excel (.xlsx/.xls), or PDF file.')
  }
}
