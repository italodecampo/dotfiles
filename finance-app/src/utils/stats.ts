import { format } from 'date-fns'
import type { Transaction, FinanceSummary, CategoryStats, MonthlyStats } from '../types'
import { CATEGORY_COLORS } from './categorizer'

export function computeSummary(transactions: Transaction[]): FinanceSummary {
  if (transactions.length === 0) {
    return {
      totalIncome: 0,
      totalExpenses: 0,
      netSavings: 0,
      savingsRate: 0,
      transactionCount: 0,
      dateRange: null,
    }
  }

  const totalIncome = transactions
    .filter((t) => t.type === 'income')
    .reduce((s, t) => s + Math.abs(t.amount), 0)

  const totalExpenses = transactions
    .filter((t) => t.type === 'expense')
    .reduce((s, t) => s + Math.abs(t.amount), 0)

  const netSavings = totalIncome - totalExpenses
  const savingsRate = totalIncome > 0 ? (netSavings / totalIncome) * 100 : 0

  const dates = transactions.map((t) => t.date)
  const from = new Date(Math.min(...dates.map((d) => d.getTime())))
  const to = new Date(Math.max(...dates.map((d) => d.getTime())))

  return {
    totalIncome,
    totalExpenses,
    netSavings,
    savingsRate,
    transactionCount: transactions.length,
    dateRange: { from, to },
  }
}

export function computeCategoryStats(transactions: Transaction[]): CategoryStats[] {
  const expenses = transactions.filter((t) => t.type === 'expense')
  const totalExpenses = expenses.reduce((s, t) => s + Math.abs(t.amount), 0)

  const groups = new Map<string, { total: number; count: number }>()
  for (const tx of expenses) {
    const existing = groups.get(tx.category) ?? { total: 0, count: 0 }
    groups.set(tx.category, {
      total: existing.total + Math.abs(tx.amount),
      count: existing.count + 1,
    })
  }

  return Array.from(groups.entries())
    .map(([category, { total, count }]) => ({
      category: category as CategoryStats['category'],
      total,
      count,
      percentage: totalExpenses > 0 ? (total / totalExpenses) * 100 : 0,
      color: CATEGORY_COLORS[category as CategoryStats['category']] ?? '#94A3B8',
    }))
    .sort((a, b) => b.total - a.total)
}

export function computeMonthlyStats(transactions: Transaction[]): MonthlyStats[] {
  const months = new Map<string, { income: number; expenses: number }>()

  for (const tx of transactions) {
    const label = format(tx.date, 'MMM yyyy')
    const existing = months.get(label) ?? { income: 0, expenses: 0 }
    if (tx.type === 'income') {
      months.set(label, { ...existing, income: existing.income + Math.abs(tx.amount) })
    } else {
      months.set(label, { ...existing, expenses: existing.expenses + Math.abs(tx.amount) })
    }
  }

  return Array.from(months.entries())
    .map(([label, { income, expenses }]) => ({
      label,
      income,
      expenses,
      net: income - expenses,
    }))
    .sort((a, b) => {
      const dateA = new Date(a.label)
      const dateB = new Date(b.label)
      return dateA.getTime() - dateB.getTime()
    })
}

export function formatCurrency(amount: number, absolute = false): string {
  const value = absolute ? Math.abs(amount) : amount
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}
