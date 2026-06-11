import type { DateFilter, Transaction } from '../types'

export function filterTransactionsByDate(transactions: Transaction[], filter: DateFilter): Transaction[] {
  if (filter.type === 'all') return transactions

  if (filter.type === 'year') {
    return transactions.filter((t) => t.date.getFullYear() === filter.year)
  }

  return transactions.filter(
    (t) => t.date.getFullYear() === filter.year && t.date.getMonth() === filter.month
  )
}

export interface YearOption {
  year: number
  months: { year: number; month: number; label: string }[]
}

const MONTH_LABELS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

/** Returns years (descending) with their available months (descending), based on the data present. */
export function getAvailablePeriods(transactions: Transaction[]): YearOption[] {
  const years = new Map<number, Set<number>>()
  for (const t of transactions) {
    const y = t.date.getFullYear()
    const m = t.date.getMonth()
    if (!years.has(y)) years.set(y, new Set())
    years.get(y)!.add(m)
  }

  return Array.from(years.entries())
    .sort((a, b) => b[0] - a[0])
    .map(([year, months]) => ({
      year,
      months: Array.from(months)
        .sort((a, b) => b - a)
        .map((month) => ({ year, month, label: MONTH_LABELS[month] })),
    }))
}

export function dateFilterLabel(filter: DateFilter): string {
  if (filter.type === 'all') return 'All Time'
  if (filter.type === 'year') return String(filter.year)
  return `${MONTH_LABELS[filter.month]} ${filter.year}`
}
