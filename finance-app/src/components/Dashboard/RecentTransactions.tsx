import { format } from 'date-fns'
import { ArrowUpRight } from 'lucide-react'
import type { Transaction, ViewType } from '../../types'
import { Badge } from '../common/Badge'
import { formatCurrency } from '../../utils/stats'

interface RecentTransactionsProps {
  transactions: Transaction[]
  onNavigate: (view: ViewType) => void
}

export function RecentTransactions({ transactions, onNavigate }: RecentTransactionsProps) {
  const recent = transactions.slice(0, 8)

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-slate-700">Recent Transactions</h3>
        <button
          onClick={() => onNavigate('transactions')}
          className="text-xs text-indigo-600 font-medium hover:text-indigo-700 flex items-center gap-1 cursor-pointer"
        >
          View all <ArrowUpRight size={12} />
        </button>
      </div>
      <div className="space-y-1">
        {recent.map((tx) => (
          <div
            key={tx.id}
            className="flex items-center gap-3 py-2.5 border-b border-slate-50 last:border-0"
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm text-slate-700 truncate font-medium">{tx.description}</p>
              <p className="text-xs text-slate-400 mt-0.5">{format(tx.date, 'dd MMM yyyy')}</p>
            </div>
            <Badge category={tx.category} size="sm" />
            <span
              className={`text-sm font-semibold shrink-0 ${
                tx.type === 'income' ? 'text-emerald-600' : 'text-slate-700'
              }`}
            >
              {tx.type === 'income' ? '+' : ''}
              {formatCurrency(Math.abs(tx.amount))}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
