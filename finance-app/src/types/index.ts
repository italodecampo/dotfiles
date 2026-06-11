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

export interface Account {
  id: string
  name: string
  transactions: Transaction[]
  createdAt: string
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

export type DateFilter =
  | { type: 'all' }
  | { type: 'year'; year: number }
  | { type: 'month'; year: number; month: number }

export type TaxDocumentCategory =
  | 'Income Statement'
  | 'Receipt'
  | 'Donation'
  | 'Medical'
  | 'Investment'
  | 'Business Expense'
  | 'Other'

export interface TaxDocument {
  id: string
  name: string
  category: TaxDocumentCategory
  taxYear: number
  uploadedAt: string
  fileType: string
  fileSize: number
}

export type ViewType = 'upload' | 'dashboard' | 'transactions' | 'subscriptions' | 'categories' | 'accounts' | 'taxes'
