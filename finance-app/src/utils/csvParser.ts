import Papa from 'papaparse'
import type { Transaction } from '../types'
import { categorizeTransaction } from './categorizer'
import { detectSubscriptions } from './subscriptionDetector'

function parseDate(raw: string): Date | null {
  if (!raw || typeof raw !== 'string') return null
  const s = raw.trim()

  const formats = [
    /^(\d{4})[/-](\d{1,2})[/-](\d{1,2})$/,
    /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/,
    /^(\d{1,2})\s+(\w+)\s+(\d{4})$/,
    /^(\w+)\s+(\d{1,2}),?\s+(\d{4})$/,
  ]

  for (const fmt of formats) {
    const m = s.match(fmt)
    if (m) {
      const d = new Date(s)
      if (!isNaN(d.getTime())) return d
    }
  }

  const d = new Date(s)
  return isNaN(d.getTime()) ? null : d
}

function parseAmount(raw: string | number): number | null {
  if (typeof raw === 'number') return raw
  if (!raw || typeof raw !== 'string') return null
  const cleaned = raw.replace(/[^0-9.,\-+()]/g, '')
  const withParen = cleaned.match(/^\((.+)\)$/)
  const numeric = withParen
    ? `-${withParen[1].replace(/,/g, '')}`
    : cleaned.replace(/,/g, '')
  const n = parseFloat(numeric)
  return isNaN(n) ? null : n
}

function normalizeHeaders(headers: string[]): Record<string, number> {
  const map: Record<string, number> = {}
  const patterns: Record<string, RegExp[]> = {
    date: [/date/i, /transaction date/i, /posted/i, /value date/i],
    description: [/description/i, /narrative/i, /details/i, /memo/i, /payee/i, /merchant/i, /reference/i],
    amount: [/^amount$/i, /transaction amount/i, /^amt$/i],
    debit: [/debit/i, /withdrawal/i, /expense/i, /dr\b/i],
    credit: [/credit/i, /deposit/i, /income/i, /cr\b/i],
    balance: [/balance/i, /running/i],
  }

  headers.forEach((h, i) => {
    for (const [key, regexes] of Object.entries(patterns)) {
      if (!(key in map) && regexes.some((r) => r.test(h.trim()))) {
        map[key] = i
        break
      }
    }
  })

  return map
}

function simpleId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

export function parseCSV(file: File): Promise<Transaction[]> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: false,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const rows = results.data as string[][]
          if (rows.length < 2) {
            reject(new Error('File appears empty or has no data rows.'))
            return
          }

          const headers = rows[0].map((h) => String(h).trim())
          const colMap = normalizeHeaders(headers)

          if (colMap.date === undefined || colMap.description === undefined) {
            reject(
              new Error(
                'Could not detect required columns (Date, Description). ' +
                  'Please ensure your CSV has Date and Description columns.'
              )
            )
            return
          }

          const transactions: Transaction[] = []

          for (let i = 1; i < rows.length; i++) {
            const row = rows[i]
            const rawDate = row[colMap.date]
            const description = String(row[colMap.description] ?? '').trim()

            if (!rawDate || !description) continue

            const date = parseDate(rawDate)
            if (!date) continue

            let amount: number | null = null

            if (colMap.amount !== undefined) {
              amount = parseAmount(row[colMap.amount])
            } else if (colMap.debit !== undefined || colMap.credit !== undefined) {
              const debit = colMap.debit !== undefined ? parseAmount(row[colMap.debit]) : null
              const credit = colMap.credit !== undefined ? parseAmount(row[colMap.credit]) : null
              const d = debit !== null ? Math.abs(debit) : 0
              const c = credit !== null ? Math.abs(credit) : 0
              if (d > 0) amount = -d
              else if (c > 0) amount = c
            }

            if (amount === null) continue

            const { category, type } = categorizeTransaction(description, amount)

            transactions.push({
              id: simpleId(),
              date,
              description,
              amount,
              type,
              category,
              isSubscription: false,
            })
          }

          if (transactions.length === 0) {
            reject(new Error('No valid transactions found. Please check the file format.'))
            return
          }

          const subscriptionIds = detectSubscriptions(transactions)
          const withSubs = transactions.map((t) => ({
            ...t,
            isSubscription: subscriptionIds.has(t.id),
            category:
              subscriptionIds.has(t.id) && t.category === 'Other'
                ? ('Subscriptions' as const)
                : t.category,
          }))

          resolve(withSubs.sort((a, b) => b.date.getTime() - a.date.getTime()))
        } catch (err) {
          reject(err)
        }
      },
      error: (err) => reject(new Error(err.message)),
    })
  })
}
