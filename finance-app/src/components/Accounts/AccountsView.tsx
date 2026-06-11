import { useState } from 'react'
import { Pencil, Check, X, Trash2, Plus, CreditCard } from 'lucide-react'
import type { Account, DateFilter, ViewType } from '../../types'
import { computeSummary, formatCurrency } from '../../utils/stats'
import { filterTransactionsByDate, dateFilterLabel } from '../../utils/dateFilter'
import { DateRangeFilter } from '../common/DateRangeFilter'

interface AccountsViewProps {
  accounts: Account[]
  dateFilter: DateFilter
  onDateFilterChange: (filter: DateFilter) => void
  onRename: (id: string, name: string) => void
  onDelete: (id: string) => void
  onNavigate: (view: ViewType) => void
}

export function AccountsView({
  accounts,
  dateFilter,
  onDateFilterChange,
  onRename,
  onDelete,
  onNavigate,
}: AccountsViewProps) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')

  const allTransactions = accounts.flatMap((a) => a.transactions)
  const combinedSummary = computeSummary(filterTransactionsByDate(allTransactions, dateFilter))

  function startEdit(account: Account) {
    setEditingId(account.id)
    setEditValue(account.name)
  }

  function commitEdit(id: string) {
    const trimmed = editValue.trim()
    if (trimmed) onRename(id, trimmed)
    setEditingId(null)
  }

  if (accounts.length === 0) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-semibold text-slate-800 mb-5">Accounts</h1>
        <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center">
          <CreditCard size={32} className="mx-auto text-slate-200 mb-3" />
          <p className="text-slate-500 font-medium">No accounts yet</p>
          <p className="text-slate-400 text-sm mt-1 mb-4">Upload a statement to get started.</p>
          <button
            onClick={() => onNavigate('upload')}
            className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-all cursor-pointer"
          >
            Upload Statement
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-800">Accounts</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            {accounts.length} account{accounts.length === 1 ? '' : 's'} · totals shown for {dateFilterLabel(dateFilter)}
          </p>
        </div>
        <DateRangeFilter transactions={allTransactions} value={dateFilter} onChange={onDateFilterChange} />
      </div>

      <div className="bg-indigo-600 rounded-2xl p-5 text-white grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-indigo-200 mb-1">Combined Income</p>
          <p className="text-xl font-semibold">{formatCurrency(combinedSummary.totalIncome)}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-indigo-200 mb-1">Combined Expenses</p>
          <p className="text-xl font-semibold">{formatCurrency(combinedSummary.totalExpenses)}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-indigo-200 mb-1">Net Savings</p>
          <p className="text-xl font-semibold">{formatCurrency(combinedSummary.netSavings)}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-indigo-200 mb-1">Savings Rate</p>
          <p className="text-xl font-semibold">{combinedSummary.savingsRate.toFixed(1)}%</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 divide-y divide-slate-50">
        {accounts.map((account) => {
          const summary = computeSummary(filterTransactionsByDate(account.transactions, dateFilter))
          const isEditing = editingId === account.id
          return (
            <div key={account.id} className="p-5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
                  <CreditCard size={16} className="text-indigo-500" />
                </div>
                <div className="min-w-0 flex-1">
                  {isEditing ? (
                    <div className="flex items-center gap-2">
                      <input
                        autoFocus
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') commitEdit(account.id)
                          if (e.key === 'Escape') setEditingId(null)
                        }}
                        className="text-sm font-medium text-slate-700 border border-indigo-300 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-200"
                      />
                      <button onClick={() => commitEdit(account.id)} className="text-emerald-600 hover:text-emerald-700 cursor-pointer">
                        <Check size={16} />
                      </button>
                      <button onClick={() => setEditingId(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 group">
                      <p className="text-sm font-semibold text-slate-700 truncate">{account.name}</p>
                      <button
                        onClick={() => startEdit(account)}
                        className="text-slate-300 hover:text-indigo-500 cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Pencil size={13} />
                      </button>
                    </div>
                  )}
                  <p className="text-xs text-slate-400 mt-0.5">{account.transactions.length} transactions</p>
                </div>
              </div>

              <div className="hidden md:grid grid-cols-3 gap-6 text-right shrink-0">
                <div>
                  <p className="text-xs text-slate-400">Income</p>
                  <p className="text-sm font-semibold text-emerald-600">{formatCurrency(summary.totalIncome)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Expenses</p>
                  <p className="text-sm font-semibold text-rose-500">{formatCurrency(summary.totalExpenses)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Net</p>
                  <p className={`text-sm font-semibold ${summary.netSavings >= 0 ? 'text-indigo-600' : 'text-amber-500'}`}>
                    {formatCurrency(summary.netSavings)}
                  </p>
                </div>
              </div>

              <button
                onClick={() => onDelete(account.id)}
                className="text-slate-300 hover:text-rose-500 cursor-pointer shrink-0"
                title="Remove account"
              >
                <Trash2 size={16} />
              </button>
            </div>
          )
        })}
      </div>

      <button
        onClick={() => onNavigate('upload')}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-slate-200 text-sm text-slate-500 font-medium hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50/50 transition-all cursor-pointer"
      >
        <Plus size={16} /> Add Another Account
      </button>
    </div>
  )
}
