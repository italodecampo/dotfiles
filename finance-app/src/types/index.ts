export type Category =
  | 'Income'
  | 'Food & Dining'
  | 'Groceries'
  | 'Transportation'
  | 'Housing & Utilities'
  | 'Entertainment'
  | 'Shopping'
  | 'Health & Fitness'
  | 'Subscriptions'
  | 'Financial'
  | 'Travel'
  | 'Education'
  | 'Other'

export type TransactionType = 'income' | 'expense'

export interface Transaction {
  id: string
  date: Date
  description: string
  amount: number
  type: TransactionType
  category: Category
  isSubscription: boolean
}

export interface CategoryStats {
  category: Category
  total: number
  count: number
  percentage: number
  color: string
}

export interface MonthlyStats {
  label: string
  income: number
  expenses: number
  net: number
}

export interface FinanceSummary {
  totalIncome: number
  totalExpenses: number
  netSavings: number
  savingsRate: number
  transactionCount: number
  dateRange: { from: Date; to: Date } | null
}

export type ViewType = 'upload' | 'dashboard' | 'transactions' | 'subscriptions' | 'categories'

export interface AppState {
  transactions: Transaction[]
  view: ViewType
  filterMonth: string | null
  filterCategory: Category | null
  searchQuery: string
}
