import type { Transaction } from '../types'

function normalizeDescription(desc: string): string {
  return desc
    .toLowerCase()
    .replace(/\d{4}[-/]\d{2}[-/]\d{2}/g, '')
    .replace(/\d{2}[-/]\d{2}[-/]\d{4}/g, '')
    .replace(/\*{4}\d{4}/g, '')
    .replace(/[^a-z\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .slice(0, 4)
    .join(' ')
}

function monthKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth()}`
}

const MIN_OCCURRENCES = 3
const AMOUNT_TOLERANCE = 0.05
const DAY_TOLERANCE = 4

/**
 * Heuristically detects recurring monthly payments. Requires at least
 * MIN_OCCURRENCES charges, each in a distinct calendar month, with a
 * consistent amount and day-of-month — a single repeat purchase (e.g.
 * buying the same item twice in one month) should not qualify.
 */
export function detectSubscriptions(transactions: Transaction[]): Set<string> {
  const expenses = transactions.filter((t) => t.type === 'expense')

  const groups: Map<string, Transaction[]> = new Map()
  for (const tx of expenses) {
    const key = normalizeDescription(tx.description)
    if (!key) continue
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push(tx)
  }

  const subscriptionIds = new Set<string>()

  for (const [, group] of groups) {
    if (group.length < MIN_OCCURRENCES) continue

    const months = new Set(group.map((t) => monthKey(t.date)))
    if (months.size !== group.length) continue

    const amounts = group.map((t) => Math.abs(t.amount))
    const avgAmount = amounts.reduce((a, b) => a + b, 0) / amounts.length
    const amountsConsistent = amounts.every(
      (a) => Math.abs(a - avgAmount) / avgAmount < AMOUNT_TOLERANCE
    )
    if (!amountsConsistent) continue

    const days = group.map((t) => t.date.getDate())
    const avgDay = days.reduce((a, b) => a + b, 0) / days.length
    const daysConsistent = days.every((d) => Math.abs(d - avgDay) <= DAY_TOLERANCE)
    if (!daysConsistent) continue

    for (const tx of group) subscriptionIds.add(tx.id)
  }

  return subscriptionIds
}
