import { RefreshCcw, ArrowUpRight } from 'lucide-react'
import type { Transaction, ViewType } from '../../types'
import { formatCurrency } from '../../utils/stats'

interface TopSubscriptionsProps {
  transactions: Transaction[]
  onNavigate: (view: ViewType) => void
}

export function TopSubscriptions({ transactions, onNavigate }: TopSubscriptionsProps) {
  const subs = transactions
    .filter((t) => t.isSubscription && t.type === 'expense')
    .reduce<Map<string, { desc: string; amount: number; count: number }>>((acc, tx) => {
      const key = tx.description.toLowerCase().split(' ').slice(0, 2).join(' ')
      const existing = acc.get(key)
      if (!existing || tx.date > transactions.find((t) => t.id === existing.desc)?.date!) {
        acc.set(key, { desc: tx.description, amount: Math.abs(tx.amount), count: (existing?.count ?? 0) + 1 })
      }
      return acc
    }, new Map())

  const subList = Array.from(subs.values())
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5)

  const totalMonthly = subList.reduce((s, sub) => s + sub.amount, 0)

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-slate-700">Subscriptions</h3>
        <button
          onClick={() => onNavigate('subscriptions')}
          className="text-xs text-indigo-600 font-medium hover:text-indigo-700 flex items-center gap-1 cursor-pointer"
        >
          View all <ArrowUpRight size={12} />
        </button>
      </div>

      {subList.length === 0 ? (
        <p className="text-sm text-slate-400 text-center py-4">No recurring payments detected</p>
      ) : (
        <>
          <div className="space-y-1">
            {subList.map((sub, i) => (
              <div key={i} className="flex items-center gap-3 py-2 border-b border-slate-50 last:border-0">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
                  <RefreshCcw size={14} className="text-indigo-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-700 truncate">{sub.desc}</p>
                  <p className="text-xs text-slate-400">Monthly</p>
                </div>
                <span className="text-sm font-semibold text-slate-700 shrink-0">
                  {formatCurrency(sub.amount)}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex justify-between text-xs">
            <span className="text-slate-400">Est. monthly total</span>
            <span className="font-semibold text-slate-700">{formatCurrency(totalMonthly)}</span>
          </div>
        </>
      )}
    </div>
  )
}
