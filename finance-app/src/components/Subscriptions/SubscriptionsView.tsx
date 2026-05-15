import { useMemo } from 'react'
import { format } from 'date-fns'
import { RefreshCcw, AlertCircle } from 'lucide-react'
import type { Transaction } from '../../types'
import { formatCurrency } from '../../utils/stats'

interface SubscriptionsViewProps {
  transactions: Transaction[]
}

interface SubGroup {
  key: string
  name: string
  latestAmount: number
  lastCharged: Date
  occurrences: number
  monthlyEstimate: number
  yearlyEstimate: number
}

export function SubscriptionsView({ transactions }: SubscriptionsViewProps) {
  const subscriptions = useMemo<SubGroup[]>(() => {
    const subs = transactions.filter((t) => t.isSubscription && t.type === 'expense')

    const groups = new Map<string, Transaction[]>()
    for (const tx of subs) {
      const key = tx.description.toLowerCase().replace(/\s+/g, ' ').trim()
      if (!groups.has(key)) groups.set(key, [])
      groups.get(key)!.push(tx)
    }

    return Array.from(groups.entries()).map(([key, txs]) => {
      const sorted = [...txs].sort((a, b) => b.date.getTime() - a.date.getTime())
      const latestAmount = Math.abs(sorted[0].amount)
      return {
        key,
        name: sorted[0].description,
        latestAmount,
        lastCharged: sorted[0].date,
        occurrences: txs.length,
        monthlyEstimate: latestAmount,
        yearlyEstimate: latestAmount * 12,
      }
    }).sort((a, b) => b.latestAmount - a.latestAmount)
  }, [transactions])

  const totalMonthly = subscriptions.reduce((s, sub) => s + sub.monthlyEstimate, 0)
  const totalYearly = totalMonthly * 12

  if (subscriptions.length === 0) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-semibold text-slate-800 mb-5">Subscriptions</h1>
        <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center">
          <RefreshCcw size={32} className="mx-auto text-slate-200 mb-3" />
          <p className="text-slate-500 font-medium">No recurring payments detected</p>
          <p className="text-slate-400 text-sm mt-1">
            Upload more months of data to detect subscriptions.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-slate-800">Subscriptions</h1>
        <p className="text-sm text-slate-400 mt-0.5">
          {subscriptions.length} recurring payments detected
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Monthly Cost</p>
          <p className="text-2xl font-semibold text-indigo-600">{formatCurrency(totalMonthly)}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Annual Cost</p>
          <p className="text-2xl font-semibold text-slate-800">{formatCurrency(totalYearly)}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Active Services</p>
          <p className="text-2xl font-semibold text-slate-800">{subscriptions.length}</p>
        </div>
      </div>

      {totalMonthly > 2000 && (
        <div className="flex gap-3 items-start p-4 bg-amber-50 rounded-xl border border-amber-100">
          <AlertCircle size={16} className="text-amber-500 mt-0.5 shrink-0" />
          <p className="text-sm text-amber-700">
            Your subscriptions total{' '}
            <strong>{formatCurrency(totalMonthly)}/month</strong>. Consider reviewing which services you actively use.
          </p>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <div className="grid grid-cols-[1fr_120px_100px_120px_120px] text-xs font-semibold text-slate-400 uppercase tracking-wide px-5 py-3 border-b border-slate-100 bg-slate-50">
          <span>Service</span>
          <span>Last Charged</span>
          <span>Occurrences</span>
          <span>Monthly</span>
          <span>Annual</span>
        </div>
        <div className="divide-y divide-slate-50">
          {subscriptions.map((sub) => (
            <div
              key={sub.key}
              className="grid grid-cols-[1fr_120px_100px_120px_120px] px-5 py-4 items-center hover:bg-slate-50/60 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
                  <RefreshCcw size={15} className="text-indigo-500" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-700 truncate">{sub.name}</p>
                  <p className="text-xs text-slate-400">Monthly recurring</p>
                </div>
              </div>
              <span className="text-sm text-slate-500">{format(sub.lastCharged, 'dd MMM yyyy')}</span>
              <span className="text-sm text-slate-500">{sub.occurrences}×</span>
              <span className="text-sm font-semibold text-slate-700">{formatCurrency(sub.monthlyEstimate)}</span>
              <span className="text-sm text-slate-500">{formatCurrency(sub.yearlyEstimate)}</span>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-[1fr_120px_100px_120px_120px] px-5 py-3 border-t border-slate-100 bg-slate-50">
          <span className="text-xs font-semibold text-slate-500 col-span-3">Total</span>
          <span className="text-sm font-bold text-indigo-600">{formatCurrency(totalMonthly)}</span>
          <span className="text-sm font-semibold text-slate-700">{formatCurrency(totalYearly)}</span>
        </div>
      </div>
    </div>
  )
}
