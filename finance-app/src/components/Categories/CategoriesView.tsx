import { useMemo } from 'react'
import { format } from 'date-fns'
import type { Transaction, Category } from '../../types'
import { computeCategoryStats, formatCurrency } from '../../utils/stats'
import { CATEGORY_COLORS } from '../../utils/categorizer'

interface CategoriesViewProps {
  transactions: Transaction[]
}

export function CategoriesView({ transactions }: CategoriesViewProps) {
  const categoryStats = useMemo(() => computeCategoryStats(transactions), [transactions])

  const expenseTotal = useMemo(
    () => transactions.filter((t) => t.type === 'expense').reduce((s, t) => s + Math.abs(t.amount), 0),
    [transactions]
  )

  const txByCategory = useMemo(() => {
    const map = new Map<Category, Transaction[]>()
    for (const tx of transactions.filter((t) => t.type === 'expense')) {
      if (!map.has(tx.category)) map.set(tx.category, [])
      map.get(tx.category)!.push(tx)
    }
    return map
  }, [transactions])

  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-slate-800">Categories</h1>
        <p className="text-sm text-slate-400 mt-0.5">
          Total expenses: {formatCurrency(expenseTotal)}
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {categoryStats.map((stat) => {
          const txs = txByCategory.get(stat.category) ?? []
          const recent = [...txs]
            .sort((a, b) => b.date.getTime() - a.date.getTime())
            .slice(0, 3)

          return (
            <div key={stat.category} className="bg-white rounded-2xl border border-slate-100 p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: CATEGORY_COLORS[stat.category] ?? '#94A3B8' }}
                  />
                  <h3 className="text-sm font-semibold text-slate-700">{stat.category}</h3>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-slate-800">{formatCurrency(stat.total)}</p>
                  <p className="text-xs text-slate-400">{stat.count} transactions</p>
                </div>
              </div>

              <div className="mb-4">
                <div className="flex justify-between text-xs text-slate-400 mb-1.5">
                  <span>{stat.percentage.toFixed(1)}% of expenses</span>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${stat.percentage}%`,
                      backgroundColor: CATEGORY_COLORS[stat.category] ?? '#94A3B8',
                    }}
                  />
                </div>
              </div>

              {recent.length > 0 && (
                <div className="space-y-1.5">
                  {recent.map((tx) => (
                    <div key={tx.id} className="flex items-center justify-between py-1">
                      <div className="min-w-0">
                        <p className="text-xs text-slate-600 truncate">{tx.description}</p>
                        <p className="text-xs text-slate-400">{format(tx.date, 'dd MMM')}</p>
                      </div>
                      <span className="text-xs font-medium text-slate-700 shrink-0 ml-2">
                        {formatCurrency(Math.abs(tx.amount))}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
