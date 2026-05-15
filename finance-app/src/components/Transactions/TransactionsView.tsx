import { useState, useMemo } from 'react'
import { format } from 'date-fns'
import { Search, Filter, ArrowUpDown, X } from 'lucide-react'
import type { Transaction, Category } from '../../types'
import { Badge } from '../common/Badge'
import { formatCurrency } from '../../utils/stats'

const ALL_CATEGORIES: Category[] = [
  'Income', 'Food & Dining', 'Groceries', 'Transportation',
  'Housing & Utilities', 'Entertainment', 'Shopping', 'Health & Fitness',
  'Subscriptions', 'Financial', 'Travel', 'Education', 'Other',
]

type SortKey = 'date' | 'amount' | 'description'
type SortDir = 'asc' | 'desc'

interface TransactionsViewProps {
  transactions: Transaction[]
}

export function TransactionsView({ transactions }: TransactionsViewProps) {
  const [search, setSearch] = useState('')
  const [filterCategory, setFilterCategory] = useState<Category | ''>('')
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all')
  const [sortKey, setSortKey] = useState<SortKey>('date')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  const filtered = useMemo(() => {
    let result = [...transactions]

    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter((t) => t.description.toLowerCase().includes(q))
    }

    if (filterCategory) {
      result = result.filter((t) => t.category === filterCategory)
    }

    if (filterType !== 'all') {
      result = result.filter((t) => t.type === filterType)
    }

    result.sort((a, b) => {
      let cmp = 0
      if (sortKey === 'date') cmp = a.date.getTime() - b.date.getTime()
      else if (sortKey === 'amount') cmp = Math.abs(a.amount) - Math.abs(b.amount)
      else cmp = a.description.localeCompare(b.description)
      return sortDir === 'desc' ? -cmp : cmp
    })

    return result
  }, [transactions, search, filterCategory, filterType, sortKey, sortDir])

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortKey(key); setSortDir('desc') }
  }

  const hasFilters = search || filterCategory || filterType !== 'all'

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-semibold text-slate-800">Transactions</h1>
          <p className="text-sm text-slate-400 mt-0.5">{filtered.length} of {transactions.length} transactions</p>
        </div>
        {hasFilters && (
          <button
            onClick={() => { setSearch(''); setFilterCategory(''); setFilterType('all') }}
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-all cursor-pointer"
          >
            <X size={12} /> Clear filters
          </button>
        )}
      </div>

      <div className="flex gap-3 mb-5 flex-wrap">
        <div className="flex-1 min-w-48 relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search transactions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-100 placeholder-slate-400 text-slate-700"
          />
        </div>

        <div className="relative">
          <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value as Category | '')}
            className="pl-8 pr-8 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-400 appearance-none text-slate-700 cursor-pointer min-w-36"
          >
            <option value="">All Categories</option>
            {ALL_CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div className="flex rounded-xl border border-slate-200 overflow-hidden">
          {(['all', 'income', 'expense'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-4 py-2.5 text-sm font-medium transition-all cursor-pointer capitalize
                ${filterType === type
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-slate-500 hover:bg-slate-50'
                }`}
            >
              {type === 'all' ? 'All' : type}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <div className="grid grid-cols-[1fr_140px_120px_120px] text-xs font-semibold text-slate-400 uppercase tracking-wide px-5 py-3 border-b border-slate-100 bg-slate-50">
          <button
            onClick={() => toggleSort('description')}
            className="flex items-center gap-1 text-left cursor-pointer hover:text-slate-600"
          >
            Description <ArrowUpDown size={11} />
          </button>
          <span>Category</span>
          <button
            onClick={() => toggleSort('date')}
            className="flex items-center gap-1 cursor-pointer hover:text-slate-600"
          >
            Date <ArrowUpDown size={11} />
          </button>
          <button
            onClick={() => toggleSort('amount')}
            className="flex items-center gap-1 justify-end cursor-pointer hover:text-slate-600"
          >
            Amount <ArrowUpDown size={11} />
          </button>
        </div>

        <div className="divide-y divide-slate-50">
          {filtered.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-slate-400 text-sm">No transactions match your filters</p>
            </div>
          ) : (
            filtered.map((tx) => (
              <div
                key={tx.id}
                className="grid grid-cols-[1fr_140px_120px_120px] px-5 py-3.5 items-center hover:bg-slate-50/60 transition-colors"
              >
                <div className="min-w-0 pr-4">
                  <p className="text-sm text-slate-700 truncate font-medium">{tx.description}</p>
                  {tx.isSubscription && (
                    <span className="text-xs text-indigo-500 font-medium">Recurring</span>
                  )}
                </div>
                <div>
                  <Badge category={tx.category} size="sm" />
                </div>
                <span className="text-sm text-slate-400">
                  {format(tx.date, 'dd MMM yyyy')}
                </span>
                <span
                  className={`text-sm font-semibold text-right ${
                    tx.type === 'income' ? 'text-emerald-600' : 'text-slate-700'
                  }`}
                >
                  {tx.type === 'income' ? '+' : '-'}
                  {formatCurrency(Math.abs(tx.amount))}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
