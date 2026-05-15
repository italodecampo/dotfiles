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

function dayOfMonth(date: Date): number {
  return date.getDate()
}

export function detectSubscriptions(transactions: Transaction[]): Set<string> {
  const expenses = transactions.filter((t) => t.type === 'expense')

  const groups: Map<string, Transaction[]> = new Map()
  for (const tx of expenses) {
    const key = normalizeDescription(tx.description)
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push(tx)
  }

  const subscriptionIds = new Set<string>()

  for (const [, group] of groups) {
    if (group.length < 2) continue

    const amounts = group.map((t) => Math.abs(t.amount))
    const avgAmount = amounts.reduce((a, b) => a + b, 0) / amounts.length
    const amountsConsistent = amounts.every(
      (a) => Math.abs(a - avgAmount) / avgAmount < 0.1
    )
    if (!amountsConsistent) continue

    const sorted = [...group].sort((a, b) => a.date.getTime() - b.date.getTime())
    const days = sorted.map((t) => dayOfMonth(t.date))
    const avgDay = days.reduce((a, b) => a + b, 0) / days.length
    const daysConsistent = days.every((d) => Math.abs(d - avgDay) <= 5)
    if (!daysConsistent) continue

    for (const tx of group) subscriptionIds.add(tx.id)
  }

  return subscriptionIds
}
