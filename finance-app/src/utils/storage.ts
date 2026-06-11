import type { Account, DateFilter, Transaction } from '../types'

const ACCOUNTS_KEY = 'financetrack.accounts'
const SELECTED_ACCOUNT_KEY = 'financetrack.selectedAccount'
const DATE_FILTER_KEY = 'financetrack.dateFilter'

interface SerializedTransaction extends Omit<Transaction, 'date'> {
  date: string
}

interface SerializedAccount extends Omit<Account, 'transactions'> {
  transactions: SerializedTransaction[]
}

export function loadAccounts(): Account[] {
  try {
    const raw = localStorage.getItem(ACCOUNTS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as SerializedAccount[]
    return parsed.map((account) => ({
      ...account,
      transactions: account.transactions.map((tx) => ({ ...tx, date: new Date(tx.date) })),
    }))
  } catch {
    return []
  }
}

export function saveAccounts(accounts: Account[]): void {
  const serialized: SerializedAccount[] = accounts.map((account) => ({
    ...account,
    transactions: account.transactions.map((tx) => ({ ...tx, date: tx.date.toISOString() })),
  }))
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(serialized))
}

export function loadSelectedAccountId(): string | 'all' {
  return localStorage.getItem(SELECTED_ACCOUNT_KEY) ?? 'all'
}

export function saveSelectedAccountId(id: string | 'all'): void {
  localStorage.setItem(SELECTED_ACCOUNT_KEY, id)
}

export function loadDateFilter(): DateFilter {
  try {
    const raw = localStorage.getItem(DATE_FILTER_KEY)
    if (!raw) return { type: 'all' }
    return JSON.parse(raw) as DateFilter
  } catch {
    return { type: 'all' }
  }
}

export function saveDateFilter(filter: DateFilter): void {
  localStorage.setItem(DATE_FILTER_KEY, JSON.stringify(filter))
}

export function clearAllData(): void {
  localStorage.removeItem(ACCOUNTS_KEY)
  localStorage.removeItem(SELECTED_ACCOUNT_KEY)
  localStorage.removeItem(DATE_FILTER_KEY)
}
