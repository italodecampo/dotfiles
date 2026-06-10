import Papa from 'papaparse'
import type { Transaction } from '../types'
import { buildTransactionsFromRows } from './parseHelpers'

export function parseCSV(file: File): Promise<Transaction[]> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: false,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const rows = results.data as string[][]
          resolve(buildTransactionsFromRows(rows))
        } catch (err) {
          reject(err)
        }
      },
      error: (err) => reject(new Error(err.message)),
    })
  })
}
