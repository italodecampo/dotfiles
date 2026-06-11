import type { Transaction } from '../types'
import { categorizeTransaction } from './categorizer'
import { detectSubscriptions } from './subscriptionDetector'

export function parseDate(raw: string | number | Date): Date | null {
  if (raw instanceof Date) return isNaN(raw.getTime()) ? null : raw
  if (typeof raw === 'number') {
    // Excel serial date (days since 1899-12-30)
    const epoch = new Date(Date.UTC(1899, 11, 30))
    const d = new Date(epoch.getTime() + raw * 86400000)
    return isNaN(d.getTime()) ? null : d
  }
  if (!raw || typeof raw !== 'string') return null
  const s = raw.trim()
  if (!s) return null

  const d = new Date(s)
  return isNaN(d.getTime()) ? null : d
}

export function parseAmount(raw: string | number): number | null {
  if (typeof raw === 'number') return raw
  if (!raw || typeof raw !== 'string') return null
  const cleaned = raw.replace(/[^0-9.,\-+()]/g, '')
  if (!cleaned) return null
  const withParen = cleaned.match(/^\((.+)\)$/)
  const numeric = withParen
    ? `-${withParen[1].replace(/,/g, '')}`
    : cleaned.replace(/,/g, '')
  const n = parseFloat(numeric)
  return isNaN(n) ? null : n
}

export function simpleId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

export interface ColumnMap {
  date?: number
  description?: number
  amount?: number
  debit?: number
  credit?: number
  balance?: number
}

export function detectColumns(headers: string[]): ColumnMap {
  const map: ColumnMap = {}
  const patterns: Record<keyof ColumnMap, RegExp[]> = {
    date: [/date/i, /transaction date/i, /posted/i, /value date/i],
    description: [/description/i, /narrative/i, /details/i, /memo/i, /payee/i, /merchant/i, /reference/i],
    amount: [/^amount$/i, /transaction amount/i, /^amt$/i],
    debit: [/debit/i, /withdrawal/i, /money out/i, /paid out/i, /^dr$/i],
    credit: [/credit/i, /deposit/i, /money in/i, /paid in/i, /^cr$/i],
    balance: [/balance/i, /running/i],
  }

  headers.forEach((h, i) => {
    const trimmed = h.trim()
    for (const [key, regexes] of Object.entries(patterns) as [keyof ColumnMap, RegExp[]][]) {
      if (map[key] === undefined && regexes.some((r) => r.test(trimmed))) {
        map[key] = i
        break
      }
    }
  })

  return map
}

const HEADER_SCAN_LIMIT = 15

/**
 * Bank exports often include title/metadata rows (account name, statement
 * period, etc.) before the actual table header. Scan the first few rows to
 * find the one that looks like a header (has both a date-like and a
 * description-like column).
 */
function findHeaderRowIndex(rows: (string | number | Date)[][]): number {
  const limit = Math.min(rows.length, HEADER_SCAN_LIMIT)
  for (let i = 0; i < limit; i++) {
    const headers = rows[i].map((h) => String(h ?? '').trim())
    const colMap = detectColumns(headers)
    if (colMap.date !== undefined && colMap.description !== undefined) {
      return i
    }
  }
  return -1
}

/** Builds transactions from a 2D array of cell values, where one of the first rows is the header row. */
export function buildTransactionsFromRows(rows: (string | number | Date)[][]): Transaction[] {
  if (rows.length < 2) {
    throw new Error('File appears empty or has no data rows.')
  }

  const headerIndex = findHeaderRowIndex(rows)

  if (headerIndex === -1) {
    throw new Error(
      'Could not detect required columns (Date, Description). ' +
        'Please ensure your file has Date and Description columns.'
    )
  }

  const headers = rows[headerIndex].map((h) => String(h ?? '').trim())
  const colMap = detectColumns(headers)

  if (colMap.date === undefined || colMap.description === undefined) {
    throw new Error(
      'Could not detect required columns (Date, Description). ' +
        'Please ensure your file has Date and Description columns.'
    )
  }

  const transactions: Transaction[] = []

  for (let i = headerIndex + 1; i < rows.length; i++) {
    const row = rows[i]
    const rawDate = row[colMap.date]
    const description = String(row[colMap.description] ?? '').trim()

    if (!rawDate || !description) continue

    const date = parseDate(rawDate)
    if (!date) continue

    let amount: number | null = null

    if (colMap.amount !== undefined) {
      amount = parseAmount(row[colMap.amount] as string | number)
    } else if (colMap.debit !== undefined || colMap.credit !== undefined) {
      const debit = colMap.debit !== undefined ? parseAmount(row[colMap.debit] as string | number) : null
      const credit = colMap.credit !== undefined ? parseAmount(row[colMap.credit] as string | number) : null
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

  return finalizeTransactions(transactions)
}

/** Applies subscription detection, sorts by date descending, and validates non-empty result. */
export function finalizeTransactions(transactions: Transaction[]): Transaction[] {
  if (transactions.length === 0) {
    throw new Error('No valid transactions found. Please check the file format.')
  }

  // Recognized subscription services (Netflix, Claude, etc.) are always flagged,
  // even on a single occurrence. Everything else needs a heuristically-detected
  // recurring pattern (multiple months at a consistent amount/day).
  const recurringIds = detectSubscriptions(transactions)
  const withSubs = transactions.map((t) => {
    const isKnownSubscription = t.category === 'Subscriptions'
    const isRecurring = recurringIds.has(t.id)
    return {
      ...t,
      isSubscription: isKnownSubscription || isRecurring,
      category: isRecurring && t.category === 'Other' ? ('Subscriptions' as const) : t.category,
    }
  })

  return withSubs.sort((a, b) => b.date.getTime() - a.date.getTime())
}
